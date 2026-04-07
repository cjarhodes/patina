import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../hooks/useAuthStore';
import { SizeSelector } from '../../components/SizeSelector';
import { trackEvent } from '../../lib/analytics';

type ShoppingFor = 'womens' | 'mens' | 'both';

const STYLE_OPTIONS = [
  { id: 'bohemian', label: 'Bohemian' },
  { id: 'preppy', label: 'Preppy' },
  { id: 'minimalist', label: 'Minimalist' },
  { id: 'grunge', label: 'Grunge' },
  { id: 'mod', label: 'Mod' },
  { id: 'western', label: 'Western' },
  { id: 'streetwear', label: 'Streetwear' },
  { id: 'romantic', label: 'Romantic' },
  { id: 'workwear', label: 'Workwear' },
  { id: 'country', label: 'Country' },
  { id: 'athleisure', label: 'Athleisure' },
  { id: 'punk', label: 'Punk' },
];

const DECADE_OPTIONS = [
  { id: '1950s', label: '1950s', vibe: 'Full skirts, poodle cuts' },
  { id: '1960s', label: '1960s', vibe: 'Mod shifts, go-go boots' },
  { id: '1970s', label: '1970s', vibe: 'Flares, earthy tones' },
  { id: '1980s', label: '1980s', vibe: 'Power shoulders, neon' },
  { id: '1990s', label: '1990s', vibe: 'Slip dresses, denim' },
  { id: '2000s', label: '2000s', vibe: 'Y2K, low-rise' },
];

const SHOPPING_OPTIONS: { value: ShoppingFor; label: string }[] = [
  { value: 'womens', label: "Women's" },
  { value: 'mens', label: "Men's" },
  { value: 'both', label: 'Both' },
];

const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
  const session = useAuthStore((s) => s.session);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [shoppingFor, setShoppingFor] = useState<ShoppingFor>('womens');
  const [size, setSize] = useState('M');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedDecades, setSelectedDecades] = useState<string[]>([]);

  function toggleStyle(id: string) {
    setSelectedStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function toggleDecade(id: string) {
    setSelectedDecades((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  function canAdvance() {
    switch (step) {
      case 0: return true;
      case 1: return true;
      case 2: return selectedStyles.length > 0;
      case 3: return selectedDecades.length > 0;
      default: return false;
    }
  }

  async function finish() {
    if (!session) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: session.user.id,
        shopping_for: shoppingFor,
        size_label: size,
        style_preferences: selectedStyles,
        favorite_decades: selectedDecades,
        onboarding_complete: true,
      });
      if (error) throw error;

      trackEvent('profile_updated', {
        shopping_for: shoppingFor,
        size: size,
        styles: selectedStyles.join(','),
        decades: selectedDecades.join(','),
      });

      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Onboarding save error:', err.message);
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  }

  function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {step === 0 && (
            <View style={styles.stepContent}>
              <Text style={styles.logo}>patina</Text>
              <Text style={styles.welcomeTitle}>Welcome to Patina</Text>
              <Text style={styles.welcomeBody}>
                Let's learn a bit about your style so we can find the perfect vintage pieces for you.
              </Text>
              <Text style={styles.welcomeNote}>Takes about 30 seconds</Text>
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>The basics</Text>
              <Text style={styles.stepSubtitle}>What section do you shop?</Text>
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

              <Text style={[styles.stepSubtitle, { marginTop: 32 }]}>What's your size?</Text>
              <Text style={styles.sizeNote}>Vintage sizing can be tricky — we'll handle the conversions.</Text>
              <SizeSelector value={size} onChange={setSize} />
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Your style</Text>
              <Text style={styles.stepSubtitle}>Pick all that speak to you</Text>
              <View style={styles.styleGrid}>
                {STYLE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.styleChip, selectedStyles.includes(opt.id) && styles.styleChipSelected]}
                    onPress={() => toggleStyle(opt.id)}
                  >
                    <Text style={[styles.styleChipText, selectedStyles.includes(opt.id) && styles.styleChipTextSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Your decades</Text>
              <Text style={styles.stepSubtitle}>Which eras inspire you?</Text>
              <View style={styles.decadeList}>
                {DECADE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.decadeCard, selectedDecades.includes(opt.id) && styles.decadeCardSelected]}
                    onPress={() => toggleDecade(opt.id)}
                  >
                    <Text style={[styles.decadeLabel, selectedDecades.includes(opt.id) && styles.decadeLabelSelected]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.decadeVibe, selectedDecades.includes(opt.id) && styles.decadeVibeSelected]}>
                      {opt.vibe}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom navigation */}
      <View style={styles.bottomBar}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <TouchableOpacity
          style={[styles.nextButton, !canAdvance() && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!canAdvance() || saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.nextText}>
              {step === TOTAL_STEPS - 1 ? "Let's go" : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  progressContainer: {
    height: 3,
    backgroundColor: '#E0D8D0',
    marginHorizontal: 24,
    marginTop: 8,
    borderRadius: 2,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#8B6F47',
    borderRadius: 2,
  },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, justifyContent: 'center' },
  stepContent: { paddingHorizontal: 32 },

  // Welcome
  logo: { fontSize: 36, fontWeight: '300', letterSpacing: 6, color: '#3D2B1F', textAlign: 'center' },
  welcomeTitle: { fontSize: 24, fontWeight: '600', color: '#3D2B1F', textAlign: 'center', marginTop: 24 },
  welcomeBody: { fontSize: 16, color: '#6B5B4E', textAlign: 'center', lineHeight: 24, marginTop: 16 },
  welcomeNote: { fontSize: 13, color: '#9E9E9E', textAlign: 'center', marginTop: 12 },

  // Steps
  stepTitle: { fontSize: 28, fontWeight: '600', color: '#3D2B1F', marginBottom: 8 },
  stepSubtitle: { fontSize: 15, color: '#6B5B4E', marginBottom: 20 },

  // Shopping for
  optionRow: { flexDirection: 'row', gap: 10 },
  optionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D4C5B5',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  optionButtonSelected: { borderColor: '#8B6F47', backgroundColor: '#8B6F47' },
  optionText: { fontSize: 15, fontWeight: '500', color: '#3D2B1F' },
  optionTextSelected: { color: '#FFF' },

  // Size
  sizeNote: { fontSize: 13, color: '#9E9E9E', marginBottom: 16 },

  // Style grid
  styleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  styleChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#D4C5B5',
    backgroundColor: '#FFF',
  },
  styleChipSelected: { borderColor: '#8B6F47', backgroundColor: '#8B6F47' },
  styleChipText: { fontSize: 14, fontWeight: '500', color: '#3D2B1F' },
  styleChipTextSelected: { color: '#FFF' },

  // Decade cards
  decadeList: { gap: 10 },
  decadeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D4C5B5',
    backgroundColor: '#FFF',
  },
  decadeCardSelected: { borderColor: '#8B6F47', backgroundColor: '#8B6F47' },
  decadeLabel: { fontSize: 18, fontWeight: '600', color: '#3D2B1F' },
  decadeLabelSelected: { color: '#FFF' },
  decadeVibe: { fontSize: 13, color: '#9E9E9E' },
  decadeVibeSelected: { color: 'rgba(255,255,255,0.7)' },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
  },
  backButton: { padding: 12 },
  backText: { fontSize: 15, color: '#8B6F47', fontWeight: '500' },
  nextButton: {
    backgroundColor: '#8B6F47',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  nextButtonDisabled: { opacity: 0.4 },
  nextText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
