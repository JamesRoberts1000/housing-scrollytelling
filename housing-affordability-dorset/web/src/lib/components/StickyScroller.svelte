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
		/** Section heading in the narrative column; on mobile appears before the graphic */
		intro?: Snippet;
		activeStep?: number;
		/** Shorter sticky panel (e.g. bar chart) instead of full viewport height */
		compactGraphic?: boolean;
		/** Shorter min-height on step cards (bar-chart section) */
		compactSteps?: boolean;
	};

	let {
		captions,
		graphic,
		intro,
		activeStep = $bindable(0),
		compactGraphic = false,
		compactSteps = false
	}: Props = $props();

	let stepsRoot = $state<HTMLDivElement | null>(null);

	$effect(() => {
		void captions;
		if (!stepsRoot) return;
		const elements = [...stepsRoot.querySelectorAll<HTMLElement>('[data-step-index]')];
		if (!elements.length) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries.filter((entry) => entry.isIntersecting);
				if (!visible.length) return;
				const best = visible.sort(
					(a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0)
				)[0];
				const idx = Number(best.target.dataset.stepIndex);
				if (!Number.isNaN(idx)) activeStep = idx;
			},
			{ threshold: [0.2, 0.35, 0.55, 0.75], rootMargin: '-22% 0px -32% 0px' }
		);

		for (const el of elements) observer.observe(el);
		return () => observer.disconnect();
	});
</script>

<!--
  ONS-style scrolly: narrative ~left third, sticky graphic ~right two-thirds (md+).
  With intro: DOM order is intro → graphic → steps on mobile (heading, chart, copy).
  Sticky must live inside a grid item that stretches to the full row height (tall narrative column).
-->
<div
	class="grid w-full grid-cols-1 gap-6 pb-24 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-8 md:pb-32 lg:gap-10"
	class:pt-8={!compactGraphic}
	class:pt-0={compactGraphic}
>
	{#if intro}
		<div
			class="scroll-mt-28 px-5 sm:px-8 md:col-start-1 md:row-start-1 md:max-w-xl md:justify-self-end md:px-6 lg:px-8 xl:pr-12"
		>
			{@render intro()}
		</div>
	{/if}

	<div
		class="relative w-full min-h-0 md:min-h-0"
		class:md:col-start-2={!!intro}
		class:md:row-start-1={!!intro}
		class:md:row-span-2={!!intro}
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

	<div
		bind:this={stepsRoot}
		class="space-y-6 px-5 sm:px-8 md:max-w-xl md:justify-self-end md:px-6 lg:px-8 xl:pr-12"
		class:md:col-start-1={!!intro}
		class:md:row-start-2={!!intro}
	>
		{#each captions as caption, i (i)}
			<article
				data-step-index={i}
				class="scroll-mt-28 rounded-sm border border-line bg-white p-6 shadow-sm sm:p-8"
				class:min-h-[65vh]={!compactSteps}
				class:min-h-[45vh]={compactSteps}
			>
				{#if caption.title}
					<h3 class="text-[30px] font-bold leading-tight tracking-tight text-ink">{caption.title}</h3>
				{/if}
				{#each bodyParagraphs(caption.body) as para, j (j)}
					<p
						class="text-[21px] leading-relaxed text-muted"
						class:mt-4={j === 0}
						class:mt-3={j > 0}
					>
						{para}
					</p>
				{/each}
			</article>
		{/each}
	</div>
</div>
