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

  async function runSearch(imageUri: string, sizeFilter: string) {
    setState((s) => ({ ...s, isAnalyzing: true, error: null, listings: [] }));
    trackEvent('search_started', { size_filter: sizeFilter });

    try {
      // Get current session token to explicitly pass to edge functions
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const authHeader = currentSession?.access_token
        ? { Authorization: `Bearer ${currentSession.access_token}` }
        : {};

      // 1. Upload image to Supabase Storage (read as base64 for React Native compatibility)
      const fileName = `${Date.now()}.jpg`;
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64' as any,
      });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('search-images')
        .upload(fileName, decode(base64), { contentType: 'image/jpeg' });

      if (uploadError) throw new Error(uploadError.message);

      const imagePath = uploadData.path;

      // 2. Get public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('search-images')
        .getPublicUrl(imagePath);

      // 3. Call analyze-image edge function
      const { data: analyzeData, error: analyzeError } = await supabase.functions.invoke(
        'analyze-image',
        { body: { image_url: publicUrl }, headers: authHeader }
      );

      if (analyzeError) throw new Error(analyzeError.message);

      const styleSignals: StyleSignal = analyzeData.style_signals;
      setState((s) => ({ ...s, isAnalyzing: false, isSearching: true, styleSignals }));

      // 4. Fetch user's profile preferences
      let shoppingFor = 'womens';
      let stylePreferences: string[] = [];
      let favoriteDecades: string[] = [];
      if (session?.user.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('shopping_for, style_preferences, favorite_decades')
          .eq('id', session.user.id)
          .single();
        if (profile?.shopping_for) shoppingFor = profile.shopping_for;
        if (profile?.style_preferences) stylePreferences = profile.style_preferences;
        if (profile?.favorite_decades) favoriteDecades = profile.favorite_decades;
      }

      // 5. Call search-platforms edge function
      const { data: searchData, error: searchError } = await supabase.functions.invoke(
        'search-platforms',
        {
          body: {
            style_signals: styleSignals,
            size_filter: sizeFilter,
            image_path: imagePath,
            shopping_for: shoppingFor,
            style_preferences: stylePreferences,
            favorite_decades: favoriteDecades,
          },
          headers: authHeader,
        }
      );

      if (searchError) throw new Error(searchError.message);

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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setState((s) => ({ ...s, isAnalyzing: false, isSearching: false, error: message }));
      return null;
    }
  }

  async function findSimilar(thumbnailUrl: string, sizeFilter: string) {
    setState((s) => ({ ...s, isAnalyzing: true, error: null, listings: [] }));
    trackEvent('find_similar_started', {});

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const authHeader = currentSession?.access_token
        ? { Authorization: `Bearer ${currentSession.access_token}` }
        : {};

      // Download the listing thumbnail and re-upload to our storage
      const fileName = `similar_${Date.now()}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(
        thumbnailUrl,
        FileSystem.documentDirectory + fileName
      );

      const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
        encoding: 'base64' as any,
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('search-images')
        .upload(fileName, decode(base64), { contentType: 'image/jpeg' });

      if (uploadError) throw new Error(uploadError.message);

      const imagePath = uploadData.path;
      const { data: { publicUrl } } = supabase.storage
        .from('search-images')
        .getPublicUrl(imagePath);

      // Analyze the image
      const { data: analyzeData, error: analyzeError } = await supabase.functions.invoke(
        'analyze-image',
        { body: { image_url: publicUrl }, headers: authHeader }
      );

      if (analyzeError) throw new Error(analyzeError.message);

      const styleSignals: StyleSignal = analyzeData.style_signals;
      setState((s) => ({ ...s, isAnalyzing: false, isSearching: true, styleSignals }));

      // Fetch profile preferences
      let shoppingFor = 'womens';
      let stylePreferences: string[] = [];
      let favoriteDecades: string[] = [];
      if (session?.user.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('shopping_for, style_preferences, favorite_decades')
          .eq('id', session.user.id)
          .single();
        if (profile?.shopping_for) shoppingFor = profile.shopping_for;
        if (profile?.style_preferences) stylePreferences = profile.style_preferences;
        if (profile?.favorite_decades) favoriteDecades = profile.favorite_decades;
      }

      // Search platforms
      const { data: searchData, error: searchError } = await supabase.functions.invoke(
        'search-platforms',
        {
          body: {
            style_signals: styleSignals,
            size_filter: sizeFilter,
            image_path: imagePath,
            shopping_for: shoppingFor,
            style_preferences: stylePreferences,
            favorite_decades: favoriteDecades,
          },
          headers: authHeader,
        }
      );

      if (searchError) throw new Error(searchError.message);

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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setState((s) => ({ ...s, isAnalyzing: false, isSearching: false, error: message }));
      return null;
    }
  }

  return { ...state, runSearch, findSimilar };
}

