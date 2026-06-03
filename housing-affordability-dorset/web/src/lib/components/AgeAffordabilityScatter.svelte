<script lang="ts">
	import { browser } from '$app/environment';
	import { formatPercent, formatRatio, ratioExtent } from '$lib/charts/boxStrip';
	import { linearRegression, regressionLine } from '$lib/charts/regression';
	import {
		DORSET_AVERAGE_STROKE,
		HIGHLIGHT_POINT_FILL,
		OLDER_HIGH_RATIO_CODES,
		POINT_FILL,
		RATIO_BELOW_AFFORDABLE_THRESHOLD,
		SHOW_BELOW_EIGHT_YOUNGER,
		SHOW_OLDER_HIGH_RATIO,
		SHOW_TRENDLINE,
		SHOW_YOUNGER_AFFORDABLE,
		TRENDLINE_STROKE,
		YOUNGER_AFFORDABLE_CODES
	} from '$lib/constants/ageAffordabilityStory';
	import type { AgeAffordabilityBundle, MsoaAgeAffordabilityRow } from '$lib/types/ageAffordability';
	import { allocateChartHeight } from '$lib/utils/stackedGraphicLayout';
	import { scaleLinear } from 'd3';

	type Props = {
		data: AgeAffordabilityBundle;
		step?: number;
	};

	type PlotPoint = {
		row: MsoaAgeAffordabilityRow;
		cx: number;
		cy: number;
	};

	let { data, step = 0 }: Props = $props();

	let currentStep = $derived(Number(step));
	let maxStepReached = $state(0);
	let graphicRoot = $state<HTMLDivElement | null>(null);
	let chartWrap = $state<HTMLDivElement | null>(null);
	let hovered = $state<MsoaAgeAffordabilityRow | null>(null);
	let tooltipPos = $state({ x: 0, y: 0 });
	let layoutSize = $state({ w: 640, h: 560 });

	$effect(() => {
		maxStepReached = Math.max(maxStepReached, currentStep);
	});

	$effect(() => {
		if (!graphicRoot || !browser) return;
		const ro = new ResizeObserver(([entry]) => {
			const { width: w, height: h } = entry.contentRect;
			if (w > 0 && h > 0) layoutSize = { w, h };
		});
		ro.observe(graphicRoot);
		return () => ro.disconnect();
	});

	const margin = { top: 36, right: 20, bottom: 48, left: 52 };
	let width = $derived(Math.max(640, Math.round(layoutSize.w)));
	let chartH = $derived(allocateChartHeight(layoutSize.h));
	let plotW = $derived(width - margin.left - margin.right);
	let plotH = $derived(chartH - margin.top - margin.bottom);

	const olderSet = new Set<string>(OLDER_HIGH_RATIO_CODES);
	const youngerSet = new Set<string>(YOUNGER_AFFORDABLE_CODES);

	const xDomain = $derived.by((): [number, number] => {
		const vals = data.rows.map((r) => r.pct65Plus);
		if (!vals.length) return [0, 100];
		let lo = Math.min(...vals);
		let hi = Math.max(...vals);
		const pad = (hi - lo) * 0.08 || 2;
		return [lo - pad, hi + pad];
	});

	const yDomain = $derived(ratioExtent(data.rows));

	const xScale = $derived(scaleLinear().domain(xDomain).range([0, plotW]));
	const yScale = $derived(scaleLinear().domain(yDomain).range([plotH, 0]));

	const points = $derived(
		data.rows.map((row) => ({
			row,
			cx: margin.left + xScale(row.pct65Plus),
			cy: margin.top + yScale(row.ratio)
		}))
	);

	const regression = $derived(
		linearRegression(data.rows.map((r) => ({ x: r.pct65Plus, y: r.ratio })))
	);

	const trendSegment = $derived.by(() => {
		if (!regression) return null;
		return regressionLine(regression, xDomain[0], xDomain[1]);
	});

	const showTrendline = $derived(maxStepReached >= SHOW_TRENDLINE);
	const showDorsetAverage = $derived(maxStepReached >= SHOW_TRENDLINE);
	const dorsetPct65 = $derived(data.summary.dorsetPct65Plus);
	const dorsetAverageX = $derived(
		Number.isFinite(dorsetPct65) ? margin.left + xScale(dorsetPct65) : NaN
	);

	const belowEightYoungerCodes = $derived.by(() => {
		const avg = data.summary.dorsetPct65Plus;
		if (!Number.isFinite(avg)) return new Set<string>();
		return new Set(
			data.rows
				.filter((r) => r.ratio < RATIO_BELOW_AFFORDABLE_THRESHOLD && r.pct65Plus < avg)
				.map((r) => r.code)
		);
	});

	const emphasisActive = $derived(
		currentStep >= SHOW_OLDER_HIGH_RATIO && currentStep <= SHOW_BELOW_EIGHT_YOUNGER
	);

	const highlightCodes = $derived.by((): Set<string> => {
		if (!emphasisActive) return new Set();
		if (currentStep === SHOW_OLDER_HIGH_RATIO) return olderSet;
		if (currentStep === SHOW_YOUNGER_AFFORDABLE) return youngerSet;
		if (currentStep === SHOW_BELOW_EIGHT_YOUNGER) return belowEightYoungerCodes;
		return new Set();
	});

	const xTicks = [20, 25, 30, 35, 40];
	const yTicks = [6, 8, 10, 12, 14, 16, 18];

	const ariaSummary = $derived.by(() => {
		const s = data.summary;
		const r = Number.isFinite(s.correlation) ? s.correlation.toFixed(2) : 'unknown';
		return (
			`Scatter plot of ${s.count} Dorset MSOAs. ` +
			`Share aged 65 and over ranges from ${formatPercent(s.pct65Min)} to ${formatPercent(s.pct65Max)}. ` +
			`Affordability ratios range from ${formatRatio(s.ratioMin)} to ${formatRatio(s.ratioMax)}. ` +
			`There is a moderate positive association (correlation about ${r}). ` +
			`Dorset average share aged 65 and over is about ${formatPercent(s.dorsetPct65Plus, 1)}. ` +
			`This shows association only, not causation.`
		);
	});

	function setTooltipFromEvent(row: MsoaAgeAffordabilityRow, e: MouseEvent): void {
		hovered = row;
		if (!chartWrap) return;
		const rect = chartWrap.getBoundingClientRect();
		tooltipPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
	}

	function clearTooltip(): void {
		hovered = null;
	}
