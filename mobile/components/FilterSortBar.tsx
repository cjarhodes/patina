import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Platform } from '../types/listing';

export type SortOption = 'relevance' | 'price_asc' | 'price_desc';
export type PlatformFilter = 'all' | Platform;

type Props = {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  platformFilter: PlatformFilter;
  onPlatformFilterChange: (filter: PlatformFilter) => void;
};

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low-High' },
  { value: 'price_desc', label: 'Price: High-Low' },
];

const platformOptions: { value: PlatformFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ebay', label: 'eBay' },
  { value: 'etsy', label: 'Etsy' },
];

export function FilterSortBar({ sort, onSortChange, platformFilter, onPlatformFilterChange }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, sort === option.value && styles.chipActive]}
            onPress={() => onSortChange(option.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, sort === option.value && styles.chipTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.divider} />

        {platformOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, platformFilter === option.value && styles.chipActive]}
            onPress={() => onPlatformFilterChange(option.value)}
            activeOpacity={0.7}
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
    backgroundColor: '#F5F0EB',
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4C5B5',
    backgroundColor: '#FFF',
  },
  chipActive: {
    backgroundColor: '#8B6F47',
    borderColor: '#8B6F47',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3D2B1F',
  },
  chipTextActive: {
    color: '#FFF',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#D4C5B5',
    marginHorizontal: 4,
  },
});
