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
