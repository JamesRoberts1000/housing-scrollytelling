<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	type Props = {
		ratioByMsoa: Record<string, number>;
		step?: number;
	};

	let { ratioByMsoa, step = 0 }: Props = $props();

	let container = $state<HTMLDivElement | null>(null);
	let mapInstance: import('maplibre-gl').Map | null = null;

	function walkCoords(coords: unknown, cb: (x: number, y: number) => void): void {
		if (Array.isArray(coords) && coords.length && typeof coords[0] === 'number') {
			const [x, y] = coords as [number, number];
			cb(x, y);
			return;
		}
		if (Array.isArray(coords)) {
			for (const c of coords) walkCoords(c, cb);
		}
	}

	type FeatureCollection = {
		type: 'FeatureCollection';
		features: {
			geometry?: { type: string; coordinates: unknown };
			properties?: Record<string, unknown>;
		}[];
	};

	function bboxOfFeatureCollection(fc: FeatureCollection): [[number, number], [number, number]] {
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		for (const feature of fc.features) {
			const geom = feature.geometry;
			if (!geom) continue;
			if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
				walkCoords(geom.coordinates, (x, y) => {
					minX = Math.min(minX, x);
					minY = Math.min(minY, y);
					maxX = Math.max(maxX, x);
					maxY = Math.max(maxY, y);
				});
			}
		}
		if (!Number.isFinite(minX)) {
			return [
				[-2.9, 50.6],
				[-1.9, 51.1]
			];
		}
		return [
			[minX, minY],
			[maxX, maxY]
		];
	}

	onMount(async () => {
		if (!container) return;
		const maplibregl = (await import('maplibre-gl')).default;
		await import('maplibre-gl/dist/maplibre-gl.css');

		const response = await fetch('/geo/dorset_msoa_2021.geojson');
		const geojson = (await response.json()) as FeatureCollection;

		for (const feature of geojson.features) {
			const code = String(feature.properties?.MSOA21CD ?? '');
			const raw = ratioByMsoa[code];
			const ratio = typeof raw === 'number' && Number.isFinite(raw) ? raw : -1;
			feature.properties = { ...feature.properties, ratio };
		}

		const bounds = bboxOfFeatureCollection(geojson);

		mapInstance = new maplibregl.Map({
			attributionControl: true,
			container,
			bounds,
			fitBoundsOptions: { padding: 28, maxZoom: 10 },
			style: {
				version: 8,
				sources: {},
				layers: [
					{
						id: 'background',
						type: 'background',
						paint: { 'background-color': '#f6f4f0' }
					}
				]
			} as any
		});

		mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

		mapInstance.on('load', () => {
			if (!mapInstance) return;
			mapInstance.addSource('msoa', {
				type: 'geojson',
				data: geojson
			});

			mapInstance.addLayer({
				id: 'msoa-fill',
				type: 'fill',
				source: 'msoa',
				paint: {
					'fill-color': [
						'case',
						['<', ['get', 'ratio'], 0],
						'#e3e0da',
						[
							'interpolate',
							['linear'],
							['get', 'ratio'],
							5,
							'#eef4f8',
							10,
							'#c6d4e3',
							14,
							'#7a93ab',
							18,
							'#2a4f6f',
							22,
							'#0f1f2e'
						]
					],
					'fill-opacity': 0.92
				}
			});

			mapInstance.addLayer({
				id: 'msoa-outline',
				type: 'line',
				source: 'msoa',
				paint: {
					'line-color': '#c9c2b8',
					'line-width': 0.35
				}
			});
		});
	});

	onDestroy(() => {
		mapInstance?.remove();
		mapInstance = null;
	});

</script>

<div class="relative h-full w-full">
	<div bind:this={container} class="h-full min-h-[280px] w-full"></div>
	<div class="pointer-events-none absolute bottom-3 left-3 rounded bg-white/90 px-3 py-2 text-xs text-muted shadow-sm">
		Ratio: median price (existing stock) ÷ Dorset median full-time pay · Step {step + 1}
	</div>
</div>
