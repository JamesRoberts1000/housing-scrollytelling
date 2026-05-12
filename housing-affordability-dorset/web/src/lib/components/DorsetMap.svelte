<script lang="ts">
	import type { MsoaRatioPoint } from '$lib/data/loadAffordabilityData';
	import AffordabilityRangePanel from '$lib/components/AffordabilityRangePanel.svelte';
	import type { MapLayerMouseEvent } from 'maplibre-gl';
	import { onDestroy, onMount } from 'svelte';

	type Props = {
		ratioByMsoa: Record<string, number>;
		msoaDistribution: MsoaRatioPoint[];
		step?: number;
	};

	let { ratioByMsoa, msoaDistribution, step = 0 }: Props = $props();

	let container = $state<HTMLDivElement | null>(null);
	let mapInstance: import('maplibre-gl').Map | null = null;
	let hovered = $state<MsoaRatioPoint | null>(null);

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

	function parseHoverProps(props: Record<string, unknown>): MsoaRatioPoint | null {
		const code = String(props.MSOA21CD ?? '');
		const name = String(props.MSOA21NM ?? '');
		let r: unknown = props.ratio;
		if (typeof r === 'string') r = parseFloat(r);
		if (typeof r !== 'number' || !Number.isFinite(r) || r < 0 || !code) return null;
		return { code, name, ratio: r };
	}

	function setHoverOutlineFilter(code: string | null): void {
		if (!mapInstance?.getLayer('msoa-hover-outline')) return;
		if (!code) {
			mapInstance.setFilter('msoa-hover-outline', ['==', ['get', 'MSOA21CD'], '__none__']);
			return;
		}
		mapInstance.setFilter('msoa-hover-outline', ['==', ['get', 'MSOA21CD'], code]);
	}

	let teardownHover: (() => void) | null = null;

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
			attributionControl: { compact: true },
			container,
			bounds,
			fitBoundsOptions: { padding: 28, maxZoom: 10 },
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
						'rgba(227, 224, 218, 0.65)',
						[
							'interpolate',
							['linear'],
							['get', 'ratio'],
							5,
							'rgba(238, 244, 248, 0.55)',
							10,
							'rgba(198, 212, 227, 0.62)',
							14,
							'rgba(122, 147, 171, 0.68)',
							18,
							'rgba(42, 79, 111, 0.72)',
							22,
							'rgba(15, 31, 46, 0.78)'
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
				const canonical =
					msoaDistribution.find((d) => d.code === parsed.code) ?? parsed;
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
		});
	});

	onDestroy(() => {
		teardownHover?.();
		teardownHover = null;
		mapInstance?.remove();
		mapInstance = null;
	});

</script>

<div class="relative h-full w-full">
	<!-- Range strip plot (ONS-style); pointer-events-none so the map receives hover -->
	<div class="absolute right-3 top-14 z-[25] md:right-4 md:top-16">
		<AffordabilityRangePanel distribution={msoaDistribution} hovered={hovered} />
	</div>

	<div bind:this={container} class="h-full min-h-[280px] w-full"></div>

	<div
		class="pointer-events-none absolute bottom-10 left-3 max-w-[min(90%,20rem)] text-xs leading-snug text-muted drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] sm:bottom-12 lg:left-4"
	>
		Ratio: median price (existing stock) ÷ Dorset median full-time pay · Step {step + 1}
	</div>
</div>
