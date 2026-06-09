<script lang="ts">
	import { formatRatio } from '$lib/charts/boxStrip';
	import AccessibleDataTable from '$lib/components/AccessibleDataTable.svelte';
	import TypologyCards from '$lib/components/TypologyCards.svelte';
	import TypologyMap from '$lib/components/TypologyMap.svelte';
	import {
		SYSTEM_SHORT_LABELS,
		stepAriaLabel,
		stepMapDescription
	} from '$lib/constants/housingMarketTypologyStory';
	import type { HousingMarketTypologyBundle } from '$lib/types/housingMarketTypology';

	type Props = {
		data: HousingMarketTypologyBundle;
		step?: number;
	};

	let { data, step = 0 }: Props = $props();

	const sortedRows = $derived(
		[...data.rows].sort((a, b) => a.name.localeCompare(b.name, 'en'))
	);
	const mapDescriptionId = 'typology-map-description';
</script>

<div
	class="flex h-full min-h-0 w-full flex-col"
	role="region"
	aria-label={stepAriaLabel(step)}
	aria-describedby={mapDescriptionId}
>
	<a href="#typology-map-data" class="skip-link">Skip to housing market data table</a>
	<p id={mapDescriptionId} class="sr-only">{stepMapDescription(step, data.rows.length)}</p>

	<div class="relative min-h-0 flex-1">
		<TypologyMap {data} {step} />
		<TypologyCards summary={data.summary} {step} />
	</div>

	<AccessibleDataTable
		id="typology-map-data"
		summaryLabel="View housing market data ({sortedRows.length} areas)"
		caption="Housing market typology assignments for Dorset MSOAs"
		rows={sortedRows}
		rowKey={(row) => row.code}
		columns={[
			{ header: 'Neighbourhood', value: (row) => row.name },
			{ header: 'Housing market', value: (row) => SYSTEM_SHORT_LABELS[row.system] },
			{ header: 'Affordability ratio', value: (row) => formatRatio(row.ratio) },
			{ header: 'Aged 65+', value: (row) => `${row.pct65Plus.toFixed(1)}%` }
		]}
	/>
</div>
