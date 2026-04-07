import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>!</Text>
      </View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.body}>
        {message ?? "We couldn't load this content. Check your connection and try again."}
      </Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0E8DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  icon: { fontSize: 24, fontWeight: '700', color: '#C0392B' },
  title: { fontSize: 18, fontWeight: '600', color: '#3D2B1F', marginBottom: 8 },
  body: { fontSize: 14, color: '#6B5B4E', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  retryButton: {
    backgroundColor: '#8B6F47',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  retryText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
