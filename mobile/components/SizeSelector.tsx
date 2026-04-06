import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

type Props = {
  value: string;
  onChange: (size: string) => void;
};

export function SizeSelector({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Size</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {SIZES.map((size) => (
          <TouchableOpacity
            key={size}
            style={[styles.chip, value === size && styles.chipSelected]}
            onPress={() => onChange(size)}
          >
            <Text style={[styles.chipText, value === size && styles.chipTextSelected]}>
              {size}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '600', color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D4C5B5',
    backgroundColor: '#FFF',
  },
  chipSelected: { backgroundColor: '#8B6F47', borderColor: '#8B6F47' },
  chipText: { fontSize: 14, fontWeight: '500', color: '#3D2B1F' },
  chipTextSelected: { color: '#FFF' },
});
