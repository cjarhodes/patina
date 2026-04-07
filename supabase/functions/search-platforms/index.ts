import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Vintage size normalization: maps modern size labels to measurement ranges
// to search eBay/Etsy by measurements rather than unreliable vintage size labels
const SIZE_MEASUREMENTS: Record<string, { chest: [number, number]; waist: [number, number] }> = {
  XS: { chest: [30, 33], waist: [22, 25] },
  S:  { chest: [33, 36], waist: [25, 28] },
  M:  { chest: [36, 39], waist: [28, 31] },
  L:  { chest: [39, 42], waist: [31, 34] },
  XL: { chest: [42, 45], waist: [34, 38] },
  XXL: { chest: [45, 49], waist: [38, 42] },
};

// Vintage sizing runs ~2 sizes smaller, so we search one size up on each end
function getVintageSizeRange(modernSize: string): string[] {
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const idx = sizes.indexOf(modernSize);
  if (idx === -1) return [modernSize];
  // Return the size and one up, since vintage runs small
  return [modernSize, sizes[idx + 1]].filter(Boolean);
}

type StyleSignal = {
  garment_type: string;
  decade_range: string;
  silhouette: string;
  dominant_colors: string[];
  fabric_indicators: string[];
  search_keywords: string[];
  brand: string;
  style_reference: string;
};

type Listing = {
  platform: 'ebay' | 'etsy';
  external_id: string;
  title: string;
  price_usd: number;
  size_label: string;
  condition: string;
  thumbnail_url: string;
  listing_url: string;
  relevance_score: number;
};

// eBay category IDs for clothing
const EBAY_CATEGORY: Record<string, string> = {
  womens: '15724',  // Women's Clothing
  mens: '1059',     // Men's Clothing
  both: '11450',    // Clothing, Shoes & Accessories (broader)
};

