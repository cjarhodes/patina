import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';

export function useSavedSearches() {
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();

  const { data: savedSearches = [], isLoading, refetch } = useQuery({
    queryKey: ['saved-searches', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_searches')
        .select(`
          id,
          is_active,
          last_checked_at,
          searches (
            id,
            style_signals,
            size_filter,
            created_at,
            image_storage_path
          )
        `)
        .eq('is_active', true)
        .order('created_at', { referencedTable: 'searches', ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const saveSearch = useMutation({
    mutationFn: async (searchId: string) => {
      if (savedSearches.length >= 3) {
        throw new Error('Free tier limit: you can save up to 3 searches. Remove one to add another.');
      }
      const { error } = await supabase
        .from('saved_searches')
        .insert({ search_id: searchId, user_id: session!.user.id, is_active: true });

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  const removeSearch = useMutation({
    mutationFn: async (savedSearchId: string) => {
      const { error } = await supabase
        .from('saved_searches')
        .update({ is_active: false })
        .eq('id', savedSearchId);

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  return { savedSearches, isLoading, refetch, saveSearch, removeSearch };
}
