import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { encode as encodeBase64 } from 'https://deno.land/std@0.177.0/encoding/base64.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FALLBACK_SIGNALS = {
  garment_type: 'clothing',
  decade_range: 'vintage',
  silhouette: '',
  dominant_colors: [],
  fabric_indicators: [],
  search_keywords: ['vintage', 'clothing'],
};

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
    const { image_url } = await req.json();
    if (!image_url) {
      return new Response(JSON.stringify({ error: 'image_url is required' }), { status: 400 });
    }

    const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_KEY) {
      await logDebug('ANTHROPIC_API_KEY not configured');
      return ok(FALLBACK_SIGNALS);
    }

    // Fetch image and encode as base64
    await logDebug(`Fetching image: ${image_url}`);
    const imageRes = await fetch(image_url, { signal: AbortSignal.timeout(10000) });
    if (!imageRes.ok) {
      await logDebug(`Image fetch failed: ${imageRes.status} ${imageRes.statusText}`);
      return ok(FALLBACK_SIGNALS);
    }
    const imageBytes = new Uint8Array(await imageRes.arrayBuffer());
    await logDebug(`Image fetched: ${imageBytes.length} bytes, type: ${imageRes.headers.get('content-type')}`);
    if (imageBytes.length === 0) {
      await logDebug('Image bytes empty — returning fallback');
      return ok(FALLBACK_SIGNALS);
    }
    const base64Image = encodeBase64(imageBytes);
    await logDebug(`Base64 length: ${base64Image.length}`);
    const contentType = imageRes.headers.get('content-type') ?? 'image/jpeg';

    const prompt = `You are a vintage fashion expert. Analyse this clothing photo and return a JSON object with exactly these fields:

{
  "garment_type": string,
  "decade_range": string,
  "silhouette": string,
  "dominant_colors": string[],
  "fabric_indicators": string[],
  "search_keywords": string[]
}

For garment_type use: "dress", "blazer", "jeans", "blouse", "coat", "skirt", "top", "jumpsuit", "cardigan", "trousers", "shirt", "sweater", "shorts", "jacket", or similar.
For decade_range use: "1940s", "1950s", "1960s", "1970s", "1980s", "1990s", or "vintage" if unclear.
For silhouette use: "A-line", "fitted", "oversized", "wide-leg", "wrap", "shift", "maxi", "mini", "midi", or "" if unclear.
For dominant_colors use vintage terms like: "burnt orange", "mustard yellow", "sage green", "burgundy", "navy", "cream", "ivory", "dusty rose", "camel", "rust", "mauve", "powder blue", "black", "white", "grey".
For fabric_indicators use: "denim", "lace", "velvet", "corduroy", "silk", "wool", "cotton", "polyester", "leather" or empty array.
For search_keywords provide 3-6 terms for searching vintage marketplaces.

Be specific. Return ONLY valid JSON, no other text.`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: contentType,
                  data: base64Image,
                },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      await logDebug(`Claude API ${claudeRes.status}: ${errText}`);
      return ok(FALLBACK_SIGNALS);
    }

    const claudeData = await claudeRes.json();
    const rawText = claudeData.content?.[0]?.text ?? '';

    let style_signals;
    try {
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      style_signals = JSON.parse(cleaned);
    } catch {
      await logDebug(`Parse error. Raw: ${rawText.substring(0, 500)}`);
      return ok(FALLBACK_SIGNALS);
    }

    const result = {
      garment_type: style_signals.garment_type ?? 'clothing',
      decade_range: style_signals.decade_range ?? 'vintage',
      silhouette: style_signals.silhouette ?? '',
      dominant_colors: Array.isArray(style_signals.dominant_colors) ? style_signals.dominant_colors : [],
      fabric_indicators: Array.isArray(style_signals.fabric_indicators) ? style_signals.fabric_indicators : [],
      search_keywords: Array.isArray(style_signals.search_keywords) ? style_signals.search_keywords : ['vintage', style_signals.garment_type ?? 'clothing'],
    };

    return ok(result);
  } catch (err: any) {
    await logDebug(`Catch: ${err.message}`);
    return ok(FALLBACK_SIGNALS);
  }
});

function ok(style_signals: any) {
  return new Response(JSON.stringify({ style_signals }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

async function logDebug(message: string) {
  try {
    const client = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    await client.from('debug_logs').insert({ message });
  } catch {
    console.error('Debug log failed:', message);
  }
}
