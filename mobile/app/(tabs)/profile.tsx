import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../hooks/useAuthStore';
import { SizeSelector } from '../../components/SizeSelector';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';

type ShoppingFor = 'womens' | 'mens' | 'both';

const SHOPPING_OPTIONS: { value: ShoppingFor; label: string }[] = [
  { value: 'womens', label: "Women's" },
  { value: 'mens', label: "Men's" },
  { value: 'both', label: 'Both' },
];

export default function ProfileScreen() {
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();
  const [savingSize, setSavingSize] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('size_label, shopping_for, style_preferences, favorite_decades')
        .eq('id', session!.user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  async function updateProfile(updates: { size_label?: string; shopping_for?: ShoppingFor }): Promise<void> {
    setSavingSize(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: session!.user.id, ...updates });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['profile', session?.user.id] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      Alert.alert('Update failed', message);
    } finally {
      setSavingSize(false);
    }
  }

  async function signOut() {
    Alert.alert('Sign out?', 'You\'ll need to sign back in.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{session?.user.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>I shop for</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          ) : (
            <View style={styles.optionRow}>
              {SHOPPING_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionButton, profile?.shopping_for === opt.value && styles.optionButtonSelected]}
                  onPress={() => updateProfile({ shopping_for: opt.value })}
                  accessibilityLabel={`Shop for ${opt.label}`}
                  accessibilityState={{ selected: profile?.shopping_for === opt.value }}
                  accessibilityRole="button"
                >
                  <Text style={[styles.optionText, profile?.shopping_for === opt.value && styles.optionTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {savingSize && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>My size</Text>
          <Text style={styles.note}>We use this to filter vintage results to fit you.</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          ) : (
            <SizeSelector value={profile?.size_label ?? 'M'} onChange={(size) => updateProfile({ size_label: size })} />
          )}
        </View>

        {(profile?.style_preferences?.length > 0 || profile?.favorite_decades?.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.label}>My style</Text>
            <View style={styles.tagRow}>
              {(profile?.style_preferences ?? []).map((s: string) => (
                <View key={s} style={styles.tag}>
                  <Text style={styles.tagText}>{s}</Text>
                </View>
              ))}
              {(profile?.favorite_decades ?? []).map((d: string) => (
                <View key={d} style={styles.tag}>
                  <Text style={styles.tagText}>{d}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.styleGuideButton} onPress={() => router.push('/style-guide' as any)}>
            <Text style={styles.styleGuideText}>Style Guide</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
          <Text style={styles.disclosure}>
            We may earn a commission when you purchase through links in the app. This does not affect which items are shown.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background },
  inner: { flexGrow: 1, padding: spacing.xxl },
  title: { ...typography.title, marginBottom: spacing.xxxl },
  section: { marginBottom: spacing.xxxl },
  label: { ...typography.label, marginBottom: spacing.sm },
  value: { fontSize: 16, color: colors.text.primary },
  note: { fontSize: 13, color: colors.text.secondary, marginBottom: spacing.lg },
  optionRow: { flexDirection: 'row', gap: 10 },
  optionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border.strong,
    alignItems: 'center',
    backgroundColor: colors.surface.card,
  },
  optionButtonSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  optionText: { fontSize: 14, fontWeight: '500', color: colors.text.primary },
  optionTextSelected: { color: colors.text.inverse },
  footer: { marginTop: 'auto', paddingTop: 40 },
  signOutButton: {
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  styleGuideButton: {
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  styleGuideText: { color: colors.primary, fontSize: 15, fontWeight: '500' },
  signOutText: { color: colors.functional.error, fontSize: 15, fontWeight: '500' },
  disclosure: { fontSize: 11, color: colors.text.disabled, textAlign: 'center', lineHeight: 18 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  tagText: { fontSize: 13, color: colors.primary, fontWeight: '500', textTransform: 'capitalize' },
});
