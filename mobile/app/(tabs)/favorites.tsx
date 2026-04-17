import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Linking,
  Share,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useFavorites, FavoriteItem } from '../../hooks/useFavorites';
import { ResultCard } from '../../components/ResultCard';
import { SkeletonGrid } from '../../components/SkeletonCard';
import { buildAffiliateUrl } from '../../lib/affiliateLinks';
import { Listing } from '../../types/listing';
import { useClickTracking } from '../../hooks/useClickTracking';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

export default function FavoritesScreen() {
  const { favorites, isLoading, toggleFavorite, isFavorited, refetch } = useFavorites();
  const { trackClick } = useClickTracking();
  const [refreshing, setRefreshing] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  function toListing(fav: FavoriteItem): Listing {
    return fav.listings;
  }

  async function openListing(listing: Listing) {
    const url = buildAffiliateUrl(listing.listing_url, listing.platform);
    trackClick({
      listingId: listing.id,
      searchId: listing.search_id,
      platform: listing.platform,
      listingUrl: listing.listing_url,
      affiliateUrl: url,
    });
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Favorites</Text>
        </View>
        <SkeletonGrid />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>
          {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved
        </Text>
        {favorites.length >= 2 && (
          <TouchableOpacity
            style={[styles.compareToggle, compareMode && styles.compareToggleActive]}
            onPress={() => {
              setCompareMode(!compareMode);
              setSelected([]);
            }}
            accessibilityLabel={compareMode ? 'Cancel compare mode' : 'Compare items'}
            accessibilityRole="button"
          >
            <Text style={[styles.compareToggleText, compareMode && styles.compareToggleTextActive]}>
              {compareMode ? 'Cancel' : 'Compare'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyHeart}>{'\u2661'}</Text>
          </View>
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyBody}>
            Tap the heart on any listing to save it here.
          </Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => router.push('/(tabs)')}
            accessibilityLabel="Start a search"
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>Start a search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          numColumns={2}
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
          renderItem={({ item }) => {
            const listing = toListing(item);
            const isItemSelected = selected.includes(listing.id);
            const priceDrop = item.last_known_price !== null && item.last_known_price < listing.price_usd
              ? listing.price_usd - item.last_known_price!
              : undefined;

            return (
              <TouchableOpacity
                activeOpacity={compareMode ? 0.7 : 1}
                onPress={() => {
                  if (compareMode) {
                    setSelected((prev) => {
                      if (prev.includes(listing.id)) {
                        return prev.filter((id) => id !== listing.id);
                      }
                      if (prev.length >= 2) return prev;
                      return [...prev, listing.id];
                    });
                  }
                }}
                style={[compareMode && isItemSelected && styles.selectedCard]}
                accessibilityLabel={compareMode ? `Select ${listing.title} for comparison` : undefined}
              >
                <ResultCard
                  listing={priceDrop ? { ...listing, price_usd: item.last_known_price! } : listing}
                  onPress={compareMode ? () => {} : () => openListing(listing)}
                  onLongPress={compareMode ? undefined : () => shareListing(listing)}
                  isFavorited={isFavorited(listing.id)}
                  onToggleFavorite={compareMode ? undefined : () => toggleFavorite.mutate(listing.id)}
                  priceDrop={priceDrop}
                />
              </TouchableOpacity>
            );
          }}
        />
      )}

      {compareMode && selected.length === 2 && (
        <TouchableOpacity
          style={styles.compareFloating}
          onPress={() => {
            router.push(`/compare?listingA=${selected[0]}&listingB=${selected[1]}` as any);
            setCompareMode(false);
            setSelected([]);
          }}
          accessibilityLabel="Compare selected items"
          accessibilityRole="button"
        >
          <Text style={styles.compareFloatingText}>Compare these two</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background },
  header: { padding: spacing.xxl, paddingBottom: spacing.md, position: 'relative' },
  title: { ...typography.title },
  subtitle: { fontSize: 13, color: colors.text.muted, marginTop: spacing.xs },
  grid: { padding: spacing.sm },
  row: { justifyContent: 'space-between' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyHeart: {
    fontSize: 28,
    color: colors.text.disabled,
  },
  emptyTitle: { ...typography.titleSmall, marginBottom: spacing.md },
  emptyBody: { ...typography.body, textAlign: 'center', marginBottom: spacing.xxxl },
  cta: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: 14, paddingHorizontal: spacing.xxxl },
  ctaText: { color: colors.text.inverse, fontSize: 15, fontWeight: '600' },
  compareToggle: { position: 'absolute', right: spacing.xxl, top: 28, paddingHorizontal: 14, paddingVertical: 6, borderRadius: borderRadius.lg, backgroundColor: colors.surface.secondary },
  compareToggleActive: { backgroundColor: colors.primary },
  compareToggleText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  compareToggleTextActive: { color: colors.text.inverse },
  selectedCard: { borderWidth: 2, borderColor: colors.primary, borderRadius: borderRadius.xl },
  compareFloating: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: spacing.xxl,
    right: spacing.xxl,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.elevated,
  },
  compareFloatingText: { color: colors.text.inverse, fontSize: 16, fontWeight: '600' },
});
