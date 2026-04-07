import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// This function runs on a daily cron schedule.
// It re-queries eBay/Etsy for each active saved search
// and sends push notifications when new listings appear.

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function sendPushNotification(token: string, title: string, body: string, data: Record<string, string> = {}) {
  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        title,
        body,
        data,
      }),
    });
  } catch (err) {
    console.error('Push notification failed:', err);
  }
}

async function searchEtsy(keywords: string): Promise<number> {
  const ETSY_KEY = Deno.env.get('ETSY_API_KEY');
  if (!ETSY_KEY) return 0;

  try {
    const params = new URLSearchParams({
      keywords,
      limit: '25',
      sort_on: 'score',
    });

    const res = await fetch(
      `https://openapi.etsy.com/v3/application/listings/active?${params}`,
      {
        headers: { 'x-api-key': ETSY_KEY },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) return 0;
    const data = await res.json();
    return data.count ?? 0;
  } catch {
    return 0;
  }
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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Fetch all active saved searches with their search data
  const { data: savedSearches, error } = await supabase
    .from('saved_searches')
    .select(`
      id,
      user_id,
      search_id,
      last_checked_at,
      searches (
        id,
        style_signals,
        size_filter
      )
    `)
    .eq('is_active', true);

  if (error) {
    console.error('Failed to fetch saved searches:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let processed = 0;
  let notificationsSent = 0;

  for (const saved of savedSearches ?? []) {
    try {
      const search = saved.searches as any;
      if (!search?.style_signals) continue;

      const signals = search.style_signals;

      // Build search keywords from style signals
      const keywords = [
        signals.brand || 'vintage',
        signals.decade_range !== 'vintage' ? signals.decade_range : '',
        signals.garment_type,
        signals.dominant_colors?.[0] ?? '',
      ].filter(Boolean).join(' ');

      // Count existing listings for this search
      const { count: existingCount } = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('search_id', saved.search_id);

      // Query Etsy for new results count
      const newTotalCount = await searchEtsy(keywords);

      // If there are more results than we had, notify
      const hasNewResults = newTotalCount > (existingCount ?? 0);

      // Update last_checked_at
      await supabase
        .from('saved_searches')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('id', saved.id);

      processed++;

      if (hasNewResults) {
        // Get user's push token
        const { data: tokenData } = await supabase
          .from('push_tokens')
          .select('token')
          .eq('user_id', saved.user_id)
          .single();

        if (tokenData?.token) {
          const garment = signals.garment_type ?? 'piece';
          const brand = signals.brand ? `${signals.brand} ` : '';
          await sendPushNotification(
            tokenData.token,
            'New vintage finds!',
            `New ${brand}${garment}s matching your saved search just appeared.`,
            { searchId: search.id }
          );
          notificationsSent++;
        }
      }
    } catch (err) {
      console.error(`Error processing saved search ${saved.id}:`, err);
    }
  }

  return new Response(
    JSON.stringify({ processed, notificationsSent }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
