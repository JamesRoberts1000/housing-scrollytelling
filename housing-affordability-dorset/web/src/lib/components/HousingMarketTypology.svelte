<script lang="ts">
	import TypologyCards from '$lib/components/TypologyCards.svelte';
	import TypologyMap from '$lib/components/TypologyMap.svelte';
	import type { HousingMarketTypologyBundle } from '$lib/types/housingMarketTypology';

	type Props = {
		data: HousingMarketTypologyBundle;
		step?: number;
	};

	let { data, step = 0 }: Props = $props();
</script>

<div class="relative flex h-full min-h-0 w-full flex-col">
	<TypologyMap {data} {step} />
	<TypologyCards summary={data.summary} {step} />
</div>
