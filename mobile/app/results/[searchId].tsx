import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Listing } from '../../types/listing';
import { StyleSignal } from '../../types/styleSignal';
import { ResultCard } from '../../components/ResultCard';
import { StyleSignalCard } from '../../components/StyleSignalCard';
import { SizeSelector } from '../../components/SizeSelector';
import { SkeletonGrid } from '../../components/SkeletonCard';
import { ErrorState } from '../../components/ErrorState';
import { FilterSortBar, SortOption, PlatformFilter } from '../../components/FilterSortBar';
import { AnalyzingOverlay } from '../../components/AnalyzingOverlay';
import { buildAffiliateUrl } from '../../lib/affiliateLinks';
import { useSavedSearches } from '../../hooks/useSavedSearches';
import { useSearch } from '../../hooks/useSearch';
import { useFavorites } from '../../hooks/useFavorites';
import { useClickTracking } from '../../hooks/useClickTracking';

export default function ResultsScreen() {
  const { searchId } = useLocalSearchParams<{ searchId: string }>();
  const { saveSearch, savedSearches } = useSavedSearches();
  const { isAnalyzing, isSearching, findSimilar, refineSearch } = useSearch();
  const { toggleFavorite, isFavorited } = useFavorites();
  const { trackClick } = useClickTracking();
  const [saving, setSaving] = useState(false);
  const [sort, setSort] = useState<SortOption>('relevance');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showRefine, setShowRefine] = useState(false);
  const [refineSize, setRefineSize] = useState('M');
  const [refineKeywords, setRefineKeywords] = useState('');
  const isFindingSimilar = isAnalyzing || isSearching;

  const isSaved = savedSearches.some((s) => (s.searches as any)?.id === searchId);

  // Fetch search metadata (for style signals)
  const { data: searchMeta } = useQuery({
    queryKey: ['search-meta', searchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('searches')
        .select('style_signals, size_filter, image_storage_path')
        .eq('id', searchId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (searchMeta?.size_filter) {
      setRefineSize(searchMeta.size_filter);
    }
  }, [searchMeta?.size_filter]);

  const styleSignals = searchMeta?.style_signals as StyleSignal | undefined;

  // Fetch listings
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['results', searchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('search_id', searchId)
        .order('relevance_score', { ascending: false });

      if (error) throw error;
      return data as Listing[];
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Apply platform filter and sort
  const filteredData = useMemo(() => {
    if (!data) return [];
    let results = [...data];

    // Platform filter
    if (platformFilter !== 'all') {
      results = results.filter((item) => item.platform === platformFilter);
    }

    // Sort
    switch (sort) {
      case 'price_asc':
        results.sort((a, b) => a.price_usd - b.price_usd);
        break;
      case 'price_desc':
        results.sort((a, b) => b.price_usd - a.price_usd);
        break;
      case 'relevance':
      default:
        results.sort((a, b) => b.relevance_score - a.relevance_score);
        break;
    }

    return results;
  }, [data, sort, platformFilter]);

  async function handleSaveSearch() {
    if (!searchId) return;
    setSaving(true);
    try {
      await saveSearch.mutateAsync(searchId);
      Alert.alert('Saved!', "We'll notify you when new vintage pieces matching this search appear.");
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function openListing(listing: Listing) {
    const url = buildAffiliateUrl(listing.listing_url, listing.platform);
    trackClick({
      listingId: listing.id,
      searchId: searchId!,
      platform: listing.platform,
      listingUrl: listing.listing_url,
      affiliateUrl: url,
    });
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    }
  }

  async function shareSearch() {
    const garment = styleSignals?.garment_type ?? 'vintage piece';
    const decade = styleSignals?.decade_range ?? '';
    const resultCount = data?.length ?? 0;

    try {
      await Share.share({
        message: `Check out this ${decade} ${garment} search on Patina — ${resultCount} vintage finds! https://patina.app/search/${searchId}`,
        url: `patina://results/${searchId}`,
      });
    } catch {
      // user cancelled
    }
  }

  async function shareListing(listing: Listing) {
    try {
      await Share.share({
        message: `Check out this vintage find on Patina: ${listing.title} - $${listing.price_usd.toFixed(2)} ${listing.listing_url}`,
      });
    } catch {
      // user cancelled
    }
  }

  async function handleFindSimilar(listing: Listing) {
    const sizeFilter = searchMeta?.size_filter ?? 'M';
    const newSearchId = await findSimilar(listing.thumbnail_url, sizeFilter);
    if (newSearchId) {
      router.push(`/results/${newSearchId}`);
    }
  }

  async function handleRefine() {
    setShowRefine(false);
    const newSearchId = await refineSearch(
      styleSignals,
      searchMeta?.image_storage_path ?? '',
      refineSize,
      refineKeywords.trim() || undefined,
    );
    if (newSearchId) {
      setRefineKeywords('');
      router.push(`/results/${newSearchId}`);
    }
  }

  const headerComponent = (
    <>
      <Text style={styles.disclosure}>
        We may earn a commission on purchases · results from eBay & Etsy
      </Text>
      {styleSignals && <StyleSignalCard signals={styleSignals} />}
      <FilterSortBar
        sort={sort}
        onSortChange={setSort}
        platformFilter={platformFilter}
        onPlatformFilterChange={setPlatformFilter}
      />
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Results</Text>
        {!isSaved && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveSearch}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#8B6F47" />
              : <Text style={styles.saveButtonText}>Save</Text>
            }
          </TouchableOpacity>
        )}
        {isSaved && <Text style={styles.savedLabel}>Saved</Text>}
        <TouchableOpacity onPress={() => setShowRefine(true)} style={styles.refineButton}>
          <Text style={styles.refineButtonText}>Refine</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={shareSearch} style={styles.shareButton}>
          <Text style={styles.shareIcon}>↗</Text>
        </TouchableOpacity>
      </View>

      {isLoading && !isFindingSimilar && <SkeletonGrid />}

      {isFindingSimilar && (
        <AnalyzingOverlay stage={isAnalyzing ? 'analyzing' : 'searching'} />
      )}

      {error && (
        <ErrorState
          message="Couldn't load results. Check your connection and try again."
          onRetry={() => refetch()}
        />
      )}

      {data && data.length === 0 && (
        <View style={styles.empty}>
          {styleSignals && <StyleSignalCard signals={styleSignals} />}
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptyBody}>
            Try a different photo with clearer clothing details, or adjust your size.
          </Text>
        </View>
      )}

      {data && data.length > 0 && (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          numColumns={2}
          ListHeaderComponent={headerComponent}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#8B6F47"
              colors={['#8B6F47']}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No results for this filter</Text>
              <Text style={styles.emptyBody}>
                Try selecting a different platform or sort option.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ResultCard
              listing={item}
              onPress={() => openListing(item)}
              onLongPress={() => shareListing(item)}
              onFindSimilar={() => handleFindSimilar(item)}
              isFavorited={isFavorited(item.id)}
              onToggleFavorite={() => toggleFavorite.mutate(item.id)}
            />
          )}
        />
      )}
      <Modal
        visible={showRefine}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRefine(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Refine Search</Text>
              <TouchableOpacity onPress={() => setShowRefine(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Size</Text>
            <SizeSelector value={refineSize} onChange={setRefineSize} />

            <Text style={styles.modalLabel}>Add keywords</Text>
            <TextInput
              style={styles.keywordInput}
              placeholder="e.g. corduroy, floral, oversized"
              placeholderTextColor="#C4B5A5"
              value={refineKeywords}
              onChangeText={setRefineKeywords}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity style={styles.refineSubmit} onPress={handleRefine}>
              <Text style={styles.refineSubmitText}>Search again</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 },
  backButton: { marginRight: 12 },
  backText: { color: '#8B6F47', fontSize: 15 },
  title: { flex: 1, fontSize: 20, fontWeight: '600', color: '#3D2B1F' },
  saveButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F0E8DE', borderRadius: 20 },
  saveButtonText: { color: '#8B6F47', fontWeight: '600', fontSize: 14 },
  savedLabel: { color: '#8B6F47', fontWeight: '600', fontSize: 14 },
  shareButton: { marginLeft: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F0E8DE', borderRadius: 20 },
  shareIcon: { fontSize: 16, color: '#8B6F47' },
  disclosure: { fontSize: 11, color: '#C4B5A5', textAlign: 'center', paddingVertical: 8, paddingHorizontal: 16 },
  grid: { padding: 8 },
  row: { justifyContent: 'space-between' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  errorText: { color: '#C0392B', fontSize: 15, textAlign: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#3D2B1F', marginBottom: 12, marginTop: 20 },
  emptyBody: { fontSize: 14, color: '#6B5B4E', textAlign: 'center', lineHeight: 22 },
  refineButton: { marginLeft: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F0E8DE', borderRadius: 20 },
  refineButtonText: { color: '#8B6F47', fontWeight: '600', fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row' as const, justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#3D2B1F' },
  modalClose: { fontSize: 20, color: '#C4B5A5', padding: 4 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#3D2B1F', marginTop: 16, marginBottom: 8 },
  keywordInput: { backgroundColor: '#F5F0EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#3D2B1F', borderWidth: 1, borderColor: '#E0D8D0' },
  refineSubmit: { backgroundColor: '#8B6F47', borderRadius: 14, padding: 16, alignItems: 'center' as const, marginTop: 24 },
  refineSubmitText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
