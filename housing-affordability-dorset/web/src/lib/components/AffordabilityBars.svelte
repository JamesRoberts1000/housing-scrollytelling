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

	type ChartHandles = {
		medianBars: Map<string, SVGRectElement>;
		lqBars: Map<string, SVGRectElement>;
		medianLabels: Map<string, SVGTextElement>;
		lqLabels: Map<string, SVGTextElement>;
		regionGroups: Map<string, SVGGElement>;
		legendMedian: SVGGElement;
		legendLq: SVGGElement;
		y: (v: number) => number;
		innerH: number;
		x0: ReturnType<typeof scaleBand<string>>;
		x1: ReturnType<typeof scaleBand<string>>;
	};

	let handles = $state<ChartHandles | null>(null);

	function formatRatio(n: number): string {
		return `${n.toFixed(1)}×`;
	}

	function prefersReducedMotion(): boolean {
		return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	function setBarGeometry(
		bar: SVGRectElement,
		value: number,
		y: (v: number) => number,
		innerH: number,
		animate: boolean
	): void {
		const targetH = Math.max(0, innerH - y(value));
		const targetY = y(value);
		if (!animate || prefersReducedMotion()) {
			bar.setAttribute('y', String(targetY));
			bar.setAttribute('height', String(targetH));
			return;
		}
		bar.setAttribute('y', String(innerH));
		bar.setAttribute('height', '0');
		requestAnimationFrame(() => {
			bar.setAttribute('y', String(targetY));
			bar.setAttribute('height', String(targetH));
		});
	}

	function applyStep(s: number, h: ChartHandles, rows: BarDatum[]): void {
		const reduced = prefersReducedMotion();
		const dur = reduced ? '0.01ms' : '0.65s';
		const fade = reduced ? '0.01ms' : '0.5s';

		for (const row of rows) {
			const median = h.medianBars.get(row.label);
			const lq = h.lqBars.get(row.label);
			const mLabel = h.medianLabels.get(row.label);
			const lLabel = h.lqLabels.get(row.label);
			const group = h.regionGroups.get(row.label);
			const isDorset = row.label === 'Dorset';

			if (median) {
				median.style.transition = `y ${dur} ease, height ${dur} ease, opacity ${fade} ease, fill ${fade} ease`;
				if (s >= 0) {
					setBarGeometry(median, row.medianRatio, h.y, h.innerH, s === 0 && !reduced);
					median.setAttribute('opacity', s >= 0 ? '1' : '0');
					if (s === 0) {
						median.setAttribute('fill', isDorset ? '#206095' : '#6a9fc4');
						median.setAttribute('opacity', isDorset ? '1' : '0.42');
					} else if (s === 1) {
						median.setAttribute('fill', '#206095');
						median.setAttribute('opacity', isDorset ? '1' : '0.55');
					} else {
						median.setAttribute('fill', '#206095');
						median.setAttribute('opacity', '0.85');
					}
				}
			}

			if (lq) {
				lq.style.transition = `y ${dur} ease, height ${dur} ease, opacity ${fade} ease`;
				if (s >= 2) {
					setBarGeometry(lq, row.lowerQuartileRatio, h.y, h.innerH, s === 2 && !reduced);
					lq.setAttribute('opacity', '1');
				} else {
					lq.setAttribute('y', String(h.innerH));
					lq.setAttribute('height', '0');
					lq.setAttribute('opacity', '0');
				}
			}

			if (mLabel) {
				mLabel.style.transition = `opacity ${fade} ease`;
				mLabel.setAttribute('opacity', s >= 1 ? '1' : '0');
				mLabel.textContent = formatRatio(row.medianRatio);
				mLabel.setAttribute('font-weight', isDorset && s === 1 ? '700' : '600');
				mLabel.setAttribute('fill', isDorset && s === 1 ? '#206095' : '#5c5c5c');
			}

			if (lLabel) {
				lLabel.style.transition = `opacity ${fade} ease`;
				lLabel.setAttribute('opacity', s >= 2 ? '1' : '0');
				lLabel.textContent = formatRatio(row.lowerQuartileRatio);
			}

			if (group) {
				group.style.transition = `opacity ${fade} ease`;
				group.setAttribute('opacity', s >= 0 ? '1' : '0');
			}
		}

		h.legendMedian.setAttribute('opacity', s >= 0 ? '1' : '0');
		h.legendLq.setAttribute('opacity', s >= 2 ? '1' : '0');
	}

	function draw(el: HTMLDivElement, rows: BarDatum[]): ChartHandles {
		el.replaceChildren();
		const width = Math.min(el.clientWidth || 640, 920);
		const height = 400;
		const margin = { top: 44, right: 24, bottom: 56, left: 52 };

		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
		svg.setAttribute('role', 'img');
		svg.setAttribute('aria-label', 'Affordability ratios for England, South West, and Dorset');
		svg.setAttribute('font-family', 'Open Sans, Helvetica, Arial, sans-serif');
		svg.classList.add('w-full', 'h-auto');

		const innerW = width - margin.left - margin.right;
		const innerH = height - margin.top - margin.bottom;

		const labels = rows.map((d) => d.label);
		const x0 = scaleBand().domain(labels).range([0, innerW]).paddingInner(0.18);
		const innerKeys = ['medianRatio', 'lowerQuartileRatio'] as const;
		const x1 = scaleBand().domain(innerKeys).range([0, x0.bandwidth()]).padding(0.12);

		const yMax = max(rows, (d) => Math.max(d.medianRatio, d.lowerQuartileRatio)) ?? 0;
		const y = scaleLinear()
			.domain([0, yMax * 1.12])
			.nice()
			.range([innerH, 0]);

		const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		g.setAttribute('transform', `translate(${margin.left},${margin.top})`);

		const axisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		axisLine.setAttribute('x1', '0');
		axisLine.setAttribute('x2', String(innerW));
		axisLine.setAttribute('y1', String(innerH));
		axisLine.setAttribute('y2', String(innerH));
		axisLine.setAttribute('stroke', '#d9d4cc');
		g.appendChild(axisLine);

		for (let i = 0; i <= 4; i++) {
			const yPos = innerH * (i / 4);
			const grid = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			grid.setAttribute('x1', '0');
			grid.setAttribute('x2', String(innerW));
			grid.setAttribute('y1', String(yPos));
			grid.setAttribute('y2', String(yPos));
			grid.setAttribute('stroke', '#ece8e2');
			g.appendChild(grid);
		}

		const medianBars = new Map<string, SVGRectElement>();
		const lqBars = new Map<string, SVGRectElement>();
		const medianLabels = new Map<string, SVGTextElement>();
		const lqLabels = new Map<string, SVGTextElement>();
		const regionGroups = new Map<string, SVGGElement>();

		for (const row of rows) {
			const xg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
			xg.setAttribute('data-region', row.label);
			xg.setAttribute('transform', `translate(${x0(row.label)},0)`);
			regionGroups.set(row.label, xg);

			const w = x1.bandwidth();
			const mx = x1('medianRatio') ?? 0;
			const lx = x1('lowerQuartileRatio') ?? 0;

			const median = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
			median.setAttribute('class', 'bar-median');
			median.setAttribute('x', String(mx));
			median.setAttribute('width', String(w));
			median.setAttribute('rx', '2');
			median.setAttribute('y', String(innerH));
			median.setAttribute('height', '0');
			median.setAttribute('opacity', '0');
			xg.appendChild(median);
			medianBars.set(row.label, median);

			const lq = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
			lq.setAttribute('class', 'bar-lq');
			lq.setAttribute('x', String(lx));
			lq.setAttribute('width', String(w));
			lq.setAttribute('rx', '2');
			lq.setAttribute('fill', '#6a9fc4');
			lq.setAttribute('y', String(innerH));
			lq.setAttribute('height', '0');
			lq.setAttribute('opacity', '0');
			xg.appendChild(lq);
			lqBars.set(row.label, lq);

			const mLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			mLabel.setAttribute('x', String(mx + w / 2));
			mLabel.setAttribute('y', String(y(row.medianRatio) - 8));
			mLabel.setAttribute('text-anchor', 'middle');
			mLabel.setAttribute('font-size', '13');
			mLabel.setAttribute('opacity', '0');
			xg.appendChild(mLabel);
			medianLabels.set(row.label, mLabel);

			const lLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			lLabel.setAttribute('x', String(lx + w / 2));
			lLabel.setAttribute('y', String(y(row.lowerQuartileRatio) - 8));
			lLabel.setAttribute('text-anchor', 'middle');
			lLabel.setAttribute('font-size', '13');
			lLabel.setAttribute('fill', '#5c5c5c');
			lLabel.setAttribute('font-weight', '600');
			lLabel.setAttribute('opacity', '0');
			xg.appendChild(lLabel);
			lqLabels.set(row.label, lLabel);

			g.appendChild(xg);
		}

		for (const label of labels) {
			const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			text.textContent = label;
			text.setAttribute('x', String((x0(label) ?? 0) + x0.bandwidth() / 2));
			text.setAttribute('y', String(innerH + 28));
			text.setAttribute('text-anchor', 'middle');
			text.setAttribute('fill', '#5c5c5c');
			text.setAttribute('font-size', '13');
			if (label === 'Dorset') text.setAttribute('font-weight', '600');
			g.appendChild(text);
		}

		for (const tick of y.ticks(5)) {
			const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			text.textContent = String(tick);
			text.setAttribute('x', '-10');
			text.setAttribute('y', String(y(tick) + 4));
			text.setAttribute('text-anchor', 'end');
			text.setAttribute('fill', '#5c5c5c');
			text.setAttribute('font-size', '12');
			g.appendChild(text);
		}

		const legend = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		legend.setAttribute('transform', `translate(0,${innerH + 44})`);

		const legendMedian = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		const rMed = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		rMed.setAttribute('width', '12');
		rMed.setAttribute('height', '12');
		rMed.setAttribute('fill', '#206095');
		legendMedian.appendChild(rMed);
		const tMed = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		tMed.textContent = 'Median ratio';
		tMed.setAttribute('x', '18');
		tMed.setAttribute('y', '10');
		tMed.setAttribute('fill', '#5c5c5c');
		tMed.setAttribute('font-size', '12');
		legendMedian.appendChild(tMed);
		legendMedian.setAttribute('opacity', '0');
		legend.appendChild(legendMedian);

		const legendLq = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		legendLq.setAttribute('transform', 'translate(200,0)');
		const rLq = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		rLq.setAttribute('width', '12');
		rLq.setAttribute('height', '12');
		rLq.setAttribute('fill', '#6a9fc4');
		legendLq.appendChild(rLq);
		const tLq = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		tLq.textContent = 'Lower quartile ratio';
		tLq.setAttribute('x', '18');
		tLq.setAttribute('y', '10');
		tLq.setAttribute('fill', '#5c5c5c');
		tLq.setAttribute('font-size', '12');
		legendLq.appendChild(tLq);
		legendLq.setAttribute('opacity', '0');
		legend.appendChild(legendLq);

		g.appendChild(legend);
		svg.appendChild(g);
		el.appendChild(svg);

		return {
			medianBars,
			lqBars,
			medianLabels,
			lqLabels,
			regionGroups,
			legendMedian,
			legendLq,
			y,
			innerH,
			x0,
			x1
		};
	}

	$effect(() => {
		if (!browser || !host) return;
		const rows = data;
		handles = draw(host, rows);
		applyStep(step, handles, rows);
		const ro = new ResizeObserver(() => {
			if (!host) return;
			handles = draw(host, rows);
			applyStep(step, handles, rows);
		});
		ro.observe(host);
		return () => ro.disconnect();
	});

	$effect(() => {
		const s = step;
		if (!handles) return;
		applyStep(s, handles, data);
	});
</script>

<div bind:this={host} class="min-h-[400px] w-full"></div>

<style>
	:global(.bar-median),
	:global(.bar-lq) {
		transition-property: y, height, opacity, fill;
	}
</style>
