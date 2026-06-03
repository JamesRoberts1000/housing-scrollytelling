import { csvParse } from 'd3';
import {
	MSOA_EXISTING_DETACHED_RATIO_COL,
	MSOA_EXISTING_FLAT_RATIO_COL,
	MSOA_EXISTING_MEDIAN_RATIO_COL,
	MSOA_EXISTING_SEMI_DETACHED_RATIO_COL,
	MSOA_EXISTING_TERRACED_RATIO_COL
} from '$lib/constants/dataColumns';
import type {
	HousingTypeAffordabilityBundle,
	HousingTypeAffordabilityRow,
	HousingTypeAffordabilitySummary
} from '$lib/types/housingType';
import { assetPath } from '$lib/utils/assetPath';

function num(v: string | undefined): number {
	if (v === undefined || v === '') return NaN;
	const n = Number(String(v).replace(/,/g, ''));
	return Number.isFinite(n) ? n : NaN;
}

function median(values: number[]): number {
	if (!values.length) return NaN;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 0) return (sorted[mid - 1]! + sorted[mid]!) / 2;
	return sorted[mid]!;
}

export function parseHousingTypeRows(records: Record<string, string>[]): HousingTypeAffordabilityRow[] {
	return records
		.map((r) => {
			const code = String(r['MSOA code'] ?? '').trim();
			const name = String(r['MSOA name'] ?? '').trim();
			const overall = num(r[MSOA_EXISTING_MEDIAN_RATIO_COL]);
			if (!code || !Number.isFinite(overall) || overall <= 0) return null;

			const detached = num(r[MSOA_EXISTING_DETACHED_RATIO_COL]);
			const semiDetached = num(r[MSOA_EXISTING_SEMI_DETACHED_RATIO_COL]);
			const terraced = num(r[MSOA_EXISTING_TERRACED_RATIO_COL]);
			const flats = num(r[MSOA_EXISTING_FLAT_RATIO_COL]);

			const typeValues = [detached, semiDetached, terraced, flats].filter(
				(v) => Number.isFinite(v) && v > 0
			);
			const validTypeCount = typeValues.length;
			const hasFlats = Number.isFinite(flats) && flats > 0;
			const overallMinusFlats = hasFlats ? overall - flats : NaN;

			return {
				code,
				name,
				overall,
				detached,
				semiDetached,
				terraced,
				flats,
				overallMinusFlats,
				validTypeCount,
				hasFlats
			};
		})
		.filter((x): x is HousingTypeAffordabilityRow => x !== null);
}

export function summariseHousingTypeRows(rows: HousingTypeAffordabilityRow[]): HousingTypeAffordabilitySummary {
	const withFlats = rows.filter((r) => r.hasFlats && Number.isFinite(r.overallMinusFlats));
	const gapValues = withFlats.map((r) => r.overallMinusFlats);
	return {
		count: rows.length,
		availableFlatsCount: withFlats.length,
		medianOverallMinusFlats: median(gapValues),
		maxOverallMinusFlats: gapValues.length ? Math.max(...gapValues) : NaN,
		minOverallMinusFlats: gapValues.length ? Math.min(...gapValues) : NaN
	};
}

export function buildHousingTypeBundle(rows: HousingTypeAffordabilityRow[]): HousingTypeAffordabilityBundle {
	return {
		rows,
		summary: summariseHousingTypeRows(rows)
	};
}

export async function loadHousingTypeAffordabilityFetch(
	fetchFn: typeof fetch
): Promise<HousingTypeAffordabilityBundle> {
	const text = await fetchFn(assetPath('/data/dorset_msoa_affordability_ratios.csv')).then((r) => {
		if (!r.ok) throw new Error(`Failed to load housing-type affordability data: ${r.status}`);
		return r.text();
	});
	const records = csvParse(text) as Record<string, string>[];
	return buildHousingTypeBundle(parseHousingTypeRows(records));
}
