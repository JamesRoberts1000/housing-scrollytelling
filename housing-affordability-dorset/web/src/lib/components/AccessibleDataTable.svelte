<script lang="ts" generics="T">
	type Column = {
		header: string;
		value: (row: T) => string;
	};

	type Props = {
		id: string;
		summaryLabel: string;
		caption: string;
		columns: Column[];
		rows: T[];
		rowKey: (row: T) => string;
	};

	let { id, summaryLabel, caption, columns, rows, rowKey }: Props = $props();
</script>

<details
	{id}
	class="mx-3 mb-3 rounded-sm border border-line bg-white/95 px-3 py-2 text-left shadow-sm sm:mx-4"
>
	<summary class="cursor-pointer text-sm font-semibold text-ink">{summaryLabel}</summary>
	<div class="mt-3 max-h-48 overflow-auto">
		<table class="w-full border-collapse text-left text-sm text-ink">
			<caption class="sr-only">{caption}</caption>
			<thead>
				<tr class="border-b border-line">
					{#each columns as col}
						<th scope="col" class="px-2 py-1.5 font-semibold">{col.header}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rows as row (rowKey(row))}
					<tr class="border-b border-line/60 last:border-0">
						{#each columns as col}
							<td class="px-2 py-1.5 align-top text-muted">{col.value(row)}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</details>
