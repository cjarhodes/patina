import { View, Text, StyleSheet } from 'react-native';
import { StyleSignal } from '../types/styleSignal';

type Props = { signals: StyleSignal };

export function StyleSignalCard({ signals }: Props) {
  const hasBrand = !!signals.brand;

  const tags = [
    signals.garment_type,
    signals.decade_range !== 'vintage' ? signals.decade_range : null,
    signals.silhouette || null,
    ...signals.dominant_colors.slice(0, 2),
    ...signals.fabric_indicators.slice(0, 2),
  ].filter(Boolean);

  if (tags.length === 0 && !hasBrand) return null;

  return (
    <View style={styles.container}>
      {hasBrand && (
        <View style={styles.brandRow}>
          <View style={styles.brandTag}>
            <Text style={styles.brandText}>{signals.brand}</Text>
          </View>
          {signals.style_reference ? (
            <Text style={styles.styleRef}>{signals.style_reference}</Text>
          ) : null}
        </View>
      )}
      <Text style={styles.label}>{hasBrand ? 'Style details' : 'Style detected'}</Text>
      <View style={styles.tags}>
        {tags.map((tag, i) => (
          <View key={i} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0D8D0',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  brandTag: {
    backgroundColor: '#3D2B1F',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  brandText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  styleRef: {
    fontSize: 13,
    color: '#8B6F47',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9E9E9E',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F0E8DE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 13,
    color: '#8B6F47',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});
