<script lang="ts">
	import { browser } from '$app/environment';
	import { boxStats, formatRatio, jitterOffset, ratioExtent } from '$lib/charts/boxStrip';
	import {
		HIGHLIGHT_POINT_FILL,
		RURAL_CHART_FILL,
		SHOW_RURAL_ABOVE_URBAN,
		SHOW_RURAL_MEDIAN,
		SHOW_URBAN_MEDIAN,
		URBAN_CHART_FILL
	} from '$lib/constants/ruralUrbanStory';
	import { ruralOutliersAboveUrban } from '$lib/data/loadRuralUrbanData';
	import type { GroupSummary, MsoaRuralUrbanRow, RuralUrbanBundle } from '$lib/types/ruralUrban';
	import { allocateChartAndMapHeights } from '$lib/utils/stackedGraphicLayout';
	import { scaleLinear } from 'd3';
	import RuralUrbanMapMini from './RuralUrbanMapMini.svelte';

	type Props = {
		data: RuralUrbanBundle;
		step?: number;
	};

	type PanelPoint = {
		row: MsoaRuralUrbanRow;
		cx: number;
		cy: number;
	};

	type CalloutPlacement = 'above' | 'below';

	type CalloutLayout = {
		point: PanelPoint;
		labelX: number;
		labelY: number;
		labelW: number;
		labelH: number;
		placement: CalloutPlacement;
	};

	const CALLOUT_LABEL_H = 26;
	const CALLOUT_PAD = 10;

	let { data, step = 0 }: Props = $props();

	let maxStepReached = $state(0);
	let graphicRoot = $state<HTMLDivElement | null>(null);
	let chartWrap = $state<HTMLDivElement | null>(null);
	let hovered = $state<MsoaRuralUrbanRow | null>(null);
	let tooltipPos = $state({ x: 0, y: 0 });
	let layoutSize = $state({ w: 640, h: 560 });

	$effect(() => {
		maxStepReached = Math.max(maxStepReached, step);
	});

	$effect(() => {
		if (step === SHOW_RURAL_ABOVE_URBAN) hovered = null;
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

	const titleY = 14;
	const margin = { top: 52, right: 12, bottom: 32, left: 12 };
	const panelGap = 24;
	let width = $derived(Math.max(640, Math.round(layoutSize.w)));
	let layoutHeights = $derived(allocateChartAndMapHeights(layoutSize.h));
	let chartH = $derived(layoutHeights.chartH);
	let mapBlockH = $derived(layoutHeights.mapBlockH);
	let panelW = $derived(
		Math.max(220, Math.floor((width - margin.left - margin.right - panelGap) / 2))
	);
	let innerH = $derived(chartH - margin.top - margin.bottom);
	let ruralCenterX = $derived(margin.left + panelW / 2);
	let urbanCenterX = $derived(margin.left + panelW + panelGap + panelW / 2);
	let stripHalf = $derived(Math.min(36, Math.max(20, Math.round(innerH * 0.18))));

	function summaryFor(group: 'Rural' | 'Urban'): GroupSummary | undefined {
		return data.summary.find((s) => s.group === group);
	}

	let domain = $derived(ratioExtent(data.rows));
	let xScale = $derived(scaleLinear().domain(domain).range([0, panelW - 24]));

	let ruralStats = $derived(boxStats(data.rural.map((r) => r.ratio)));
	let urbanStats = $derived(boxStats(data.urban.map((r) => r.ratio)));

	let outlierRows = $derived(ruralOutliersAboveUrban(data.rows));
	let outlierCodes = $derived(new Set(outlierRows.map((r) => r.code)));

	let showOutlierCallouts = $derived(step === SHOW_RURAL_ABOVE_URBAN);

	function panelPoints(rows: MsoaRuralUrbanRow[], centerX: number): PanelPoint[] {
		const base = centerX - panelW / 2 + 12;
		return rows.map((row) => ({
			row,
			cx: base + xScale(row.ratio),
			cy: margin.top + innerH / 2 + jitterOffset(row.code) * stripHalf * 2
		}));
	}

	let ruralPoints = $derived(panelPoints(data.rural, ruralCenterX));
	let urbanPoints = $derived(panelPoints(data.urban, urbanCenterX));

	function showRuralMedian(): boolean {
		return maxStepReached >= SHOW_RURAL_MEDIAN;
	}
	function showUrbanMedian(): boolean {
		return maxStepReached >= SHOW_URBAN_MEDIAN;
	}

	let ruralMedian = $derived(summaryFor('Rural')?.median ?? NaN);
	let urbanMedian = $derived(summaryFor('Urban')?.median ?? NaN);

	let ariaSummary = $derived.by(() => {
		const r = summaryFor('Rural');
		const u = summaryFor('Urban');
		if (!r || !u) return 'Rural and urban affordability comparison.';
		return `Rural MSOAs: median ${formatRatio(r.median)}, ${r.count} areas. Urban MSOAs: median ${formatRatio(u.median)}, ${u.count} areas. Rural areas are less affordable on average.`;
	});

	function renderBox(
		stats: ReturnType<typeof boxStats>,
		centerX: number
	): { whiskerD: string; boxX: number; boxW: number; boxY: number; boxH: number; medX: number } | null {
		if (!stats) return null;
		const base = centerX - panelW / 2 + 12;
		const sx = (v: number) => base + xScale(v);
		const midY = margin.top + innerH / 2;
		return {
			whiskerD: `M ${sx(stats.min)} ${midY} L ${sx(stats.max)} ${midY}`,
			boxX: sx(stats.q1),
			boxW: Math.max(2, sx(stats.q3) - sx(stats.q1)),
			boxY: midY - 14,
			boxH: 28,
			medX: sx(stats.median)
		};
	}

	let ruralBox = $derived(renderBox(ruralStats, ruralCenterX));
	let urbanBox = $derived(renderBox(urbanStats, urbanCenterX));

	const ticks = [6, 8, 10, 12, 14, 16, 18];

	function calloutLabelWidth(name: string): number {
		const base = Math.max(90, Math.ceil(name.length * 6.3) + 18);
		if (name.startsWith('Lyme Regis')) return 320;
		if (name.includes('Sturminster')) return Math.max(base + 28, Math.ceil(name.length * 7.2) + 26);
		return base;
	}

	function clampLabelX(cx: number, labelW: number): number {
		const half = labelW / 2;
		const leftBound = margin.left + half + 4;
		const rightBound = ruralCenterX + panelW / 2 - 12 - half;
		return Math.min(rightBound, Math.max(leftBound, cx));
	}

	function boxesOverlap(a: CalloutLayout, b: CalloutLayout): boolean {
		const aL = a.labelX - a.labelW / 2;
		const aR = a.labelX + a.labelW / 2;
		const bL = b.labelX - b.labelW / 2;
		const bR = b.labelX + b.labelW / 2;
		const xOverlap = aR + CALLOUT_PAD > bL && bR + CALLOUT_PAD > aL;
		const yOverlap =
			a.labelY + a.labelH + CALLOUT_PAD > b.labelY &&
			b.labelY + b.labelH + CALLOUT_PAD > a.labelY;
		return xOverlap && yOverlap;
	}

	function layoutOutlierCallouts(pts: PanelPoint[]): CalloutLayout[] {
		const sorted = [...pts].sort((a, b) => a.cx - b.cx);
		if (sorted.length < 3) {
			return sorted.map((point, i) => {
				const labelW = calloutLabelWidth(point.row.name);
				return {
					point,
					labelW,
					labelH: CALLOUT_LABEL_H,
					labelX: clampLabelX(point.cx, labelW),
					labelY: point.cy - 48 - i * 34,
					placement: 'above' as CalloutPlacement
				};
			});
		}

		const [lyme, sturminster, stLeonards] = sorted;
		const plotBottom = margin.top + innerH;
		const lowerRow2 = plotBottom - CALLOUT_LABEL_H - 10;

		const lymeAbove: CalloutLayout = {
			point: lyme,
			placement: 'above',
			labelW: calloutLabelWidth(lyme.row.name),
			labelH: CALLOUT_LABEL_H,
			labelX: clampLabelX(lyme.cx, calloutLabelWidth(lyme.row.name)),
			labelY: lyme.cy - 52
		};

		const stLeonardsAbove: CalloutLayout = {
			point: stLeonards,
			placement: 'above',
			labelW: calloutLabelWidth(stLeonards.row.name),
			labelH: CALLOUT_LABEL_H,
			labelX: clampLabelX(stLeonards.cx, calloutLabelWidth(stLeonards.row.name)),
			labelY: stLeonards.cy - CALLOUT_LABEL_H - 24
		};

		const sturminsterBelow: CalloutLayout = {
			point: sturminster,
			placement: 'below',
			labelW: calloutLabelWidth(sturminster.row.name),
			labelH: CALLOUT_LABEL_H,
			labelX: clampLabelX(sturminster.cx, calloutLabelWidth(sturminster.row.name)),
			labelY: lowerRow2
		};

		if (boxesOverlap(lymeAbove, stLeonardsAbove)) {
			lymeAbove.labelY = Math.min(lymeAbove.labelY, stLeonardsAbove.labelY - CALLOUT_LABEL_H - CALLOUT_PAD);
		}

		if (boxesOverlap(stLeonardsAbove, sturminsterBelow)) {
			stLeonardsAbove.labelY = Math.min(stLeonardsAbove.labelY, margin.top + 6);
		}

		return [sturminsterBelow, lymeAbove, stLeonardsAbove];
	}

	let outlierCallouts = $derived(
		layoutOutlierCallouts(ruralPoints.filter((p) => outlierCodes.has(p.row.code)))
	);

	function isOutlier(code: string): boolean {
		return outlierCodes.has(code);
	}

	function ruralPointFill(p: PanelPoint): string {
		if (showOutlierCallouts && isOutlier(p.row.code)) return HIGHLIGHT_POINT_FILL;
		return RURAL_CHART_FILL;
	}

	function setTooltipFromEvent(row: MsoaRuralUrbanRow, e: MouseEvent): void {
		if (showOutlierCallouts) return;
		hovered = row;
		if (!chartWrap) return;
		const rect = chartWrap.getBoundingClientRect();
		tooltipPos = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};
	}

	function clearTooltip(): void {
		if (showOutlierCallouts) return;
		hovered = null;
	}
</script>

<div bind:this={graphicRoot} class="flex h-full min-h-0 w-full flex-col px-4 py-4 sm:px-6 sm:py-5">
	<div class="mx-auto w-full max-w-3xl shrink-0">
		<h3 class="mb-2 text-center text-[20px] font-bold leading-tight text-ink sm:text-[22px]">
			Affordability by rural and urban classification
		</h3>
		<p class="mb-3 text-center text-sm text-muted">
			Each point is one MSOA. Higher ratios mean less affordable housing.
		</p>
	</div>

	<div class="mx-auto flex w-full max-w-3xl flex-col gap-3">
		<div bind:this={chartWrap} class="relative shrink-0" style:height="{chartH}px">
			{#if hovered && !showOutlierCallouts}
				<div
					class="pointer-events-none absolute z-10 max-w-[14rem] -translate-x-1/2 -translate-y-full rounded-sm border border-line bg-white px-2.5 py-1.5 text-left shadow-md"
					style:left="{tooltipPos.x}px"
					style:top="{tooltipPos.y - 10}px"
					role="tooltip"
				>
					<p class="text-[14px] font-semibold leading-snug text-ink">{hovered.name}</p>
					<p class="mt-0.5 text-[13px] text-muted">
						{formatRatio(hovered.ratio)} · {hovered.group}
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
				<text
					x={ruralCenterX}
					y={titleY}
					text-anchor="middle"
					class="fill-ink text-[18px] font-bold"
					style="font-family: inherit"
				>
					Rural
				</text>
				<text
					x={urbanCenterX}
					y={titleY}
					text-anchor="middle"
					class="fill-ink text-[18px] font-bold"
					style="font-family: inherit"
				>
					Urban
				</text>

				{#each ticks as t}
					{@const x = ruralCenterX - panelW / 2 + 12 + xScale(t)}
					{#if t >= domain[0] && t <= domain[1]}
						<line
							x1={x}
							y1={margin.top}
							x2={x}
							y2={margin.top + innerH}
							stroke="#e5e4e2"
							stroke-width="1"
						/>
						<text x={x} y={chartH - 8} text-anchor="middle" class="fill-muted text-[13px]">{t}×</text>
					{/if}
				{/each}

				{#each ticks as t}
					{@const x = urbanCenterX - panelW / 2 + 12 + xScale(t)}
					{#if t >= domain[0] && t <= domain[1]}
						<line
							x1={x}
							y1={margin.top}
							x2={x}
							y2={margin.top + innerH}
							stroke="#e5e4e2"
							stroke-width="1"
						/>
						<text x={x} y={chartH - 8} text-anchor="middle" class="fill-muted text-[13px]">{t}×</text>
					{/if}
				{/each}

				{#if ruralBox}
					<path d={ruralBox.whiskerD} stroke={RURAL_CHART_FILL} stroke-width="1.5" fill="none" opacity="0.7" />
					<rect
						x={ruralBox.boxX}
						y={ruralBox.boxY}
						width={ruralBox.boxW}
						height={ruralBox.boxH}
						fill={RURAL_CHART_FILL}
						fill-opacity="0.25"
						stroke={RURAL_CHART_FILL}
						stroke-width="1.5"
					/>
					<line
						x1={ruralBox.medX}
						y1={ruralBox.boxY}
						x2={ruralBox.medX}
						y2={ruralBox.boxY + ruralBox.boxH}
						stroke={RURAL_CHART_FILL}
						stroke-width="2"
					/>
				{/if}

				{#if urbanBox}
					<path d={urbanBox.whiskerD} stroke={URBAN_CHART_FILL} stroke-width="1.5" fill="none" opacity="0.7" />
					<rect
						x={urbanBox.boxX}
						y={urbanBox.boxY}
						width={urbanBox.boxW}
						height={urbanBox.boxH}
						fill={URBAN_CHART_FILL}
						fill-opacity="0.25"
						stroke={URBAN_CHART_FILL}
						stroke-width="1.5"
					/>
					<line
						x1={urbanBox.medX}
						y1={urbanBox.boxY}
						x2={urbanBox.medX}
						y2={urbanBox.boxY + urbanBox.boxH}
						stroke={URBAN_CHART_FILL}
						stroke-width="2"
					/>
				{/if}

				{#each ruralPoints as p (p.row.code)}
					{@const highlighted = showOutlierCallouts && isOutlier(p.row.code)}
					<g
						class={showOutlierCallouts ? '' : 'cursor-pointer'}
						role="graphics-symbol"
						aria-label="{p.row.name}, {formatRatio(p.row.ratio)}"
						onmouseenter={(e) => setTooltipFromEvent(p.row, e)}
						onmousemove={(e) => setTooltipFromEvent(p.row, e)}
						onmouseleave={clearTooltip}
					>
						{#if !showOutlierCallouts}
							<circle cx={p.cx} cy={p.cy} r="10" fill="transparent" />
						{/if}
						<circle
							cx={p.cx}
							cy={p.cy}
							r={highlighted || hovered?.code === p.row.code ? 5.5 : 4}
							fill={ruralPointFill(p)}
							fill-opacity={highlighted ? 1 : hovered?.code === p.row.code ? 1 : 0.85}
							stroke="#fff"
							stroke-width="0.75"
							pointer-events={showOutlierCallouts ? 'none' : 'none'}
						/>
					</g>
				{/each}

				{#each urbanPoints as p (p.row.code)}
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
							fill={URBAN_CHART_FILL}
							fill-opacity={hovered?.code === p.row.code ? 1 : 0.85}
							stroke="#fff"
							stroke-width="0.75"
							pointer-events="none"
						/>
					</g>
				{/each}

				{#if showRuralMedian() && ruralBox && Number.isFinite(ruralMedian)}
					<line
						x1={ruralBox.medX}
						y1={margin.top - 4}
						x2={ruralBox.medX}
						y2={margin.top + innerH + 4}
						stroke="#0b0c0c"
						stroke-width="1.5"
						stroke-dasharray="4 3"
						opacity={step >= SHOW_RURAL_MEDIAN ? 1 : 0.5}
					/>
					<text
						x={ruralBox.medX}
						y={margin.top - 8}
						text-anchor="middle"
						class="fill-ink text-[14px] font-semibold"
					>
						Median {formatRatio(ruralMedian)}
					</text>
				{/if}

				{#if showUrbanMedian() && urbanBox && Number.isFinite(urbanMedian)}
					<line
						x1={urbanBox.medX}
						y1={margin.top - 4}
						x2={urbanBox.medX}
						y2={margin.top + innerH + 4}
						stroke="#0b0c0c"
						stroke-width="1.5"
						stroke-dasharray="4 3"
						opacity={step >= SHOW_URBAN_MEDIAN ? 1 : 0.5}
					/>
					<text
						x={urbanBox.medX}
						y={margin.top - 8}
						text-anchor="middle"
						class="fill-ink text-[14px] font-semibold"
					>
						Median {formatRatio(urbanMedian)}
					</text>
				{/if}

				{#if showOutlierCallouts}
					{#each outlierCallouts as c (c.point.row.code)}
						{@const boxX = c.labelX - c.labelW / 2}
						{@const lineEndY = c.placement === 'above' ? c.labelY + c.labelH : c.labelY}
						{@const lineStartY = c.placement === 'above' ? c.point.cy - 5 : c.point.cy + 5}
						<line
							x1={c.point.cx}
							y1={lineStartY}
							x2={c.labelX}
							y2={lineEndY}
							stroke={HIGHLIGHT_POINT_FILL}
							stroke-width="1"
						/>
						<rect
							x={boxX}
							y={c.labelY}
							width={c.labelW}
							height={c.labelH}
							rx="2"
							fill="#fff"
							stroke={HIGHLIGHT_POINT_FILL}
							stroke-width="1"
						/>
						<text
							x={c.labelX}
							y={c.labelY + c.labelH / 2 + 4}
							text-anchor="middle"
							class="fill-ink text-[14px] font-semibold"
							style="font-family: inherit"
						>
							{c.point.row.name}
						</text>
					{/each}
				{/if}

			</svg>
		</div>

		<div class="flex shrink-0 flex-col gap-2" style:height="{mapBlockH}px">
			<p class="shrink-0 text-center text-sm text-muted">ONS Rural Urban Classification (2021)</p>
			<div class="min-h-0 flex-1">
				<RuralUrbanMapMini classificationByMsoa={data.classificationByMsoa} {step} />
			</div>
		</div>
	</div>
</div>
