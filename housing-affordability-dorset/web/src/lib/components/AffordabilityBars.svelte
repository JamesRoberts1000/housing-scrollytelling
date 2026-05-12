<script lang="ts">
	import { browser } from '$app/environment';
	import type { BarDatum } from '$lib/types/affordability';
	import { max, scaleBand, scaleLinear } from 'd3';

	type Props = {
		data: BarDatum[];
	};

	let { data }: Props = $props();

	let host = $state<HTMLDivElement | null>(null);

	function draw(el: HTMLDivElement, rows: BarDatum[]) {
		el.replaceChildren();
		const width = Math.min(el.clientWidth || 640, 920);
		const height = 360;
		const margin = { top: 28, right: 24, bottom: 56, left: 52 };

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
			.domain([0, yMax * 1.08])
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
			const t = i / 4;
			const yPos = innerH * t;
			const grid = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			grid.setAttribute('x1', '0');
			grid.setAttribute('x2', String(innerW));
			grid.setAttribute('y1', String(yPos));
			grid.setAttribute('y2', String(yPos));
			grid.setAttribute('stroke', '#ece8e2');
			g.appendChild(grid);
		}

		for (const row of rows) {
			const xg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
			xg.setAttribute('transform', `translate(${x0(row.label)},0)`);

			for (const key of innerKeys) {
				const value = row[key];
				const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
				const w = x1.bandwidth();
				const h = innerH - y(value);
				const bx = x1(key) ?? 0;
				const by = y(value);
				bar.setAttribute('x', String(bx));
				bar.setAttribute('y', String(by));
				bar.setAttribute('width', String(w));
				bar.setAttribute('height', String(h));
				bar.setAttribute('fill', key === 'medianRatio' ? '#206095' : '#6a9fc4');
				bar.setAttribute('rx', '2');
				xg.appendChild(bar);
			}
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
			g.appendChild(text);
		}

		const yTicks = y.ticks(5);
		for (const tick of yTicks) {
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
		const items = [
			{ label: 'Median ratio', color: '#206095' },
			{ label: 'Lower quartile ratio', color: '#6a9fc4' }
		];
		let lx = 0;
		for (const item of items) {
			const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
			r.setAttribute('x', String(lx));
			r.setAttribute('y', '0');
			r.setAttribute('width', '12');
			r.setAttribute('height', '12');
			r.setAttribute('fill', item.color);
			legend.appendChild(r);
			const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			t.textContent = item.label;
			t.setAttribute('x', String(lx + 18));
			t.setAttribute('y', '10');
			t.setAttribute('fill', '#5c5c5c');
			t.setAttribute('font-size', '12');
			legend.appendChild(t);
			lx += 200;
		}
		g.appendChild(legend);

		svg.appendChild(g);
		el.appendChild(svg);
	}

	$effect(() => {
		if (!browser || !host) return;
		const rows = data;
		draw(host, rows);
		const ro = new ResizeObserver(() => draw(host, rows));
		ro.observe(host);
		return () => ro.disconnect();
	});
</script>

<div bind:this={host} class="min-h-[360px] w-full"></div>
