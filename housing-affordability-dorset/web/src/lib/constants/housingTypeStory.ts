/** Scroll-step choreography for Section 7 (affordability by dwelling type). */
export const STEP_OVERALL = 0;
export const STEP_DETACHED = 1;
export const STEP_SEMI_DETACHED = 2;
export const STEP_TERRACED = 3;
export const STEP_FLATS = 4;
export const STEP_FLATS_AFFORDABLE = 5;
export const STEP_FLATS_EXPENSIVE_OR_SCARCE = 6;
export const STEP_LINKED_ALL_TYPES = 7;

export const LINKED_TYPE_KEYS = ['detached', 'semiDetached', 'terraced', 'flats'] as const;
export type LinkedTypeKey = (typeof LINKED_TYPE_KEYS)[number];

export const TYPE_LABELS: Record<LinkedTypeKey, string> = {
	detached: 'Detached',
	semiDetached: 'Semi-detached',
	terraced: 'Terraced',
	flats: 'Flats'
};

export const TYPE_COLORS: Record<LinkedTypeKey, string> = {
	detached: '#0b0c0c',
	semiDetached: '#206095',
	terraced: '#5694ca',
	flats: '#85994b'
};

export const POINT_FILL = '#5C6B7A';
export const MUTED_POINT_FILL = '#B1B4B6';
export const HIGHLIGHT_POINT_FILL = '#0b0c0c';

/** Weymouth and Portland cluster: comparatively affordable flats. */
export const FLAT_ACCESS_CODES = [
	'E02004284', // Weymouth
	'E02004285',
	'E02004286',
	'E02004287',
	'E02004288', // Underhill & The Grove
	'E02004289' // Southwell & Weston
] as const;

/** Coastal/retirement examples where flats can still be expensive. */
export const FLAT_EXPENSIVE_CODES = [
	'E02004246', // St Leonards
	'E02004267', // Corfe Castle & Langton Matravers
	'E02004273' // Lyme Regis, Charmouth & Marshwood Vale
] as const;

/** Areas with sparse flat stock in this release are proxied by missing flat values. */
export const SHOW_MISSING_FLAT_BADGE_FROM_STEP = STEP_FLATS_EXPENSIVE_OR_SCARCE;
