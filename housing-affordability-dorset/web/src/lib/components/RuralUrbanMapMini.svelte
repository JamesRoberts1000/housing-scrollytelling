<script lang="ts">
	import {
		RURAL_CHART_FILL,
		RURAL_MAP_FILL,
		SHOW_GAP,
		SHOW_URBAN_MEDIAN,
		UNCLASSIFIED_MAP_FILL,
		URBAN_CHART_FILL,
		URBAN_MAP_FILL
	} from '$lib/constants/ruralUrbanStory';
	import type { RuralUrbanGroup } from '$lib/types/ruralUrban';
	import { assetPath } from '$lib/utils/assetPath';
	import { onDestroy, onMount } from 'svelte';

	type Props = {
		classificationByMsoa: Record<string, RuralUrbanGroup>;
		step?: number;
	};

	let { classificationByMsoa, step = 0 }: Props = $props();

	let container = $state<HTMLDivElement | null>(null);
	let mapInstance: import('maplibre-gl').Map | null = null;
	let maplibregl: typeof import('maplibre-gl').default | null = null;
	let mapReady = $state(false);
	let resizeObserver: ResizeObserver | null = null;

	type FeatureCollection = {
		type: 'FeatureCollection';
		features: {
			geometry?: { type: string; coordinates: unknown };
			properties?: Record<string, unknown>;
		}[];
	};

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

	let mapOpacity = $derived(step >= SHOW_URBAN_MEDIAN ? 1 : step >= 1 ? 0.45 : 0.2);

	onMount(async () => {
		if (!container) return;
		maplibregl = (await import('maplibre-gl')).default;
		await import('maplibre-gl/dist/maplibre-gl.css');

		const response = await fetch(assetPath('/geo/dorset_msoa_2021.geojson'));
		const geojson = (await response.json()) as FeatureCollection;

		for (const feature of geojson.features) {
			const code = String(feature.properties?.MSOA21CD ?? '');
			const group = classificationByMsoa[code];
			feature.properties = { ...feature.properties, ruralUrban: group ?? '' };
		}

		const bounds = bboxOfFeatureCollection(geojson);

		mapInstance = new maplibregl.Map({
			attributionControl: { compact: true },
			container,
			bounds,
			fitBoundsOptions: { padding: 16, maxZoom: 10 },
			dragPan: false,
			scrollZoom: false,
			boxZoom: false,
			dragRotate: false,
			dragPitch: false,
			keyboard: false,
			doubleClickZoom: false,
			touchZoomRotate: false,
			touchPitch: false,
			style: {
				version: 8,
				sources: {
					'carto-light': {
						type: 'raster',
						tiles: ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
						tileSize: 256,
						attribution:
							'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
					}
				},
				layers: [
					{
						id: 'basemap',
						type: 'raster',
						source: 'carto-light',
						minzoom: 0,
						maxzoom: 22,
						paint: {
							'raster-opacity': 0.97,
							'raster-saturation': -0.35,
							'raster-contrast': -0.08
						}
					}
				]
			} as import('maplibre-gl').StyleSpecification
		});

		resizeObserver = new ResizeObserver(() => mapInstance?.resize());
		resizeObserver.observe(container);

		mapInstance.on('load', () => {
			if (!mapInstance) return;
			mapInstance.addSource('msoa', { type: 'geojson', data: geojson });
			mapInstance.addLayer({
				id: 'msoa-fill',
				type: 'fill',
				source: 'msoa',
				paint: {
					'fill-color': [
						'match',
						['get', 'ruralUrban'],
						'Rural',
						RURAL_MAP_FILL,
						'Urban',
						URBAN_MAP_FILL,
						UNCLASSIFIED_MAP_FILL
					],
					'fill-opacity': 1
				}
			});
			mapInstance.addLayer({
				id: 'msoa-outline',
				type: 'line',
				source: 'msoa',
				paint: {
					'line-color': '#2a2a2a',
					'line-opacity': 0.4,
					'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.2, 12, 0.7]
				}
			});
			mapReady = true;
			queueMicrotask(() => mapInstance?.resize());
		});
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
		resizeObserver = null;
		mapInstance?.remove();
		mapInstance = null;
		maplibregl = null;
		mapReady = false;
	});

	$effect(() => {
		void step;
		if (!mapInstance || !mapReady) return;
		const layer = mapInstance.getLayer('msoa-fill');
		if (!layer) return;
		const op = step >= SHOW_GAP ? 0.85 : mapOpacity;
		mapInstance.setPaintProperty('msoa-fill', 'fill-opacity', op);
	});
</script>

<div
	class="relative w-full overflow-hidden rounded-sm border border-line transition-opacity duration-500 motion-reduce:transition-none"
	style:opacity={mapReady ? mapOpacity : 0}
	aria-hidden={step < SHOW_URBAN_MEDIAN}
>
	<div bind:this={container} class="h-[200px] w-full sm:h-[220px]"></div>
	{#if step >= SHOW_URBAN_MEDIAN}
		<ul class="absolute bottom-1 left-2 flex flex-wrap gap-3 text-[10px] text-ink">
			<li class="flex items-center gap-1">
				<span class="inline-block h-2 w-2 rounded-sm" style:background={RURAL_CHART_FILL}></span>
				Rural
			</li>
			<li class="flex items-center gap-1">
				<span class="inline-block h-2 w-2 rounded-sm" style:background={URBAN_CHART_FILL}></span>
				Urban
			</li>
		</ul>
	{/if}
</div>