</script>

<div bind:this={graphicRoot} class="flex h-full min-h-0 w-full flex-col px-4 py-4 sm:px-6 sm:py-5">
	<div class="mx-auto w-full max-w-3xl shrink-0">
		<h3 class="mb-2 text-center text-[20px] font-bold leading-tight text-ink sm:text-[22px]">
			Affordability ratio and share of population aged 65+
		</h3>
		<p class="mb-3 text-center text-sm text-muted">
			Each point is one MSOA. Higher on the chart means less affordable housing.
		</p>
	</div>

	<div
		bind:this={chartWrap}
		class="relative mx-auto w-full max-w-3xl shrink-0"
		style:height="{chartH}px"
	>
			{#if hovered}
				<div
					class="pointer-events-none absolute z-10 max-w-[14rem] -translate-x-1/2 -translate-y-full rounded-sm border border-line bg-white px-2.5 py-1.5 text-left shadow-md"
					style:left="{tooltipPos.x}px"
					style:top="{tooltipPos.y - 10}px"
					role="tooltip"
				>
					<p class="text-[14px] font-semibold leading-snug text-ink">{hovered.name}</p>
					<p class="mt-0.5 text-[14px] text-muted">
						{formatPercent(hovered.pct65Plus, 1)} aged 65+ · {formatRatio(hovered.ratio)}
					</p>
				</div>
			{/if}

			<svg
				class="mx-auto block h-full w-full"
				viewBox="0 0 {width} {chartH}"
				role="img"
				aria-label={ariaSummary}
				preserveAspectRatio="xMidYMid meet"
			>
				{#each xTicks as t}
					{@const x = margin.left + xScale(t)}
					{#if t >= xDomain[0] && t <= xDomain[1]}
						<line
							x1={x}
							y1={margin.top}
							x2={x}
							y2={margin.top + plotH}
							stroke="#e5e4e2"
							stroke-width="1"
						/>
						<text
							x={x}
							y={chartH - 28}
							text-anchor="middle"
							class="fill-muted text-[13px]"
						>
							{t}%
						</text>
					{/if}
				{/each}

				{#each yTicks as t}
					{@const y = margin.top + yScale(t)}
					{#if t >= yDomain[0] && t <= yDomain[1]}
						<line
							x1={margin.left}
							y1={y}
							x2={margin.left + plotW}
							y2={y}
							stroke="#e5e4e2"
							stroke-width="1"
						/>
						<text
							x={margin.left - 8}
							y={y + 3}
							text-anchor="end"
							class="fill-muted text-[13px]"
						>
							{t}×
						</text>
					{/if}
				{/each}

				{#if showDorsetAverage && Number.isFinite(dorsetAverageX)}
					<line
						x1={dorsetAverageX}
						y1={margin.top}
						x2={dorsetAverageX}
						y2={margin.top + plotH}
						stroke={DORSET_AVERAGE_STROKE}
						stroke-width="1.5"
						stroke-dasharray="4 3"
						opacity={currentStep >= SHOW_TRENDLINE ? 0.85 : 0}
					/>
					<text
						x={dorsetAverageX}
						y={margin.top - 6}
						text-anchor="middle"
						class="fill-ink text-[13px] font-semibold"
					>
						Dorset average {formatPercent(dorsetPct65, 1)}
					</text>
				{/if}

				{#if showTrendline && trendSegment}
					<line
						x1={margin.left + xScale(trendSegment.x1)}
						y1={margin.top + yScale(trendSegment.y1)}
						x2={margin.left + xScale(trendSegment.x2)}
						y2={margin.top + yScale(trendSegment.y2)}
						stroke={TRENDLINE_STROKE}
						stroke-width="1.5"
						stroke-dasharray="6 4"
						opacity={currentStep >= SHOW_TRENDLINE ? 0.9 : 0.4}
					/>
				{/if}

				{#each points as p (p.row.code)}
					{@const highlighted = emphasisActive && highlightCodes.has(p.row.code)}
					{@const isHovered = hovered?.code === p.row.code}
					{@const fill = highlighted ? HIGHLIGHT_POINT_FILL : POINT_FILL}
					{@const opacity = emphasisActive ? (highlighted ? 1 : 0.2) : isHovered ? 1 : 0.85}
					{@const r = highlighted ? 6 : isHovered ? 5.5 : 4.5}
					<g
						class="cursor-pointer"
						role="graphics-symbol"
						aria-label="{p.row.name}, {formatPercent(p.row.pct65Plus, 1)} aged 65+, {formatRatio(p.row.ratio)}"
						onmouseenter={(e) => setTooltipFromEvent(p.row, e)}
						onmousemove={(e) => setTooltipFromEvent(p.row, e)}
						onmouseleave={clearTooltip}
					>
						<circle cx={p.cx} cy={p.cy} r="12" fill="transparent" />
						<circle
							cx={p.cx}
							cy={p.cy}
							{r}
							{fill}
							fill-opacity={opacity}
							stroke="#fff"
							stroke-width={highlighted ? 1.25 : 0.75}
						/>
					</g>
				{/each}

				<text
					x={margin.left + plotW / 2}
					y={chartH - 8}
					text-anchor="middle"
					class="fill-ink text-[14px] font-semibold"
					style="font-family: inherit"
				>
					% of population aged 65 and over
				</text>
				<text
					x={14}
					y={margin.top + plotH / 2}
					text-anchor="middle"
					transform="rotate(-90 14 {margin.top + plotH / 2})"
					class="fill-ink text-[14px] font-semibold"
					style="font-family: inherit"
				>
					Affordability ratio
				</text>
			</svg>
	</div>

	<p class="mx-auto mt-2 w-full max-w-3xl shrink-0 text-center text-sm text-muted">
		Population aged 65+, MSOA estimates (2021-based), Office for National Statistics
	</p>
</div>
