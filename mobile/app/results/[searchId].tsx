import { useState } from 'react';
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
} from 'react-native';
import { Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Listing } from '../../types/listing';
import { ResultCard } from '../../components/ResultCard';
import { buildAffiliateUrl } from '../../lib/affiliateLinks';
import { useSavedSearches } from '../../hooks/useSavedSearches';

export default function ResultsScreen() {
  const { searchId } = useLocalSearchParams<{ searchId: string }>();
  const { saveSearch, savedSearches } = useSavedSearches();
  const [saving, setSaving] = useState(false);

  const isSaved = savedSearches.some((s) => (s.searches as any)?.id === searchId);

  const { data, isLoading, error } = useQuery({
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

  async function handleSaveSearch() {
    if (!searchId) return;
    setSaving(true);
    try {
      await saveSearch.mutateAsync(searchId);
      Alert.alert('Saved!', 'We\'ll notify you when new vintage pieces matching this search appear.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function openListing(listing: Listing) {
    const url = buildAffiliateUrl(listing.listing_url, listing.platform);
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    }
  }

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
        {isSaved && <Text style={styles.savedLabel}>Saved ✓</Text>}
      </View>

      <Text style={styles.disclosure}>
        We may earn a commission on purchases · results from eBay &amp; Etsy
      </Text>

      {isLoading && (
        <ActivityIndicator size="large" color="#8B6F47" style={{ flex: 1 }} />
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Couldn't load results. Please try again.</Text>
        </View>
      )}

      {data && data.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptyBody}>
            Try a different photo with clearer clothing details, or adjust your size.
          </Text>
        </View>
      )}

      {data && data.length > 0 && (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <ResultCard listing={item} onPress={() => openListing(item)} />
          )}
        />
      )}
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
  disclosure: { fontSize: 11, color: '#C4B5A5', textAlign: 'center', paddingVertical: 8, paddingHorizontal: 16 },
  grid: { padding: 8 },
  row: { justifyContent: 'space-between' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  errorText: { color: '#C0392B', fontSize: 15, textAlign: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#3D2B1F', marginBottom: 12 },
  emptyBody: { fontSize: 14, color: '#6B5B4E', textAlign: 'center', lineHeight: 22 },
});
