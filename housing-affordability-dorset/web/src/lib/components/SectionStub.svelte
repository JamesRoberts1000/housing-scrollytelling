<script lang="ts">
	type Props = {
		id: string;
		eyebrow: string;
		title: string;
		body: string;
	};

	let { id, eyebrow, title, body }: Props = $props();
</script>

<section
	{id}
	class="border-t border-line px-5 py-20 sm:px-10 lg:px-16"
	aria-labelledby="{`${id}-heading`}"
>
	<p class="text-sm uppercase tracking-[0.18em] text-muted">{eyebrow}</p>
	<h2 id="{`${id}-heading`}" class="mx-auto mt-10 mb-5 w-full max-w-[680px] text-left text-[30px] font-bold leading-[45px] text-ink">{title}</h2>
	<p class="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{body}</p>
	<div class="mt-10 rounded-sm border border-dashed border-line bg-[#f3f2f1] p-8 text-sm text-muted">
		Visualisation placeholder — data wiring and chart design in a later milestone.
	</div>
</section>
