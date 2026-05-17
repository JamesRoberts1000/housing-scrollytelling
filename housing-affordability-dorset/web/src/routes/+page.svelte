<script lang="ts">
	import AffordabilityBars from '$lib/components/AffordabilityBars.svelte';
	import DorsetMap from '$lib/components/DorsetMap.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import SectionStub from '$lib/components/SectionStub.svelte';
	import StickyScroller from '$lib/components/StickyScroller.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let activeStep = $state(0);
	let barsActiveStep = $state(0);

	const barsCaptions: { body: string | string[] }[] = [
		{
			body: 'Housing affordability in Dorset is higher than both the England and South West averages.'
		},
		{
			body: [
				'In Dorset, median house prices were around 9.9 times annual earnings.',
				'Across England, the equivalent figure was 7.6.'
			]
		},
		{
			body: [
				'Lower quartile affordability ratios were also higher in Dorset.',
				'This suggests greater affordability pressures for lower-income households.'
			]
		}
	];

	const mapCaptions: { title: string; body: string }[] = [
		{
			title: 'A patchwork of housing markets',
			body: 'Each MSOA blends prices, earnings, and housing mix differently. The choropleth uses median prices for existing homes divided by Dorset median full-time pay — a headline affordability pressure measure, not a loan affordability test.'
		},
		{
			title: 'Internal inequality',
			body: 'The map now emphasises the extremes: areas in the top quarter of ratios stay vivid while the middle band fades back, so the spread between the most and least pressured neighbourhoods is easier to see at a glance.'
		},
		{
			title: 'Places to watch',
			body: 'Several MSOAs anchor the Dorset story — including St Leonards, the Lyme Regis coast, Corfe Castle, Weymouth town centre, and Underhill & The Grove. Labels appear on the map while this step is active.'
		},
		{
			title: 'How to read the colours',
			body: 'Darker blues indicate higher ratios (prices further above a single pay benchmark). Hover any area to highlight it on the map and on the range strip. Scroll back to section 2 to situate Dorset against England and the South West.'
		}
	];
</script>

{#snippet section2Intro()}
	<p class="text-sm uppercase tracking-[0.18em] text-muted">Section 2</p>
	<h2 id="section-2-heading" class="mt-3 max-w-prose text-[30px] font-bold leading-tight tracking-tight text-ink">
		Dorset in context
	</h2>
{/snippet}

{#snippet barsGraphic(step: number)}
	<div class="flex h-full min-h-0 w-full items-center justify-center px-5 py-8 sm:px-8">
		<div class="w-full max-w-4xl">
			<AffordabilityBars data={data.bars} {step} />
		</div>
	</div>
{/snippet}

{#snippet mapGraphic(step: number)}
	<DorsetMap
		ratioByMsoa={data.ratioByMsoa}
		msoaDistribution={data.msoaDistribution}
		msoaNameByCode={data.msoaNameByCode}
		{step}
	/>
{/snippet}

<Hero />

<section id="section-2" class="overflow-visible border-t border-line py-16" aria-labelledby="section-2-heading">
	<StickyScroller
		captions={barsCaptions}
		graphic={barsGraphic}
		intro={section2Intro}
		bind:activeStep={barsActiveStep}
		compactGraphic
		compactSteps
	/>
</section>

<section id="section-3" class="overflow-visible border-t border-line py-16" aria-labelledby="section-3-heading">
	<div class="mx-auto max-w-6xl px-5 sm:px-10 lg:px-10">
		<p class="text-sm uppercase tracking-[0.18em] text-muted">Section 3</p>
		<h2 id="section-3-heading" class="mt-3 max-w-prose text-[30px] font-bold leading-tight tracking-tight text-ink">
			Zoom into Dorset
		</h2>
		<p class="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
			Scroll the captions alongside the map — the view updates to match each beat of the story.
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
