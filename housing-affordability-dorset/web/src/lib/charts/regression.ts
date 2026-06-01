export type XYPoint = { x: number; y: number };

export type LinearRegression = {
	slope: number;
	intercept: number;
};

/** Ordinary least-squares fit for y ~ x. */
export function linearRegression(points: XYPoint[]): LinearRegression | null {
	const valid = points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
	const n = valid.length;
	if (n < 2) return null;

	const meanX = valid.reduce((s, p) => s + p.x, 0) / n;
	const meanY = valid.reduce((s, p) => s + p.y, 0) / n;
	let num = 0;
	let den = 0;
	for (const p of valid) {
		const dx = p.x - meanX;
		num += dx * (p.y - meanY);
		den += dx * dx;
	}
	if (den === 0) return null;
	const slope = num / den;
	return { slope, intercept: meanY - slope * meanX };
}

/** Line segment clipped to [xMin, xMax] on x-axis. */
export function regressionLine(
	reg: LinearRegression,
	xMin: number,
	xMax: number
): { x1: number; y1: number; x2: number; y2: number } {
	const y1 = reg.slope * xMin + reg.intercept;
	const y2 = reg.slope * xMax + reg.intercept;
	return { x1: xMin, y1, x2: xMax, y2 };
}
