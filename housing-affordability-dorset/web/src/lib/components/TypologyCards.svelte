<script lang="ts">
	import {
		STEP_INTRO,
		STEP_RURAL_LIFESTYLE,
		STEP_RETIREMENT_AMENITY,
		STEP_SYNTHESIS,
		STEP_URBAN_WORKING,
		SYSTEM_COLORS,
		SYSTEM_GLYPHS,
		SYSTEM_LABELS,
		SYSTEM_ORDER,
		SYSTEM_TRAITS
	} from '$lib/constants/housingMarketTypologyStory';
	import type { HousingMarketSystem, HousingMarketTypologySummary } from '$lib/types/housingMarketTypology';

	type Props = {
		step?: number;
		summary: HousingMarketTypologySummary;
	};

	let { step = 0, summary }: Props = $props();

	function systemCount(system: HousingMarketSystem): number {
		if (system === 'rural_lifestyle') return summary.ruralLifestyleCount;
		if (system === 'urban_working_coastal') return summary.urbanWorkingCount;
		return summary.retirementAmenityCount;
	}

	function isActive(system: HousingMarketSystem): boolean {
		if (step === STEP_SYNTHESIS) return true;
		if (step === STEP_INTRO) return false;
		if (step === STEP_RURAL_LIFESTYLE) return system === 'rural_lifestyle';
		if (step === STEP_URBAN_WORKING) return system === 'urban_working_coastal';
		if (step === STEP_RETIREMENT_AMENITY) return system === 'retirement_amenity';
		return false;
	}

	function cardOpacity(system: HousingMarketSystem): number {
		if (step === STEP_SYNTHESIS) return 1;
		if (step === STEP_INTRO) return 0.55;
		return isActive(system) ? 1 : 0.42;
	}
</script>

<div
	class="pointer-events-none absolute inset-x-0 bottom-0 z-[20] flex justify-center px-3 pb-3 sm:px-5 sm:pb-4"
	aria-hidden={step === STEP_INTRO}
>
	<div
		class="flex w-full max-w-5xl snap-x snap-mandatory gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:pb-0"
		class:opacity-90={step === STEP_INTRO}
	>
		{#each SYSTEM_ORDER as system (system)}
			<article
				class="w-[min(85vw,16rem)] shrink-0 snap-start rounded-sm border bg-white/92 px-3 py-2.5 shadow-sm transition-all duration-500 motion-reduce:transition-none sm:w-auto sm:px-3.5 sm:py-3"
				class:border-line={!isActive(system)}
				class:border-ink={isActive(system) && step !== STEP_SYNTHESIS}
				class:ring-1={isActive(system) && step !== STEP_SYNTHESIS}
				class:ring-ink={isActive(system) && step !== STEP_SYNTHESIS}
				style:opacity={cardOpacity(system)}
				style:transform={isActive(system) && step !== STEP_INTRO && step !== STEP_SYNTHESIS
					? 'translateY(-2px)'
					: 'none'}
			>
				<div class="flex items-start gap-2">
					<span
						class="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-sm"
						style:background={SYSTEM_COLORS[system]}
					></span>
					<div class="min-w-0 flex-1">
						<h3 class="text-[13px] font-bold leading-snug text-ink sm:text-[14px]">
							{SYSTEM_LABELS[system]}
						</h3>
						<p class="mt-0.5 text-[11px] text-muted sm:text-[12px]">
							{systemCount(system)} neighbourhoods
						</p>
					</div>
				</div>

				<ul class="mt-2 space-y-1 text-[11px] leading-snug text-muted sm:text-[12px]">
					{#each SYSTEM_TRAITS[system] as trait}
						<li class="flex gap-1.5">
							<span aria-hidden="true">·</span>
							<span>{trait}</span>
						</li>
					{/each}
				</ul>

				<div class="mt-2 flex flex-wrap gap-1.5">
					{#each SYSTEM_GLYPHS[system] as glyph}
						<span
							class="rounded-sm border border-line bg-[#f3f2f1] px-1.5 py-0.5 text-[10px] font-medium text-ink sm:text-[11px]"
						>
							{glyph}
						</span>
					{/each}
				</div>
			</article>
		{/each}
	</div>
</div>
