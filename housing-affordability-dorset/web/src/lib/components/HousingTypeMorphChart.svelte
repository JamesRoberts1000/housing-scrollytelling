<script lang="ts">
	import { browser } from '$app/environment';
	import {
		FLAT_ACCESS_CODES,
		FLAT_EXPENSIVE_CODES,
		HIGHLIGHT_POINT_FILL,
		MUTED_POINT_FILL,
		POINT_FILL,
		SHOW_MISSING_FLAT_BADGE_FROM_STEP,
		STEP_DETACHED,
		STEP_FLATS,
		STEP_FLATS_AFFORDABLE,
		STEP_FLATS_EXPENSIVE_OR_SCARCE,
		STEP_OVERALL,
		STEP_SEMI_DETACHED,
		STEP_TERRACED
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

	let { data, step = 0 }: Props = $props();
	let currentStep = $derived(Number(step));

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

	const activeMetric = $derived.by((): HousingTypeKey => {
		if (currentStep <= STEP_OVERALL) return 'overall';
		if (currentStep === STEP_DETACHED) return 'detached';
		if (currentStep === STEP_SEMI_DETACHED) return 'semiDetached';
		if (currentStep === STEP_TERRACED) return 'terraced';
		if (currentStep >= STEP_FLATS) return 'flats';
		return 'overall';
	});

	const metricLabel = $derived.by((): string => {
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

	const globalMinMax = $derived.by((): [number, number] => {
		const values = data.rows.flatMap((r) =>
			[r.overall, r.detached, r.semiDetached, r.terraced, r.flats].filter(
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
		const n = Math.max(1, rankedRows.length - 1);
		return plotH / n;
	});

	const points = $derived.by(() =>
		rankedRows.map((row, i) => ({
			row,
			x: margin.left + xScale(row[activeMetric]),
			y: margin.top + i * rowGap
		}))
	);

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

	function pointFill(row: HousingTypeAffordabilityRow): string {
		if (currentStep === STEP_FLATS_AFFORDABLE && accessSet.has(row.code)) return HIGHLIGHT_POINT_FILL;
		if (currentStep === STEP_FLATS_EXPENSIVE_OR_SCARCE && !row.hasFlats) return MUTED_POINT_FILL;
		if (
			currentStep === STEP_FLATS_EXPENSIVE_OR_SCARCE &&
			expensiveSet.has(row.code)
		) {
			return HIGHLIGHT_POINT_FILL;
		}
		return POINT_FILL;
	}
</script>

<div class="flex h-full min-h-0 w-full flex-col items-center justify-start px-4 py-6 sm:px-6">
	<div class="w-full max-w-4xl">
		<h3 class="mb-2 text-center text-[20px] font-bold leading-tight text-ink sm:text-[22px]">
			Affordability by housing type
		</h3>
		<p class="mb-4 text-center text-sm text-muted">
			Now showing: <span class="font-semibold text-ink">{metricLabel}</span>
		</p>

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

			{#each points as p (p.row.code)}
				<g
					transform="translate({p.x},{p.y})"
					style="transition: transform {reducedMotion ? '0.01ms' : '450ms'} ease, opacity {reducedMotion ? '0.01ms' : '300ms'} ease;"
					opacity={pointOpacity(p.row)}
				>
					{#if currentStep >= STEP_FLATS_EXPENSIVE_OR_SCARCE && !p.row.hasFlats}
						<rect x="-4.5" y="-4.5" width="9" height="9" fill={pointFill(p.row)} />
					{:else}
						<circle
							r={currentStep >= STEP_FLATS_AFFORDABLE && accessSet.has(p.row.code) ? 4.8 : 3.7}
							fill={pointFill(p.row)}
							stroke="#ffffff"
							stroke-width={currentStep >= STEP_FLATS_AFFORDABLE ? 0.6 : 0}
						/>
					{/if}
				</g>
			{/each}

			{#if currentStep === STEP_FLATS_AFFORDABLE}
				{#each accessibleRows as row, i (row.code)}
					{@const point = points.find((p) => p.row.code === row.code)}
					{#if point}
						<text x={point.x + 8} y={point.y + (i === 0 ? -8 : 12)} class="fill-ink text-[10px] font-semibold">
							{row.name}
						</text>
					{/if}
				{/each}
			{/if}

			{#if currentStep === STEP_FLATS_EXPENSIVE_OR_SCARCE}
				{#each expensiveRows as row, i (row.code)}
					{@const point = points.find((p) => p.row.code === row.code)}
					{#if point}
						<text x={point.x + 8} y={point.y + (i === 0 ? -8 : 12)} class="fill-ink text-[10px] font-semibold">
							{row.name}
						</text>
					{/if}
				{/each}
			{/if}
		</svg>

		{#if currentStep >= SHOW_MISSING_FLAT_BADGE_FROM_STEP}
			<p class="mt-2 text-center text-xs text-muted">
				{missingFlatsCount} MSOAs have limited or missing flat values in this dataset.
			</p>
		{/if}
	</div>
</div>
