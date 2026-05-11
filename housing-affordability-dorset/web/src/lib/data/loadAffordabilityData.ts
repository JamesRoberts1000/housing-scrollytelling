import { csv, csvParse } from 'd3';
import {
	DORSET_LA_LOWER_QUARTILE_RATIO_COL,
	DORSET_LA_MEDIAN_RATIO_COL,
	MSOA_EXISTING_MEDIAN_RATIO_COL,
	REGION_LOWER_QUARTILE_RATIO_COL,
	REGION_MEDIAN_RATIO_COL
} from '$lib/constants/dataColumns';
import type { BarDatum, DorsetLaRow, MsoaRatioRow, RegionRow } from '$lib/types/affordability';

function num(v: string | undefined): number {
	if (v === undefined || v === '') return NaN;
	const n = Number(String(v).replace(/,/g, ''));
	return Number.isFinite(n) ? n : NaN;
}

export async function loadMsoaRatios(url = '/data/dorset_msoa_affordability_ratios.csv'): Promise<MsoaRatioRow[]> {
	const rows = await csv(url);
	return rows as unknown as MsoaRatioRow[];
}

export async function loadMsoaRatiosFetch(fetchFn: typeof fetch): Promise<MsoaRatioRow[]> {
	const text = await fetchFn('/data/dorset_msoa_affordability_ratios.csv').then((r) => r.text());
	return csvParse(text) as unknown as MsoaRatioRow[];
}

export async function loadNationalContextBarsFetch(fetchFn: typeof fetch): Promise<BarDatum[]> {
	const [regionsText, laText] = await Promise.all([
		fetchFn('/data/aff1ratioofhousepricetoworkplacebasedearnings_regions_latest.csv').then((r) =>
			r.text()
		),
		fetchFn('/data/aff1ratioofhousepricetoworkplacebasedearnings_latest.csv').then((r) => r.text())
	]);
	const regions = csvParse(regionsText);
	const la = csvParse(laText);

	const want = new Set(['england', 'south west']);
	const regionRows = regions.filter((r) =>
		want.has(String(r['Name'] ?? '').trim().toLowerCase())
	) as Record<string, string>[];

	const byName = new Map<string, RegionRow>();
	for (const r of regionRows) {
		const name = String(r['Name'] ?? '').trim();
		byName.set(name.toLowerCase(), {
			Code: String(r['Code'] ?? ''),
			Name: name,
			medianRatio: num(r[REGION_MEDIAN_RATIO_COL]),
			lowerQuartileRatio: num(r[REGION_LOWER_QUARTILE_RATIO_COL])
		});
	}

	const dorsetLa = la[0] as Record<string, string> | undefined;
	if (!dorsetLa) {
		throw new Error('Dorset local authority row missing from earnings workbook export.');
	}

	const dorset: DorsetLaRow = {
		medianRatio: num(dorsetLa[DORSET_LA_MEDIAN_RATIO_COL]),
		lowerQuartileRatio: num(dorsetLa[DORSET_LA_LOWER_QUARTILE_RATIO_COL])
	};

	const order: { key: string; label: string }[] = [
		{ key: 'England', label: 'England' },
		{ key: 'South West', label: 'South West' }
	];

	const bars: BarDatum[] = order.map(({ key, label }) => {
		const row = byName.get(key.toLowerCase());
		if (!row) throw new Error(`Missing region row for ${key}`);
		return {
			label,
			medianRatio: row.medianRatio,
			lowerQuartileRatio: row.lowerQuartileRatio
		};
	});

	bars.push({
		label: 'Dorset',
		medianRatio: dorset.medianRatio,
		lowerQuartileRatio: dorset.lowerQuartileRatio
	});

	return bars;
}

/** Browser convenience wrapper (uses `window.fetch`). */
export async function loadNationalContextBars(): Promise<BarDatum[]> {
	return loadNationalContextBarsFetch(fetch);
}

export function ratioByMsoaCode(rows: MsoaRatioRow[]): Map<string, number> {
	const m = new Map<string, number>();
	for (const r of rows) {
		const code = String(r['MSOA code'] ?? '').trim();
		m.set(code, num(String(r[MSOA_EXISTING_MEDIAN_RATIO_COL] ?? '')));
	}
	return m;
}
