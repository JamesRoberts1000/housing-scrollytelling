<script lang="ts">
	type Props = {
		label: string;
		step?: number;
	};

	let { label, step = 0 }: Props = $props();
</script>

<div
	class="flex h-full min-h-0 w-full flex-col items-center justify-center px-5 py-8 sm:px-8"
	aria-hidden="true"
>
	<div
		class="flex w-full max-w-xl flex-col items-center justify-center rounded-sm border border-dashed border-line bg-[#f3f2f1] px-8 py-16 text-center"
	>
		<p class="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Chart placeholder</p>
		<p class="mt-3 text-lg leading-relaxed text-ink">{label}</p>
		<p class="mt-6 text-sm text-muted">Scroll step {step + 1} — visualisation to follow</p>
	</div>
</div>
