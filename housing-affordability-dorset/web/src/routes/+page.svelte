<script lang="ts">
	import AffordabilityBars from '$lib/components/AffordabilityBars.svelte';
	import DorsetMap from '$lib/components/DorsetMap.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import SectionStub from '$lib/components/SectionStub.svelte';
	import StickyScroller from '$lib/components/StickyScroller.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let activeStep = $state(0);

	const mapCaptions: { title: string; body: string }[] = [
		{
			title: 'A patchwork of housing markets',
			body: 'Each MSOA blends prices, earnings, and housing mix differently. The choropleth uses median prices for existing homes divided by Dorset median full-time pay — a headline affordability pressure measure, not a loan affordability test.'
		},
		{
			title: 'Internal inequality',
			body: 'The gap between the least and most pressured MSOAs is wide. Later sections will unpack rural, coastal, and age patterns behind this map.'
		},
		{
			title: 'Places to watch',
			body: 'Named areas such as St Leonards, Lyme Regis, Corfe Castle, Weymouth, and Portland will be highlighted and annotated in a later milestone.'
		},
		{
			title: 'How to read the colours',
			body: 'Darker blues indicate higher ratios (prices further above a single pay benchmark). Use the narrative scroll to situate Dorset against national context above.'
		}
	];
</script>

{#snippet mapGraphic(step: number)}
	<DorsetMap ratioByMsoa={data.ratioByMsoa} {step} />
{/snippet}

<Hero />

<section id="section-2" class="border-t border-line px-5 py-20 sm:px-10 lg:px-16" aria-labelledby="section-2-heading">
	<p class="text-sm uppercase tracking-[0.18em] text-muted">Section 2</p>
	<h2 id="section-2-heading" class="mt-3 max-w-prose text-3xl font-bold tracking-tight text-ink sm:text-4xl">
		Dorset in national context
	</h2>
	<p class="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
		Dorset’s workplace-based affordability pressures sit above England and the South West on both median and
		lower-quartile headline ratios (ONS-style house price to earnings measures).
	</p>
	<div class="mt-12 max-w-4xl">
		<AffordabilityBars data={data.bars} />
	</div>
</section>

<section id="section-3" class="overflow-visible border-t border-line py-16" aria-labelledby="section-3-heading">
	<div class="mx-auto max-w-6xl px-5 sm:px-10 lg:px-10">
		<p class="text-sm uppercase tracking-[0.18em] text-muted">Section 3</p>
		<h2 id="section-3-heading" class="mt-3 max-w-prose text-3xl font-bold tracking-tight text-ink sm:text-4xl">
			Zoom into Dorset
		</h2>
		<p class="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
			Scroll the captions alongside the map. Active step: {activeStep + 1} of {mapCaptions.length}.
		</p>
	</div>

	<div class="mt-12">
		<StickyScroller captions={mapCaptions} graphic={mapGraphic} bind:activeStep />
	</div>
</section>

<SectionStub
	id="section-4"
	eyebrow="Section 4"
	title="The rural affordability problem"
	body="Rural Dorset often shows higher headline ratios than urban areas, reflecting constrained supply and demand for larger homes. Distribution charts and rural overlays will land here."
/>

<SectionStub
	id="section-5"
	eyebrow="Section 5"
	title="Coastal Dorset is divided"
	body="Not all coastlines behave like luxury markets. This section will contrast amenity coastlines with working coastal towns, including Weymouth and Portland as affordability pressure valves."
/>

<SectionStub
	id="section-6"
	eyebrow="Section 6"
	title="Ageing and affordability"
	body="Older populations overlap with pressured markets in several MSOAs. A scatter with careful causal framing will follow."
/>

<SectionStub
	id="section-7"
	eyebrow="Section 7"
	title="Housing type changes the story"
	body="Flats and smaller homes can look relatively accessible in some towns while detached markets dominate elsewhere — small multiples and morphing transitions will be added later."
/>

<SectionStub
	id="section-8"
	eyebrow="Section 8"
	title="Dorset’s multiple housing systems"
	body="A typology synthesis will cluster rural lifestyle markets, working coastal towns, and retirement-driven apartment markets."
/>

<SectionStub
	id="section-9"
	eyebrow="Section 9"
	title="Conclusion"
	body="Dorset is not one housing market. Affordability depends on location, housing mix, tenure options, and who the homes are built for — a simplified map recap and methodology notes will close the piece."
/>
