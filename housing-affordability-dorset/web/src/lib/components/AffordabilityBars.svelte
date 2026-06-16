<script lang="ts">
	import { browser } from '$app/environment';
	import type { BarDatum } from '$lib/types/affordability';
	import { max, scaleBand, scaleLinear } from 'd3';

	type Props = {
		data: BarDatum[];
		step?: number;
	};

	let { data, step = 0 }: Props = $props();

	let host = $state<HTMLDivElement | null>(null);

	const COLOR_HOUSE_PRICE = '#00A19A';
	const COLOR_EARNINGS = '#49B170';
	const COLOR_MEDIAN_RATIO = '#206095';
	const COLOR_LQ_RATIO = '#6a9fc4';
	const REVEAL_MS = 2000;
	const RAW_CROSSFADE_MS = 650;
	const RATIO_CROSSFADE_MS = 800;

	type BarElements = {
		rect: SVGRectElement;
		grow: SVGGElement;
		slot: SVGGElement;
	};

	type ChartHandles = {
		primaryBars: Map<string, BarElements>;
		secondaryBars: Map<string, BarElements>;
		primaryLabels: Map<string, SVGTextElement>;
		secondaryLabels: Map<string, SVGTextElement>;
		regionGroups: Map<string, SVGGElement>;
		subheading: SVGTextElement;
		legendPrimary: SVGGElement;
		legendSecondary: SVGGElement;
		legendPrimarySwatch: SVGRectElement;
		legendSecondarySwatch: SVGRectElement;
		legendPrimaryText: SVGTextElement;
		legendSecondaryText: SVGTextElement;
		innerH: number;
		barWidth: number;
		primaryX: number;
		secondaryX: number;
		centerX: number;
	};

	let handles = $state<ChartHandles | null>(null);

	type StepMode = 'house_price_only' | 'raw_pair' | 'median_ratio' | 'ratio_pair';

	function stepMode(stepNumber: number): StepMode {
		if (stepNumber <= 0) return 'house_price_only';
		if (stepNumber === 1) return 'raw_pair';
		if (stepNumber === 2) return 'median_ratio';
		return 'ratio_pair';
	}

	function isRawStep(mode: StepMode): boolean {
		return mode === 'house_price_only' || mode === 'raw_pair';
	}

	function formatRatio(n: number): string {
		return `${n.toFixed(1)}×`;
	}

	function formatCurrency(n: number): string {
		return `£${Math.round(n).toLocaleString('en-GB')}`;
	}

	function yScaleLeft(mode: StepMode, rows: BarDatum[], innerH: number) {
		const maxValue = isRawStep(mode)
			? max(rows, (d) => d.medianHousePrice) ?? 0
			: max(rows, (d) => Math.max(d.medianRatio, d.lowerQuartileRatio)) ?? 0;
		return scaleLinear()
			.domain([0, maxValue * 1.12])
			.nice()
			.range([innerH, 0]);
	}

	function yScaleRight(rows: BarDatum[], innerH: number) {
		const maxValue = max(rows, (d) => d.medianEarnings) ?? 0;
		return scaleLinear()
			.domain([0, maxValue * 1.12])
			.nice()
			.range([innerH, 0]);
	}

	function prefersReducedMotion(): boolean {
		return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	function fadeIn(el: SVGElement, ms: number, animate: boolean, delayMs = 0): void {
		if (!animate || ms <= 0) {
			el.setAttribute('opacity', '1');
			return;
		}
		el.setAttribute('opacity', '0');
		el.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: ms,
			delay: delayMs,
			easing: 'ease-out',
			fill: 'forwards'
		}).onfinish = () => {
			el.setAttribute('opacity', '1');
		};
	}

	function fadeOut(el: SVGElement, ms: number, animate: boolean, delayMs = 0): void {
		if (!animate || ms <= 0) {
			el.setAttribute('opacity', '0');
			return;
		}
		el.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: ms,
			delay: delayMs,
			easing: 'ease-out',
			fill: 'forwards'
		}).onfinish = () => {
			el.setAttribute('opacity', '0');
		};
	}

	function revealBar(
		bar: BarElements,
		value: number,
		y: (v: number) => number,
		innerH: number,
		fill: string,
		animate: boolean,
		grownKey: string,
		delayMs = 0,
		durationMs = REVEAL_MS
	): void {
		if (bar.grow.getAttribute(grownKey) === '1') {
			return;
		}

		const targetH = Math.max(0, innerH - y(value));
		const { rect, grow } = bar;

		rect.setAttribute('fill', fill);
		rect.setAttribute('y', String(-targetH));
		rect.setAttribute('height', String(targetH));
		grow.setAttribute(grownKey, '1');
		grow.style.transformOrigin = '0px 0px';
		grow.style.transformBox = 'fill-box';

		if (!animate) {
			grow.style.transform = 'scaleY(1)';
			rect.setAttribute('opacity', '1');
			return;
		}

		grow.style.transform = 'scaleY(0)';
		rect.setAttribute('opacity', '0');

		grow.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], {
			duration: durationMs,
			delay: delayMs,
			easing: 'ease-out',
			fill: 'forwards'
		}).onfinish = () => {
			grow.style.transform = 'scaleY(1)';
		};

		rect.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: durationMs,
			delay: delayMs,
			easing: 'ease-out',
			fill: 'forwards'
		}).onfinish = () => {
			rect.setAttribute('opacity', '1');
		};
	}

	function hideBar(
		bar: BarElements,
		animate: boolean,
		grownKey: string,
		durationMs = REVEAL_MS
	): void {
		if (bar.grow.getAttribute(grownKey) !== '1') {
			return;
		}

		const { rect, grow } = bar;
		const ms = animate ? durationMs : 0;

		if (animate && ms > 0) {
			grow.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], {
				duration: ms,
				easing: 'ease-out',
				fill: 'forwards'
			}).onfinish = () => {
				grow.style.transform = 'scaleY(0)';
			};
			rect.animate([{ opacity: 1 }, { opacity: 0 }], {
				duration: ms,
				easing: 'ease-out',
				fill: 'forwards'
			}).onfinish = () => {
				rect.setAttribute('opacity', '0');
			};
		} else {
			grow.style.transform = 'scaleY(0)';
			rect.setAttribute('opacity', '0');
		}
		grow.removeAttribute(grownKey);
	}

	function setSlotX(bar: BarElements, x: number, innerH: number): void {
		bar.slot.setAttribute('transform', `translate(${x},${innerH})`);
	}

	function createBarSlot(
		x: number,
		width: number,
		innerH: number,
		className: string
	): BarElements {
		const slot = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		slot.setAttribute('transform', `translate(${x},${innerH})`);

		const grow = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		grow.setAttribute('class', className);

		const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		rect.setAttribute('x', '0');
		rect.setAttribute('width', String(width));
		rect.setAttribute('rx', '2');
		rect.setAttribute('y', '0');
		rect.setAttribute('height', '0');
		rect.setAttribute('opacity', '0');

		grow.appendChild(rect);
		slot.appendChild(grow);

		return { rect, grow, slot };
	}

	function applyStep(
		current: number,
		h: ChartHandles,
		rows: BarDatum[],
		instant = false
	): void {
		const mode = stepMode(current);
		const yLeft = yScaleLeft(mode, rows, h.innerH);
		const yRight = yScaleRight(rows, h.innerH);
		const reduced = prefersReducedMotion();
		const revealMs = reduced ? 0 : REVEAL_MS;
		const animate = !reduced && !instant;
		const transitioningToEarnings = mode === 'raw_pair';
		const transitioningToPrices = mode === 'house_price_only';

		if (mode === 'house_price_only') {
			h.subheading.textContent = 'Median house prices';
			h.subheading.setAttribute('opacity', '1');
			h.legendPrimary.setAttribute('opacity', '0');
			h.legendSecondary.setAttribute('opacity', '0');
		} else if (mode === 'raw_pair') {
			h.subheading.textContent = 'Median earnings';
			h.subheading.setAttribute('opacity', '1');
			h.legendPrimary.setAttribute('opacity', '0');
			h.legendSecondary.setAttribute('opacity', '0');
		} else if (mode === 'median_ratio') {
			fadeOut(h.subheading, RATIO_CROSSFADE_MS, animate);
			h.legendPrimarySwatch.setAttribute('fill', COLOR_MEDIAN_RATIO);
			h.legendPrimaryText.textContent = 'Median ratio';
			fadeIn(h.legendPrimary, RATIO_CROSSFADE_MS, animate, RATIO_CROSSFADE_MS);
			h.legendSecondary.setAttribute('opacity', '0');
		} else {
			h.subheading.setAttribute('opacity', '0');
			h.legendPrimarySwatch.setAttribute('fill', COLOR_MEDIAN_RATIO);
			h.legendPrimaryText.textContent = 'Median ratio';
			h.legendSecondarySwatch.setAttribute('fill', COLOR_LQ_RATIO);
			h.legendSecondaryText.textContent = 'Lower quartile ratio';
			h.legendPrimary.setAttribute('opacity', '1');
			h.legendSecondary.setAttribute('opacity', '1');
		}

		for (const row of rows) {
			const primary = h.primaryBars.get(row.label);
			const secondary = h.secondaryBars.get(row.label);
			const pLabel = h.primaryLabels.get(row.label);
			const sLabel = h.secondaryLabels.get(row.label);
			const group = h.regionGroups.get(row.label);
			const earningsVisible = secondary?.grow.getAttribute('data-grown-earnings') === '1';
			const crossfadeToRatio = mode === 'median_ratio' && earningsVisible;

			if (primary) {
				if (isRawStep(mode)) {
					setSlotX(primary, h.centerX, h.innerH);
					if (pLabel) pLabel.setAttribute('x', String(h.centerX + h.barWidth / 2));
				} else {
					setSlotX(primary, h.primaryX, h.innerH);
					if (pLabel) pLabel.setAttribute('x', String(h.primaryX + h.barWidth / 2));
				}

				const primaryGrownKey = isRawStep(mode) ? 'data-grown-price' : 'data-grown-ratio';
				const animatePrimary = primary.grow.getAttribute(primaryGrownKey) !== '1';
				if (isRawStep(mode)) {
					const crossfadeFromEarnings =
						transitioningToPrices && secondary?.grow.getAttribute('data-grown-earnings') === '1';
					if (animatePrimary) {
						revealBar(
							primary,
							row.medianHousePrice,
							yLeft,
							h.innerH,
							COLOR_HOUSE_PRICE,
							animate,
							'data-grown-price',
							crossfadeFromEarnings ? RAW_CROSSFADE_MS : 0,
							crossfadeFromEarnings ? RAW_CROSSFADE_MS : REVEAL_MS
						);
					}
					primary.grow.removeAttribute('data-grown-ratio');
					if (secondary?.grow.getAttribute('data-grown-earnings') === '1') {
						hideBar(secondary, animate, 'data-grown-earnings', RAW_CROSSFADE_MS);
					}
					if (sLabel) {
						sLabel.setAttribute('opacity', '0');
						sLabel.setAttribute('visibility', 'hidden');
					}
				} else {
					const ratioDelay = crossfadeToRatio ? RATIO_CROSSFADE_MS : 0;
					const ratioDuration = crossfadeToRatio ? RATIO_CROSSFADE_MS : REVEAL_MS;

					if (crossfadeToRatio && secondary) {
						hideBar(secondary, animate, 'data-grown-earnings', RATIO_CROSSFADE_MS);
						if (sLabel) {
							fadeOut(sLabel, RATIO_CROSSFADE_MS, animate);
							sLabel.setAttribute('visibility', 'hidden');
						}
					}

					revealBar(
						primary,
						row.medianRatio,
						yLeft,
						h.innerH,
						COLOR_MEDIAN_RATIO,
						animate,
						'data-grown-ratio',
						ratioDelay,
						ratioDuration
					);
					primary.grow.removeAttribute('data-grown-price');
				}

				if (pLabel && animatePrimary) {
					const crossfadeFromEarningsOnPrice =
						isRawStep(mode) && transitioningToPrices && earningsVisible;
					if (isRawStep(mode)) {
						pLabel.textContent = formatCurrency(row.medianHousePrice);
						pLabel.setAttribute('y', String(yLeft(row.medianHousePrice) - 12));
					} else {
						pLabel.textContent = formatRatio(row.medianRatio);
						pLabel.setAttribute('y', String(yLeft(row.medianRatio) - 12));
					}
					pLabel.setAttribute('font-weight', '600');
					pLabel.setAttribute('fill', '#222222');
					pLabel.setAttribute('visibility', 'visible');
					if (crossfadeFromEarningsOnPrice) {
						fadeIn(pLabel, RAW_CROSSFADE_MS, animate, RAW_CROSSFADE_MS);
					} else if (crossfadeToRatio) {
						fadeIn(pLabel, RATIO_CROSSFADE_MS, animate, RATIO_CROSSFADE_MS);
					} else {
						fadeIn(pLabel, revealMs, animate);
					}
				}
			}

			if (secondary) {
				if (mode === 'raw_pair') {
					setSlotX(secondary, h.centerX, h.innerH);
					if (sLabel) sLabel.setAttribute('x', String(h.centerX + h.barWidth / 2));
				} else {
					setSlotX(secondary, h.secondaryX, h.innerH);
					if (sLabel) sLabel.setAttribute('x', String(h.secondaryX + h.barWidth / 2));
				}

				if (mode === 'raw_pair') {
					const animateEarnings = secondary.grow.getAttribute('data-grown-earnings') !== '1';
					const crossfadeFromPrices =
						transitioningToEarnings && primary?.grow.getAttribute('data-grown-price') === '1';
					const delayMs = crossfadeFromPrices ? RAW_CROSSFADE_MS : 0;
					if (primary?.grow.getAttribute('data-grown-price') === '1') {
						hideBar(primary, animate, 'data-grown-price', RAW_CROSSFADE_MS);
					}
					if (pLabel) {
						pLabel.setAttribute('opacity', '0');
						pLabel.setAttribute('visibility', 'hidden');
					}
					revealBar(
						secondary,
						row.medianEarnings,
						yRight,
						h.innerH,
						COLOR_EARNINGS,
						animate,
						'data-grown-earnings',
						delayMs,
						crossfadeFromPrices ? RAW_CROSSFADE_MS : REVEAL_MS
					);
					secondary.grow.removeAttribute('data-grown-lq');

					if (sLabel && animateEarnings) {
						sLabel.textContent = formatCurrency(row.medianEarnings);
						sLabel.setAttribute('y', String(yRight(row.medianEarnings) - 12));
						sLabel.setAttribute('visibility', 'visible');
						fadeIn(
							sLabel,
							crossfadeFromPrices ? RAW_CROSSFADE_MS : revealMs,
							animate,
							delayMs
						);
					}
				} else if (mode === 'ratio_pair') {
					const animateLq = secondary.grow.getAttribute('data-grown-lq') !== '1';
					revealBar(
						secondary,
						row.lowerQuartileRatio,
						yLeft,
						h.innerH,
						COLOR_LQ_RATIO,
						animate,
						'data-grown-lq'
					);
					secondary.grow.removeAttribute('data-grown-earnings');

					if (sLabel && animateLq) {
						sLabel.textContent = formatRatio(row.lowerQuartileRatio);
						sLabel.setAttribute('y', String(yLeft(row.lowerQuartileRatio) - 12));
						sLabel.setAttribute('visibility', 'visible');
						fadeIn(sLabel, revealMs, animate);
					}
				} else {
					if (secondary.grow.getAttribute('data-grown-earnings') === '1') {
						hideBar(secondary, animate, 'data-grown-earnings');
					}
					if (secondary.grow.getAttribute('data-grown-lq') === '1') {
						hideBar(secondary, animate, 'data-grown-lq');
					}
					if (
						sLabel &&
						secondary.grow.getAttribute('data-grown-earnings') !== '1' &&
						secondary.grow.getAttribute('data-grown-lq') !== '1'
					) {
						sLabel.setAttribute('opacity', '0');
						sLabel.setAttribute('visibility', 'hidden');
					}
				}
			}

			if (group) {
				group.setAttribute('opacity', '1');
			}
		}
	}

	function draw(el: HTMLDivElement, rows: BarDatum[]): ChartHandles {
		el.replaceChildren();
		const width = Math.min(el.clientWidth || 640, 920);
		const height = 440;
		const margin = { top: 52, right: 56, bottom: 64, left: 56 };
		const fsLabel = 20;
		const fsValue = 20;
		const fsLegend = 18;
		const fsSubheading = 24;

		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
		svg.setAttribute('role', 'img');
		svg.setAttribute(
			'aria-label',
			'Housing affordability comparison for England, South West, and Dorset'
		);
		svg.setAttribute('font-family', 'Open Sans, Helvetica, Arial, sans-serif');
		svg.classList.add('w-full', 'h-auto');

		const innerW = width - margin.left - margin.right;
		const innerH = height - margin.top - margin.bottom;

		const labels = rows.map((d) => d.label);
		const x0 = scaleBand().domain(labels).range([0, innerW]).paddingInner(0.18);
		const x1 = scaleBand().domain(['primary', 'secondary']).range([0, x0.bandwidth()]).padding(0.12);
		const barWidth = x1.bandwidth();
		const primaryX = x1('primary') ?? 0;
		const secondaryX = x1('secondary') ?? 0;
		const centerX = (x0.bandwidth() - barWidth) / 2;

		const initialMode = stepMode(step);
		const yLeft = yScaleLeft(initialMode, rows, innerH);

		const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		g.setAttribute('transform', `translate(${margin.left},${margin.top})`);

		const subheading = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		subheading.setAttribute('x', String(innerW / 2));
		subheading.setAttribute('y', '-18');
		subheading.setAttribute('text-anchor', 'middle');
		subheading.setAttribute('font-size', String(fsSubheading));
		subheading.setAttribute('font-weight', '600');
		subheading.setAttribute('fill', '#222222');
		subheading.textContent = initialMode === 'raw_pair' ? 'Median earnings' : 'Median house prices';
		subheading.setAttribute('opacity', isRawStep(initialMode) ? '1' : '0');
		g.appendChild(subheading);

		const axisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		axisLine.setAttribute('x1', '0');
		axisLine.setAttribute('x2', String(innerW));
		axisLine.setAttribute('y1', String(innerH));
		axisLine.setAttribute('y2', String(innerH));
		axisLine.setAttribute('stroke', '#d9d4cc');
		g.appendChild(axisLine);

		// Invisible dual y-axes (scales used for bar positioning only)
		for (const tick of yLeft.ticks(5)) {
			const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			text.setAttribute('x', '-10');
			text.setAttribute('y', String(yLeft(tick) + 4));
			text.setAttribute('text-anchor', 'end');
			text.setAttribute('opacity', '0');
			text.setAttribute('aria-hidden', 'true');
			g.appendChild(text);
		}
		const yRight = yScaleRight(rows, innerH);
		for (const tick of yRight.ticks(5)) {
			const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			text.setAttribute('x', String(innerW + 10));
			text.setAttribute('y', String(yRight(tick) + 4));
			text.setAttribute('text-anchor', 'start');
			text.setAttribute('opacity', '0');
			text.setAttribute('aria-hidden', 'true');
			g.appendChild(text);
		}

		const primaryBars = new Map<string, BarElements>();
		const secondaryBars = new Map<string, BarElements>();
		const primaryLabels = new Map<string, SVGTextElement>();
		const secondaryLabels = new Map<string, SVGTextElement>();
		const regionGroups = new Map<string, SVGGElement>();

		for (const row of rows) {
			const xg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
			xg.setAttribute('data-region', row.label);
			xg.setAttribute('transform', `translate(${x0(row.label)},0)`);
			regionGroups.set(row.label, xg);

			const w = barWidth;
			const px = primaryX;
			const sx = secondaryX;

			const primary = createBarSlot(px, w, innerH, 'bar-primary');
			const secondary = createBarSlot(sx, w, innerH, 'bar-secondary');
			xg.appendChild(primary.slot);
			xg.appendChild(secondary.slot);
			primaryBars.set(row.label, primary);
			secondaryBars.set(row.label, secondary);

			const pLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			pLabel.setAttribute('x', String(px + w / 2));
			pLabel.setAttribute('text-anchor', 'middle');
			pLabel.setAttribute('font-size', String(fsValue));
			pLabel.setAttribute('opacity', '0');
			xg.appendChild(pLabel);
			primaryLabels.set(row.label, pLabel);

			const sLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			sLabel.setAttribute('x', String(sx + w / 2));
			sLabel.setAttribute('text-anchor', 'middle');
			sLabel.setAttribute('font-size', String(fsValue));
			sLabel.setAttribute('fill', '#222222');
			sLabel.setAttribute('font-weight', '600');
			sLabel.setAttribute('opacity', '0');
			xg.appendChild(sLabel);
			secondaryLabels.set(row.label, sLabel);

			g.appendChild(xg);
		}

		for (const label of labels) {
			const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			text.textContent = label;
			text.setAttribute('x', String((x0(label) ?? 0) + x0.bandwidth() / 2));
			text.setAttribute('y', String(innerH + 32));
			text.setAttribute('text-anchor', 'middle');
			text.setAttribute('fill', '#222222');
			text.setAttribute('font-size', String(fsLabel));
			if (label === 'Dorset') text.setAttribute('font-weight', '600');
			g.appendChild(text);
		}

		const legend = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		legend.setAttribute('transform', `translate(0,${innerH + 48})`);

		const legendPrimary = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		const rPrimary = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		rPrimary.setAttribute('width', '16');
		rPrimary.setAttribute('height', '16');
		rPrimary.setAttribute('fill', COLOR_HOUSE_PRICE);
		legendPrimary.appendChild(rPrimary);
		const tPrimary = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		tPrimary.textContent = 'Median house price';
		tPrimary.setAttribute('x', '22');
		tPrimary.setAttribute('y', '13');
		tPrimary.setAttribute('fill', '#222222');
		tPrimary.setAttribute('font-size', String(fsLegend));
		legendPrimary.appendChild(tPrimary);
		legend.appendChild(legendPrimary);

		const legendSecondary = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		legendSecondary.setAttribute('transform', 'translate(240,0)');
		const rSecondary = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		rSecondary.setAttribute('width', '16');
		rSecondary.setAttribute('height', '16');
		rSecondary.setAttribute('fill', COLOR_EARNINGS);
		legendSecondary.appendChild(rSecondary);
		const tSecondary = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		tSecondary.textContent = 'Median earnings';
		tSecondary.setAttribute('x', '22');
		tSecondary.setAttribute('y', '13');
		tSecondary.setAttribute('fill', '#222222');
		tSecondary.setAttribute('font-size', String(fsLegend));
		legendSecondary.appendChild(tSecondary);
		if (isRawStep(initialMode)) {
			legendPrimary.setAttribute('opacity', '0');
			legendSecondary.setAttribute('opacity', '0');
		} else if (initialMode === 'median_ratio') {
			legendPrimary.setAttribute('opacity', '1');
			legendSecondary.setAttribute('opacity', '0');
		} else {
			legendPrimary.setAttribute('opacity', '1');
			legendSecondary.setAttribute('opacity', '1');
		}
		legend.appendChild(legendSecondary);

		g.appendChild(legend);
		svg.appendChild(g);
		el.appendChild(svg);

		return {
			primaryBars,
			secondaryBars,
			primaryLabels,
			secondaryLabels,
			regionGroups,
			subheading,
			legendPrimary,
			legendSecondary,
			legendPrimarySwatch: rPrimary,
			legendSecondarySwatch: rSecondary,
			legendPrimaryText: tPrimary,
			legendSecondaryText: tSecondary,
			innerH,
			barWidth,
			primaryX,
			secondaryX,
			centerX
		};
	}

	$effect(() => {
		if (!browser || !host) return;
		const rows = data;
		const el = host;

		const rebuild = (fromResize = false) => {
			const h = draw(el, rows);
			handles = h;
			if (fromResize) {
				applyStep(step, h, rows, true);
			}
		};

		rebuild();

		const ro = new ResizeObserver(() => {
			rebuild(true);
		});
		ro.observe(el);
		return () => ro.disconnect();
	});

	$effect(() => {
		const current = step;
		const h = handles;
		if (!h) return;
		applyStep(current, h, data);
	});
</script>

<div bind:this={host} class="min-h-[440px] w-full"></div>
