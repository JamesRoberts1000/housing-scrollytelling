<script lang="ts">
	import type { Snippet } from 'svelte';

	type Caption = {
		title?: string;
		body: string | string[];
	};

	function bodyParagraphs(body: string | string[]): string[] {
		return Array.isArray(body) ? body : [body];
	}

function parseBoldSegments(para: string): { text: string; bold: boolean }[] {
	const parts = para.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
	return parts.map((part) => {
		const bold = part.startsWith('**') && part.endsWith('**') && part.length > 4;
		return { text: bold ? part.slice(2, -2) : part, bold };
	});
}

	type Props = {
		captions: Caption[];
		graphic: Snippet<[number]>;
		/** Full-width centred section heading above the scrolly grid */
		heading?: Snippet;
		activeStep?: number;
		/** Shorter sticky panel (e.g. bar chart) instead of full viewport height */
		compactGraphic?: boolean;
		/** Shorter min-height on step cards (bar-chart section) */
		compactSteps?: boolean;
	/** Pixel min-height used when compactSteps is enabled */
	compactStepMinHeight?: number;
		/** On narrow screens, show graphic before step cards (Section 2 bar chart) */
		leadWithGraphicOnMobile?: boolean;
		/** Keep viewport for graphic before first caption enters */
		introGraphicOnly?: boolean;
		/** Vertical trigger line as viewport fraction (0 top → 1 bottom) */
		triggerLine?: number;
		/** Advance step when next card reaches top edge */
		advanceOnTopEdge?: boolean;
		/** Use the caption card box for the trigger line, not the full-height step article */
		triggerOnCaption?: boolean;
		/** Extra scroll runway after the last caption so the sticky graphic stays pinned until it scrolls off the top */
		tailScrollMinHeight?: string;
		/** Stretch the sticky graphic to fill the viewport (disable for Section 3 map zoom behaviour) */
		graphicFillHeight?: boolean;
	};

	let {
		captions,
		graphic,
		heading,
		activeStep = $bindable(0),
		compactGraphic = false,
		compactSteps = false,
	compactStepMinHeight = 560,
		leadWithGraphicOnMobile = false,
		introGraphicOnly = false,
		triggerLine = 2 / 3,
		advanceOnTopEdge = false,
		triggerOnCaption = false,
		tailScrollMinHeight = '100svh',
		graphicFillHeight = true
	}: Props = $props();

	let stepsRoot = $state<HTMLDivElement | null>(null);

	$effect(() => {
		void captions;
		void triggerOnCaption;
		void triggerLine;
		void advanceOnTopEdge;
		if (!stepsRoot) return;
		const elements = [...stepsRoot.querySelectorAll<HTMLElement>('[data-step-index]')];
		if (!elements.length) return;

		function triggerRect(el: HTMLElement): DOMRect {
			if (!triggerOnCaption) return el.getBoundingClientRect();
			const caption = el.querySelector<HTMLElement>('[data-caption]');
			return (caption ?? el).getBoundingClientRect();
		}

		function updateActiveStep(): void {
			if (advanceOnTopEdge) {
				let nextStep = 0;
				for (const el of elements) {
					const rect = triggerRect(el);
					const idx = Number(el.dataset.stepIndex);
					if (!Number.isNaN(idx) && rect.top <= 0) {
						nextStep = Math.max(nextStep, idx);
					}
				}
				activeStep = nextStep;
				return;
			}

			const vh = window.innerHeight;
			const markerY = vh * triggerLine;
			let nextStep = 0;
			for (const el of elements) {
				const rect = triggerRect(el);
				const idx = Number(el.dataset.stepIndex);
				if (Number.isNaN(idx)) continue;
				// Prefer the highest-index step whose caption contains the marker.
				if (rect.top <= markerY && rect.bottom >= markerY) {
					nextStep = Math.max(nextStep, idx);
				}
			}
			if (nextStep === 0) {
				// Between cards: keep the last step whose top has passed the marker.
				for (const el of elements) {
					const rect = triggerRect(el);
					const idx = Number(el.dataset.stepIndex);
					if (!Number.isNaN(idx) && rect.top <= markerY) {
						nextStep = Math.max(nextStep, idx);
					}
				}
			}
			activeStep = nextStep;
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
  heading: full-width centred title above the two-column grid.
  Narrative column 1, graphic column 2 on md+ (DOM: steps → graphic).
  leadWithGraphicOnMobile: graphic → steps on narrow screens only.
  activeStep: the step card with the largest overlap in the bottom third of the viewport.
-->
<div class="w-full">
	{#if heading}
		<header
			class="scroll-mt-28 px-5 pb-8 text-center sm:px-10 md:pb-10 lg:px-16"
			class:pt-8={!compactGraphic}
			class:pt-0={compactGraphic}
		>
			{@render heading()}
		</header>
	{/if}

	<div
		class="grid w-full grid-cols-1 gap-6 pb-24 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-8 md:pb-32 lg:gap-10"
		class:pt-8={!heading && !compactGraphic}
		class:pt-0={heading || compactGraphic}
	>
	<div
		bind:this={stepsRoot}
		class="px-5 sm:px-8 md:col-start-1 md:row-start-1 md:max-w-xl md:justify-self-end md:px-6 lg:px-8 xl:pr-12"
		class:order-3={leadWithGraphicOnMobile}
		class:md:order-none={leadWithGraphicOnMobile}
	>
		{#if introGraphicOnly}
			<div
				aria-hidden="true"
				class="scroll-mt-28 pb-6"
				style:min-height={compactSteps ? `min(100svh, ${compactStepMinHeight}px)` : '100svh'}
			></div>
		{/if}
		{#each captions as caption, i (i)}
			<article
				data-step-index={i}
				class="flex flex-col justify-end scroll-mt-28 pb-6"
				style:min-height={compactSteps ? `min(100svh, ${compactStepMinHeight}px)` : '100svh'}
			>
				<div data-caption class="rounded-sm bg-white p-6 sm:p-8">
					{#if caption.title}
						<h3 class="text-[30px] font-bold leading-tight tracking-tight text-ink">{caption.title}</h3>
					{/if}
					{#each bodyParagraphs(caption.body) as para, j (j)}
						<p
							class="text-[21px] leading-relaxed text-ink"
							class:mt-4={j === 0}
							class:mt-3={j > 0}
						>
							{#each parseBoldSegments(para) as segment}
								<span class:font-bold={segment.bold}>{segment.text}</span>
							{/each}
						</p>
					{/each}
				</div>
			</article>
		{/each}
		{#if tailScrollMinHeight}
			<div aria-hidden="true" class="pb-6" style:min-height={tailScrollMinHeight}></div>
		{/if}
	</div>

	<div
		class="relative w-full min-h-0 md:col-start-2 md:row-start-1"
		class:order-2={leadWithGraphicOnMobile}
		class:md:order-none={leadWithGraphicOnMobile}
	>
		<div
			class="min-h-[280px] w-full md:sticky md:top-0 md:z-10"
			class:flex={graphicFillHeight}
			class:flex-col={graphicFillHeight}
			class:h-full={graphicFillHeight && !compactGraphic}
			class:min-h-0={graphicFillHeight && !compactGraphic}
			class:overflow-hidden={!compactGraphic}
			class:overflow-visible={compactGraphic}
			class:max-md:h-[100svh]={!compactGraphic}
			class:md:h-[100svh]={!compactGraphic}
			class:max-md:sticky={compactGraphic}
			class:max-md:top-0={compactGraphic}
			class:max-md:z-10={compactGraphic}
			class:max-md:h-[min(56vh,480px)]={compactGraphic}
			class:md:h-[min(92vh,580px)]={compactGraphic}
			class:md:min-h-0={compactGraphic}
		>
			{@render graphic(activeStep)}
		</div>
	</div>
	</div>
</div>
