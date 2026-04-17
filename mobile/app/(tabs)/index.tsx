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
import { colors, typography, spacing, borderRadius } from '../../lib/theme';

export default function HomeScreen() {
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { isAnalyzing, isSearching, error, runSearch } = useSearch();
  const { history } = useSearchHistory();
  const { trending } = useTrending();
  const { feed } = useStyleFeed();

  const isLoading = isAnalyzing || isSearching;

  function openFeedItem(listing: { listing_url: string }) {
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
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={pickFromLibrary}
                accessibilityLabel="Choose a photo from your library"
                accessibilityRole="button"
              >
                <Text style={styles.primaryActionText}>Choose from Photos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={takePhoto}
                accessibilityLabel="Take a photo with camera"
                accessibilityRole="button"
              >
                <Text style={styles.secondaryActionText}>Take a Photo</Text>
              </TouchableOpacity>
            </View>

            {error && (
              <Text style={styles.error}>{error}</Text>
            )}

            {history.length > 0 && (
              <View style={styles.historySection}>
                <Text style={styles.sectionLabel}>Recent searches</Text>
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
                <Text style={styles.sectionLabel}>For your style</Text>
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
                <Text style={styles.sectionLabel}>Trending now</Text>
                <FlatList
                  data={trending}
                  keyExtractor={(item, i) => `${item.garment_type}-${i}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TrendingChip
                      item={item}
                      onPress={() => {
                        // Trending chips are informational — show what's popular
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
  container: { flex: 1, backgroundColor: colors.surface.background },
  inner: { flexGrow: 1, padding: spacing.xxl },
  header: { paddingVertical: spacing.lg },
  logo: { ...typography.logo, fontSize: 28, letterSpacing: 5 },
  prompt: { fontSize: 22, fontWeight: '600', color: colors.text.primary, marginTop: spacing.xxxl, marginBottom: spacing.xxl, lineHeight: 30 },
  loadingSection: { alignItems: 'center', marginTop: spacing.xxl },
  previewImage: {
    width: 160,
    height: 213,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.border.default,
  },
  actions: { gap: spacing.md, marginVertical: spacing.xxxl },
  primaryAction: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  primaryActionText: { color: colors.text.inverse, fontSize: 17, fontWeight: '600' },
  secondaryAction: {
    backgroundColor: colors.surface.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border.strong,
  },
  secondaryActionText: { color: colors.text.primary, fontSize: 17, fontWeight: '500' },
  error: { color: colors.functional.error, fontSize: 14, textAlign: 'center', marginTop: spacing.lg },
  historySection: { marginTop: spacing.sm, marginBottom: spacing.lg },
  feedSection: { marginTop: spacing.lg, marginBottom: spacing.sm },
  trendingSection: { marginTop: spacing.lg, marginBottom: spacing.lg },
  sectionLabel: { ...typography.label, marginBottom: spacing.md },
  tip: { color: colors.text.muted, fontSize: 13, textAlign: 'center', marginTop: 'auto', paddingTop: 40, lineHeight: 20 },
});
