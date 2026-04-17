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
      // Fetch searches with listing counts in a single query using a subquery
      // This avoids the N+1 pattern of fetching count per search
      const { data, error } = await supabase
        .from('searches')
        .select('id, image_storage_path, style_signals, size_filter, created_at, listings(count)')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data ?? []).map((search) => ({
        ...search,
        // Supabase returns count as [{ count: N }] when using select('listings(count)')
        listing_count: (search.listings as any)?.[0]?.count ?? 0,
      })) as SearchHistoryItem[];
    },
  });

  return { history, isLoading };
}
