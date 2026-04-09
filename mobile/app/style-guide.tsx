import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '../lib/theme';
import { Listing } from '../types/listing';
import { StyleSignal } from '../types/styleSignal';
import { PlatformBadge } from '../components/PlatformBadge';
import { TrendingChip } from '../components/TrendingChip';
import { SizeSelector } from '../components/SizeSelector';
import { FilterSortBar, SortOption, PlatformFilter } from '../components/FilterSortBar';
import { SkeletonCard } from '../components/SkeletonCard';
import { ResultCard } from '../components/ResultCard';
import { StyleSignalCard } from '../components/StyleSignalCard';
import { AnalyzingOverlay } from '../components/AnalyzingOverlay';
import { ErrorState } from '../components/ErrorState';

// --- Mock data for component showcase ---

const MOCK_LISTING: Listing = {
  id: 'mock-sg-1',
  search_id: 'mock-search',
  platform: 'etsy',
  external_id: 'mock-ext-1',
  title: 'Vintage 1970s burnt orange wrap dress — bohemian floral',
  price_usd: 48,
  size_label: 'M',
  condition: 'Excellent',
  thumbnail_url: 'https://picsum.photos/seed/patina-styleguide/400/533',
  listing_url: 'https://www.etsy.com/listing/1234567890',
  relevance_score: 0.88,
  fetched_at: new Date().toISOString(),
};

const MOCK_SIGNALS: StyleSignal = {
  garment_type: 'wrap dress',
  decade_range: '1970s',
  silhouette: 'A-line',
  dominant_colors: ['burnt orange', 'cream'],
  fabric_indicators: ['cotton', 'floral print'],
  search_keywords: ['wrap dress', 'bohemian', 'floral'],
  brand: 'Diane von Furstenberg',
  style_reference: 'DVF iconic wrap',
};

const MOCK_TRENDING = {
  garment_type: 'denim jacket',
  decade_range: '1990s',
  brand: '',
  search_count: 24,
};

// --- Helper components ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ColorSwatch({ color, name }: { color: string; name: string }) {
  const isLight = color === '#FFFFFF' || color === '#FFF' || color.startsWith('rgba');
  return (
    <View style={styles.swatchContainer}>
      <View
        style={[
          styles.swatch,
          { backgroundColor: color },
          isLight && styles.swatchBorder,
        ]}
      />
      <Text style={styles.swatchName}>{name}</Text>
      <Text style={styles.swatchHex}>{color}</Text>
    </View>
  );
}

function SwatchGroup({ title, swatches }: { title: string; swatches: { name: string; color: string }[] }) {
  return (
    <View style={styles.swatchGroup}>
      <Text style={styles.swatchGroupTitle}>{title}</Text>
      <View style={styles.swatchRow}>
        {swatches.map((s) => (
          <ColorSwatch key={s.name} {...s} />
        ))}
      </View>
    </View>
  );
}

// --- Main screen ---

