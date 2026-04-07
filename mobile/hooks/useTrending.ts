import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';

export type TrendingItem = {
  garment_type: string;
  decade_range: string;
  brand: string;
  search_count: number;
};

export function useTrending() {
  const session = useAuthStore((s) => s.session);

  const { data: trending = [], isLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_trending_searches');
      if (error) {
        console.warn('Trending fetch failed:', error.message);
        return getFallbackTrending();
      }
      if (!data || data.length === 0) return getFallbackTrending();
      return data as TrendingItem[];
    },
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return { trending, isLoading };
}

// Fallback trending data for new apps with few users
function getFallbackTrending(): TrendingItem[] {
  return [
    { garment_type: 'denim jacket', decade_range: '1990s', brand: '', search_count: 24 },
    { garment_type: 'blazer', decade_range: '1980s', brand: '', search_count: 19 },
    { garment_type: 'slip dress', decade_range: '1990s', brand: '', search_count: 17 },
    { garment_type: 'waxed jacket', decade_range: '1980s', brand: 'Barbour', search_count: 15 },
    { garment_type: 'floral dress', decade_range: '1970s', brand: '', search_count: 13 },
    { garment_type: 'band tee', decade_range: '1990s', brand: '', search_count: 11 },
    { garment_type: 'corduroy trousers', decade_range: '1970s', brand: '', search_count: 9 },
    { garment_type: 'cable knit sweater', decade_range: '1980s', brand: '', search_count: 7 },
  ];
}
