import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';

export function useClickTracking() {
  const session = useAuthStore((s) => s.session);

  async function trackClick(params: {
    listingId: string;
    searchId: string;
    platform: string;
    listingUrl: string;
    affiliateUrl: string;
  }) {
    if (!session?.user?.id) return;

    try {
      await supabase.from('link_clicks').insert({
        user_id: session.user.id,
        listing_id: params.listingId,
        search_id: params.searchId,
        platform: params.platform,
        listing_url: params.listingUrl,
        affiliate_url: params.affiliateUrl,
      });
    } catch {
      // Non-blocking — don't fail the user's navigation
    }
  }

  return { trackClick };
}
