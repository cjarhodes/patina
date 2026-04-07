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

export default function FavoritesScreen() {
  const { favorites, isLoading, toggleFavorite, isFavorited, refetch } = useFavorites();
  const [refreshing, setRefreshing] = useState(false);

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
            return (
              <ResultCard
                listing={listing}
                onPress={() => openListing(listing)}
                onLongPress={() => shareListing(listing)}
                isFavorited={isFavorited(listing.id)}
                onToggleFavorite={() => toggleFavorite.mutate(listing.id)}
              />
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  header: { padding: 24, paddingBottom: 12 },
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
});
