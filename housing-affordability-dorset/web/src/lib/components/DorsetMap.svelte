<script lang="ts">
	import {
		MSOA_ST_LEONARDS,
		MSOA_UNDERHILL_GROVE,
		MSOA_WEYMOUTH_PORTLAND,
		SECTION3_MAP_LABEL,
		section3MapAriaLabel,
		section3MapDescription
	} from '$lib/constants/dorsetMapStory';
	import type { MsoaRatioPoint } from '$lib/data/loadAffordabilityData';
	import { formatRatio } from '$lib/charts/boxStrip';
	import AccessibleDataTable from '$lib/components/AccessibleDataTable.svelte';
	import { assetPath } from '$lib/utils/assetPath';
	import AffordabilityRangePanel from '$lib/components/AffordabilityRangePanel.svelte';
	import type { MapLayerMouseEvent } from 'maplibre-gl';
	import { onDestroy, onMount } from 'svelte';

	type Props = {
		ratioByMsoa: Record<string, number>;
		msoaDistribution: MsoaRatioPoint[];
		msoaNameByCode: Record<string, string>;
		step?: number;
	};

	let { ratioByMsoa, msoaDistribution, msoaNameByCode, step = 0 }: Props = $props();

	const sortedDistribution = $derived(
		[...msoaDistribution].sort((a, b) => a.name.localeCompare(b.name, 'en'))
	);
	const mapDescriptionId = 'dorset-map-description';

	let container = $state<HTMLDivElement | null>(null);
	let mapInstance: import('maplibre-gl').Map | null = null;
	let maplibregl: typeof import('maplibre-gl').default | null = null;
	let hovered = $state<MsoaRatioPoint | null>(null);

	let mapReady = $state(false);
	let fullBounds: [[number, number], [number, number]] | null = null;
	let geojsonForMap: FeatureCollection | null = null;

	const storyMarkers: import('maplibre-gl').Marker[] = [];

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

	function bboxForCodes(fc: FeatureCollection, codes: Set<string>): [[number, number], [number, number]] | null {
		const subset: FeatureCollection = {
			type: 'FeatureCollection',
			features: fc.features.filter((f) => codes.has(String(f.properties?.MSOA21CD ?? '')))
		};
		if (!subset.features.length) return null;
		return bboxOfFeatureCollection(subset);
	}

	function centroidOfGeometry(coords: unknown): [number, number] | null {
		let sx = 0;
		let sy = 0;
		let n = 0;
		walkCoords(coords, (x, y) => {
			sx += x;
			sy += y;
			n += 1;
		});
		if (!n) return null;
		return [sx / n, sy / n];
	}

	function parseHoverProps(props: Record<string, unknown>): MsoaRatioPoint | null {
		const code = String(props.MSOA21CD ?? '');
		const name = String(props.MSOA21NM ?? '');
		let ratio: unknown = props.ratio;
		if (typeof ratio === 'string') ratio = parseFloat(ratio);
		if (typeof ratio !== 'number' || !Number.isFinite(ratio) || ratio < 0 || !code) return null;
		const display = String(props.displayName ?? '').trim();
		return { code, name: display || name, ratio };
	}

	function setHoverOutlineFilter(code: string | null): void {
		if (!mapInstance?.getLayer('msoa-hover-outline')) return;
		if (!code) {
			mapInstance.setFilter('msoa-hover-outline', ['==', ['get', 'MSOA21CD'], '__none__']);
			return;
		}
		mapInstance.setFilter('msoa-hover-outline', ['==', ['get', 'MSOA21CD'], code]);
	}

	function clearStoryMarkers(): void {
		while (storyMarkers.length) {
			storyMarkers.pop()?.remove();
		}
	}

	function setStoryOutlineForCodes(codes: readonly string[] | null): void {
		if (!mapInstance?.getLayer('msoa-story-outline')) return;
		if (!codes?.length) {
			mapInstance.setLayoutProperty('msoa-story-outline', 'visibility', 'none');
			return;
		}
		mapInstance.setFilter('msoa-story-outline', ['in', 'MSOA21CD', ...codes]);
		mapInstance.setLayoutProperty('msoa-story-outline', 'visibility', 'visible');
	}

	function fitToCodes(
		codes: readonly string[],
		maxZoom = 11,
		durationMultiplier = 1
	): void {
		if (!mapInstance || !maplibregl || !geojsonForMap) return;
		const bb = bboxForCodes(geojsonForMap, new Set(codes));
		if (!bb) return;
		const b = new maplibregl.LngLatBounds(bb[0], bb[1]);
		const baseDur = reducedMotionMs();
		const duration = baseDur === 0 ? 0 : Math.round(baseDur * durationMultiplier);
		mapInstance.fitBounds(b, { padding: 56, maxZoom, duration });
	}

	function placeMarkers(codes: readonly string[]): void {
		if (!mapInstance || !maplibregl || !geojsonForMap) return;
		for (const code of codes) {
			const f = geojsonForMap.features.find((x) => String(x.properties?.MSOA21CD) === code);
			const geom = f?.geometry;
			if (!geom || (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon')) continue;
			const ll = centroidOfGeometry(geom.coordinates);
			if (!ll) continue;
			const el = document.createElement('div');
			el.className =
				'pointer-events-none max-w-[9.5rem] rounded-sm border border-line bg-white/90 px-1.5 py-0.5 text-center text-[10px] font-semibold leading-tight text-ink shadow-sm';
			el.textContent = SECTION3_MAP_LABEL[code] ?? code;
			const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
				.setLngLat(ll)
				.addTo(mapInstance);
			storyMarkers.push(marker);
		}
	}

	function reducedMotionMs(): number {
		if (typeof window === 'undefined') return 650;
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1850;
	}

	function applyStep(s: number): void {
		if (!mapInstance || !mapReady || !fullBounds || !geojsonForMap || !maplibregl) return;

		const dur = reducedMotionMs();

		const fitFull = () => {
			const b = new maplibregl.LngLatBounds(fullBounds![0], fullBounds![1]);
			mapInstance!.fitBounds(b, { padding: 28, maxZoom: 10, duration: dur });
		};

		clearStoryMarkers();
		setStoryOutlineForCodes(null);

		if (s === 0) {
			fitFull();
		} else if (s === 1) {
			const codes = [MSOA_ST_LEONARDS];
			setStoryOutlineForCodes(codes);
			fitToCodes(codes, 12);
			placeMarkers(codes);
		} else if (s === 2) {
			const codes = [...MSOA_WEYMOUTH_PORTLAND];
			setStoryOutlineForCodes(codes);
			fitToCodes(codes, 11, 1.5);
		} else if (s === 3) {
			const codes = [MSOA_UNDERHILL_GROVE];
			setStoryOutlineForCodes(codes);
			fitToCodes(codes, 12);
			placeMarkers(codes);
		}
	}

	let teardownHover: (() => void) | null = null;
	let resizeObserver: ResizeObserver | null = null;

	$effect(() => {
		const s = step;
		void msoaDistribution;
		if (!mapReady) return;
		applyStep(s);
	});

	onMount(async () => {
		if (!container) return;
		maplibregl = (await import('maplibre-gl')).default;
		await import('maplibre-gl/dist/maplibre-gl.css');

		const response = await fetch(assetPath('/geo/dorset_msoa_2021.geojson'));
		const geojson = (await response.json()) as FeatureCollection;

		const labelCodes = new Set<string>([
			MSOA_ST_LEONARDS,
			MSOA_UNDERHILL_GROVE,
			...MSOA_WEYMOUTH_PORTLAND
		]);

		for (const feature of geojson.features) {
			const code = String(feature.properties?.MSOA21CD ?? '');
			const raw = ratioByMsoa[code];
			const ratio = typeof raw === 'number' && Number.isFinite(raw) ? raw : -1;
			const displayName = (msoaNameByCode[code] ?? String(feature.properties?.MSOA21NM ?? '')).trim();
			const mapLabel = labelCodes.has(code) ? (SECTION3_MAP_LABEL[code] ?? '') : '';
			feature.properties = { ...feature.properties, ratio, displayName, mapLabel };
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
			if (mapReady) queueMicrotask(() => applyStep(step));
		});
		resizeObserver.observe(container);

		mapInstance.on('load', () => {
			if (!mapInstance || !maplibregl) return;
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
						'rgba(227, 224, 218, 0.65)',
						[
							'interpolate',
							['linear'],
							['get', 'ratio'],
							5,
							'rgba(232, 240, 246, 0.55)',
							10,
							'rgba(160, 195, 218, 0.62)',
							14,
							'rgba(90, 140, 178, 0.68)',
							18,
							'rgba(32, 96, 149, 0.72)',
							22,
							'rgba(22, 65, 102, 0.78)'
						]
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
					'line-opacity': 0.55,
					'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.25, 12, 0.85]
				}
			});

			mapInstance.addLayer({
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

			mapInstance.addLayer(
				{
					id: 'msoa-story-outline',
					type: 'line',
					source: 'msoa',
					layout: { visibility: 'none' },
					paint: {
						'line-color': '#206095',
						'line-opacity': 0.92,
						'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.25, 12, 3]
					},
					filter: ['==', ['get', 'MSOA21CD'], '__none__']
				},
				'msoa-hover-outline'
			);

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
				const canonical = msoaDistribution.find((d) => d.code === parsed.code) ?? parsed;
				hovered = canonical;
				setHoverOutlineFilter(canonical.code);
				mapInstance.getCanvas().style.cursor = 'pointer';
			};

			const onLeave = () => {
				if (!mapInstance) return;
				hovered = null;
				setHoverOutlineFilter(null);
				mapInstance.getCanvas().style.cursor = '';
			};

			mapInstance.on('mousemove', 'msoa-fill', onMove);
			mapInstance.on('mouseleave', 'msoa-fill', onLeave);

			teardownHover = () => {
				mapInstance?.off('mousemove', 'msoa-fill', onMove);
				mapInstance?.off('mouseleave', 'msoa-fill', onLeave);
			};

			mapReady = true;
			queueMicrotask(() => mapInstance?.resize());
		});
	});

	onDestroy(() => {
		clearStoryMarkers();
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

<div
	class="relative flex h-full min-h-0 w-full flex-col"
	role="region"
	aria-label={section3MapAriaLabel(step)}
	aria-describedby={mapDescriptionId}
>
	<a href="#dorset-map-data" class="skip-link">
		Skip to neighbourhood data table
	</a>
	<p id={mapDescriptionId} class="sr-only">{section3MapDescription(step, msoaDistribution.length)}</p>

	<div class="pointer-events-none absolute right-0 top-0 z-[25] flex max-w-full justify-end">
		<AffordabilityRangePanel distribution={msoaDistribution} hovered={hovered} />
	</div>

	<div bind:this={container} class="min-h-0 w-full flex-1" aria-hidden="true"></div>

	<AccessibleDataTable
		id="dorset-map-data"
		summaryLabel="View neighbourhood affordability data ({sortedDistribution.length} areas)"
		caption="Affordability ratios for Dorset MSOAs"
		rows={sortedDistribution}
		rowKey={(row) => row.code}
		columns={[
			{ header: 'Neighbourhood', value: (row) => row.name },
			{ header: 'Affordability ratio', value: (row) => formatRatio(row.ratio) }
		]}
	/>
</div>
