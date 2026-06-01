<script lang="ts">
	import { boxStats, formatRatio, jitterOffset, ratioExtent } from '$lib/charts/boxStrip';
	import {
		COASTAL_CHART_FILL,
		INLAND_CHART_FILL,
		SHOW_MEDIANS
	} from '$lib/constants/coastalInlandStory';
	import type { CoastalInlandBundle, CoastalInlandGroup, MsoaCoastalInlandRow } from '$lib/types/coastalInland';
	import { scaleLinear } from 'd3';
	import CoastalInlandMapMini from './CoastalInlandMapMini.svelte';

	type Props = {
		data: CoastalInlandBundle;
		step?: number;
	};

	type RowPoint = {
		row: MsoaCoastalInlandRow;
		cx: number;
		cy: number;
	};

	let { data, step = 0 }: Props = $props();

	let maxStepReached = $state(0);
	let chartWrap = $state<HTMLDivElement | null>(null);
	let hovered = $state<MsoaCoastalInlandRow | null>(null);
	let tooltipPos = $state({ x: 0, y: 0 });

	$effect(() => {
		maxStepReached = Math.max(maxStepReached, step);
	});

	const width = 640;
	const chartH = 268;
	const margin = { top: 44, right: 16, bottom: 32, left: 68 };
	const plotW = width - margin.left - margin.right;
	const coastalMidY = margin.top + 52;
	const inlandMidY = margin.top + 52 + 88;
	const stripHalf = 26;

	let domain = $derived(ratioExtent(data.rows));
	let xScale = $derived(scaleLinear().domain(domain).range([0, plotW]));

	let coastalStats = $derived(boxStats(data.coastal.map((r) => r.ratio)));
	let inlandStats = $derived(boxStats(data.inland.map((r) => r.ratio)));

	let showMedians = $derived(maxStepReached >= SHOW_MEDIANS);

	function summaryFor(group: CoastalInlandGroup) {
		return data.summary.find((s) => s.group === group);
	}

	let coastalMedian = $derived(summaryFor('Coastal')?.median ?? NaN);
	let inlandMedian = $derived(summaryFor('Inland')?.median ?? NaN);

	function rowPoints(rows: MsoaCoastalInlandRow[], midY: number): RowPoint[] {
		const baseX = margin.left;
		return rows.map((row) => ({
			row,
			cx: baseX + xScale(row.ratio),
			cy: midY + jitterOffset(row.code) * stripHalf * 2
		}));
	}

	let coastalPoints = $derived(rowPoints(data.coastal, coastalMidY));
	let inlandPoints = $derived(rowPoints(data.inland, inlandMidY));

	function renderBox(
		stats: ReturnType<typeof boxStats>,
		midY: number
	): { whiskerD: string; boxX: number; boxW: number; boxY: number; boxH: number; medX: number } | null {
		if (!stats) return null;
		const baseX = margin.left;
		const sx = (v: number) => baseX + xScale(v);
		return {
			whiskerD: `M ${sx(stats.min)} ${midY} L ${sx(stats.max)} ${midY}`,
			boxX: sx(stats.q1),
			boxW: Math.max(2, sx(stats.q3) - sx(stats.q1)),
			boxY: midY - 14,
			boxH: 28,
			medX: sx(stats.median)
		};
	}

	let coastalBox = $derived(renderBox(coastalStats, coastalMidY));
	let inlandBox = $derived(renderBox(inlandStats, inlandMidY));

	const ticks = [6, 8, 10, 12, 14, 16, 18];

	let ariaSummary = $derived.by(() => {
		const c = summaryFor('Coastal');
		const i = summaryFor('Inland');
		if (!c || !i) return 'Coastal and inland affordability comparison.';
		return `Coastal MSOAs: median ${formatRatio(c.median)}, ${c.count} areas. Inland MSOAs: median ${formatRatio(i.median)}, ${i.count} areas. Coastal areas span a wide range of affordability ratios.`;
	});

	function setTooltipFromEvent(row: MsoaCoastalInlandRow, e: MouseEvent): void {
		hovered = row;
		if (!chartWrap) return;
		const rect = chartWrap.getBoundingClientRect();
		tooltipPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
	}

	function clearTooltip(): void {
		hovered = null;
	}
</script>

