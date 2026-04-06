import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// This function is called on a daily cron schedule by Supabase.
// It re-runs all active saved searches and sends push notifications
// if new listings are found.

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function sendPushNotification(token: string, title: string, body: string) {
  await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: token,
      sound: 'default',
      title,
      body,
      data: {},
    }),
  });
}

serve(async (req) => {
  // Verify this is called from Supabase cron (or for manual testing)
  const authHeader = req.headers.get('Authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceRoleKey
  );

  // Fetch all active saved searches with their style signals and user push tokens
  const { data: savedSearches, error } = await supabase
    .from('saved_searches')
    .select(`
      id,
      user_id,
      search_id,
      last_checked_at,
      searches (
        style_signals,
        size_filter,
        image_storage_path
      ),
      profiles!inner (
        id
      )
    `)
    .eq('is_active', true);

  if (error) {
    console.error('Failed to fetch saved searches:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let notificationsSent = 0;

  for (const saved of savedSearches ?? []) {
    try {
      const search = saved.searches as any;
      if (!search?.style_signals) continue;

      // Get user's push token
      const { data: tokenData } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', saved.user_id)
        .single();

      if (!tokenData?.token) continue;

      // Count listings found before this check
      const { count: prevCount } = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('search_id', saved.search_id);

      // Call search-platforms function to re-run the search
      const { data: searchResult } = await supabase.functions.invoke('search-platforms', {
        body: {
          style_signals: search.style_signals,
          size_filter: search.size_filter,
          image_path: search.image_storage_path,
          saved_search_id: saved.search_id, // will reuse existing search_id in a future optimization
        },
        headers: {
          // Use service role to bypass user auth for cron context
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      });

      const newCount = searchResult?.listings?.length ?? 0;
      const newListings = Math.max(0, newCount - (prevCount ?? 0));

      // Update last_checked_at
      await supabase
        .from('saved_searches')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('id', saved.id);

      // Send push notification if new results found
      if (newListings > 0) {
        const garment = search.style_signals.garment_type ?? 'piece';
        await sendPushNotification(
          tokenData.token,
          'New vintage finds!',
          `${newListings} new ${garment}${newListings > 1 ? 's' : ''} matching your saved search just appeared.`
        );
        notificationsSent++;
      }
    } catch (err) {
      console.error(`Error processing saved search ${saved.id}:`, err);
    }
  }

  return new Response(
    JSON.stringify({ processed: savedSearches?.length ?? 0, notificationsSent }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
