import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../hooks/useAuthStore';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
type SizeLabel = typeof SIZES[number];

type ShoppingFor = 'womens' | 'mens' | 'both';

const SHOPPING_OPTIONS: { value: ShoppingFor; label: string }[] = [
  { value: 'womens', label: "Women's" },
  { value: 'mens', label: "Men's" },
  { value: 'both', label: 'Both' },
];

export default function OnboardingScreen() {
  const [shoppingFor, setShoppingFor] = useState<ShoppingFor | null>(null);
  const [selectedSize, setSelectedSize] = useState<SizeLabel | null>(null);
  const [loading, setLoading] = useState(false);
  const session = useAuthStore((s) => s.session);

  const canContinue = !!shoppingFor && !!selectedSize;

  async function handleSave() {
    if (!canContinue) {
      Alert.alert('Please select what you shop for and your size to continue.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: session!.user.id,
        shopping_for: shoppingFor,
        size_label: selectedSize,
      });
      if (error) throw error;
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Let's personalise your search</Text>

      <Text style={styles.sectionLabel}>I shop for</Text>
      <View style={styles.optionRow}>
        {SHOPPING_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.optionButton, shoppingFor === opt.value && styles.optionButtonSelected]}
            onPress={() => setShoppingFor(opt.value)}
          >
            <Text style={[styles.optionText, shoppingFor === opt.value && styles.optionTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>My size</Text>
      <Text style={styles.subtitle}>
        We'll use this to filter vintage pieces to fit you. You can change it anytime.
      </Text>
      <View style={styles.sizeGrid}>
        {SIZES.map((size) => (
          <TouchableOpacity
            key={size}
            style={[styles.sizeButton, selectedSize === size && styles.sizeButtonSelected]}
            onPress={() => setSelectedSize(size)}
          >
            <Text style={[styles.sizeLabel, selectedSize === size && styles.sizeLabelSelected]}>
              {size}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.note}>
        Vintage sizing runs small. We account for this when showing results.
      </Text>

      <TouchableOpacity
        style={[styles.button, !canContinue && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={!canContinue || loading}
      >
        {loading
          ? <ActivityIndicator color="#FFF" />
          : <Text style={styles.buttonText}>Start finding vintage</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F5F0EB', padding: 32, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '600', color: '#3D2B1F', marginBottom: 32 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  optionRow: { flexDirection: 'row', gap: 12, marginBottom: 36 },
  optionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D4C5B5',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  optionButtonSelected: { borderColor: '#8B6F47', backgroundColor: '#8B6F47' },
  optionText: { fontSize: 15, fontWeight: '500', color: '#3D2B1F' },
  optionTextSelected: { color: '#FFF' },
  subtitle: { fontSize: 13, color: '#6B5B4E', lineHeight: 20, marginBottom: 14 },
  sizeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  sizeButton: {
    width: '30%',
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D4C5B5',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  sizeButtonSelected: { borderColor: '#8B6F47', backgroundColor: '#8B6F47' },
  sizeLabel: { fontSize: 18, fontWeight: '500', color: '#3D2B1F' },
  sizeLabelSelected: { color: '#FFF' },
  note: { fontSize: 13, color: '#9E9E9E', marginBottom: 40, fontStyle: 'italic' },
  button: {
    backgroundColor: '#8B6F47',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
