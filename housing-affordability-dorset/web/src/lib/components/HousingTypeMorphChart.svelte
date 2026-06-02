<script lang="ts">
	import { browser } from '$app/environment';
	import { formatRatio } from '$lib/charts/boxStrip';
	import {
		FLAT_ACCESS_CODES,
		FLAT_EXPENSIVE_CODES,
		HIGHLIGHT_POINT_FILL,
		LINKED_TYPE_KEYS,
		MUTED_POINT_FILL,
		POINT_FILL,
		SHOW_MISSING_FLAT_BADGE_FROM_STEP,
		STEP_DETACHED,
		STEP_FLATS,
		STEP_FLATS_AFFORDABLE,
		STEP_FLATS_EXPENSIVE_OR_SCARCE,
		STEP_LINKED_ALL_TYPES,
		STEP_OVERALL,
		STEP_SEMI_DETACHED,
		STEP_TERRACED,
		TYPE_COLORS,
		TYPE_LABELS,
		type LinkedTypeKey
	} from '$lib/constants/housingTypeStory';
	import type {
		HousingTypeAffordabilityBundle,
		HousingTypeAffordabilityRow,
		HousingTypeKey
	} from '$lib/types/housingType';
	import { scaleLinear } from 'd3';

	type Props = {
		data: HousingTypeAffordabilityBundle;
		step?: number;
	};

	type LinkedDot = {
		row: HousingTypeAffordabilityRow;
		typeKey: LinkedTypeKey;
		x: number;
		y: number;
	};

	type HoveredDot = {
		row: HousingTypeAffordabilityRow;
		typeLabel: string;
		ratio: number;
	};

	let { data, step = 0 }: Props = $props();
	let currentStep = $derived(Number(step));
	let chartWrap = $state<HTMLDivElement | null>(null);
	let hoveredDot = $state<HoveredDot | null>(null);
	let tooltipPos = $state({ x: 0, y: 0 });

	const width = 700;
	const chartH = 380;
	const margin = { top: 34, right: 20, bottom: 46, left: 24 };
	const plotW = width - margin.left - margin.right;
	const plotH = chartH - margin.top - margin.bottom;

	const accessSet = new Set<string>(FLAT_ACCESS_CODES);
	const expensiveSet = new Set<string>(FLAT_EXPENSIVE_CODES);

	const reducedMotion = $derived.by(
		() =>
			browser &&
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);

	const isLinkedView = $derived(currentStep >= STEP_LINKED_ALL_TYPES);

	const activeMetric = $derived.by((): HousingTypeKey => {
		if (currentStep <= STEP_OVERALL) return 'overall';
		if (currentStep === STEP_DETACHED) return 'detached';
		if (currentStep === STEP_SEMI_DETACHED) return 'semiDetached';
		if (currentStep === STEP_TERRACED) return 'terraced';
		if (currentStep >= STEP_FLATS && currentStep <= STEP_FLATS_EXPENSIVE_OR_SCARCE) return 'flats';
		return 'overall';
	});

	const metricLabel = $derived.by((): string => {
		if (isLinkedView) return 'All dwelling types by neighbourhood';
		if (activeMetric === 'overall') return 'Overall affordability';
		if (activeMetric === 'detached') return 'Detached homes';
		if (activeMetric === 'semiDetached') return 'Semi-detached homes';
		if (activeMetric === 'terraced') return 'Terraced homes';
		return 'Flats and maisonettes';
	});

	const plottedRows = $derived.by((): HousingTypeAffordabilityRow[] => {
		const metric = activeMetric;
		return data.rows.filter((r) => Number.isFinite(r[metric]) && r[metric] > 0);
	});

	const rankedRows = $derived.by((): HousingTypeAffordabilityRow[] => {
		const metric = activeMetric;
		return [...plottedRows].sort((a, b) => a[metric] - b[metric]);
	});

	const overallRankedRows = $derived.by((): HousingTypeAffordabilityRow[] =>
		[...data.rows].sort((a, b) => a.overall - b.overall)
	);

	const globalMinMax = $derived.by((): [number, number] => {
		const values = data.rows.flatMap((r) =>
			[r.detached, r.semiDetached, r.terraced, r.flats].filter(
				(v) => Number.isFinite(v) && v > 0
			)
		);
		if (!values.length) return [0, 20];
		const lo = Math.min(...values);
		const hi = Math.max(...values);
		const pad = (hi - lo) * 0.08 || 1;
		return [Math.max(0, lo - pad), hi + pad];
	});

	const xScale = $derived(scaleLinear().domain(globalMinMax).range([0, plotW]));

	const rowGap = $derived.by(() => {
		const rows = isLinkedView ? overallRankedRows : rankedRows;
		const n = Math.max(1, rows.length - 1);
		return plotH / n;
	});

	const points = $derived.by(() =>
		rankedRows.map((row, i) => ({
			row,
			x: margin.left + xScale(row[activeMetric]),
			y: margin.top + i * rowGap
		}))
	);

	const linkedLines = $derived.by(() =>
		overallRankedRows
			.map((row, i) => {
				const y = margin.top + i * rowGap;
				const xs = LINKED_TYPE_KEYS.map((typeKey) => row[typeKey])
					.filter((v) => Number.isFinite(v) && v > 0)
					.sort((a, b) => a - b)
					.map((v) => margin.left + xScale(v));
				return { row, y, xs };
			})
			.filter((line) => line.xs.length >= 2)
	);

	const linkedDots = $derived.by((): LinkedDot[] => {
		const dots: LinkedDot[] = [];
		overallRankedRows.forEach((row, i) => {
			const y = margin.top + i * rowGap;
			for (const typeKey of LINKED_TYPE_KEYS) {
				const ratio = row[typeKey];
				if (Number.isFinite(ratio) && ratio > 0) {
					dots.push({
						row,
						typeKey,
						x: margin.left + xScale(ratio),
						y
					});
				}
			}
		});
		return dots;
	});

	const xTicks = $derived.by(() => {
		const [lo, hi] = globalMinMax;
		const stepSize = 2;
		const start = Math.floor(lo / stepSize) * stepSize;
		const ticks: number[] = [];
		for (let t = start; t <= hi; t += stepSize) {
			if (t >= lo && t <= hi) ticks.push(t);
		}
		return ticks;
	});

	const expensiveRows = $derived.by(() =>
		rankedRows.filter((r) => expensiveSet.has(r.code)).slice(0, 2)
	);

	const accessibleRows = $derived.by(() =>
		rankedRows.filter((r) => accessSet.has(r.code)).slice(0, 2)
	);

	const missingFlatsCount = $derived.by(() => data.rows.filter((r) => !r.hasFlats).length);

	const ariaSummary = $derived.by(() => {
		if (isLinkedView) {
			return `Linked dot plot of ${overallRankedRows.length} Dorset MSOAs. Each row shows detached, semi-detached, terraced and flat affordability ratios where available, colour-coded by dwelling type.`;
		}
		return `${metricLabel} plotted for ${rankedRows.length} Dorset MSOAs. Lower values indicate more affordable homes relative to local earnings.`;
	});

	function pointOpacity(row: HousingTypeAffordabilityRow): number {
		if (currentStep === STEP_FLATS_AFFORDABLE) {
			return accessSet.has(row.code) ? 1 : 0.2;
		}
		if (currentStep === STEP_FLATS_EXPENSIVE_OR_SCARCE) {
			return expensiveSet.has(row.code) || !row.hasFlats ? 1 : 0.2;
		}
		return 0.88;
	}

	function setTooltipFromEvent(info: HoveredDot, e: MouseEvent): void {
		hoveredDot = info;
		if (!chartWrap) return;
		const rect = chartWrap.getBoundingClientRect();
		tooltipPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
	}

	function clearTooltip(): void {
		hoveredDot = null;
	}

	function pointFill(row: HousingTypeAffordabilityRow): string {
		if (currentStep === STEP_FLATS_AFFORDABLE && accessSet.has(row.code)) return HIGHLIGHT_POINT_FILL;
		if (currentStep === STEP_FLATS_EXPENSIVE_OR_SCARCE && !row.hasFlats) return MUTED_POINT_FILL;
		if (currentStep === STEP_FLATS_EXPENSIVE_OR_SCARCE && expensiveSet.has(row.code)) {
			return HIGHLIGHT_POINT_FILL;
		}
		return POINT_FILL;
	}

	const transitionStyle = $derived(
		`transition: transform ${reducedMotion ? '0.01ms' : '450ms'} ease, opacity ${reducedMotion ? '0.01ms' : '300ms'} ease;`
	);
