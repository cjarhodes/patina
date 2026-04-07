import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all active favorites with price alerts enabled
    const { data: favorites, error: favError } = await serviceClient
      .from('favorites')
      .select(`
        id,
        user_id,
        listing_id,
        last_known_price,
        listings (
          id,
          platform,
          external_id,
          title,
          price_usd,
          listing_url
        )
      `)
      .eq('price_alert_enabled', true);

    if (favError) {
      console.error('Failed to fetch favorites:', favError.message);
      return new Response(JSON.stringify({ error: favError.message }), { status: 500 });
    }

    if (!favorites || favorites.length === 0) {
      return new Response(JSON.stringify({ message: 'No favorites to check' }));
    }

    const ETSY_KEY = Deno.env.get('ETSY_API_KEY');
    const EBAY_TOKEN = Deno.env.get('EBAY_OAUTH_TOKEN');
    let priceDrops = 0;

    for (const fav of favorites) {
      const listing = (fav as any).listings;
      if (!listing) continue;

      let currentPrice: number | null = null;

      try {
        if (listing.platform === 'etsy' && ETSY_KEY) {
          const res = await fetch(
            `https://openapi.etsy.com/v3/application/listings/${listing.external_id}`,
            {
              headers: { 'x-api-key': ETSY_KEY },
              signal: AbortSignal.timeout(5000),
            }
          );
          if (res.ok) {
            const data = await res.json();
            currentPrice = (data.price?.amount ?? 0) / (data.price?.divisor ?? 100);
          }
        } else if (listing.platform === 'ebay' && EBAY_TOKEN) {
          const res = await fetch(
            `https://api.ebay.com/buy/browse/v1/item/${listing.external_id}`,
            {
              headers: {
                'Authorization': `Bearer ${EBAY_TOKEN}`,
                'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
              },
              signal: AbortSignal.timeout(5000),
            }
          );
          if (res.ok) {
            const data = await res.json();
            currentPrice = parseFloat(data.price?.value ?? '0');
          }
        }
      } catch {
        // API timeout or error — skip this listing
        continue;
      }

      if (currentPrice === null || currentPrice <= 0) continue;

      const previousPrice = fav.last_known_price ?? listing.price_usd;

      // Record price history
      await serviceClient.from('price_history').insert({
        listing_id: listing.id,
        price_usd: currentPrice,
      });

      // Update last known price
      await serviceClient.from('favorites').update({
        last_known_price: currentPrice,
      }).eq('id', fav.id);

      // Check for price drop (at least $2 or 5% decrease)
      if (previousPrice && currentPrice < previousPrice) {
        const dropAmount = previousPrice - currentPrice;
        const dropPercent = (dropAmount / previousPrice) * 100;

        if (dropAmount >= 2 || dropPercent >= 5) {
          priceDrops++;

          // Get user's push token
          const { data: tokenData } = await serviceClient
            .from('push_tokens')
            .select('expo_push_token')
            .eq('user_id', fav.user_id)
            .single();

          if (tokenData?.expo_push_token) {
            // Send Expo push notification
            await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: tokenData.expo_push_token,
                title: 'Price Drop! \u{1F4B0}',
                body: `${listing.title.slice(0, 50)} dropped from $${previousPrice.toFixed(0)} to $${currentPrice.toFixed(0)} (-${dropPercent.toFixed(0)}%)`,
                data: { listing_url: listing.listing_url, listing_id: listing.id },
              }),
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        checked: favorites.length,
        price_drops: priceDrops,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Price check error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