<div class="flex h-full min-h-0 w-full flex-col items-center justify-start px-4 py-6 sm:px-6">
	<div class="w-full max-w-3xl">
		<h3 class="mb-2 text-center text-[20px] font-bold leading-tight text-ink sm:text-[22px]">
			Affordability by coastal and inland classification
		</h3>
		<p class="mb-4 text-center text-sm text-muted">
			Each point is one MSOA. Higher ratios mean less affordable housing.
		</p>

		<div bind:this={chartWrap} class="relative mx-auto w-full max-w-full">
			{#if hovered}
				<div
					class="pointer-events-none absolute z-10 max-w-[14rem] -translate-x-1/2 -translate-y-full rounded-sm border border-line bg-white px-2.5 py-1.5 text-left shadow-md"
					style:left="{tooltipPos.x}px"
					style:top="{tooltipPos.y - 10}px"
					role="tooltip"
				>
					<p class="text-[12px] font-semibold leading-snug text-ink">{hovered.name}</p>
					<p class="mt-0.5 text-[11px] text-muted">
						{formatRatio(hovered.ratio)} · {hovered.group}
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
				{#each ticks as t}
					{@const x = margin.left + xScale(t)}
					{#if t >= domain[0] && t <= domain[1]}
						<line
							x1={x}
							y1={margin.top - 8}
							x2={x}
							y2={inlandMidY + stripHalf + 8}
							stroke="#e5e4e2"
							stroke-width="1"
						/>
						<text x={x} y={chartH - 8} text-anchor="middle" class="fill-muted text-[10px]">{t}×</text>
					{/if}
				{/each}

				<text
					x={margin.left - 8}
					y={coastalMidY + 4}
					text-anchor="end"
					class="fill-ink text-[12px] font-bold"
					style="font-family: inherit"
				>
					Coastal
				</text>
				<text
					x={margin.left - 8}
					y={inlandMidY + 4}
					text-anchor="end"
					class="fill-ink text-[12px] font-bold"
					style="font-family: inherit"
				>
					Inland
				</text>

				{#if coastalBox}
					<path
						d={coastalBox.whiskerD}
						stroke={COASTAL_CHART_FILL}
						stroke-width="1.5"
						fill="none"
						opacity="0.7"
					/>
					<rect
						x={coastalBox.boxX}
						y={coastalBox.boxY}
						width={coastalBox.boxW}
						height={coastalBox.boxH}
						fill={COASTAL_CHART_FILL}
						fill-opacity="0.25"
						stroke={COASTAL_CHART_FILL}
						stroke-width="1.5"
					/>
					<line
						x1={coastalBox.medX}
						y1={coastalBox.boxY}
						x2={coastalBox.medX}
						y2={coastalBox.boxY + coastalBox.boxH}
						stroke={COASTAL_CHART_FILL}
						stroke-width="2"
					/>
				{/if}

				{#if inlandBox}
					<path
						d={inlandBox.whiskerD}
						stroke={INLAND_CHART_FILL}
						stroke-width="1.5"
						fill="none"
						opacity="0.7"
					/>
					<rect
						x={inlandBox.boxX}
						y={inlandBox.boxY}
						width={inlandBox.boxW}
						height={inlandBox.boxH}
						fill={INLAND_CHART_FILL}
						fill-opacity="0.25"
						stroke={INLAND_CHART_FILL}
						stroke-width="1.5"
					/>
					<line
						x1={inlandBox.medX}
						y1={inlandBox.boxY}
						x2={inlandBox.medX}
						y2={inlandBox.boxY + inlandBox.boxH}
						stroke={INLAND_CHART_FILL}
						stroke-width="2"
					/>
				{/if}

				{#each inlandPoints as p (p.row.code)}
					<g
						class="cursor-pointer"
						role="graphics-symbol"
						aria-label="{p.row.name}, {formatRatio(p.row.ratio)}"
						onmouseenter={(e) => setTooltipFromEvent(p.row, e)}
						onmousemove={(e) => setTooltipFromEvent(p.row, e)}
						onmouseleave={clearTooltip}
					>
						<circle cx={p.cx} cy={p.cy} r="10" fill="transparent" />
						<circle
							cx={p.cx}
							cy={p.cy}
							r={hovered?.code === p.row.code ? 5.5 : 4}
							fill={INLAND_CHART_FILL}
							fill-opacity={hovered?.code === p.row.code ? 1 : 0.85}
							stroke="#fff"
							stroke-width="0.75"
						/>
					</g>
				{/each}

				{#each coastalPoints as p (p.row.code)}
					<g
						class="cursor-pointer"
						role="graphics-symbol"
						aria-label="{p.row.name}, {formatRatio(p.row.ratio)}"
						onmouseenter={(e) => setTooltipFromEvent(p.row, e)}
						onmousemove={(e) => setTooltipFromEvent(p.row, e)}
						onmouseleave={clearTooltip}
					>
						<circle cx={p.cx} cy={p.cy} r="10" fill="transparent" />
						<circle
							cx={p.cx}
							cy={p.cy}
							r={hovered?.code === p.row.code ? 5.5 : 4}
							fill={COASTAL_CHART_FILL}
							fill-opacity={hovered?.code === p.row.code ? 1 : 0.85}
							stroke="#fff"
							stroke-width="0.75"
						/>
					</g>
				{/each}

				{#if showMedians && coastalBox && Number.isFinite(coastalMedian)}
					<line
						x1={coastalBox.medX}
						y1={margin.top - 6}
						x2={coastalBox.medX}
						y2={coastalMidY + stripHalf + 6}
						stroke="#0b0c0c"
						stroke-width="1.5"
						stroke-dasharray="4 3"
						opacity={step >= SHOW_MEDIANS ? 1 : 0.5}
					/>
					<text
						x={coastalBox.medX}
						y={margin.top - 10}
						text-anchor="middle"
						class="fill-ink text-[10px] font-semibold"
					>
						Coastal median {formatRatio(coastalMedian)}
					</text>
				{/if}

				{#if showMedians && inlandBox && Number.isFinite(inlandMedian)}
					<line
						x1={inlandBox.medX}
						y1={inlandMidY - stripHalf - 6}
						x2={inlandBox.medX}
						y2={inlandMidY + stripHalf + 14}
						stroke="#0b0c0c"
						stroke-width="1.5"
						stroke-dasharray="4 3"
						opacity={step >= SHOW_MEDIANS ? 1 : 0.5}
					/>
					<text
						x={inlandBox.medX}
						y={inlandMidY + stripHalf + 26}
						text-anchor="middle"
						class="fill-ink text-[10px] font-semibold"
					>
						Inland median {formatRatio(inlandMedian)}
					</text>
				{/if}
			</svg>
		</div>

		<div class="mt-4">
			<p class="mb-2 text-center text-xs text-muted">
				Coastal MSOAs based on Dorset coastal neighbourhood list
			</p>
			<CoastalInlandMapMini classificationByMsoa={data.classificationByMsoa} {step} />
		</div>
	</div>
</div>