</script>

<div class="flex h-full min-h-0 w-full flex-col items-center justify-start px-4 py-6 sm:px-6">
	<div class="w-full max-w-4xl">
		<h3 class="mb-2 text-center text-[20px] font-bold leading-tight text-ink sm:text-[22px]">
			Affordability by housing type
		</h3>
		<p class="mb-4 text-center text-sm text-muted">
			{#if isLinkedView}
				Each row is one neighbourhood. Dots are linked and colour-coded by dwelling type.
			{:else}
				Now showing: <span class="font-semibold text-ink">{metricLabel}</span>
			{/if}
		</p>

		{#if isLinkedView}
			<div class="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted">
				{#each LINKED_TYPE_KEYS as typeKey}
					<span class="inline-flex items-center gap-1.5">
						<span
							class="inline-block h-2.5 w-2.5 rounded-full"
							style:background-color={TYPE_COLORS[typeKey]}
						></span>
						{TYPE_LABELS[typeKey]}
					</span>
				{/each}
			</div>
		{/if}

		<div bind:this={chartWrap} class="relative mx-auto w-full max-w-full">
			{#if hoveredDot}
				<div
					class="pointer-events-none absolute z-10 max-w-[14rem] -translate-x-1/2 -translate-y-full rounded-sm border border-line bg-white px-2.5 py-1.5 text-left shadow-md"
					style:left="{tooltipPos.x}px"
					style:top="{tooltipPos.y - 10}px"
					role="tooltip"
				>
					<p class="text-[12px] font-semibold leading-snug text-ink">{hoveredDot.row.name}</p>
					<p class="mt-0.5 text-[11px] text-muted">
						{formatRatio(hoveredDot.ratio)} · {hoveredDot.typeLabel}
					</p>
				</div>
			{/if}

			<svg
				class="mx-auto block w-full"
				viewBox="0 0 {width} {chartH}"
				role="img"
				aria-label={ariaSummary}
				preserveAspectRatio="xMidYMid meet"
			>
				{#each xTicks as tick}
					{@const x = margin.left + xScale(tick)}
					<line x1={x} y1={margin.top} x2={x} y2={margin.top + plotH} stroke="#e5e4e2" stroke-width="1" />
					<text x={x} y={chartH - 18} text-anchor="middle" class="fill-muted text-[10px]">{tick}×</text>
				{/each}

				<line
					x1={margin.left}
					y1={margin.top + plotH}
					x2={margin.left + plotW}
					y2={margin.top + plotH}
					stroke="#b1b4b6"
					stroke-width="1"
				/>

				{#if isLinkedView}
					{#each linkedLines as line (line.row.code)}
						<polyline
							points={line.xs.map((x) => `${x},${line.y}`).join(' ')}
							fill="none"
							stroke="#b1b4b6"
							stroke-width="1"
							stroke-opacity="0.55"
						/>
					{/each}

					{#each linkedDots as dot (`${dot.row.code}-${dot.typeKey}`)}
						{@const isHovered =
							hoveredDot?.row.code === dot.row.code &&
							hoveredDot.typeLabel === TYPE_LABELS[dot.typeKey]}
						<g
							transform="translate({dot.x},{dot.y})"
							class="cursor-pointer"
							style={transitionStyle}
							opacity={isHovered ? 1 : 0.9}
							role="graphics-symbol"
							aria-label="{dot.row.name}, {TYPE_LABELS[dot.typeKey]}, {formatRatio(dot.row[dot.typeKey])}"
							onmouseenter={(e) =>
								setTooltipFromEvent(
									{
										row: dot.row,
										typeLabel: TYPE_LABELS[dot.typeKey],
										ratio: dot.row[dot.typeKey]
									},
									e
								)}
							onmousemove={(e) =>
								setTooltipFromEvent(
									{
										row: dot.row,
										typeLabel: TYPE_LABELS[dot.typeKey],
										ratio: dot.row[dot.typeKey]
									},
									e
								)}
							onmouseleave={clearTooltip}
						>
							<circle r="10" fill="transparent" />
							<circle
								r={isHovered ? 4 : 3.2}
								fill={TYPE_COLORS[dot.typeKey]}
								stroke="#ffffff"
								stroke-width="0.75"
							/>
						</g>
					{/each}
				{:else}
					{#each points as p (p.row.code)}
						{@const isHovered = hoveredDot?.row.code === p.row.code}
						{@const opacity = pointOpacity(p.row)}
						{@const fill = pointFill(p.row)}
						{@const r =
							currentStep >= STEP_FLATS_AFFORDABLE && accessSet.has(p.row.code)
								? 4.8
								: isHovered
									? 5
									: 3.7}
						<g
							transform="translate({p.x},{p.y})"
							class="cursor-pointer"
							style={transitionStyle}
							opacity={isHovered ? 1 : opacity}
							role="graphics-symbol"
							aria-label="{p.row.name}, {formatRatio(p.row[activeMetric])}, {metricLabel}"
							onmouseenter={(e) =>
								setTooltipFromEvent(
									{ row: p.row, typeLabel: metricLabel, ratio: p.row[activeMetric] },
									e
								)}
							onmousemove={(e) =>
								setTooltipFromEvent(
									{ row: p.row, typeLabel: metricLabel, ratio: p.row[activeMetric] },
									e
								)}
							onmouseleave={clearTooltip}
						>
							<circle r="12" fill="transparent" />
							{#if currentStep >= STEP_FLATS_EXPENSIVE_OR_SCARCE && !p.row.hasFlats}
								<rect x="-4.5" y="-4.5" width="9" height="9" fill={fill} />
							{:else}
								<circle
									{r}
									fill={fill}
									stroke="#ffffff"
									stroke-width={currentStep >= STEP_FLATS_AFFORDABLE || isHovered ? 0.75 : 0}
								/>
							{/if}
						</g>
					{/each}

					{#if currentStep === STEP_FLATS_AFFORDABLE}
						{#each accessibleRows as row, i (row.code)}
							{@const point = points.find((p) => p.row.code === row.code)}
							{#if point}
								<text
									x={point.x + 8}
									y={point.y + (i === 0 ? -8 : 12)}
									class="fill-ink text-[10px] font-semibold"
								>
									{row.name}
								</text>
							{/if}
						{/each}
					{/if}

					{#if currentStep === STEP_FLATS_EXPENSIVE_OR_SCARCE}
						{#each expensiveRows as row, i (row.code)}
							{@const point = points.find((p) => p.row.code === row.code)}
							{#if point}
								<text
									x={point.x + 8}
									y={point.y + (i === 0 ? -8 : 12)}
									class="fill-ink text-[10px] font-semibold"
								>
									{row.name}
								</text>
							{/if}
						{/each}
					{/if}
				{/if}
			</svg>
		</div>

		{#if !isLinkedView && currentStep >= SHOW_MISSING_FLAT_BADGE_FROM_STEP}
			<p class="mt-2 text-center text-xs text-muted">
				{missingFlatsCount} MSOAs have limited or missing flat values in this dataset.
			</p>
		{/if}
	</div>
</div>
