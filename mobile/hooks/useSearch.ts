import { useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import { StyleSignal } from '../types/styleSignal';
import { Listing } from '../types/listing';
import { useAuthStore } from './useAuthStore';
import { trackEvent } from '../lib/analytics';

type SearchState = {
  isAnalyzing: boolean;
  isSearching: boolean;
  searchId: string | null;
  styleSignals: StyleSignal | null;
  listings: Listing[];
  error: string | null;
};

/** Get current auth header for edge function calls */
async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

/** Fetch user profile preferences */
async function getUserPreferences(userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('shopping_for, style_preferences, favorite_decades')
    .eq('id', userId)
    .single();

  return {
    shoppingFor: profile?.shopping_for ?? 'womens',
    stylePreferences: profile?.style_preferences ?? [],
    favoriteDecades: profile?.favorite_decades ?? [],
  };
}

/** Upload a local image to Supabase Storage */
async function uploadImage(imageUri: string, prefix = ''): Promise<string> {
  const fileName = `${prefix}${Date.now()}.jpg`;
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: 'base64' as any,
  });

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('search-images')
    .upload(fileName, decode(base64), { contentType: 'image/jpeg' });

  if (uploadError) throw new Error(uploadError.message);
  return uploadData.path;
}

/** Analyze an image via the edge function */
async function analyzeImage(imagePath: string, authHeader: Record<string, string>): Promise<StyleSignal> {
  const { data: { publicUrl } } = supabase.storage
    .from('search-images')
    .getPublicUrl(imagePath);

  const { data, error } = await supabase.functions.invoke('analyze-image', {
    body: { image_url: publicUrl },
    headers: authHeader,
  });

  if (error) throw new Error(error.message);
  return data.style_signals;
}

/** Search platforms with given signals and preferences */
async function searchPlatforms(
  params: {
    styleSignals: StyleSignal;
    sizeFilter: string;
    imagePath: string;
    shoppingFor: string;
    stylePreferences: string[];
    favoriteDecades: string[];
    extraKeywords?: string;
  },
  authHeader: Record<string, string>,
) {
  const { data, error } = await supabase.functions.invoke('search-platforms', {
    body: {
      style_signals: params.styleSignals,
      size_filter: params.sizeFilter,
      image_path: params.imagePath,
      shopping_for: params.shoppingFor,
      style_preferences: params.stylePreferences,
      favorite_decades: params.favoriteDecades,
      ...(params.extraKeywords ? { extra_keywords: params.extraKeywords } : {}),
    },
    headers: authHeader,
  });

  if (error) throw new Error(error.message);
  return data;
}

export function useSearch() {
  const session = useAuthStore((s) => s.session);
  const [state, setState] = useState<SearchState>({
    isAnalyzing: false,
    isSearching: false,
    searchId: null,
    styleSignals: null,
    listings: [],
    error: null,
  });

  async function runSearch(imageUri: string, sizeFilter: string): Promise<string | null> {
    setState((s) => ({ ...s, isAnalyzing: true, error: null, listings: [] }));
    trackEvent('search_started', { size_filter: sizeFilter });

    try {
      const authHeader = await getAuthHeader();
      const imagePath = await uploadImage(imageUri);
      const styleSignals = await analyzeImage(imagePath, authHeader);

      setState((s) => ({ ...s, isAnalyzing: false, isSearching: true, styleSignals }));

      const prefs = session?.user.id
        ? await getUserPreferences(session.user.id)
        : { shoppingFor: 'womens', stylePreferences: [], favoriteDecades: [] };

      const searchData = await searchPlatforms({
        styleSignals,
        sizeFilter,
        imagePath,
        ...prefs,
      }, authHeader);

      setState((s) => ({
        ...s,
        isSearching: false,
        searchId: searchData.search_id,
        listings: searchData.listings,
      }));

      trackEvent('search_completed', {
        search_id: searchData.search_id,
        listing_count: searchData.listings?.length ?? 0,
        garment_type: styleSignals?.garment_type ?? 'unknown',
      });
      return searchData.search_id as string;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setState((s) => ({ ...s, isAnalyzing: false, isSearching: false, error: message }));
      return null;
    }
  }

  async function findSimilar(thumbnailUrl: string, sizeFilter: string): Promise<string | null> {
    setState((s) => ({ ...s, isAnalyzing: true, error: null, listings: [] }));
    trackEvent('find_similar_started', {});

    try {
      const authHeader = await getAuthHeader();

      // Download the listing thumbnail and re-upload to our storage
      const fileName = `similar_${Date.now()}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(
        thumbnailUrl,
        FileSystem.documentDirectory + fileName
      );

      const imagePath = await uploadImage(downloadResult.uri, 'similar_');
      const styleSignals = await analyzeImage(imagePath, authHeader);

      setState((s) => ({ ...s, isAnalyzing: false, isSearching: true, styleSignals }));

      const prefs = session?.user.id
        ? await getUserPreferences(session.user.id)
        : { shoppingFor: 'womens', stylePreferences: [], favoriteDecades: [] };

      const searchData = await searchPlatforms({
        styleSignals,
        sizeFilter,
        imagePath,
        ...prefs,
      }, authHeader);

      setState((s) => ({
        ...s,
        isSearching: false,
        searchId: searchData.search_id,
        listings: searchData.listings,
      }));

      trackEvent('find_similar_completed', {
        search_id: searchData.search_id,
        listing_count: searchData.listings?.length ?? 0,
        garment_type: styleSignals?.garment_type ?? 'unknown',
      });
      return searchData.search_id as string;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setState((s) => ({ ...s, isAnalyzing: false, isSearching: false, error: message }));
      return null;
    }
  }

  async function refineSearch(
    originalStyleSignals: StyleSignal | undefined,
    originalImagePath: string,
    newSizeFilter: string,
    extraKeywords?: string,
  ): Promise<string | null> {
    try {
      setState((s) => ({ ...s, isSearching: true, error: null }));
      trackEvent('refine_search_started', { size_filter: newSizeFilter, has_extra_keywords: !!extraKeywords });

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) throw new Error('Not signed in');

      const prefs = await getUserPreferences(currentSession.user.id);

      const searchData = await searchPlatforms({
        styleSignals: originalStyleSignals!,
        sizeFilter: newSizeFilter,
        imagePath: originalImagePath,
        extraKeywords: extraKeywords ?? '',
        ...prefs,
      }, { Authorization: `Bearer ${currentSession.access_token}` });

      trackEvent('refine_search_completed', {
        search_id: searchData?.search_id,
        listing_count: searchData?.listings?.length ?? 0,
      });
      return searchData?.search_id ?? null;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setState((s) => ({ ...s, error: message }));
      return null;
    } finally {
      setState((s) => ({ ...s, isSearching: false }));
    }
  }

  return { ...state, runSearch, findSimilar, refineSearch };
}
