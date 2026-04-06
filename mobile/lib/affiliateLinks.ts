import { Platform } from '../types/listing';

// Replace these with your actual affiliate IDs once approved
const EBAY_CAMPAIGN_ID = process.env.EXPO_PUBLIC_EBAY_CAMPAIGN_ID ?? '';
const ETSY_AFFILIATE_ID = process.env.EXPO_PUBLIC_ETSY_AFFILIATE_ID ?? '';

export function buildAffiliateUrl(listingUrl: string, platform: Platform): string {
  if (platform === 'ebay' && EBAY_CAMPAIGN_ID) {
    const encoded = encodeURIComponent(listingUrl);
    return `https://rover.ebay.com/rover/1/711-53200-19255-0/1?campid=${EBAY_CAMPAIGN_ID}&customid=&toolid=10001&mkevt=1&mkcid=1&mkrid=711-53200-19255-0&ff3=2&url=${encoded}`;
  }

  if (platform === 'etsy' && ETSY_AFFILIATE_ID) {
    const url = new URL(listingUrl);
    url.searchParams.set('utm_source', 'patina');
    url.searchParams.set('utm_medium', 'affiliate');
    return url.toString();
  }

  return listingUrl;
}
