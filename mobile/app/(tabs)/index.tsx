import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  Image,
  FlatList,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useSearch } from '../../hooks/useSearch';
import { useSearchHistory } from '../../hooks/useSearchHistory';
import { useTrending } from '../../hooks/useTrending';
import { useStyleFeed } from '../../hooks/useStyleFeed';
import { SizeSelector } from '../../components/SizeSelector';
import { AnalyzingOverlay } from '../../components/AnalyzingOverlay';
import { SearchHistoryCard } from '../../components/SearchHistoryCard';
import { TrendingChip } from '../../components/TrendingChip';
import { StyleFeedCard } from '../../components/StyleFeedCard';

export default function HomeScreen() {
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { isAnalyzing, isSearching, error, runSearch } = useSearch();
  const { history } = useSearchHistory();
  const { trending } = useTrending();
  const { feed } = useStyleFeed();

  const isLoading = isAnalyzing || isSearching;

  function openFeedItem(listing: any) {
    Linking.openURL(listing.listing_url);
  }

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      await startSearch(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access required', 'Please enable camera access in Settings to photograph outfits.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      await startSearch(result.assets[0].uri);
    }
  }

  async function startSearch(imageUri: string) {
    const searchId = await runSearch(imageUri, selectedSize);
    if (searchId) {
      setSelectedImage(null);
      router.push(`/results/${searchId}`);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.logo}>patina</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingSection}>
            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            )}
            <AnalyzingOverlay stage={isAnalyzing ? 'analyzing' : 'searching'} />
          </View>
        ) : (
          <>
            <Text style={styles.prompt}>Find vintage that matches your style</Text>

            <SizeSelector value={selectedSize} onChange={setSelectedSize} />

            <View style={styles.actions}>
              <TouchableOpacity style={styles.primaryAction} onPress={pickFromLibrary}>
                <Text style={styles.primaryActionText}>Choose from Photos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryAction} onPress={takePhoto}>
                <Text style={styles.secondaryActionText}>Take a Photo</Text>
              </TouchableOpacity>
            </View>

            {error && (
              <Text style={styles.error}>{error}</Text>
            )}

            {history.length > 0 && (
              <View style={styles.historySection}>
                <Text style={styles.historyLabel}>Recent searches</Text>
                <FlatList
                  data={history}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <SearchHistoryCard
                      item={item}
                      onPress={() => router.push(`/results/${item.id}`)}
                    />
                  )}
                />
              </View>
            )}

            {feed.length > 0 && (
              <View style={styles.feedSection}>
                <Text style={styles.feedLabel}>For your style</Text>
                <FlatList
                  data={feed}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <StyleFeedCard
                      listing={item}
                      onPress={() => openFeedItem(item)}
                    />
                  )}
                />
              </View>
            )}

            {trending.length > 0 && (
              <View style={styles.trendingSection}>
                <Text style={styles.trendingLabel}>Trending now</Text>
                <FlatList
                  data={trending}
                  keyExtractor={(item, i) => `${item.garment_type}-${i}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TrendingChip
                      item={item}
                      onPress={() => {
                        // For now, trending chips are informational — they show what's popular
                        // In future, they could trigger a text-based search
                      }}
                    />
                  )}
                />
              </View>
            )}

            <Text style={styles.tip}>
              Tip: Screenshots of outfits from Pinterest, Instagram, or magazines work great.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  inner: { flexGrow: 1, padding: 24 },
  header: { paddingVertical: 16 },
  logo: { fontSize: 28, fontWeight: '300', letterSpacing: 5, color: '#3D2B1F' },
  prompt: { fontSize: 22, fontWeight: '600', color: '#3D2B1F', marginTop: 32, marginBottom: 24, lineHeight: 30 },
  loadingSection: { alignItems: 'center', marginTop: 24 },
  previewImage: {
    width: 160,
    height: 213,
    borderRadius: 12,
    backgroundColor: '#E0D8D0',
  },
  actions: { gap: 12, marginVertical: 32 },
  primaryAction: {
    backgroundColor: '#8B6F47',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  primaryActionText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
  secondaryAction: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D4C5B5',
  },
  secondaryActionText: { color: '#3D2B1F', fontSize: 17, fontWeight: '500' },
  error: { color: '#C0392B', fontSize: 14, textAlign: 'center', marginTop: 16 },
  historySection: { marginTop: 8, marginBottom: 16 },
  historyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  feedSection: { marginTop: 16, marginBottom: 8 },
  feedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  trendingSection: { marginTop: 16, marginBottom: 16 },
  trendingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  tip: { color: '#9E9E9E', fontSize: 13, textAlign: 'center', marginTop: 'auto', paddingTop: 40, lineHeight: 20 },
});