export default function StyleGuideScreen() {
  const [demoSize, setDemoSize] = useState('M');
  const [demoSort, setDemoSort] = useState<SortOption>('relevance');
  const [demoPlatform, setDemoPlatform] = useState<PlatformFilter>('all');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Style Guide</Text>
          <Text style={styles.headerSubtitle}>Weathered Grace</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Philosophy */}
        <Section title="Design Philosophy">
          <View style={styles.quote}>
            <Text style={styles.quoteText}>
              Visual restraint. Material authenticity. Labored effortlessness.
              Every mark, space, and calibration is deliberate — evoking surfaces
              that have lived, with quiet authority.
            </Text>
            <Text style={styles.quoteAttribution}>— Patina design principles</Text>
          </View>
        </Section>

        {/* Colors */}
        <Section title="Colors">
          <SwatchGroup
            title="Primary"
            swatches={[
              { name: 'primary', color: colors.primary },
              { name: 'primaryDark', color: colors.primaryDark },
            ]}
          />
          <SwatchGroup
            title="Text"
            swatches={[
              { name: 'text.primary', color: colors.text.primary },
              { name: 'text.secondary', color: colors.text.secondary },
              { name: 'text.muted', color: colors.text.muted },
              { name: 'text.disabled', color: colors.text.disabled },
              { name: 'text.inverse', color: colors.text.inverse },
            ]}
          />
          <SwatchGroup
            title="Surfaces"
            swatches={[
              { name: 'surface.background', color: colors.surface.background },
              { name: 'surface.card', color: colors.surface.card },
              { name: 'surface.secondary', color: colors.surface.secondary },
              { name: 'surface.skeleton', color: colors.surface.skeleton },
            ]}
          />
          <SwatchGroup
            title="Borders"
            swatches={[
              { name: 'border.default', color: colors.border.default },
              { name: 'border.strong', color: colors.border.strong },
            ]}
          />
          <SwatchGroup
            title="Functional"
            swatches={[
              { name: 'functional.error', color: colors.functional.error },
              { name: 'functional.success', color: colors.functional.success },
            ]}
          />
          <SwatchGroup
            title="Platform"
            swatches={[
              { name: 'platform.ebay', color: colors.platform.ebay },
              { name: 'platform.etsy', color: colors.platform.etsy },
            ]}
          />
        </Section>

        {/* Typography */}
        <Section title="Typography">
          {Object.entries(typography).map(([name, preset]) => (
            <View key={name} style={styles.typeRow}>
              <Text style={preset as any}>
                {name === 'logo' ? 'patina' : `The quick brown fox — ${name}`}
              </Text>
              <Text style={styles.typeMeta}>
                {preset.fontSize}px / {preset.fontWeight}
                {'letterSpacing' in preset ? ` / ls ${(preset as any).letterSpacing}` : ''}
              </Text>
            </View>
          ))}
        </Section>

        {/* Spacing */}
        <Section title="Spacing Scale">
          {Object.entries(spacing).map(([name, value]) => (
            <View key={name} style={styles.spacingRow}>
              <Text style={styles.spacingLabel}>{name} ({value}px)</Text>
              <View style={[styles.spacingBar, { width: value * 4, minWidth: 16 }]} />
            </View>
          ))}
        </Section>

        {/* Border Radius */}
        <Section title="Border Radius">
          <View style={styles.radiusRow}>
            {Object.entries(borderRadius).filter(([n]) => n !== 'circle' && n !== 'none').map(([name, value]) => (
              <View key={name} style={styles.radiusItem}>
                <View style={[styles.radiusShape, { borderRadius: value }]} />
                <Text style={styles.radiusLabel}>{name}</Text>
                <Text style={styles.radiusPx}>{value}px</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Shadows */}
        <Section title="Shadows">
          <View style={styles.shadowRow}>
            <View style={[styles.shadowBox, shadows.card]}>
              <Text style={styles.shadowLabel}>card</Text>
            </View>
            <View style={[styles.shadowBox, shadows.elevated]}>
              <Text style={styles.shadowLabel}>elevated</Text>
            </View>
          </View>
        </Section>

        {/* Component Showcase */}
        <Section title="Component Showcase">

          <Text style={styles.showcaseLabel}>Platform Badges</Text>
          <View style={styles.showcaseRow}>
            <View style={styles.badgeDemo}>
              <PlatformBadge platform="ebay" />
            </View>
            <View style={styles.badgeDemo}>
              <PlatformBadge platform="etsy" />
            </View>
          </View>

          <Text style={styles.showcaseLabel}>Trending Chip</Text>
          <View style={styles.showcaseRow}>
            <TrendingChip item={MOCK_TRENDING} onPress={() => {}} />
          </View>

          <Text style={styles.showcaseLabel}>Size Selector</Text>
          <SizeSelector value={demoSize} onChange={setDemoSize} />

          <Text style={styles.showcaseLabel}>Filter / Sort Bar</Text>
          <FilterSortBar
            sort={demoSort}
            onSortChange={setDemoSort}
            platformFilter={demoPlatform}
            onPlatformFilterChange={setDemoPlatform}
          />

          <Text style={styles.showcaseLabel}>Skeleton Card</Text>
          <View style={styles.skeletonDemo}>
            <SkeletonCard />
          </View>

          <Text style={styles.showcaseLabel}>Result Card</Text>
          <View style={styles.resultCardDemo}>
            <ResultCard
              listing={MOCK_LISTING}
              onPress={() => {}}
              onFindSimilar={() => {}}
              isFavorited={true}
              onToggleFavorite={() => {}}
            />
          </View>

          <Text style={styles.showcaseLabel}>Style Signal Card</Text>
          <StyleSignalCard signals={MOCK_SIGNALS} />

          <Text style={styles.showcaseLabel}>Analyzing Overlay</Text>
          <View style={styles.overlayDemo}>
            <AnalyzingOverlay stage="analyzing" />
          </View>

          <Text style={styles.showcaseLabel}>Error State</Text>
          <ErrorState message="Something went wrong. Check your connection and try again." />

        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Patina v1.0.0 — Design tokens defined in lib/theme.ts
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
  },
  backButton: { width: 60 },
  backText: { color: colors.primary, fontSize: 15 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: colors.text.primary, textAlign: 'center' },
  headerSubtitle: { fontSize: 13, fontWeight: '500', color: colors.text.disabled, textAlign: 'center', fontStyle: 'italic', marginTop: 2 },
  content: { padding: 16, paddingBottom: 60 },

  // Sections
  section: { marginBottom: 40 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    paddingBottom: 8,
  },

  // Philosophy
  quote: {
    backgroundColor: colors.surface.card,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: 8,
    padding: 16,
  },
  quoteText: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  quoteAttribution: {
    fontSize: 12,
    color: colors.text.disabled,
    marginTop: 12,
  },

  // Color swatches
  swatchGroup: { marginBottom: 20 },
  swatchGroupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 10,
  },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatchContainer: { alignItems: 'center', width: 64 },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginBottom: 4,
  },
  swatchBorder: { borderWidth: 1, borderColor: colors.border.default },
  swatchName: { fontSize: 9, color: colors.text.secondary, textAlign: 'center' },
  swatchHex: { fontSize: 8, color: colors.text.muted, textAlign: 'center', marginTop: 1 },

  // Typography
  typeRow: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.skeleton,
  },
  typeMeta: { fontSize: 10, color: colors.text.disabled, marginTop: 6 },

  // Spacing
  spacingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  spacingLabel: { fontSize: 12, color: colors.text.secondary, width: 90 },
  spacingBar: {
    height: 16,
    backgroundColor: colors.primary,
    borderRadius: 4,
    opacity: 0.7,
  },

  // Border radius
  radiusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  radiusItem: { alignItems: 'center' },
  radiusShape: {
    width: 56,
    height: 56,
    backgroundColor: colors.surface.secondary,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginBottom: 6,
  },
  radiusLabel: { fontSize: 11, fontWeight: '600', color: colors.text.primary },
  radiusPx: { fontSize: 9, color: colors.text.muted },

  // Shadows
  shadowRow: { flexDirection: 'row', gap: 20 },
  shadowBox: {
    width: 120,
    height: 80,
    backgroundColor: colors.surface.card,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadowLabel: { fontSize: 12, fontWeight: '600', color: colors.text.secondary },

  // Component showcase
  showcaseLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 24,
    marginBottom: 12,
  },
  showcaseRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  badgeDemo: {
    width: 60,
    height: 30,
    backgroundColor: colors.surface.skeleton,
    borderRadius: 6,
    position: 'relative',
  },
  skeletonDemo: { width: '48.5%' },
  resultCardDemo: { width: '48.5%' },
  overlayDemo: {
    backgroundColor: colors.surface.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },

  // Footer
  footer: { alignItems: 'center', paddingVertical: 24 },
  footerText: { fontSize: 11, color: colors.text.disabled },
});
