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

  async function updateProfile(updates: { size_label?: string; shopping_for?: ShoppingFor }) {
    setSavingSize(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: session!.user.id, ...updates });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (err: any) {
      Alert.alert('Error', err.message);
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
            <ActivityIndicator color="#8B6F47" style={{ marginTop: 16 }} />
          ) : (
            <View style={styles.optionRow}>
              {SHOPPING_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionButton, profile?.shopping_for === opt.value && styles.optionButtonSelected]}
                  onPress={() => updateProfile({ shopping_for: opt.value })}
                >
                  <Text style={[styles.optionText, profile?.shopping_for === opt.value && styles.optionTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>My size</Text>
          <Text style={styles.note}>We use this to filter vintage results to fit you.</Text>
          {isLoading ? (
            <ActivityIndicator color="#8B6F47" style={{ marginTop: 16 }} />
          ) : (
            <View>
              <SizeSelector value={profile?.size_label ?? 'M'} onChange={(size) => updateProfile({ size_label: size })} />
              {savingSize && <ActivityIndicator color="#8B6F47" style={{ marginTop: 12 }} />}
            </View>
          )}
        </View>

        {(profile?.style_preferences?.length > 0 || profile?.favorite_decades?.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.label}>My style</Text>
            <View style={styles.tagRow}>
              {(profile.style_preferences ?? []).map((s: string) => (
                <View key={s} style={styles.tag}>
                  <Text style={styles.tagText}>{s}</Text>
                </View>
              ))}
              {(profile.favorite_decades ?? []).map((d: string) => (
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
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  inner: { flexGrow: 1, padding: 24 },
  title: { fontSize: 26, fontWeight: '600', color: '#3D2B1F', marginBottom: 32 },
  section: { marginBottom: 32 },
  label: { fontSize: 12, fontWeight: '600', color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  value: { fontSize: 16, color: '#3D2B1F' },
  note: { fontSize: 13, color: '#6B5B4E', marginBottom: 16 },
  optionRow: { flexDirection: 'row', gap: 10 },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D4C5B5',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  optionButtonSelected: { borderColor: '#8B6F47', backgroundColor: '#8B6F47' },
  optionText: { fontSize: 14, fontWeight: '500', color: '#3D2B1F' },
  optionTextSelected: { color: '#FFF' },
  footer: { marginTop: 'auto', paddingTop: 40 },
  signOutButton: {
    borderWidth: 1,
    borderColor: '#D4C5B5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  styleGuideButton: {
    borderWidth: 1,
    borderColor: '#D4C5B5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  styleGuideText: { color: '#8B6F47', fontSize: 15, fontWeight: '500' },
  signOutText: { color: '#C0392B', fontSize: 15, fontWeight: '500' },
  disclosure: { fontSize: 11, color: '#C4B5A5', textAlign: 'center', lineHeight: 18 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: '#F0E8DE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: { fontSize: 13, color: '#8B6F47', fontWeight: '500', textTransform: 'capitalize' },
});
