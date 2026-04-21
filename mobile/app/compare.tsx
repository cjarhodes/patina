import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Listing } from '../types/listing';
import { PlatformBadge } from '../components/PlatformBadge';
import { buildAffiliateUrl } from '../lib/affiliateLinks';

export default function CompareScreen() {
  const { listingA, listingB } = useLocalSearchParams<{ listingA: string; listingB: string }>();

  const { data: listings, isLoading } = useQuery({
    queryKey: ['compare', listingA, listingB],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .in('id', [listingA, listingB]);
      if (error) throw error;
      return data as Listing[];
    },
    enabled: !!listingA && !!listingB,
  });

  const a = listings?.find((l) => l.id === listingA);
  const b = listings?.find((l) => l.id === listingB);

  function openListing(listing: Listing) {
    const url = buildAffiliateUrl(listing.listing_url, listing.platform, 'compare');
    Linking.openURL(url);
  }

  function CompareColumn({ listing }: { listing: Listing }) {
    return (
      <View style={styles.column}>
        <Image source={{ uri: listing.thumbnail_url }} style={styles.image} resizeMode="cover" />
        <View style={styles.columnContent}>
          <PlatformBadge platform={listing.platform} />
          <Text style={styles.price}>${listing.price_usd.toFixed(0)}</Text>
          <Text style={styles.itemTitle} numberOfLines={3}>{listing.title}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Size</Text>
            <Text style={styles.detailValue}>{listing.size_label || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Condition</Text>
            <Text style={styles.detailValue}>{listing.condition || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Match</Text>
            <Text style={styles.detailValue}>{Math.round(listing.relevance_score * 100)}%</Text>
          </View>

          <TouchableOpacity style={styles.viewButton} onPress={() => openListing(listing)}>
            <Text style={styles.viewButtonText}>View on {listing.platform === 'ebay' ? 'eBay' : 'Etsy'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compare</Text>
        <View style={{ width: 60 }} />
      </View>

      {isLoading && (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {a && b && (
        <ScrollView contentContainerStyle={styles.compareGrid}>
          <View style={styles.columnsRow}>
            <CompareColumn listing={a} />
            <View style={styles.divider} />
            <CompareColumn listing={b} />
          </View>

          {/* Price comparison highlight */}
          {a.price_usd !== b.price_usd && (
            <View style={styles.comparisonNote}>
              <Text style={styles.comparisonNoteText}>
                {a.price_usd < b.price_usd
                  ? `Left is $${(b.price_usd - a.price_usd).toFixed(0)} cheaper`
                  : `Right is $${(a.price_usd - b.price_usd).toFixed(0)} cheaper`
                }
              </Text>
            </View>
          )}

          {/* Match score comparison */}
          {a.relevance_score !== b.relevance_score && (
            <View style={styles.comparisonNote}>
              <Text style={styles.comparisonNoteText}>
                {a.relevance_score > b.relevance_score
                  ? `Left is a ${Math.round((a.relevance_score - b.relevance_score) * 100)}% better match`
                  : `Right is a ${Math.round((b.relevance_score - a.relevance_score) * 100)}% better match`
                }
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {!isLoading && (!a || !b) && (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Could not load both items</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 8 },
  backButton: { width: 60 },
  backText: { color: '#8B6F47', fontSize: 15 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#3D2B1F' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 15, color: '#9E9E9E' },
  compareGrid: { padding: 12 },
  columnsRow: { flexDirection: 'row', gap: 0 },
  column: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#E0D8D0' },
  divider: { width: 12 },
  image: { width: '100%', aspectRatio: 3 / 4, backgroundColor: '#F0EAE4' },
  columnContent: { padding: 12, gap: 8 },
  price: { fontSize: 22, fontWeight: '700', color: '#3D2B1F' },
  itemTitle: { fontSize: 13, color: '#6B5B4E', lineHeight: 18 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F0EAE4' },
  detailLabel: { fontSize: 12, color: '#9E9E9E' },
  detailValue: { fontSize: 12, fontWeight: '600', color: '#3D2B1F' },
  viewButton: { backgroundColor: '#8B6F47', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4 },
  viewButtonText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  comparisonNote: { backgroundColor: '#F0E8DE', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 12 },
  comparisonNoteText: { fontSize: 13, fontWeight: '600', color: '#8B6F47' },
});
