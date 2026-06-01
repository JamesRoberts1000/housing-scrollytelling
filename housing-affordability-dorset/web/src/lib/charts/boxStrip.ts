import { quantileSorted } from 'd3';

export type RatioRow = { ratio: number };

export type BoxStats = {
	min: number;
	q1: number;
	median: number;
	q3: number;
	max: number;
};

/** Deterministic pseudo-random jitter in [-0.5, 0.5] from a string seed. */
export function jitterOffset(seed: string): number {
	let h = 0;
	for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
	return ((h % 1000) / 1000 - 0.5);
}

export function boxStats(values: number[]): BoxStats | null {
	const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
	if (!sorted.length) return null;
	const q1 = quantileSorted(sorted, 0.25) ?? sorted[0]!;
	const med = quantileSorted(sorted, 0.5) ?? sorted[0]!;
	const q3 = quantileSorted(sorted, 0.75) ?? sorted[sorted.length - 1]!;
	return {
		min: sorted[0]!,
		q1,
		median: med,
		q3,
		max: sorted[sorted.length - 1]!
	};
}

export function ratioExtent(rows: RatioRow[], pad = 0.08): [number, number] {
	const vals = rows.map((r) => r.ratio).filter((v) => Number.isFinite(v));
	if (!vals.length) return [0, 1];
	let lo = Math.min(...vals);
	let hi = Math.max(...vals);
	if (lo === hi) return [lo - 1, hi + 1];
	const p = (hi - lo) * pad;
	return [lo - p, hi + p];
}

export function formatRatio(n: number): string {
	return `${n.toFixed(1)}×`;
}

export function formatPercent(n: number, digits = 0): string {
	return `${n.toFixed(digits)}%`;
}
