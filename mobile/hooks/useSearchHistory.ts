import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';

export type SearchHistoryItem = {
  id: string;
  image_storage_path: string;
  style_signals: {
    garment_type: string;
    decade_range: string;
    dominant_colors: string[];
  };
  size_filter: string;
  created_at: string;
  listing_count: number;
};

export function useSearchHistory() {
  const session = useAuthStore((s) => s.session);

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['search-history', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('searches')
        .select('id, image_storage_path, style_signals, size_filter, created_at')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get listing counts
      const results = await Promise.all(
        (data ?? []).map(async (search) => {
          const { count } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('search_id', search.id);

          return {
            ...search,
            listing_count: count ?? 0,
          } as SearchHistoryItem;
        })
      );

      return results;
    },
  });

  return { history, isLoading };
}
