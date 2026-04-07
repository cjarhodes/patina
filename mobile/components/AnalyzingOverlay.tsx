import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

type Props = {
  stage: 'analyzing' | 'searching';
};

const MESSAGES = {
  analyzing: [
    'Studying the garment...',
    'Detecting colors and fabric...',
    'Identifying the era...',
  ],
  searching: [
    'Searching vintage marketplaces...',
    'Finding similar pieces...',
    'Scoring relevance...',
  ],
};

export function AnalyzingOverlay({ stage }: Props) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const messageIndex = useRef(0);
  const messageAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Spin animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Cycle messages
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(messageAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(messageAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      messageIndex.current = (messageIndex.current + 1) % MESSAGES[stage].length;
    }, 2500);

    return () => clearInterval(interval);
  }, [stage]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
        <View style={styles.spinnerArc} />
      </Animated.View>

      <Text style={styles.stage}>
        {stage === 'analyzing' ? 'Analyzing your style' : 'Finding vintage pieces'}
      </Text>

      <Animated.Text style={[styles.message, { opacity: messageAnim }]}>
        {MESSAGES[stage][messageIndex.current]}
      </Animated.Text>

      <View style={styles.dots}>
        <View style={[styles.dot, stage === 'analyzing' && styles.dotActive]} />
        <View style={styles.dotLine} />
        <View style={[styles.dot, stage === 'searching' && styles.dotActive]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 20,
  },
  spinner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#E0D8D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerArc: {
    position: 'absolute',
    top: -3,
    left: -3,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#8B6F47',
  },
  stage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3D2B1F',
  },
  message: {
    fontSize: 14,
    color: '#8B6F47',
    fontStyle: 'italic',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0D8D0',
  },
  dotActive: {
    backgroundColor: '#8B6F47',
  },
  dotLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E0D8D0',
  },
});
