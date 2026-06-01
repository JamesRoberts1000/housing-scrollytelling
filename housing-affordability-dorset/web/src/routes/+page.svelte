<script lang="ts">
	import AffordabilityBars from '$lib/components/AffordabilityBars.svelte';
	import ChartPlaceholder from '$lib/components/ChartPlaceholder.svelte';
	import DorsetMap from '$lib/components/DorsetMap.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import StickyScroller from '$lib/components/StickyScroller.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let activeStep = $state(0);
	let barsActiveStep = $state(0);
	let ruralActiveStep = $state(0);
	let coastalActiveStep = $state(0);
	let ageingActiveStep = $state(0);
	let housingTypeActiveStep = $state(0);
	let marketsActiveStep = $state(0);

	const barsCaptions: { body: string | string[] }[] = [
		{
		body: [
			'Housing affordability in Dorset is higher (worse) than both the England and South West averages.',
			'**In Dorset, median house prices were around 9.9 times annual earnings.**',
			'Across England, the equivalent figure was 7.6.'
		]
		},
		{
			body: [
			'**Lower quartile** affordability ratios were also higher in Dorset.',
				'This suggests greater affordability pressures for lower-income households.'
			]
		}
	];

	const mapCaptions: { title?: string; body: string | string[] }[] = [
		{
			body: [
				'Housing affordability varies widely between Dorset’s neighbourhoods.',
				'Affordability ratios range from just **under 6 to over 15**.',
			]
		},
		{
			body: [
				'**St Leonards** had the highest affordability ratio in Dorset at 19.',
				'Median house prices were around £676,500.'
			]
		},
		{
			body: 'More affordable areas were concentrated in parts of Weymouth and Portland.'
		},
		{
			body: [
				'**Underhill and The Grove** had one of the lowest affordability ratios in Dorset at just under 6.',
				'Median house prices were around £205,000.'
			]
		}
	];

	const ruralCaptions: { body: string | string[] }[] = [
		{
			body: 'Rural areas generally had higher affordability ratios than urban areas.'
		},
		{
			body: [
				'The average affordability ratio in rural MSOAs was around 11.1.',
				'In urban MSOAs it was around 9.6.'
			]
		},
		{
			body: 'Many of the least affordable areas were rural or semi-rural settlements.'
		},
		{
			body: 'Urban areas tended to have a wider mix of housing types and lower median prices.'
		}
	];

	const coastalCaptions: { body: string | string[] }[] = [
		{
			body: 'Coastal areas did not always have the highest affordability ratios.'
		},
		{
			body: 'Some coastal MSOAs, including parts of Weymouth and Portland, had relatively low house prices.'
		},
		{
			body: 'Other coastal areas, including Lyme Regis and parts of Purbeck, had some of the highest affordability ratios in Dorset.'
		},
		{
			body: 'This reflects differences between coastal towns and smaller amenity or heritage settlements.'
		}
	];

	const ageingCaptions: { body: string | string[] }[] = [
		{
			body: 'Areas with older populations often had higher affordability ratios.'
		},
		{
			body: 'Several MSOAs with large proportions of residents aged 65 years and over also had high median house prices.'
		},
		{
			body: 'Lyme Regis, Charmouth and Marshwood Vale had both a high affordability ratio and an older age profile.'
		},
		{
			body: 'More affordable areas generally had younger populations.'
		}
	];

	const housingTypeCaptions: { body: string | string[] }[] = [
		{
			body: 'Housing affordability varied by property type.'
		},
		{
			body: 'Detached homes had the highest prices across most MSOAs.'
		},
		{
			body: 'Flats were generally more affordable than detached or semi-detached homes.'
		},
		{
			body: 'In some areas, flat prices were substantially lower than overall house prices.'
		},
		{
			body: 'Parts of Weymouth and Portland had comparatively affordable flat prices.'
		},
		{
			body: 'Some rural areas had relatively few flats or smaller dwellings available.'
		},
		{
			body: 'In several coastal and retirement areas, flat prices remained comparatively high.'
		}
	];

	const marketsCaptions: { body: string | string[] }[] = [
		{
			body: 'The data suggests Dorset contains several different housing markets.'
		},
		{
			body: 'Some rural areas had high house prices, limited smaller housing and older populations.'
		},
		{
			body: 'Parts of Weymouth and Portland had lower prices and more affordable flats and terraces.'
		},
		{
			body: 'Some coastal and retirement areas had high prices across multiple property types.'
		}
	];
</script>

