import { csvParse } from 'd3';
import type {
	AgeAffordabilityBundle,
	AgeAffordabilitySummary,
	MsoaAgeAffordabilityRow
} from '$lib/types/ageAffordability';
import { assetPath } from '$lib/utils/assetPath';

function num(v: string | undefined): number {
	if (v === undefined || v === '') return NaN;
	const n = Number(String(v).replace(/,/g, ''));
	return Number.isFinite(n) ? n : NaN;
}

function pearsonCorrelation(xs: number[], ys: number[]): number {
	const n = xs.length;
	if (n < 2) return NaN;
	const meanX = xs.reduce((a, b) => a + b, 0) / n;
	const meanY = ys.reduce((a, b) => a + b, 0) / n;
	let num = 0;
	let denX = 0;
	let denY = 0;
	for (let i = 0; i < n; i++) {
		const dx = xs[i]! - meanX;
		const dy = ys[i]! - meanY;
		num += dx * dy;
		denX += dx * dx;
		denY += dy * dy;
	}
	const den = Math.sqrt(denX * denY);
	return den === 0 ? NaN : num / den;
}

export function parseAgeAffordabilityRows(
	records: Record<string, string>[]
): MsoaAgeAffordabilityRow[] {
	return records
		.map((r) => {
			const code = String(r['MSOA code'] ?? '').trim();
			const name = String(r['MSOA name'] ?? '').trim();
			const ratio = num(r['affordability_ratio']);
			const pct65Plus = num(r['pct_65_plus']);
			const populationTotal = num(r['population_total']);
			if (
				!code ||
				!Number.isFinite(ratio) ||
				ratio <= 0 ||
				!Number.isFinite(pct65Plus) ||
				pct65Plus < 0 ||
				pct65Plus > 100
			) {
				return null;
			}
			return { code, name, ratio, pct65Plus, populationTotal };
		})
		.filter((x): x is MsoaAgeAffordabilityRow => x !== null);
}

export function dorsetPopulationPct65Plus(rows: MsoaAgeAffordabilityRow[]): number {
	const totalPop = rows.reduce((s, r) => s + r.populationTotal, 0);
	if (totalPop <= 0) return NaN;
	const aged65Plus = rows.reduce((s, r) => s + (r.populationTotal * r.pct65Plus) / 100, 0);
	return (100 * aged65Plus) / totalPop;
}

export function summariseAgeAffordability(rows: MsoaAgeAffordabilityRow[]): AgeAffordabilitySummary {
	const ratios = rows.map((r) => r.ratio);
	const pct = rows.map((r) => r.pct65Plus);
	return {
		count: rows.length,
		pct65Min: Math.min(...pct),
		pct65Max: Math.max(...pct),
		dorsetPct65Plus: dorsetPopulationPct65Plus(rows),
		ratioMin: Math.min(...ratios),
		ratioMax: Math.max(...ratios),
		correlation: pearsonCorrelation(pct, ratios)
	};
}

export function buildAgeAffordabilityBundle(rows: MsoaAgeAffordabilityRow[]): AgeAffordabilityBundle {
	return {
		rows,
		summary: summariseAgeAffordability(rows)
	};
}

export async function loadAgeAffordabilityFetch(fetchFn: typeof fetch): Promise<AgeAffordabilityBundle> {
	const text = await fetchFn(assetPath('/data/dorset_msoa_age.csv')).then((r) => {
		if (!r.ok) throw new Error(`Failed to load age/affordability data: ${r.status}`);
		return r.text();
	});
	const records = csvParse(text) as Record<string, string>[];
	return buildAgeAffordabilityBundle(parseAgeAffordabilityRows(records));
}
