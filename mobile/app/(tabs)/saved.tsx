import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSavedSearches } from '../../hooks/useSavedSearches';
import { supabase } from '../../lib/supabase';

export default function SavedScreen() {
  const { savedSearches, isLoading, removeSearch } = useSavedSearches();

  function confirmRemove(savedSearchId: string) {
    Alert.alert('Remove saved search?', "You'll stop receiving alerts for this search.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeSearch.mutate(savedSearchId),
      },
    ]);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color="#8B6F47" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Searches</Text>
        <Text style={styles.subtitle}>{savedSearches.length}/3 searches saved</Text>
      </View>

      {savedSearches.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <View style={styles.emptyHeart} />
          </View>
          <Text style={styles.emptyTitle}>No saved searches yet</Text>
          <Text style={styles.emptyBody}>
            After a search, tap "Save" to get daily alerts when new vintage pieces matching your style appear.
          </Text>
          <TouchableOpacity style={styles.cta} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.ctaText}>Start a search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={savedSearches}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const search = item.searches as any;
            const signals = search?.style_signals;
            const imagePath = search?.image_storage_path;
            const publicUrl = imagePath
              ? supabase.storage.from('search-images').getPublicUrl(imagePath).data.publicUrl
              : null;

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/results/${search.id}`)}
              >
                {publicUrl && (
                  <Image source={{ uri: publicUrl }} style={styles.cardImage} />
                )}
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>
                    {signals?.garment_type ?? 'Vintage piece'}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {[
                      signals?.decade_range !== 'vintage' ? signals?.decade_range : null,
                      ...(signals?.dominant_colors?.slice(0, 2) ?? []),
                    ].filter(Boolean).join(' · ') || 'Vintage style'}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardSize}>Size {search?.size_filter ?? ''}</Text>
                    <Text style={styles.cardDate}>
                      {new Date(search?.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => confirmRemove(item.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
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
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0D8D0',
    overflow: 'hidden',
  },
  cardImage: {
    width: 72,
    height: 96,
    backgroundColor: '#F0EAE4',
  },
  cardContent: { flex: 1, padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#3D2B1F', textTransform: 'capitalize' },
  cardMeta: { fontSize: 13, color: '#8B6F47', marginTop: 3, textTransform: 'capitalize' },
  cardFooter: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cardSize: { fontSize: 12, color: '#9E9E9E' },
  cardDate: { fontSize: 12, color: '#9E9E9E' },
  removeButton: { padding: 16 },
  removeText: { fontSize: 16, color: '#C4B5A5' },
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
    width: 24,
    height: 22,
    borderRadius: 4,
    borderWidth: 2.5,
    borderColor: '#C4B5A5',
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#3D2B1F', marginBottom: 12 },
  emptyBody: { fontSize: 14, color: '#6B5B4E', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  cta: { backgroundColor: '#8B6F47', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  ctaText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
