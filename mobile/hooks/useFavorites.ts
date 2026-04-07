import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';

export type FavoriteItem = {
  id: string;
  listing_id: string;
  created_at: string;
  listings: {
    id: string;
    search_id: string;
    platform: 'ebay' | 'etsy';
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
};

export function useFavorites() {
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;

  const {
    data: favorites = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('favorites')
        .select('id, listing_id, created_at, listings(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as FavoriteItem[];
    },
    enabled: !!userId,
  });

  const toggleFavorite = useMutation({
    mutationFn: async (listingId: string) => {
      if (!userId) throw new Error('Not signed in');

      // Check if already favorited
      const existing = favorites.find((f) => f.listing_id === listingId);

      if (existing) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { action: 'removed' as const };
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: userId, listing_id: listingId });
        if (error) throw error;
        return { action: 'added' as const };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    },
  });

  function isFavorited(listingId: string): boolean {
    return favorites.some((f) => f.listing_id === listingId);
  }

  return { favorites, isLoading, toggleFavorite, isFavorited, refetch };
}
