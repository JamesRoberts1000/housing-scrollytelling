<script lang="ts">
	import { scaleLinear } from 'd3';

	export type RatioPoint = {
		code: string;
		name: string;
		ratio: number;
	};

	type Props = {
		distribution: RatioPoint[];
		hovered: RatioPoint | null;
	};

	let { distribution, hovered }: Props = $props();

	const width = 268;
	/* Inner SVG padding below axis ticks (tick + label) */
	/* bottom: room for tick marks + numeric axis labels (no clipping) */
	const padding = { top: 12, right: 10, bottom: 24, left: 10 };
	/* Room above strip for downward-pointing hover arrow */
	const stripTop = 12;
	const stripH = 30;
	const markerArrowHalf = 7;
	const markerArrowHeight = 9;
	const markerColor = '#f47738';
	const innerW = width - padding.left - padding.right;
	const svgHeight = stripTop + stripH + padding.bottom;

	let extent = $derived.by(() => {
		const vals = distribution.map((d) => d.ratio).filter((v) => Number.isFinite(v));
		if (!vals.length) return { min: 0, max: 1 };
		let lo = Math.min(...vals);
		let hi = Math.max(...vals);
		if (lo === hi) {
			return { min: lo - 1, max: hi + 1 };
		}
		const pad = (hi - lo) * 0.06;
		return { min: lo - pad, max: hi + pad };
	});

	let xScale = $derived.by(() =>
		scaleLinear()
			.domain([extent.min, extent.max])
			.range([padding.left, width - padding.right])
	);

	let ticks = $derived.by(() => xScale.ticks(5));

	let markerX = $derived.by(() => {
		if (!hovered || !Number.isFinite(hovered.ratio)) return null;
		const x = xScale(hovered.ratio);
		if (!Number.isFinite(x)) return null;
		return Math.max(padding.left, Math.min(width - padding.right, x));
	});
</script>

<div
	class="pointer-events-none z-[20] w-[min(100%,268px,calc(100vw-2rem))] rounded-bl-sm rounded-br-sm rounded-tl-sm rounded-tr-none border border-line border-r-0 border-t-0 bg-white px-3 pb-2 pt-2 opacity-70 shadow-md backdrop-blur-[2px]"
	aria-live="polite"
>
	<p class="text-[13px] font-bold leading-snug text-ink">
		Housing affordability across Dorset
	</p>

	{#if distribution.length === 0}
		<p class="mt-2 text-xs text-ink">No ratio data.</p>
	{:else}
		<svg
			class="mt-1 mx-auto block w-full max-w-full"
			style:aspect-ratio="{width} / {svgHeight}"
			viewBox={`0 0 ${width} ${svgHeight}`}
			preserveAspectRatio="xMidYMid meet"
			width="100%"
			role="img"
			aria-label="Distribution of affordability ratios; hover the map to highlight one MSOA."
		>
			<!-- Strip plot -->
			<rect
				x={padding.left}
				y={stripTop}
				width={innerW}
				height={stripH}
				fill="#f3f2f1"
				stroke="#b1b4b6"
				stroke-width="1"
			/>

			{#each distribution as d (d.code)}
				{#if Number.isFinite(d.ratio)}
					{@const cx = xScale(d.ratio)}
					{#if Number.isFinite(cx) && !(hovered && hovered.code === d.code)}
						<line
							x1={cx}
							y1={stripTop + 2}
							x2={cx}
							y2={stripTop + stripH - 2}
							stroke="#626a6f"
							stroke-opacity={hovered ? 0.2 : 0.55}
							stroke-width="1.25"
						/>
					{/if}
				{/if}
			{/each}

			{#if markerX !== null}
				<g aria-hidden="true">
					<line
						x1={markerX}
						y1={stripTop}
						x2={markerX}
						y2={stripTop + stripH}
						stroke="#ffffff"
						stroke-width="6"
					/>
					<line
						x1={markerX}
						y1={stripTop}
						x2={markerX}
						y2={stripTop + stripH}
						stroke={markerColor}
						stroke-width="3.5"
					/>
					<polygon
						points="{markerX},{stripTop} {markerX - markerArrowHalf},{stripTop - markerArrowHeight} {markerX + markerArrowHalf},{stripTop - markerArrowHeight}"
						fill={markerColor}
						stroke="#ffffff"
						stroke-width="1.5"
						stroke-linejoin="round"
					/>
				</g>
			{/if}

			<!-- Axis -->
			{#each ticks as t}
				{@const tx = xScale(t)}
				{#if Number.isFinite(tx)}
					<line
						x1={tx}
						y1={stripTop + stripH}
						x2={tx}
						y2={stripTop + stripH + 4}
						stroke="#222222"
						stroke-width="1"
					/>
					<text
						x={tx}
						y={stripTop + stripH + 14}
						text-anchor="middle"
						fill="#222222"
						font-size="10"
						font-family="Open Sans, Helvetica, Arial, sans-serif"
					>
						{t.toFixed(1)}×
					</text>
				{/if}
			{/each}
		</svg>

		{#if hovered}
			<p class="mt-1 text-[15px] font-bold leading-tight text-ink">{hovered.name}</p>
			<p class="mt-0.5 text-[13px] leading-snug text-ink">
				Ratio: <span class="tabular-nums">{hovered.ratio.toFixed(2)}×</span>
			</p>
		{:else}
			<p class="mt-1 text-[13px] leading-snug text-ink">
				Hover over an area on the map to see its position in this range.
			</p>
		{/if}
	{/if}
</div>
