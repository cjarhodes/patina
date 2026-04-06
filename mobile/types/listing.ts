export type Platform = 'ebay' | 'etsy';

export type Listing = {
  id: string;
  search_id: string;
  platform: Platform;
  external_id: string;
  title: string;
  price_usd: number;
  size_label: string;
  condition: string;
  thumbnail_url: string;
  listing_url: string;
  relevance_score: number;
  fetched_at: string;
};
