import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2;

export function SkeletonCard() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.card}>
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
    <View style={styles.grid}>
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
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.listContainer}>
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
    padding: 8,
    gap: 8,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 14,
    backgroundColor: '#FFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0D8D0',
  },
  image: {
    width: '100%',
    height: CARD_WIDTH * 1.2,
    backgroundColor: '#E8E0D8',
  },
  content: { padding: 10, gap: 6 },
  titleLine: { height: 12, borderRadius: 6, backgroundColor: '#E8E0D8', width: '80%' },
  priceLine: { height: 14, borderRadius: 6, backgroundColor: '#E8E0D8', width: '40%' },
  metaLine: { height: 10, borderRadius: 5, backgroundColor: '#E8E0D8', width: '60%' },

  // List skeletons (for saved searches)
  listContainer: { padding: 16, gap: 12 },
  listCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0D8D0',
    overflow: 'hidden',
  },
  listImage: { width: 72, height: 96, backgroundColor: '#E8E0D8' },
  listContent: { flex: 1, padding: 14, gap: 8 },
  listTitle: { height: 14, borderRadius: 7, backgroundColor: '#E8E0D8', width: '70%' },
  listMeta: { height: 10, borderRadius: 5, backgroundColor: '#E8E0D8', width: '50%' },
  listFooter: { height: 10, borderRadius: 5, backgroundColor: '#E8E0D8', width: '35%' },
});
