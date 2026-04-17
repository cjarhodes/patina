import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SIZES } from '../lib/constants';
import { colors, spacing, borderRadius, typography } from '../lib/theme';

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
            accessibilityLabel={`Size ${size}`}
            accessibilityState={{ selected: value === size }}
            accessibilityRole="button"
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
  container: { marginBottom: spacing.sm },
  label: { ...typography.label, marginBottom: 10 },
  row: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: borderRadius.pill,
    borderWidth: 1.5,
    borderColor: colors.border.strong,
    backgroundColor: colors.surface.card,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '500', color: colors.text.primary },
  chipTextSelected: { color: colors.text.inverse },
});
