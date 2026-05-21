<script lang="ts">
	import type { Snippet } from 'svelte';

	type Caption = {
		title?: string;
		body: string | string[];
	};

	function bodyParagraphs(body: string | string[]): string[] {
		return Array.isArray(body) ? body : [body];
	}

	type Props = {
		captions: Caption[];
		graphic: Snippet<[number]>;
		/** Section heading in the narrative column */
		intro?: Snippet;
		activeStep?: number;
		/** Shorter sticky panel (e.g. bar chart) instead of full viewport height */
		compactGraphic?: boolean;
		/** Shorter min-height on step cards (bar-chart section) */
		compactSteps?: boolean;
		/** On narrow screens, show graphic between intro and step cards (Section 2 bar chart) */
		leadWithGraphicOnMobile?: boolean;
	};

	let {
		captions,
		graphic,
		intro,
		activeStep = $bindable(0),
		compactGraphic = false,
		compactSteps = false,
		leadWithGraphicOnMobile = false
	}: Props = $props();

	let stepsRoot = $state<HTMLDivElement | null>(null);

	$effect(() => {
		void captions;
		if (!stepsRoot) return;
		const elements = [...stepsRoot.querySelectorAll<HTMLElement>('[data-step-index]')];
		if (!elements.length) return;

		/** Overlap height (px) between an element and the bottom third of the viewport. */
		function overlapWithBottomThird(rect: DOMRect): number {
			const vh = window.innerHeight;
			const bandTop = vh * (2 / 3);
			const y0 = Math.max(rect.top, bandTop);
			const y1 = Math.min(rect.bottom, vh);
			return Math.max(0, y1 - y0);
		}

		function updateActiveStep(): void {
			let bestEl: HTMLElement | null = null;
			let bestOverlap = 0;

			for (const el of elements) {
				const overlap = overlapWithBottomThird(el.getBoundingClientRect());
				if (overlap > bestOverlap) {
					bestOverlap = overlap;
					bestEl = el;
				}
			}

			if (!bestEl || bestOverlap <= 0) return;

			const idx = Number(bestEl.dataset.stepIndex);
			if (!Number.isNaN(idx)) activeStep = idx;
		}

		let scrollRaf = 0;
		const onScroll = () => {
			cancelAnimationFrame(scrollRaf);
			scrollRaf = requestAnimationFrame(updateActiveStep);
		};

		const observer = new IntersectionObserver(
			() => updateActiveStep(),
			{
				threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
				rootMargin: '-66.666% 0px 0px 0px'
			}
		);

		for (const el of elements) observer.observe(el);
		window.addEventListener('scroll', onScroll, { passive: true });
		updateActiveStep();

		return () => {
			observer.disconnect();
			window.removeEventListener('scroll', onScroll);
			cancelAnimationFrame(scrollRaf);
		};
	});
</script>

<!--
  Narrative always column 1, graphic column 2 on md+ (DOM: intro → steps → graphic).
  leadWithGraphicOnMobile: intro → graphic → steps on narrow screens only.
  activeStep: the step card with the largest overlap in the bottom third of the viewport.
-->
<div
	class="grid w-full grid-cols-1 gap-6 pb-24 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-8 md:pb-32 lg:gap-10"
	class:pt-8={!compactGraphic}
	class:pt-0={compactGraphic}
>
	{#if intro}
		<div
			class="scroll-mt-28 px-5 sm:px-8 md:col-start-1 md:row-start-1 md:max-w-xl md:justify-self-end md:px-6 lg:px-8 xl:pr-12"
			class:order-1={leadWithGraphicOnMobile}
		>
			{@render intro()}
		</div>
	{/if}

	<div
		bind:this={stepsRoot}
		class="px-5 sm:px-8 md:col-start-1 md:max-w-xl md:justify-self-end md:px-6 lg:px-8 xl:pr-12"
		class:order-3={leadWithGraphicOnMobile}
		class:md:order-none={leadWithGraphicOnMobile}
		class:md:row-start-1={!intro}
		class:md:row-start-2={!!intro}
	>
		{#each captions as caption, i (i)}
			<article
				data-step-index={i}
				class="flex flex-col justify-end scroll-mt-28 pb-6"
				class:min-h-[100svh]={!compactSteps}
				class:min-h-[min(100svh,560px)]={compactSteps}
			>
				<div class="rounded-sm border border-line bg-white p-6 shadow-sm sm:p-8">
					{#if caption.title}
						<h3 class="text-[30px] font-bold leading-tight tracking-tight text-ink">{caption.title}</h3>
					{/if}
					{#each bodyParagraphs(caption.body) as para, j (j)}
						<p
							class="text-[21px] leading-relaxed text-ink"
							class:mt-4={j === 0}
							class:mt-3={j > 0}
						>
							{para}
						</p>
					{/each}
				</div>
			</article>
		{/each}
	</div>

	<div
		class="relative w-full min-h-0 md:col-start-2 md:row-start-1"
		class:md:row-span-2={!!intro}
		class:order-2={leadWithGraphicOnMobile}
		class:md:order-none={leadWithGraphicOnMobile}
	>
		<div
			class="min-h-[280px] w-full overflow-hidden md:sticky md:top-0 md:z-10"
			class:max-md:h-[100svh]={!compactGraphic}
			class:md:h-[100svh]={!compactGraphic}
			class:max-md:sticky={compactGraphic}
			class:max-md:top-0={compactGraphic}
			class:max-md:z-10={compactGraphic}
			class:max-md:h-[min(48vh,420px)]={compactGraphic}
			class:md:h-[min(92vh,480px)]={compactGraphic}
		>
			{@render graphic(activeStep)}
		</div>
	</div>
</div>
