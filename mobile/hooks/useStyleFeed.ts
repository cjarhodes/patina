import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';
import { Listing } from '../types/listing';

export function useStyleFeed() {
  const session = useAuthStore((s) => s.session);

  const { data: feed = [], isLoading } = useQuery({
    queryKey: ['style-feed', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      // Get user's style preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('style_preferences, favorite_decades')
        .eq('id', session.user.id)
        .single();

      const stylePrefs = profile?.style_preferences ?? [];
      const decades = profile?.favorite_decades ?? [];

      if (stylePrefs.length === 0 && decades.length === 0) return [];

      // Get high-scoring listings from recent searches (not just the user's own)
      // This creates a "discovery" experience — showing finds from other users' searches
      // that match this user's preferences
      const { data: listings, error } = await supabase
        .from('listings')
        .select('*')
        .gte('relevance_score', 0.7)
        .order('fetched_at', { ascending: false })
        .limit(50);

      if (error || !listings) return [];

      // Filter and score by user's preferences
      const scored = listings.map((listing: Listing) => {
        const titleLower = listing.title.toLowerCase();
        let boost = 0;

        // Check style preference keywords
        const STYLE_KEYWORDS: Record<string, string[]> = {
          bohemian: ['boho', 'peasant', 'flowy', 'embroidered', 'fringe'],
          preppy: ['preppy', 'polo', 'blazer', 'plaid', 'argyle', 'oxford'],
          minimalist: ['minimal', 'clean', 'simple', 'structured'],
          grunge: ['grunge', 'flannel', 'distressed', 'oversized'],
          mod: ['mod', '60s', 'shift', 'geometric'],
          western: ['western', 'cowboy', 'fringe', 'denim', 'ranch'],
          streetwear: ['streetwear', 'graphic', 'hoodie', 'skate'],
          romantic: ['romantic', 'lace', 'floral', 'ruffle', 'silk'],
          workwear: ['workwear', 'carhartt', 'canvas', 'chore', 'utility'],
          country: ['country', 'barbour', 'waxed', 'tweed', 'field'],
          athleisure: ['athletic', 'track', 'windbreaker', 'fleece'],
          punk: ['punk', 'leather', 'studs', 'band tee', 'tartan'],
        };

        for (const style of stylePrefs) {
          const keywords = STYLE_KEYWORDS[style] ?? [];
          if (keywords.some((kw) => titleLower.includes(kw))) {
            boost += 0.15;
          }
        }

        for (const decade of decades) {
          if (titleLower.includes(decade.replace('s', ''))) {
            boost += 0.1;
          }
        }

        return { ...listing, feedScore: listing.relevance_score + boost };
      });

      // Only show items that actually match preferences
      return scored
        .filter((item) => item.feedScore > 0.75)
        .sort((a, b) => b.feedScore - a.feedScore)
        .slice(0, 12) as (Listing & { feedScore: number })[];
    },
    enabled: !!session?.user?.id,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  return { feed, isLoading };
}
