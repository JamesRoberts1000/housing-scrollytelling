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

<div
	class="mx-auto grid max-w-6xl gap-12 px-5 pb-24 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:px-10"
>
	<div bind:this={stepsRoot} class="space-y-6">
		{#each captions as caption, i (i)}
			<article
				data-step-index={i}
				class="min-h-[65vh] scroll-mt-28 rounded-md border border-line bg-white/50 p-6 shadow-sm sm:p-8"
			>
				<h3 class="font-serif text-2xl text-ink">{caption.title}</h3>
				<p class="mt-4 text-base leading-relaxed text-muted">{caption.body}</p>
			</article>
		{/each}
	</div>

	<div class="relative lg:sticky lg:top-28 lg:h-[min(78vh,calc(100vh-8rem))]">
		<div class="h-full min-h-[320px] overflow-hidden rounded-md border border-line bg-paper shadow-sm">
			{@render graphic(activeStep)}
		</div>
	</div>
</div>
