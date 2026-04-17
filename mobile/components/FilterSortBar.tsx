import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Platform } from '../types/listing';
import { colors, spacing, borderRadius } from '../lib/theme';

export type SortOption = 'relevance' | 'price_asc' | 'price_desc';
export type PlatformFilter = 'all' | Platform;

export type FilterSortBarProps = {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  platformFilter: PlatformFilter;
  onPlatformFilterChange: (filter: PlatformFilter) => void;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low-High' },
  { value: 'price_desc', label: 'Price: High-Low' },
];

const PLATFORM_OPTIONS: { value: PlatformFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ebay', label: 'eBay' },
  { value: 'etsy', label: 'Etsy' },
];

export function FilterSortBar({ sort, onSortChange, platformFilter, onPlatformFilterChange }: FilterSortBarProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {SORT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, sort === option.value && styles.chipActive]}
            onPress={() => onSortChange(option.value)}
            activeOpacity={0.7}
            accessibilityLabel={`Sort by ${option.label}`}
            accessibilityState={{ selected: sort === option.value }}
            accessibilityRole="button"
          >
            <Text style={[styles.chipText, sort === option.value && styles.chipTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.divider} />

        {PLATFORM_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, platformFilter === option.value && styles.chipActive]}
            onPress={() => onPlatformFilterChange(option.value)}
            activeOpacity={0.7}
            accessibilityLabel={`Filter: ${option.label} platform`}
            accessibilityState={{ selected: platformFilter === option.value }}
            accessibilityRole="button"
          >
            <Text style={[styles.chipText, platformFilter === option.value && styles.chipTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.background,
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.surface.card,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.primary,
  },
  chipTextActive: {
    color: colors.text.inverse,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.strong,
    marginHorizontal: spacing.xs,
  },
});
