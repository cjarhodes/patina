import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Listing } from '../types/listing';
import { PlatformBadge } from './PlatformBadge';

type Props = {
  listing: Listing;
  onPress: () => void;
  onLongPress?: () => void;
};

function MatchDots({ score }: { score: number }) {
  const filled = Math.round(score * 5);
  return (
    <View style={styles.matchDots}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={[styles.matchDot, i < filled && styles.matchDotFilled]} />
      ))}
    </View>
  );
}

export function ResultCard({ listing, onPress, onLongPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
      delayLongPress={400}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: listing.thumbnail_url }}
          style={styles.image}
          resizeMode="cover"
        />
        <PlatformBadge platform={listing.platform} />
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>${listing.price_usd.toFixed(0)}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
        <View style={styles.meta}>
          {listing.size_label ? <Text style={styles.tag}>{listing.size_label}</Text> : null}
          {listing.condition ? <Text style={styles.tag}>{listing.condition}</Text> : null}
        </View>
        <View style={styles.footer}>
          <MatchDots score={listing.relevance_score} />
          <Text style={styles.matchLabel}>match</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48.5%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0D8D0',
  },
  imageContainer: { position: 'relative' },
  image: { width: '100%', aspectRatio: 3 / 4, backgroundColor: '#F0EAE4' },
  priceTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(61, 43, 31, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  info: { padding: 10 },
  title: { fontSize: 12, color: '#6B5B4E', lineHeight: 17 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  tag: {
    fontSize: 10,
    color: '#8B6F47',
    backgroundColor: '#F0E8DE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  matchDots: {
    flexDirection: 'row',
    gap: 3,
  },
  matchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0D8D0',
  },
  matchDotFilled: {
    backgroundColor: '#8B6F47',
  },
  matchLabel: {
    fontSize: 10,
    color: '#C4B5A5',
    fontWeight: '500',
  },
});
