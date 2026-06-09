/** MSOA21CD values aligned with GeoJSON + affordability CSV. */
export const MSOA_ST_LEONARDS = 'E02004246';
export const MSOA_UNDERHILL_GROVE = 'E02004288';

/** Weymouth / Portland cluster (affordable step). */
export const MSOA_WEYMOUTH_PORTLAND = [
	'E02004284',
	'E02004285',
	'E02004286',
	'E02004287',
	'E02004289'
] as const;

export const SECTION3_MAP_LABEL: Record<string, string> = {
	E02004246: 'St Leonards',
	E02004284: 'Weymouth',
	E02004288: 'Underhill & Grove'
};

export function section3MapAriaLabel(step: number): string {
	switch (step) {
		case 0:
			return 'Choropleth map of housing affordability ratios across Dorset neighbourhoods. Darker blue areas have higher ratios.';
		case 1:
			return 'Map highlighting St Leonards, a neighbourhood with a high affordability ratio.';
		case 2:
			return 'Map highlighting Weymouth and Portland, comparatively lower-ratio coastal neighbourhoods.';
		case 3:
			return 'Map highlighting Underhill and The Grove, a comparatively lower-ratio coastal neighbourhood.';
		default:
			return 'Map of housing affordability ratios across Dorset neighbourhoods.';
	}
}

export function section3MapDescription(step: number, msoaCount: number): string {
	const base = `Interactive map showing affordability ratios for ${msoaCount} Dorset MSOAs. `;
	switch (step) {
		case 0:
			return `${base}Use the data table below for a full list of neighbourhoods and ratios. Mouse hover shows one area at a time in the panel above the map.`;
		case 1:
			return `${base}Current view focuses on St Leonards. Expand the data table below for all neighbourhoods.`;
		case 2:
			return `${base}Current view focuses on Weymouth and Portland. Expand the data table below for all neighbourhoods.`;
		case 3:
			return `${base}Current view focuses on Underhill and The Grove. Expand the data table below for all neighbourhoods.`;
		default:
			return `${base}Expand the data table below for all neighbourhoods and ratios.`;
	}
}
