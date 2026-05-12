/**
 * Section 3 “places to watch” — MSOA21CD values aligned with GeoJSON + affordability CSV.
 * Labels are shortened for on-map symbol text.
 */
export const SECTION3_WATCH_MSOA_CODES = [
	'E02004246',
	'E02004273',
	'E02004267',
	'E02004284',
	'E02004288'
] as const;

export type WatchMsoaCode = (typeof SECTION3_WATCH_MSOA_CODES)[number];

export const SECTION3_WATCH_MAP_LABEL: Record<WatchMsoaCode, string> = {
	E02004246: 'St Leonards',
	E02004273: 'Lyme Regis area',
	E02004267: 'Corfe Castle',
	E02004284: 'Weymouth town',
	E02004288: 'Underhill & Grove'
};
