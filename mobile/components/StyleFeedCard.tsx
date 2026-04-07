import { Image, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { Listing } from '../types/listing';
import { PlatformBadge } from './PlatformBadge';

type Props = {
  listing: Listing;
  onPress: () => void;
};

export function StyleFeedCard({ listing, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: listing.thumbnail_url }} style={styles.image} resizeMode="cover" />
      <View style={styles.overlay}>
        <PlatformBadge platform={listing.platform} />
        <Text style={styles.price}>${listing.price_usd.toFixed(0)}</Text>
      </View>
      <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: '#FFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0D8D0',
  },
  image: {
    width: 140,
    height: 186,
    backgroundColor: '#F0EAE4',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 6,
  },
  price: {
    backgroundColor: 'rgba(61,43,31,0.85)',
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  title: {
    fontSize: 11,
    color: '#6B5B4E',
    padding: 8,
    paddingTop: 6,
  },
});
