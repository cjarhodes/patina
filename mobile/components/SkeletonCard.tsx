import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors, borderRadius, spacing } from '../lib/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2;

const SHIMMER_DURATION = 1000;
const SHIMMER_MIN_OPACITY = 0.3;
const SHIMMER_MAX_OPACITY = 0.7;

export function SkeletonCard() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: SHIMMER_DURATION, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: SHIMMER_DURATION, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [SHIMMER_MIN_OPACITY, SHIMMER_MAX_OPACITY],
  });

  return (
    <View style={styles.card} accessibilityLabel="Loading item">
      <Animated.View style={[styles.image, { opacity }]} />
      <View style={styles.content}>
        <Animated.View style={[styles.titleLine, { opacity }]} />
        <Animated.View style={[styles.priceLine, { opacity }]} />
        <Animated.View style={[styles.metaLine, { opacity }]} />
      </View>
    </View>
  );
}

export function SkeletonGrid() {
  return (
    <View style={styles.grid} accessibilityLabel="Loading results">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

export function SkeletonList() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: SHIMMER_DURATION, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: SHIMMER_DURATION, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [SHIMMER_MIN_OPACITY, SHIMMER_MAX_OPACITY],
  });

  return (
    <View style={styles.listContainer} accessibilityLabel="Loading searches">
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.listCard}>
          <Animated.View style={[styles.listImage, { opacity }]} />
          <View style={styles.listContent}>
            <Animated.View style={[styles.listTitle, { opacity }]} />
            <Animated.View style={[styles.listMeta, { opacity }]} />
            <Animated.View style={[styles.listFooter, { opacity }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  image: {
    width: '100%',
    height: CARD_WIDTH * 1.2,
    backgroundColor: colors.surface.skeletonHighlight,
  },
  content: { padding: 10, gap: 6 },
  titleLine: { height: 12, borderRadius: 6, backgroundColor: colors.surface.skeletonHighlight, width: '80%' },
  priceLine: { height: 14, borderRadius: 6, backgroundColor: colors.surface.skeletonHighlight, width: '40%' },
  metaLine: { height: 10, borderRadius: 5, backgroundColor: colors.surface.skeletonHighlight, width: '60%' },

  // List skeletons (for saved searches)
  listContainer: { padding: spacing.lg, gap: spacing.md },
  listCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  listImage: { width: 72, height: 96, backgroundColor: colors.surface.skeletonHighlight },
  listContent: { flex: 1, padding: 14, gap: spacing.sm },
  listTitle: { height: 14, borderRadius: 7, backgroundColor: colors.surface.skeletonHighlight, width: '70%' },
  listMeta: { height: 10, borderRadius: 5, backgroundColor: colors.surface.skeletonHighlight, width: '50%' },
  listFooter: { height: 10, borderRadius: 5, backgroundColor: colors.surface.skeletonHighlight, width: '35%' },
});