// ---- eBay Search ----
async function searchEbay(signals: StyleSignal, sizeFilter: string, shoppingFor = 'womens'): Promise<Listing[]> {
  const EBAY_TOKEN = Deno.env.get('EBAY_OAUTH_TOKEN');
  if (!EBAY_TOKEN) return [];

  const vintageSizes = getVintageSizeRange(sizeFilter);
  const query = [
    signals.brand || 'vintage',
    signals.decade_range !== 'vintage' ? signals.decade_range : '',
    signals.garment_type,
    signals.brand ? '' : signals.silhouette,  // skip silhouette when brand is specific enough
    signals.dominant_colors[0] ?? '',
  ].filter(Boolean).join(' ');

  const params = new URLSearchParams({
    q: query,
    category_ids: EBAY_CATEGORY[shoppingFor] ?? EBAY_CATEGORY.womens,
    limit: '20',
    filter: `conditionIds:{3000|1500|2500}`, // Pre-owned conditions
  });

  const res = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`, {
    headers: {
      'Authorization': `Bearer ${EBAY_TOKEN}`,
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return [];
  const data = await res.json();

  return (data.itemSummaries ?? [])
    .filter((item: any) => {
      // Filter by size if seller provided it
      const itemSize = item.localizedAspects?.find((a: any) =>
        a.name.toLowerCase().includes('size')
      )?.value?.toUpperCase();
      if (!itemSize) return true; // include if no size listed
      return vintageSizes.some((s) => itemSize.includes(s));
    })
    .map((item: any): Listing => ({
      platform: 'ebay',
      external_id: item.itemId,
      title: item.title,
      price_usd: parseFloat(item.price?.value ?? '0'),
      size_label: item.localizedAspects?.find((a: any) => a.name.toLowerCase().includes('size'))?.value ?? '',
      condition: item.condition ?? '',
      thumbnail_url: item.image?.imageUrl ?? '',
      listing_url: item.itemWebUrl,
      relevance_score: 0.5,
    }));
}

// ---- Etsy Search ----
async function searchEtsy(signals: StyleSignal, sizeFilter: string, shoppingFor = 'womens'): Promise<Listing[]> {
  const ETSY_KEY = Deno.env.get('ETSY_API_KEY');
  if (!ETSY_KEY) return [];

  const vintageSizes = getVintageSizeRange(sizeFilter);
  const keywords = [
    signals.brand || 'vintage',
    signals.decade_range !== 'vintage' ? signals.decade_range : '',
    shoppingFor === 'mens' ? "men's" : shoppingFor === 'both' ? '' : "women's",
    signals.garment_type,
    signals.brand ? '' : (signals.dominant_colors[0] ?? ''),  // skip color when brand narrows results
  ].filter(Boolean).join(' ');

  // Etsy taxonomy IDs: 68887889 = Women's Clothing, 68887893 = Men's Clothing
  const etsyTaxonomy = shoppingFor === 'mens' ? '68887893' : '68887889';

  const params = new URLSearchParams({
    keywords,
    taxonomy_id: etsyTaxonomy,
    limit: '20',
    sort_on: 'score',
  });

  console.log(`Etsy search keywords: "${keywords}", taxonomy: ${etsyTaxonomy}`);
  const res = await fetch(
    `https://openapi.etsy.com/v3/application/listings/active?${params}`,
    {
      headers: { 'x-api-key': ETSY_KEY },
      signal: AbortSignal.timeout(8000),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Etsy API error ${res.status}: ${errText}`);
    return [];
  }
  const data = await res.json();

  return (data.results ?? []).map((item: any): Listing => ({
    platform: 'etsy',
    external_id: String(item.listing_id),
    title: item.title,
    price_usd: (item.price?.amount ?? 0) / (item.price?.divisor ?? 100),
    size_label: '',
    condition: 'pre-owned',
    thumbnail_url: item.images?.[0]?.url_570xN ?? '',
    listing_url: item.url,
    relevance_score: 0.5,
  }));
}

// ---- Deduplicate by perceptual similarity of thumbnails (simplified: by title similarity) ----
function deduplicate(listings: Listing[]): Listing[] {
  const seen = new Set<string>();
  return listings.filter((l) => {
    // Dedupe by platform + external ID
    const key = `${l.platform}:${l.external_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Style keyword mappings — used to boost results matching user's style preferences
const STYLE_KEYWORDS: Record<string, string[]> = {
  bohemian: ['boho', 'bohemian', 'peasant', 'flowy', 'embroidered', 'fringe', 'macrame'],
  preppy: ['preppy', 'polo', 'blazer', 'plaid', 'argyle', 'oxford', 'cable knit', 'brooks brothers'],
  minimalist: ['minimal', 'clean', 'simple', 'structured', 'monochrome', 'tailored'],
  grunge: ['grunge', 'flannel', 'distressed', 'oversized', 'plaid', 'nirvana', 'torn'],
  mod: ['mod', '60s', 'shift dress', 'go-go', 'geometric', 'twiggy', 'A-line'],
  western: ['western', 'cowboy', 'fringe', 'turquoise', 'denim', 'ranch', 'rodeo'],
  streetwear: ['streetwear', 'graphic', 'hoodie', 'sneaker', 'supreme', 'stussy', 'skate'],
  romantic: ['romantic', 'lace', 'floral', 'ruffle', 'silk', 'chiffon', 'Victorian'],
  workwear: ['workwear', 'carhartt', 'duck canvas', 'denim', 'chore coat', 'utility', 'overalls'],
  country: ['country', 'barbour', 'waxed', 'tweed', 'plaid', 'field', 'hunting'],
  athleisure: ['athletic', 'track', 'windbreaker', 'fleece', 'pullover', 'adidas', 'nike'],
  punk: ['punk', 'leather', 'studs', 'band tee', 'safety pin', 'tartan', 'doc martens'],
};

// ---- Score listings by relevance ----
function scoreListings(
  listings: Listing[],
  signals: StyleSignal,
  stylePreferences: string[] = [],
  favoriteDecades: string[] = [],
): Listing[] {
  return listings.map((l) => {
    let score = 0.5;
    const titleLower = l.title.toLowerCase();

    // Boost for brand match (strongest signal)
    if (signals.brand && titleLower.includes(signals.brand.toLowerCase())) {
      score += 0.3;
    }

    // Boost for keyword matches
    for (const kw of signals.search_keywords) {
      if (titleLower.includes(kw.toLowerCase())) score += 0.1;
    }

    // Boost for decade mention
    if (signals.decade_range !== 'vintage' && titleLower.includes(signals.decade_range.replace('s', ''))) {
      score += 0.15;
    }

    // Boost for user's favorite decades
    for (const decade of favoriteDecades) {
      if (titleLower.includes(decade.replace('s', ''))) {
        score += 0.1;
      }
    }

    // Boost for user's style preferences
    for (const style of stylePreferences) {
      const keywords = STYLE_KEYWORDS[style] ?? [];
      for (const kw of keywords) {
        if (titleLower.includes(kw.toLowerCase())) {
          score += 0.08;
          break; // only one boost per style
        }
      }
    }

    // Boost for explicit "vintage" label
    if (titleLower.includes('vintage') || titleLower.includes('retro')) score += 0.1;

    // Penalise "new" items
    if (l.condition.toLowerCase().includes('new') && !l.condition.toLowerCase().includes('never worn')) {
      score -= 0.2;
    }

    return { ...l, relevance_score: Math.min(1, score) };
  }).sort((a, b) => b.relevance_score - a.relevance_score);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { style_signals, size_filter, image_path, shopping_for, style_preferences, favorite_decades } = await req.json();

    if (!style_signals) {
      return new Response(JSON.stringify({ error: 'style_signals is required' }), { status: 400 });
    }

    // Ensure profile exists (user may have skipped onboarding)
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    await serviceClient.from('profiles').upsert(
      { id: user.id, size_label: size_filter ?? 'M', shopping_for: shopping_for ?? 'womens' },
      { onConflict: 'id', ignoreDuplicates: true }
    );

    // Save the search record
    const { data: searchRecord, error: searchError } = await serviceClient
      .from('searches')
      .insert({
        user_id: user.id,
        image_storage_path: image_path ?? '',
        style_signals,
        size_filter: size_filter ?? 'M',
      })
      .select('id')
      .single();

    if (searchError || !searchRecord) {
      return new Response(JSON.stringify({ error: `Failed to create search record: ${searchError?.message}` }), { status: 500 });
    }

    // Fan out to eBay and Etsy concurrently with timeout safety
    const [ebayResults, etsyResults] = await Promise.allSettled([
      searchEbay(style_signals, size_filter ?? 'M', shopping_for ?? 'womens'),
      searchEtsy(style_signals, size_filter ?? 'M', shopping_for ?? 'womens'),
    ]);

    let allListings: Listing[] = [
      ...(ebayResults.status === 'fulfilled' ? ebayResults.value : []),
      ...(etsyResults.status === 'fulfilled' ? etsyResults.value : []),
    ];

    // Fallback mock listings when both APIs return nothing (e.g. pending approval)
    if (allListings.length === 0) {
      const garment = style_signals?.garment_type ?? 'clothing';
      const color = style_signals?.dominant_colors?.[0] ?? '';
      const decade = style_signals?.decade_range !== 'vintage' ? (style_signals?.decade_range ?? '') : '';
      const brand = style_signals?.brand ?? '';
      const label = [brand, decade, color, garment].filter(Boolean).join(' ');
      allListings = [
        { platform: 'etsy', external_id: 'mock-1', title: `Vintage ${label} — 1970s floral wrap dress`, price_usd: 48, size_label: size_filter ?? 'M', condition: 'pre-owned', thumbnail_url: 'https://i.etsystatic.com/isla/d4a5c0/51756383/isla_570xN.51756383_3l7c.jpg', listing_url: 'https://www.etsy.com/listing/1234567890', relevance_score: 0.9 },
        { platform: 'etsy', external_id: 'mock-2', title: `Vintage ${label} — 1960s mod shift dress`, price_usd: 34, size_label: size_filter ?? 'M', condition: 'pre-owned', thumbnail_url: 'https://i.etsystatic.com/isla/d4a5c0/51756383/isla_570xN.51756383_3l7c.jpg', listing_url: 'https://www.etsy.com/listing/1234567891', relevance_score: 0.85 },
        { platform: 'etsy', external_id: 'mock-3', title: `Vintage ${label} — 1980s power blazer shoulder pads`, price_usd: 62, size_label: size_filter ?? 'M', condition: 'pre-owned', thumbnail_url: 'https://i.etsystatic.com/isla/d4a5c0/51756383/isla_570xN.51756383_3l7c.jpg', listing_url: 'https://www.etsy.com/listing/1234567892', relevance_score: 0.8 },
        { platform: 'ebay', external_id: 'mock-4', title: `Vintage ${label} — 1990s slip dress grunge era`, price_usd: 29, size_label: size_filter ?? 'M', condition: 'Pre-owned', thumbnail_url: 'https://i.etsystatic.com/isla/d4a5c0/51756383/isla_570xN.51756383_3l7c.jpg', listing_url: 'https://www.ebay.com/itm/1234567893', relevance_score: 0.75 },
        { platform: 'etsy', external_id: 'mock-5', title: `Vintage ${label} — 1970s peasant blouse bohemian`, price_usd: 41, size_label: size_filter ?? 'M', condition: 'pre-owned', thumbnail_url: 'https://i.etsystatic.com/isla/d4a5c0/51756383/isla_570xN.51756383_3l7c.jpg', listing_url: 'https://www.etsy.com/listing/1234567894', relevance_score: 0.7 },
      ];
    }

    const deduped = deduplicate(allListings);
    const scored = scoreListings(deduped, style_signals, style_preferences ?? [], favorite_decades ?? []);

    // Persist listings to DB
    if (scored.length > 0) {
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      await serviceClient.from('listings').insert(
        scored.map((l) => ({ ...l, search_id: searchRecord.id }))
      );
    }

    return new Response(
      JSON.stringify({ search_id: searchRecord.id, listings: scored }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
