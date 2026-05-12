<script lang="ts">
	import type { Snippet } from 'svelte';

	type Caption = {
		title: string;
		body: string;
	};

	type Props = {
		captions: Caption[];
		graphic: Snippet<[number]>;
		activeStep?: number;
	};

	let { captions, graphic, activeStep = $bindable(0) }: Props = $props();

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
  ONS-style scrolly: narrative ~left third, sticky map ~right two-thirds (md+).
  Sticky must live inside a grid item that stretches to the full row height (tall narrative column).
  Do not put `position:sticky` and a fixed height on the same element as the grid cell — that shrinks
  the cell incorrectly and the map scrolls away instead of sticking.
  Map panel uses the small viewport height (svh) and sticks flush to the viewport top so the canvas
  can fill the visible screen (no reserved top-24 band).
-->
<div
	class="grid w-full grid-cols-1 gap-10 pb-24 pt-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-8 md:pb-32 lg:gap-10"
>
	<div
		bind:this={stepsRoot}
		class="space-y-6 px-5 sm:px-8 md:max-w-xl md:justify-self-end md:px-6 lg:px-8 xl:pr-12"
	>
		{#each captions as caption, i (i)}
			<article
				data-step-index={i}
				class="min-h-[65vh] scroll-mt-28 rounded-sm border border-line bg-white p-6 shadow-sm sm:p-8"
			>
				<h3 class="text-[30px] font-bold leading-tight tracking-tight text-ink">{caption.title}</h3>
				<p class="mt-4 text-[21px] leading-relaxed text-muted">{caption.body}</p>
			</article>
		{/each}
	</div>

	<!-- Outer cell stretches with the narrative row; inner panel is sticky + viewport-tall (md+) -->
	<div class="relative w-full min-h-0 md:min-h-0">
		<div
			class="min-h-[320px] w-full overflow-hidden max-md:h-[100svh] md:sticky md:top-0 md:z-10 md:h-[100svh]"
		>
			{@render graphic(activeStep)}
		</div>
	</div>
</div>
