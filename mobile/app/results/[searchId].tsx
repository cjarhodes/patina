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
  Keyboard,
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
import { colors, typography, spacing, borderRadius } from '../../lib/theme';

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not save search';
      Alert.alert('Save failed', message);
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
    } catch (err) {
      console.error('Share failed:', err);
    }
  }

  async function shareListing(listing: Listing) {
    try {
      await Share.share({
        message: `Check out this vintage find on Patina: ${listing.title} - $${listing.price_usd.toFixed(2)} ${listing.listing_url}`,
      });
    } catch (err) {
      console.error('Share failed:', err);
    }
  }

  async function handleFindSimilar(listing: Listing) {
    const sizeFilter = searchMeta?.size_filter ?? 'M';
    const newSearchId = await findSimilar(listing.thumbnail_url, sizeFilter);
    if (newSearchId) {
      router.push(`/results/${newSearchId}`);
    }
  }

  function closeRefineModal() {
    Keyboard.dismiss();
    setShowRefine(false);
  }

  async function handleRefine() {
    closeRefineModal();
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Results</Text>
        {!isSaved && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveSearch}
            disabled={saving}
            accessibilityLabel="Save this search"
            accessibilityRole="button"
          >
            {saving
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Text style={styles.saveButtonText}>Save</Text>
            }
          </TouchableOpacity>
        )}
        {isSaved && <Text style={styles.savedLabel}>Saved</Text>}
        <TouchableOpacity
          onPress={() => setShowRefine(true)}
          style={styles.refineButton}
          accessibilityLabel="Refine search"
          accessibilityRole="button"
        >
          <Text style={styles.refineButtonText}>Refine</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={shareSearch}
          style={styles.shareButton}
          accessibilityLabel="Share this search"
          accessibilityRole="button"
        >
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
              tintColor={colors.primary}
              colors={[colors.primary]}
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
        onRequestClose={closeRefineModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Refine Search</Text>
              <TouchableOpacity
                onPress={closeRefineModal}
                accessibilityLabel="Close refine modal"
                accessibilityRole="button"
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Size</Text>
            <SizeSelector value={refineSize} onChange={setRefineSize} />

            <Text style={styles.modalLabel}>Add keywords</Text>
            <TextInput
              style={styles.keywordInput}
              placeholder="e.g. corduroy, floral, oversized"
              placeholderTextColor={colors.text.disabled}
              value={refineKeywords}
              onChangeText={setRefineKeywords}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={100}
              returnKeyType="search"
              onSubmitEditing={handleRefine}
            />

            <TouchableOpacity
              style={styles.refineSubmit}
              onPress={handleRefine}
              accessibilityLabel="Search again with new filters"
              accessibilityRole="button"
            >
              <Text style={styles.refineSubmitText}>Search again</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.sm },
  backButton: { marginRight: spacing.md },
  backText: { color: colors.primary, fontSize: 15 },
  title: { flex: 1, fontSize: 20, fontWeight: '600', color: colors.text.primary },
  saveButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.surface.secondary, borderRadius: borderRadius.pill },
  saveButtonText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  savedLabel: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  shareButton: { marginLeft: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surface.secondary, borderRadius: borderRadius.pill },
  shareIcon: { fontSize: 16, color: colors.primary },
  disclosure: { fontSize: 11, color: colors.text.disabled, textAlign: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  grid: { padding: spacing.sm },
  row: { justifyContent: 'space-between' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { ...typography.titleSmall, marginBottom: spacing.md, marginTop: spacing.xl },
  emptyBody: { ...typography.body, textAlign: 'center' },
  refineButton: { marginLeft: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surface.secondary, borderRadius: borderRadius.pill },
  refineButtonText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: colors.surface.card, borderTopLeftRadius: borderRadius.pill, borderTopRightRadius: borderRadius.pill, padding: spacing.xxl, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  modalTitle: { fontSize: 20, fontWeight: '600', color: colors.text.primary },
  modalClose: { fontSize: 20, color: colors.text.disabled, padding: spacing.xs },
  modalLabel: { fontSize: 14, fontWeight: '600', color: colors.text.primary, marginTop: spacing.lg, marginBottom: spacing.sm },
  keywordInput: { backgroundColor: colors.surface.background, borderRadius: borderRadius.lg, padding: 14, fontSize: 15, color: colors.text.primary, borderWidth: 1, borderColor: colors.border.default },
  refineSubmit: { backgroundColor: colors.primary, borderRadius: borderRadius.xl, padding: spacing.lg, alignItems: 'center', marginTop: spacing.xxl },
  refineSubmitText: { color: colors.text.inverse, fontSize: 16, fontWeight: '600' },
});
