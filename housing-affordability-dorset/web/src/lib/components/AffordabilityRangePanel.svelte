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
	const padding = { top: 6, right: 10, bottom: 26, left: 10 };
	const stripTop = 38;
	const stripH = 34;
	const innerW = width - padding.left - padding.right;

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
	class="pointer-events-none z-[20] w-[min(calc(100vw-2rem),268px)] rounded-sm border border-line bg-white/95 p-3 shadow-md backdrop-blur-[2px]"
	aria-live="polite"
>
	<p class="text-[13px] font-bold leading-snug text-ink">
		Affordability ratio across Dorset MSOAs
	</p>
	<p class="mt-1 text-[11px] leading-snug text-muted">
		Median price (existing stock) ÷ Dorset median full-time pay
	</p>

	{#if distribution.length === 0}
		<p class="mt-3 text-xs text-muted">No ratio data.</p>
	{:else}
		<svg
			class="mt-2 block"
			width={width}
			height={stripTop + stripH + padding.bottom}
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
					{#if Number.isFinite(cx)}
						<line
							x1={cx}
							y1={stripTop + 2}
							x2={cx}
							y2={stripTop + stripH - 2}
							stroke="#626a6f"
							stroke-opacity={hovered?.code === d.code ? 0.35 : 0.55}
							stroke-width={hovered?.code === d.code ? 1 : 1.25}
						/>
					{/if}
				{/if}
			{/each}

			{#if markerX !== null}
				<line
					x1={markerX}
					y1={stripTop}
					x2={markerX}
					y2={stripTop + stripH}
					stroke="#f47738"
					stroke-width="3"
				/>
			{/if}

			<!-- Axis -->
			{#each ticks as t}
				{@const tx = xScale(t)}
				{#if Number.isFinite(tx)}
					<line
						x1={tx}
						y1={stripTop + stripH}
						x2={tx}
						y2={stripTop + stripH + 5}
						stroke="#505a5f"
						stroke-width="1"
					/>
					<text
						x={tx}
						y={stripTop + stripH + 18}
						text-anchor="middle"
						fill="#505a5f"
						font-size="10"
						font-family="Arial, Helvetica, sans-serif"
					>
						{t.toFixed(1)}×
					</text>
				{/if}
			{/each}
		</svg>

		{#if hovered}
			<p class="mt-2 text-[15px] font-bold leading-tight text-ink">{hovered.name}</p>
			<p class="mt-1 text-[13px] text-muted">
				Ratio: <span class="tabular-nums text-ink">{hovered.ratio.toFixed(2)}×</span>
			</p>
		{:else}
			<p class="mt-2 text-[13px] leading-snug text-muted">
				Hover over an area on the map to see its position in this range.
			</p>
		{/if}
	{/if}
</div>