{#snippet section2Heading()}
	<p class="text-sm uppercase tracking-[0.18em] text-muted">Section 2</p>
	<h2 id="section-2-heading" class="mx-auto mt-10 mb-5 w-full max-w-[680px] text-left text-[30px] font-bold leading-[45px] text-ink">
		Dorset in context
	</h2>
	<div class="mx-auto mt-4 w-full max-w-[680px] space-y-5 text-left text-[21px] leading-relaxed text-muted">
		<p>Housing affordability compares house prices with earnings.</p>
		<p>
			In this article, affordability is measured by dividing median house prices by median annual earnings. A higher ratio
			means homes are less affordable relative to local incomes.
		</p>
		<p>For example, an affordability ratio of 10 means house prices are around 10 times annual earnings. The Office for National
		Statistics considers an area affordable if average homes cost up to 5 times the average earnings of those working nearby.</p>
		<p>
			The analysis uses data for Middle Super Output Areas (MSOAs). These are statistical neighbourhoods
			designed to contain similar population sizes.
		</p>
		<p>
			The affordability ratios shown in this analysis are based on median house prices and median workplace-based earnings, unless stated otherwise.
		</p>
	</div>
{/snippet}

{#snippet section3Heading()}
	<p class="text-sm uppercase tracking-[0.18em] text-muted">Section 3</p>
	<h2 id="section-3-heading" class="mx-auto mt-10 mb-5 w-full max-w-[680px] text-left text-[30px] font-bold leading-[45px] text-ink">
		Variation Across Dorset
	</h2>
	<div class="mx-auto mt-4 w-full max-w-[680px] space-y-5 text-left text-[21px] leading-relaxed text-muted">
		<p>
			The map below shows affordability ratios for neighbourhoods across Dorset. Darker areas indicate higher house
			prices relative to earnings, while lighter areas indicate lower affordability ratios.
		</p>
		<p>
			Although Dorset's overall affordability ratio is higher than the England average, there are substantial differences
			between individual neighbourhoods.
		</p>
		<p>
			No MSOA in Dorset had an affordability ratio below 5, a level often used by the Office for National Statistics to
			indicate broadly affordable housing.
		</p>
	</div>
{/snippet}

{#snippet section4Heading()}
	<p class="text-sm uppercase tracking-[0.18em] text-muted">Section 4</p>
	<h2 id="section-4-heading" class="mx-auto mt-10 mb-5 w-full max-w-[680px] text-left text-[30px] font-bold leading-[45px] text-ink">
		The rural affordability problem
	</h2>
{/snippet}

{#snippet section5Heading()}
	<p class="text-sm uppercase tracking-[0.18em] text-muted">Section 5</p>
	<h2 id="section-5-heading" class="mx-auto mt-10 mb-5 w-full max-w-[680px] text-left text-[30px] font-bold leading-[45px] text-ink">
		Coastal Dorset is divided
	</h2>
{/snippet}

{#snippet section6Heading()}
	<p class="text-sm uppercase tracking-[0.18em] text-muted">Section 6</p>
	<h2 id="section-6-heading" class="mx-auto mt-10 mb-5 w-full max-w-[680px] text-left text-[30px] font-bold leading-[45px] text-ink">
		Ageing and affordability
	</h2>
{/snippet}

{#snippet section7Heading()}
	<p class="text-sm uppercase tracking-[0.18em] text-muted">Section 7</p>
	<h2 id="section-7-heading" class="mx-auto mt-10 mb-5 w-full max-w-[680px] text-left text-[30px] font-bold leading-[45px] text-ink">
		Housing type changes the story
	</h2>
{/snippet}

{#snippet section8Heading()}
	<p class="text-sm uppercase tracking-[0.18em] text-muted">Section 8</p>
	<h2 id="section-8-heading" class="mx-auto mt-10 mb-5 w-full max-w-[680px] text-left text-[30px] font-bold leading-[45px] text-ink">
		Different Housing Markets
	</h2>
{/snippet}

{#snippet barsGraphic(step: number)}
	<div class="flex h-full min-h-0 w-full items-start justify-center px-5 pt-12 pb-8 sm:px-8 sm:pt-16">
		<div class="w-full max-w-4xl">
			<h3 class="mb-3 text-center text-[24px] font-bold leading-tight text-ink">Housing affordability comparison</h3>
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

{#snippet ruralGraphic(step: number)}
	<ChartPlaceholder
		label="Rural vs urban affordability distribution"
		{step}
	/>
{/snippet}

{#snippet coastalGraphic(step: number)}
	<ChartPlaceholder label="Coastal vs inland affordability" {step} />
{/snippet}

{#snippet ageingGraphic(step: number)}
	<ChartPlaceholder label="Age and affordability scatter" {step} />
{/snippet}

{#snippet housingTypeGraphic(step: number)}
	<ChartPlaceholder label="Affordability by housing type" {step} />
{/snippet}

{#snippet marketsGraphic(step: number)}
	<ChartPlaceholder label="Housing market typology" {step} />
{/snippet}

<Hero />

<section id="section-2" class="overflow-visible border-t border-line pt-24 pb-16 sm:pt-28" aria-labelledby="section-2-heading">
	<StickyScroller
		captions={barsCaptions}
		graphic={barsGraphic}
		heading={section2Heading}
		bind:activeStep={barsActiveStep}
		compactGraphic
		compactSteps
		compactStepMinHeight={580}
		leadWithGraphicOnMobile
		introGraphicOnly
		advanceOnTopEdge
	/>
</section>

<section id="section-3" class="overflow-visible border-t border-line py-16" aria-labelledby="section-3-heading">
	<StickyScroller
		captions={mapCaptions}
		graphic={mapGraphic}
		heading={section3Heading}
		bind:activeStep
		triggerOnCaption
	/>
</section>

<section id="section-4" class="overflow-visible border-t border-line py-16" aria-labelledby="section-4-heading">
	<StickyScroller
		captions={ruralCaptions}
		graphic={ruralGraphic}
		heading={section4Heading}
		bind:activeStep={ruralActiveStep}
		compactGraphic
		compactSteps
	/>
</section>

<section id="section-5" class="overflow-visible border-t border-line py-16" aria-labelledby="section-5-heading">
	<StickyScroller
		captions={coastalCaptions}
		graphic={coastalGraphic}
		heading={section5Heading}
		bind:activeStep={coastalActiveStep}
		compactGraphic
		compactSteps
	/>
</section>

<section id="section-6" class="overflow-visible border-t border-line py-16" aria-labelledby="section-6-heading">
	<StickyScroller
		captions={ageingCaptions}
		graphic={ageingGraphic}
		heading={section6Heading}
		bind:activeStep={ageingActiveStep}
		compactGraphic
		compactSteps
	/>
</section>

<section id="section-7" class="overflow-visible border-t border-line py-16" aria-labelledby="section-7-heading">
	<StickyScroller
		captions={housingTypeCaptions}
		graphic={housingTypeGraphic}
		heading={section7Heading}
		bind:activeStep={housingTypeActiveStep}
		compactGraphic
		compactSteps
	/>
</section>

<section id="section-8" class="overflow-visible border-t border-line py-16" aria-labelledby="section-8-heading">
	<StickyScroller
		captions={marketsCaptions}
		graphic={marketsGraphic}
		heading={section8Heading}
		bind:activeStep={marketsActiveStep}
		compactGraphic
		compactSteps
	/>
</section>

<section id="section-9" class="border-t border-line px-5 py-20 sm:px-10 lg:px-16" aria-labelledby="section-9-heading">
	<div class="mx-auto max-w-6xl text-center">
		<p class="text-sm uppercase tracking-[0.18em] text-muted">Section 9</p>
		<h2 id="section-9-heading" class="mx-auto mt-10 mb-5 w-full max-w-[680px] text-left text-[30px] font-bold leading-[45px] text-ink">
			Conclusion
		</h2>
		<div class="mx-auto mt-8 w-full max-w-[680px] space-y-5 text-left text-lg leading-relaxed text-muted">
			<p>Housing affordability varies considerably across Dorset.</p>
			<p>Differences in affordability were linked to rurality, age structure and housing type.</p>
			<p>
				Some urban and coastal areas remained comparatively affordable for first-time buyers, particularly
				where lower-cost flats and terraces were available.
			</p>
			<p>
				Other rural and amenity areas had consistently high prices across most property types.
			</p>
		</div>
	</div>
</section>

<section id="methodology" class="border-t border-line px-5 py-20 sm:px-10 lg:px-16" aria-labelledby="methodology-heading">
	<div class="mx-auto max-w-6xl text-center">
		<h2 id="methodology-heading" class="mx-auto mt-10 mb-5 w-full max-w-[680px] text-left text-[30px] font-bold leading-[45px] text-ink">
			Methodology
		</h2>

		<h3 class="mt-10 text-xl font-bold text-ink">About the data</h3>
		<div class="mx-auto mt-4 w-full max-w-[680px] space-y-5 text-left text-lg leading-relaxed text-muted">
			<p>Housing affordability was measured using median house prices divided by annual earnings.</p>
			<p>Data is shown for Middle Super Output Areas (MSOAs) in Dorset.</p>
			<p>Supplementary datasets were used to classify areas by:</p>
		</div>
		<ul class="mx-auto mt-3 w-full max-w-[680px] list-disc space-y-2 pl-6 text-left text-lg leading-relaxed text-muted">
			<li>rural and urban status</li>
			<li>coastal location</li>
			<li>age structure</li>
			<li>property type</li>
		</ul>

		<h3 class="mt-10 text-xl font-bold text-ink">Source</h3>
		<p class="mx-auto mt-4 w-full max-w-[680px] text-left text-lg leading-relaxed text-muted">Office for National Statistics</p>
	</div>
</section>
