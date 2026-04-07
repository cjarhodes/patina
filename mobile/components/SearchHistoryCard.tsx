import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SearchHistoryItem } from '../hooks/useSearchHistory';
import { supabase } from '../lib/supabase';

type Props = {
  item: SearchHistoryItem;
  onPress: () => void;
};

export function SearchHistoryCard({ item, onPress }: Props) {
  const signals = item.style_signals;
  const { data: { publicUrl } } = supabase.storage
    .from('search-images')
    .getPublicUrl(item.image_storage_path);

  const timeAgo = getTimeAgo(item.created_at);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: publicUrl }} style={styles.thumbnail} />
      <View style={styles.content}>
        <Text style={styles.garment}>{signals?.garment_type ?? 'Vintage piece'}</Text>
        <Text style={styles.details} numberOfLines={1}>
          {[
            signals?.decade_range !== 'vintage' ? signals?.decade_range : null,
            ...(signals?.dominant_colors?.slice(0, 2) ?? []),
          ].filter(Boolean).join(' · ') || 'Vintage style'}
        </Text>
        <Text style={styles.meta}>
          {item.listing_count} result{item.listing_count !== 1 ? 's' : ''} · {timeAgo}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0D8D0',
    marginRight: 12,
    width: 220,
  },
  thumbnail: {
    width: 60,
    height: 80,
    backgroundColor: '#F0EAE4',
  },
  content: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  garment: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D2B1F',
    textTransform: 'capitalize',
  },
  details: {
    fontSize: 12,
    color: '#8B6F47',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  meta: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 4,
  },
});
