import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Listing } from '../types/listing';
import { PlatformBadge } from './PlatformBadge';
import { colors, spacing, borderRadius } from '../lib/theme';

type Props = {
  listing: Listing;
  onPress: () => void;
  onLongPress?: () => void;
  onFindSimilar?: () => void;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  priceDrop?: number;
};

function MatchDots({ score }: { score: number }) {
  const filled = Math.round(score * 5);
  return (
    <View style={styles.matchDots} accessibilityLabel={`Match score: ${filled} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={[styles.matchDot, i < filled && styles.matchDotFilled]} />
      ))}
    </View>
  );
}

export const ResultCard = React.memo(function ResultCard({
  listing,
  onPress,
  onLongPress,
  onFindSimilar,
  isFavorited,
  onToggleFavorite,
  priceDrop,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
      delayLongPress={400}
      accessibilityLabel={`${listing.title}, $${listing.price_usd.toFixed(0)}, ${listing.platform}`}
      accessibilityRole="button"
    >
      <View style={styles.imageContainer}>
        {onToggleFavorite && (
          <TouchableOpacity
            style={styles.heartButton}
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleFavorite();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            accessibilityRole="button"
          >
            <Text style={[styles.heartIcon, isFavorited && styles.heartIconFilled]}>
              {isFavorited ? '\u2665' : '\u2661'}
            </Text>
          </TouchableOpacity>
        )}
        <Image
          source={{ uri: listing.thumbnail_url }}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel={`Photo of ${listing.title}`}
        />
        <PlatformBadge platform={listing.platform} />
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>${listing.price_usd.toFixed(0)}</Text>
        </View>
        {priceDrop != null && priceDrop > 0 && (
          <View style={styles.priceDropTag}>
            <Text style={styles.priceDropTagText}>{'\u2193'}${priceDrop.toFixed(0)}</Text>
          </View>
        )}
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
          {onFindSimilar && (
            <TouchableOpacity
              style={styles.similarButton}
              onPress={(e) => {
                e.stopPropagation?.();
                onFindSimilar();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Find similar items"
              accessibilityRole="button"
            >
              <Text style={styles.similarText}>Similar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '48.5%',
    backgroundColor: colors.surface.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  imageContainer: { position: 'relative' },
  heartButton: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.overlay.light,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  heartIcon: {
    fontSize: 18,
    color: colors.text.inverse,
  },
  heartIconFilled: {
    color: colors.functional.error,
  },
  image: { width: '100%', aspectRatio: 3 / 4, backgroundColor: colors.surface.skeleton },
  priceTag: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.overlay.dark,
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  priceText: { color: colors.text.inverse, fontSize: 15, fontWeight: '700' },
  priceDropTag: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.functional.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.md,
  },
  priceDropTagText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '700',
  },
  info: { padding: 10 },
  title: { fontSize: 12, color: colors.text.secondary, lineHeight: 17 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  tag: {
    fontSize: 10,
    color: colors.primary,
    backgroundColor: colors.surface.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
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
    backgroundColor: colors.border.default,
  },
  matchDotFilled: {
    backgroundColor: colors.primary,
  },
  matchLabel: {
    fontSize: 10,
    color: colors.text.disabled,
    fontWeight: '500',
  },
  similarButton: {
    marginLeft: 'auto',
    backgroundColor: colors.surface.secondary,
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  similarText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
});
