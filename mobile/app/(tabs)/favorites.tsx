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
    } catch {
      // user cancelled
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
          <TouchableOpacity style={styles.cta} onPress={() => router.push('/(tabs)')}>
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
              tintColor="#8B6F47"
              colors={['#8B6F47']}
            />
          }
          renderItem={({ item }) => {
            const listing = toListing(item);
            const isSelected = selected.includes(listing.id);
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
                style={[compareMode && isSelected && styles.selectedCard]}
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
        >
          <Text style={styles.compareFloatingText}>Compare these two</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  header: { padding: 24, paddingBottom: 12, position: 'relative' },
  title: { fontSize: 26, fontWeight: '600', color: '#3D2B1F' },
  subtitle: { fontSize: 13, color: '#9E9E9E', marginTop: 4 },
  grid: { padding: 8 },
  row: { justifyContent: 'space-between' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0E8DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyHeart: {
    fontSize: 28,
    color: '#C4B5A5',
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#3D2B1F', marginBottom: 12 },
  emptyBody: { fontSize: 14, color: '#6B5B4E', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  cta: { backgroundColor: '#8B6F47', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  ctaText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  compareToggle: { position: 'absolute', right: 24, top: 28, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0E8DE' },
  compareToggleActive: { backgroundColor: '#8B6F47' },
  compareToggleText: { fontSize: 13, fontWeight: '600', color: '#8B6F47' },
  compareToggleTextActive: { color: '#FFF' },
  selectedCard: { borderWidth: 2, borderColor: '#8B6F47', borderRadius: 14 },
  compareFloating: { position: 'absolute', bottom: 24, left: 24, right: 24, backgroundColor: '#8B6F47', borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  compareFloatingText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
