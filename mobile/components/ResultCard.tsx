import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Listing, Platform } from '../types/listing';
import { PlatformBadge } from './PlatformBadge';

type Props = {
  listing: Listing;
  onPress: () => void;
};

export function ResultCard({ listing, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: listing.thumbnail_url }}
          style={styles.image}
          resizeMode="cover"
        />
        <PlatformBadge platform={listing.platform} />
      </View>
      <View style={styles.info}>
        <Text style={styles.price}>${listing.price_usd.toFixed(2)}</Text>
        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
        <View style={styles.meta}>
          {listing.size_label ? <Text style={styles.tag}>{listing.size_label}</Text> : null}
          {listing.condition ? <Text style={styles.tag}>{listing.condition}</Text> : null}
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
  info: { padding: 10 },
  price: { fontSize: 15, fontWeight: '700', color: '#3D2B1F' },
  title: { fontSize: 12, color: '#6B5B4E', marginTop: 4, lineHeight: 17 },
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
});
