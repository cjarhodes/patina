// Shared constants used across the app
// Single source of truth — import from here instead of hardcoding

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
export type Size = (typeof SIZES)[number];

export const DEFAULT_SIZE: Size = 'M';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// UUID v4 pattern for deep link validation
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
