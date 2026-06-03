/** Split vertical space between a chart block and map block (sections 4–5). */
export function allocateChartAndMapHeights(
	totalH: number,
	opts: {
		headerReserve?: number;
		mapCaptionReserve?: number;
		gap?: number;
		mapMin?: number;
		mapMax?: number;
		mapShare?: number;
		chartMin?: number;
	} = {}
): { chartH: number; mapBlockH: number } {
	const {
		headerReserve = 74,
		mapCaptionReserve = 26,
		gap = 12,
		mapMin = 220,
		mapMax = 360,
		mapShare = 0.4,
		chartMin = 220
	} = opts;
	const avail = totalH - headerReserve - gap * 2 - mapCaptionReserve;
	const mapInnerH = Math.max(mapMin, Math.min(mapMax, Math.round(avail * mapShare)));
	const chartH = Math.max(chartMin, avail - mapInnerH);
	return { chartH, mapBlockH: mapInnerH + mapCaptionReserve };
}

/** Chart-only block (section 6). */
export function allocateChartHeight(
	totalH: number,
	opts: {
		headerReserve?: number;
		footerReserve?: number;
		padding?: number;
		chartMin?: number;
	} = {}
): number {
	const {
		headerReserve = 74,
		footerReserve = 28,
		padding = 20,
		chartMin = 300
	} = opts;
	return Math.max(chartMin, totalH - headerReserve - footerReserve - padding);
}
