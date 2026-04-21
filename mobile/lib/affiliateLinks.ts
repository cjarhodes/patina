import { Platform } from '../types/listing';

// eBay Partner Network Campaign ID (from partner.ebay.com → Campaigns)
const EBAY_CAMPAIGN_ID = process.env.EXPO_PUBLIC_EBAY_CAMPAIGN_ID ?? '';

// Etsy affiliate tracking (via Awin / Etsy Affiliate Programme)
const ETSY_AFFILIATE_ID = process.env.EXPO_PUBLIC_ETSY_AFFILIATE_ID ?? '';

// Default rotation / tool IDs for eBay Rover links (US network)
// See: https://partnernetwork.ebay.com/help/about/tracking-links
const EBAY_ROVER_ID = '711-53200-19255-0';
const EBAY_TOOL_ID = '10001';

/**
 * Wraps a listing URL in an affiliate tracking link.
 * @param listingUrl The raw product URL
 * @param platform The source platform
 * @param customId Optional per-click custom tracking string (e.g. search_id, "feed", "favorites")
 *                 Max 256 chars, alphanumeric + hyphens/underscores only.
 */
export function buildAffiliateUrl(
  listingUrl: string,
  platform: Platform,
  customId?: string,
): string {
  if (platform === 'ebay' && EBAY_CAMPAIGN_ID) {
    const params = new URLSearchParams({
      mkevt: '1',
      mkcid: '1',
      mkrid: EBAY_ROVER_ID,
      campid: EBAY_CAMPAIGN_ID,
      toolid: EBAY_TOOL_ID,
      customid: sanitizeCustomId(customId),
    });
    // Append eBay tracking params directly to the listing URL — this is the
    // modern EPN-preferred approach (vs. wrapping in rover.ebay.com/rover/1/...).
    const separator = listingUrl.includes('?') ? '&' : '?';
    return `${listingUrl}${separator}${params.toString()}`;
  }

  if (platform === 'etsy' && ETSY_AFFILIATE_ID) {
    try {
      const url = new URL(listingUrl);
      url.searchParams.set('utm_source', 'patina');
      url.searchParams.set('utm_medium', 'affiliate');
      url.searchParams.set('utm_campaign', ETSY_AFFILIATE_ID);
      return url.toString();
    } catch {
      return listingUrl;
    }
  }

  return listingUrl;
}

/** eBay customid: max 256 chars, safe chars only. Empty string is valid. */
function sanitizeCustomId(raw?: string): string {
  if (!raw) return '';
  return raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 256);
}
