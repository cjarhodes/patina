import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useSearch } from '../../hooks/useSearch';
import { SizeSelector } from '../../components/SizeSelector';

export default function HomeScreen() {
  const [selectedSize, setSelectedSize] = useState('M');
  const { isAnalyzing, isSearching, error, runSearch } = useSearch();

  const isLoading = isAnalyzing || isSearching;

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled) {
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
      await startSearch(result.assets[0].uri);
    }
  }

  async function startSearch(imageUri: string) {
    const searchId = await runSearch(imageUri, selectedSize);
    if (searchId) {
      router.push(`/results/${searchId}`);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.logo}>patina</Text>
        </View>

        <Text style={styles.prompt}>Find vintage that matches your style</Text>

        <SizeSelector value={selectedSize} onChange={setSelectedSize} />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B6F47" />
            <Text style={styles.loadingText}>
              {isAnalyzing ? 'Analyzing your photo...' : 'Searching vintage platforms...'}
            </Text>
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryAction} onPress={pickFromLibrary}>
              <Text style={styles.primaryActionText}>Choose from Photos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction} onPress={takePhoto}>
              <Text style={styles.secondaryActionText}>Take a Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {error && (
          <Text style={styles.error}>{error}</Text>
        )}

        <Text style={styles.tip}>
          Tip: Screenshots of outfits from Pinterest, Instagram, or magazines work great.
        </Text>
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
  loadingContainer: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  loadingText: { color: '#8B6F47', fontSize: 16, fontStyle: 'italic' },
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
  tip: { color: '#9E9E9E', fontSize: 13, textAlign: 'center', marginTop: 'auto', paddingTop: 40, lineHeight: 20 },
});
