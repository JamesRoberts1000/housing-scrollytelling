import type { HousingMarketSystem } from '$lib/types/housingMarketTypology';

/** Scroll-step choreography for Section 8 (housing market typology). */
export const STEP_INTRO = 0;
export const STEP_RURAL_LIFESTYLE = 1;
export const STEP_URBAN_WORKING = 2;
export const STEP_RETIREMENT_AMENITY = 3;
export const STEP_SYNTHESIS = 4;

export const SYSTEM_RURAL: HousingMarketSystem = 'rural_lifestyle';
export const SYSTEM_URBAN: HousingMarketSystem = 'urban_working_coastal';
export const SYSTEM_RETIREMENT: HousingMarketSystem = 'retirement_amenity';

export const SYSTEM_ORDER: HousingMarketSystem[] = [
	SYSTEM_RURAL,
	SYSTEM_URBAN,
	SYSTEM_RETIREMENT
];

export const SYSTEM_LABELS: Record<HousingMarketSystem, string> = {
	rural_lifestyle: 'Rural lifestyle markets',
	urban_working_coastal: 'Urban & working coastal markets',
	retirement_amenity: 'Retirement & amenity markets'
};

export const SYSTEM_SHORT_LABELS: Record<HousingMarketSystem, string> = {
	rural_lifestyle: 'Rural lifestyle',
	urban_working_coastal: 'Urban & working coastal',
	retirement_amenity: 'Retirement & amenity'
};

export const SYSTEM_COLORS: Record<HousingMarketSystem, string> = {
	rural_lifestyle: '#49B170',
	urban_working_coastal: '#09476D',
	retirement_amenity: '#C7D530'
};

export const MUTED_FILL = 'rgba(227, 224, 218, 0.55)';
export const MUTED_FILL_OPACITY = 0.65;
export const ACTIVE_OPACITY = 0.82;
export const SYNTHESIS_OPACITY = 0.78;

export const SYSTEM_TRAITS: Record<HousingMarketSystem, string[]> = {
	rural_lifestyle: [
		'Expensive detached housing',
		'Ageing populations',
		'Limited flat stock',
		'Exclusionary affordability'
	],
	urban_working_coastal: [
		'Affordable flats and terraces',
		'Mixed tenure',
		'Entry-level ownership opportunities'
	],
	retirement_amenity: [
		'Expensive flats',
		'Downsizer demand',
		'Second-home influence'
	]
};

export const SYSTEM_GLYPHS: Record<HousingMarketSystem, string[]> = {
	rural_lifestyle: ['Rural', 'Age 65+', 'Detached'],
	urban_working_coastal: ['Urban', 'Coastal', 'Flats'],
	retirement_amenity: ['Coastal', 'Age 65+', 'Flats']
};

/** Zoom targets when each system is spotlighted. */
export const RURAL_ZOOM_CODES = [
	'E02004243',
	'E02004247',
	'E02004259',
	'E02004262',
	'E02004270'
] as const;

export const URBAN_ZOOM_CODES = [
	'E02004284',
	'E02004285',
	'E02004286',
	'E02004287',
	'E02004288',
	'E02004289',
	'E02004255',
	'E02004281'
] as const;

export const RETIREMENT_ZOOM_CODES = [
	'E02004246',
	'E02004267',
	'E02004268',
	'E02004273',
	'E02004275'
] as const;

export function stepFocusSystem(step: number): HousingMarketSystem | null {
	if (step === STEP_RURAL_LIFESTYLE) return SYSTEM_RURAL;
	if (step === STEP_URBAN_WORKING) return SYSTEM_URBAN;
	if (step === STEP_RETIREMENT_AMENITY) return SYSTEM_RETIREMENT;
	return null;
}

export function stepZoomCodes(step: number): readonly string[] | null {
	if (step === STEP_RURAL_LIFESTYLE) return RURAL_ZOOM_CODES;
	if (step === STEP_URBAN_WORKING) return URBAN_ZOOM_CODES;
	if (step === STEP_RETIREMENT_AMENITY) return RETIREMENT_ZOOM_CODES;
	return null;
}

export function stepAriaLabel(step: number): string {
	switch (step) {
		case STEP_INTRO:
			return 'Map of Dorset neighbourhoods awaiting housing market grouping';
		case STEP_RURAL_LIFESTYLE:
			return 'Map highlighting rural lifestyle housing markets across Dorset';
		case STEP_URBAN_WORKING:
			return 'Map highlighting urban and working coastal housing markets';
		case STEP_RETIREMENT_AMENITY:
			return 'Map highlighting retirement and amenity housing markets';
		case STEP_SYNTHESIS:
			return 'Map showing all three housing market systems across Dorset';
		default:
			return 'Housing market typology map of Dorset';
	}
}

export function stepMapDescription(step: number, msoaCount: number): string {
	const base = `Interactive map grouping ${msoaCount} Dorset neighbourhoods into three housing market types. `;
	switch (step) {
		case STEP_INTRO:
			return `${base}Neighbourhoods appear in neutral grey until each market type is introduced while scrolling. Use the data table below for the full list.`;
		case STEP_RURAL_LIFESTYLE:
			return `${base}Rural lifestyle markets are shown in green. Other neighbourhoods remain grey. Expand the data table below for all assignments.`;
		case STEP_URBAN_WORKING:
			return `${base}Urban and working coastal markets are shown in dark blue. Other neighbourhoods remain grey. Expand the data table below for all assignments.`;
		case STEP_RETIREMENT_AMENITY:
			return `${base}Retirement and amenity markets are shown in yellow-green. Other neighbourhoods remain grey. Expand the data table below for all assignments.`;
		case STEP_SYNTHESIS:
			return `${base}All three market types are shown together. Expand the data table below for neighbourhood-level detail.`;
		default:
			return `${base}Expand the data table below for neighbourhood-level detail.`;
	}
}
