import { View, Text, StyleSheet } from 'react-native';
import { Platform } from '../types/listing';

const PLATFORM_COLORS: Record<Platform, { bg: string; text: string; label: string }> = {
  ebay: { bg: '#E53238', text: '#FFF', label: 'eBay' },
  etsy: { bg: '#F56400', text: '#FFF', label: 'Etsy' },
};

type Props = { platform: Platform };

export function PlatformBadge({ platform }: Props) {
  const config = PLATFORM_COLORS[platform];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  text: { fontSize: 10, fontWeight: '700' },
});
