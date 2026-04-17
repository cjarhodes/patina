import { View, Text, StyleSheet } from 'react-native';
import { Platform } from '../types/listing';
import { colors } from '../lib/theme';

const PLATFORM_COLORS: Record<Platform, { bg: string; text: string; label: string }> = {
  ebay: { bg: colors.platform.ebay, text: colors.text.inverse, label: 'eBay' },
  etsy: { bg: colors.platform.etsy, text: colors.text.inverse, label: 'Etsy' },
};

export type PlatformBadgeProps = { platform: Platform };

export function PlatformBadge({ platform }: PlatformBadgeProps) {
  const config = PLATFORM_COLORS[platform];
  return (
    <View
      style={[styles.badge, { backgroundColor: config.bg }]}
      accessibilityLabel={`Listed on ${config.label}`}
    >
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
