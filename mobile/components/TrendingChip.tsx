import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { TrendingItem } from '../hooks/useTrending';

type Props = {
  item: TrendingItem;
  onPress: () => void;
};

export function TrendingChip({ item, onPress }: Props) {
  const label = [
    item.brand || null,
    item.decade_range !== 'vintage' ? item.decade_range : null,
    item.garment_type,
  ].filter(Boolean).join(' ');

  return (
    <TouchableOpacity style={styles.chip} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.chipText}>{label}</Text>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{item.search_count}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0D8D0',
    gap: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3D2B1F',
    textTransform: 'capitalize',
  },
  countBadge: {
    backgroundColor: '#F0E8DE',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B6F47',
  },
});
