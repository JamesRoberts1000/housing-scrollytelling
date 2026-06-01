import { csvParse } from 'd3';
import type {
	CoastalInlandBundle,
	CoastalInlandGroup,
	CoastalInlandGroupSummary,
	MsoaCoastalInlandRow
} from '$lib/types/coastalInland';
import type { RuralUrbanGroup } from '$lib/types/ruralUrban';

function num(v: string | undefined): number {
	if (v === undefined || v === '') return NaN;
	const n = Number(String(v).replace(/,/g, ''));
	return Number.isFinite(n) ? n : NaN;
}

function parseCoastalInland(raw: string): CoastalInlandGroup | null {
	const s = raw.trim();
	if (s === 'Coastal' || s === 'Inland') return s;
	return null;
}

function parseRuralUrban(raw: string): RuralUrbanGroup | null {
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

export function parseCoastalInlandRows(records: Record<string, string>[]): MsoaCoastalInlandRow[] {
	return records
		.map((r) => {
			const code = String(r['MSOA code'] ?? '').trim();
			const name = String(r['MSOA name'] ?? '').trim();
			const ratio = num(r['affordability_ratio']);
			const group = parseCoastalInland(String(r['coastal_inland'] ?? ''));
			const ruralUrban = parseRuralUrban(String(r['rural_urban'] ?? ''));
			if (!code || !group || !ruralUrban || !Number.isFinite(ratio) || ratio <= 0) return null;
			return { code, name, ratio, group, ruralUrban };
		})
		.filter((x): x is MsoaCoastalInlandRow => x !== null);
}

export function partitionByCoastalInland(rows: MsoaCoastalInlandRow[]): {
	coastal: MsoaCoastalInlandRow[];
	inland: MsoaCoastalInlandRow[];
} {
	return {
		coastal: rows.filter((r) => r.group === 'Coastal'),
		inland: rows.filter((r) => r.group === 'Inland')
	};
}

export function summariseCoastalInland(rows: MsoaCoastalInlandRow[]): CoastalInlandGroupSummary[] {
	const groups: CoastalInlandGroup[] = ['Coastal', 'Inland'];
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

export function buildCoastalInlandBundle(rows: MsoaCoastalInlandRow[]): CoastalInlandBundle {
	const { coastal, inland } = partitionByCoastalInland(rows);
	const classificationByMsoa = Object.fromEntries(rows.map((r) => [r.code, r.group]));
	return {
		rows,
		coastal,
		inland,
		summary: summariseCoastalInland(rows),
		classificationByMsoa
	};
}

export async function loadCoastalInlandFetch(fetchFn: typeof fetch): Promise<CoastalInlandBundle> {
	const text = await fetchFn('/data/dorset_msoa_coastal.csv').then((r) => {
		if (!r.ok) throw new Error(`Failed to load coastal/inland data: ${r.status}`);
		return r.text();
	});
	const records = csvParse(text) as Record<string, string>[];
	return buildCoastalInlandBundle(parseCoastalInlandRows(records));
}
