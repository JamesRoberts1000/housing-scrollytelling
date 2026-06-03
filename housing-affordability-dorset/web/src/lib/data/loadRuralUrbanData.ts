import { csvParse } from 'd3';
import type {
	GroupSummary,
	MsoaRuralUrbanRow,
	RuralUrbanBundle,
	RuralUrbanGroup
} from '$lib/types/ruralUrban';
import { assetPath } from '$lib/utils/assetPath';

function num(v: string | undefined): number {
	if (v === undefined || v === '') return NaN;
	const n = Number(String(v).replace(/,/g, ''));
	return Number.isFinite(n) ? n : NaN;
}

function parseGroup(raw: string): RuralUrbanGroup | null {
	const s = raw.trim();
	if (s === 'Rural' || s === 'Urban') return s;
	return null;
}

function median(values: number[]): number {
	if (!values.length) return NaN;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

function mean(values: number[]): number {
	if (!values.length) return NaN;
	return values.reduce((a, b) => a + b, 0) / values.length;
}

export function parseRuralUrbanRows(records: Record<string, string>[]): MsoaRuralUrbanRow[] {
	return records
		.map((r) => {
			const code = String(r['MSOA code'] ?? '').trim();
			const name = String(r['MSOA name'] ?? '').trim();
			const ratio = num(r['affordability_ratio']);
			const group = parseGroup(String(r['rural_urban'] ?? ''));
			const ruc21Code = String(r['ruc21_code'] ?? '').trim();
			const ruc21Name = String(r['ruc21_name'] ?? '').trim();
			if (!code || !group || !Number.isFinite(ratio) || ratio <= 0) return null;
			return { code, name, ratio, group, ruc21Code, ruc21Name };
		})
		.filter((x): x is MsoaRuralUrbanRow => x !== null);
}

export function partitionByRuralUrban(rows: MsoaRuralUrbanRow[]): {
	rural: MsoaRuralUrbanRow[];
	urban: MsoaRuralUrbanRow[];
} {
	return {
		rural: rows.filter((r) => r.group === 'Rural'),
		urban: rows.filter((r) => r.group === 'Urban')
	};
}

export function summariseRuralUrban(rows: MsoaRuralUrbanRow[]): GroupSummary[] {
	const groups: RuralUrbanGroup[] = ['Rural', 'Urban'];
	return groups.map((group) => {
		const subset = rows.filter((r) => r.group === group).map((r) => r.ratio);
		return {
			group,
			count: subset.length,
			median: median(subset),
			mean: mean(subset)
		};
	});
}

/** Rural MSOAs with affordability ratio strictly above every urban MSOA. */
export function ruralOutliersAboveUrban(rows: MsoaRuralUrbanRow[]): MsoaRuralUrbanRow[] {
	const urbanMax = Math.max(
		0,
		...rows.filter((r) => r.group === 'Urban').map((r) => r.ratio)
	);
	return rows
		.filter((r) => r.group === 'Rural' && r.ratio > urbanMax)
		.sort((a, b) => b.ratio - a.ratio);
}

export function buildRuralUrbanBundle(rows: MsoaRuralUrbanRow[]): RuralUrbanBundle {
	const { rural, urban } = partitionByRuralUrban(rows);
	const classificationByMsoa = Object.fromEntries(rows.map((r) => [r.code, r.group]));
	return {
		rows,
		rural,
		urban,
		summary: summariseRuralUrban(rows),
		classificationByMsoa
	};
}

export async function loadRuralUrbanFetch(fetchFn: typeof fetch): Promise<RuralUrbanBundle> {
	const text = await fetchFn(assetPath('/data/dorset_msoa_rural_urban.csv')).then((r) => {
		if (!r.ok) throw new Error(`Failed to load rural/urban data: ${r.status}`);
		return r.text();
	});
	const records = csvParse(text) as Record<string, string>[];
	return buildRuralUrbanBundle(parseRuralUrbanRows(records));
}
