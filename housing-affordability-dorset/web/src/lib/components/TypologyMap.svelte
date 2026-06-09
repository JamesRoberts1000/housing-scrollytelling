<script lang="ts">
	import { formatRatio } from '$lib/charts/boxStrip';
	import {
		ACTIVE_OPACITY,
		MUTED_FILL,
		MUTED_FILL_OPACITY,
		STEP_INTRO,
		STEP_SYNTHESIS,
		SYSTEM_COLORS,
		SYSTEM_SHORT_LABELS,
		stepFocusSystem
	} from '$lib/constants/housingMarketTypologyStory';
	import type { HousingMarketTypologyBundle, MsoaHousingMarketTypologyRow } from '$lib/types/housingMarketTypology';
	import { assetPath } from '$lib/utils/assetPath';
	import type { MapLayerMouseEvent } from 'maplibre-gl';
	import { onDestroy, onMount } from 'svelte';

	type Props = {
		data: HousingMarketTypologyBundle;
		step?: number;
	};

	let { data, step = 0 }: Props = $props();

	let container = $state<HTMLDivElement | null>(null);
	let mapInstance: import('maplibre-gl').Map | null = null;
	let maplibregl: typeof import('maplibre-gl').default | null = null;
	let mapReady = $state(false);
	let hovered = $state<MsoaHousingMarketTypologyRow | null>(null);

	let fullBounds: [[number, number], [number, number]] | null = null;
	let geojsonForMap: FeatureCollection | null = null;
	let rowByCode = $derived(Object.fromEntries(data.rows.map((r) => [r.code, r])));

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

	function fillStyleForFeature(code: string, s: number): { color: string; opacity: number } {
		const row = rowByCode[code];
		if (!row) return { color: MUTED_FILL, opacity: 0.45 };

		if (s === STEP_INTRO) {
			return { color: MUTED_FILL, opacity: MUTED_FILL_OPACITY };
		}

		if (s === STEP_SYNTHESIS) {
			return { color: SYSTEM_COLORS[row.system], opacity: 0.78 };
		}

		const focus = stepFocusSystem(s);
		if (!focus) return { color: SYSTEM_COLORS[row.system], opacity: ACTIVE_OPACITY };

		if (row.system === focus) {
			return { color: SYSTEM_COLORS[row.system], opacity: ACTIVE_OPACITY };
		}
		return { color: MUTED_FILL, opacity: MUTED_FILL_OPACITY };
	}

	function applyFeatureStyles(s: number): void {
		if (!geojsonForMap || !mapInstance || !mapReady) return;

		for (const feature of geojsonForMap.features) {
			const code = String(feature.properties?.MSOA21CD ?? '');
			const row = rowByCode[code];
			const style = fillStyleForFeature(code, s);
			feature.properties = {
				...feature.properties,
				fillColor: style.color,
				fillOpacity: style.opacity,
				system: row?.system ?? '',
				displayName: row?.name ?? String(feature.properties?.MSOA21NM ?? ''),
				ratio: row?.ratio ?? -1,
				pct65Plus: row?.pct65Plus ?? -1
			};
		}

		const source = mapInstance.getSource('msoa') as import('maplibre-gl').GeoJSONSource | undefined;
		source?.setData(geojsonForMap as GeoJSON.FeatureCollection);
	}

	function setHoverOutlineFilter(code: string | null): void {
		if (!mapInstance?.getLayer('msoa-hover-outline')) return;
		if (!code) {
			mapInstance.setFilter('msoa-hover-outline', ['==', ['get', 'MSOA21CD'], '__none__']);
			return;
		}
		mapInstance.setFilter('msoa-hover-outline', ['==', ['get', 'MSOA21CD'], code]);
	}

	function parseHoverProps(props: Record<string, unknown>): MsoaHousingMarketTypologyRow | null {
		const code = String(props.MSOA21CD ?? '');
		return rowByCode[code] ?? null;
	}

	let teardownHover: (() => void) | null = null;
	let resizeObserver: ResizeObserver | null = null;

	$effect(() => {
		const s = step;
		void data.rows;
		if (!mapReady) return;
		applyFeatureStyles(s);
	});

	onMount(async () => {
		if (!container) return;
		maplibregl = (await import('maplibre-gl')).default;
		await import('maplibre-gl/dist/maplibre-gl.css');

		const response = await fetch(assetPath('/geo/dorset_msoa_2021.geojson'));
		const geojson = (await response.json()) as FeatureCollection;

		for (const feature of geojson.features) {
			const code = String(feature.properties?.MSOA21CD ?? '');
			const row = rowByCode[code];
			feature.properties = {
				...feature.properties,
				fillColor: MUTED_FILL,
				fillOpacity: MUTED_FILL_OPACITY,
				system: row?.system ?? '',
				displayName: row?.name ?? String(feature.properties?.MSOA21NM ?? ''),
				ratio: row?.ratio ?? -1,
				pct65Plus: row?.pct65Plus ?? -1
			};
		}

		geojsonForMap = geojson;
		fullBounds = bboxOfFeatureCollection(geojson);

		mapInstance = new maplibregl.Map({
			attributionControl: { compact: true },
			container,
			bounds: fullBounds,
			fitBoundsOptions: { padding: 28, maxZoom: 10 },
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

		resizeObserver = new ResizeObserver(() => {
			mapInstance?.resize();
			if (mapReady) queueMicrotask(() => applyFeatureStyles(step));
		});
		resizeObserver.observe(container);

		const map = mapInstance;
		if (!map) return;

		map.on('load', () => {
			map.addSource('msoa', {
				type: 'geojson',
				data: geojson as GeoJSON.FeatureCollection
			});

			map.addLayer({
				id: 'msoa-fill',
				type: 'fill',
				source: 'msoa',
				paint: {
					'fill-color': ['get', 'fillColor'],
					'fill-opacity': ['get', 'fillOpacity']
				}
			});

			map.addLayer({
				id: 'msoa-outline',
				type: 'line',
				source: 'msoa',
				paint: {
					'line-color': '#2a2a2a',
					'line-opacity': 0.5,
					'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.25, 12, 0.85]
				}
			});

			map.addLayer({
				id: 'msoa-hover-outline',
				type: 'line',
				source: 'msoa',
				paint: {
					'line-color': '#f47738',
					'line-width': 3,
					'line-opacity': 1
				},
				filter: ['==', ['get', 'MSOA21CD'], '__none__']
			});

			const onMove = (e: MapLayerMouseEvent) => {
				if (!mapInstance) return;
				const f = e.features?.[0];
				const props = f?.properties as Record<string, unknown> | undefined;
				if (!props) {
					hovered = null;
					setHoverOutlineFilter(null);
					mapInstance.getCanvas().style.cursor = '';
					return;
				}
				const parsed = parseHoverProps(props);
				if (!parsed) {
					hovered = null;
					setHoverOutlineFilter(null);
					mapInstance.getCanvas().style.cursor = '';
					return;
				}
				hovered = parsed;
				setHoverOutlineFilter(parsed.code);
				mapInstance.getCanvas().style.cursor = 'pointer';
			};

			const onLeave = () => {
				if (!mapInstance) return;
				hovered = null;
				setHoverOutlineFilter(null);
				mapInstance.getCanvas().style.cursor = '';
			};

			map.on('mousemove', 'msoa-fill', onMove);
			map.on('mouseleave', 'msoa-fill', onLeave);

			teardownHover = () => {
				map.off('mousemove', 'msoa-fill', onMove);
				map.off('mouseleave', 'msoa-fill', onLeave);
			};

			mapReady = true;
			queueMicrotask(() => {
				map.resize();
				applyFeatureStyles(step);
			});
		});
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
		resizeObserver = null;
		teardownHover?.();
		teardownHover = null;
		mapInstance?.remove();
		mapInstance = null;
		maplibregl = null;
		mapReady = false;
		geojsonForMap = null;
		fullBounds = null;
	});
</script>

<div class="relative flex h-full min-h-0 w-full flex-col">
	<div bind:this={container} class="min-h-0 w-full flex-1" aria-hidden="true"></div>

	{#if hovered}
		<div
			class="pointer-events-none absolute left-3 top-3 z-[30] max-w-[16rem] rounded-sm border border-line bg-white/95 px-3 py-2 text-left shadow-sm"
			role="status"
			aria-live="polite"
		>
			<p class="text-[13px] font-semibold leading-snug text-ink">{hovered.name}</p>
			<p class="mt-1 text-[12px] text-muted">{SYSTEM_SHORT_LABELS[hovered.system]}</p>
			<p class="mt-1 text-[12px] text-muted">
				Affordability ratio: {formatRatio(hovered.ratio)} · {hovered.pct65Plus.toFixed(1)}% aged 65+
			</p>
		</div>
	{/if}

	<ul
		class="pointer-events-none absolute right-3 top-3 z-[25] flex max-w-[calc(100%-1.5rem)] flex-col gap-1.5 rounded-sm border border-line bg-white/90 px-3 py-2 text-[12px] text-ink shadow-sm sm:text-[13px]"
		class:opacity-0={step > 0}
		class:opacity-100={step === 0}
		aria-hidden={step !== 0}
	>
		{#each Object.entries(SYSTEM_COLORS) as [system, color]}
			<li class="flex items-center gap-1.5">
				<span class="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style:background={color}></span>
				<span>{SYSTEM_SHORT_LABELS[system as keyof typeof SYSTEM_SHORT_LABELS]}</span>
			</li>
		{/each}
	</ul>
</div>
