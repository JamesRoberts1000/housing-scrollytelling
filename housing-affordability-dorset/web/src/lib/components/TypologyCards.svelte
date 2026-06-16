<script lang="ts">
	import {
		STEP_INTRO,
		STEP_SYNTHESIS,
		SYSTEM_COLORS,
		SYSTEM_GLYPHS,
		SYSTEM_LABELS,
		SYSTEM_ORDER,
		SYSTEM_TRAITS,
		stepFocusSystem
	} from '$lib/constants/housingMarketTypologyStory';
	import type { HousingMarketSystem, HousingMarketTypologySummary } from '$lib/types/housingMarketTypology';

	type Layout = 'overlay' | 'stacked';

	type Props = {
		step?: number;
		summary: HousingMarketTypologySummary;
		layout?: Layout;
	};

	let { step = 0, summary, layout = 'overlay' }: Props = $props();

	const isSpotlight = $derived(stepFocusSystem(step) !== null);
	const systems = $derived(visibleSystems(step));

	function visibleSystems(s: number): HousingMarketSystem[] {
		if (s === STEP_INTRO || s === STEP_SYNTHESIS) return SYSTEM_ORDER;
		const focus = stepFocusSystem(s);
		return focus ? [focus] : [];
	}

	function systemCount(system: HousingMarketSystem): number {
		if (system === 'rural_lifestyle') return summary.ruralLifestyleCount;
		if (system === 'urban_working_coastal') return summary.urbanWorkingCount;
		return summary.retirementAmenityCount;
	}

	function isActive(system: HousingMarketSystem): boolean {
		if (step === STEP_SYNTHESIS) return true;
		if (step === STEP_INTRO) return false;
		return stepFocusSystem(step) === system;
	}

	function cardOpacity(): number {
		if (step === STEP_SYNTHESIS) return 1;
		if (step === STEP_INTRO) return 0.55;
		return 1;
	}

	function hasOpaqueBackground(system: HousingMarketSystem): boolean {
		return isActive(system) && step !== STEP_INTRO;
	}

	function cardSurfaceClass(system: HousingMarketSystem): string {
		return hasOpaqueBackground(system)
			? 'bg-white/95 shadow-md backdrop-blur-sm'
			: 'bg-transparent';
	}
</script>

{#if layout === 'overlay'}
	<div
		class="pointer-events-none absolute inset-x-0 bottom-0 z-[20] flex px-3 pb-3 sm:px-5 sm:pb-4"
		class:justify-center={!isSpotlight}
		class:justify-start={isSpotlight}
		aria-hidden={step === STEP_INTRO}
	>
		<div
			class="flex gap-2 pb-1 transition-all duration-500 motion-reduce:transition-none"
			class:w-full={!isSpotlight}
			class:max-w-5xl={!isSpotlight}
			class:snap-x={!isSpotlight}
			class:snap-mandatory={!isSpotlight}
			class:overflow-x-auto={!isSpotlight}
			class:sm:grid={!isSpotlight}
			class:sm:grid-cols-3={!isSpotlight}
			class:sm:gap-3={!isSpotlight}
			class:sm:overflow-visible={!isSpotlight}
			class:sm:pb-0={!isSpotlight}
			class:opacity-90={step === STEP_INTRO}
		>
			{#each systems as system (system)}
				<article
					class="shrink-0 snap-start rounded-sm border px-3 py-2.5 transition-all duration-500 motion-reduce:transition-none sm:px-3.5 sm:py-3 {cardSurfaceClass(system)}"
					class:w-[min(85vw,16rem)]={isSpotlight}
					class:sm:w-[min(20rem,28vw)]={isSpotlight}
					class:sm:w-auto={!isSpotlight}
					class:border-line={!hasOpaqueBackground(system)}
					class:border-ink={hasOpaqueBackground(system)}
					class:ring-1={hasOpaqueBackground(system)}
					class:ring-ink={hasOpaqueBackground(system)}
					style:opacity={cardOpacity()}
					style:transform={hasOpaqueBackground(system) ? 'translateY(-2px)' : 'none'}
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
{:else}
	<div class="shrink-0 px-3 pb-3 pt-2 sm:px-5 sm:pb-4">
		<div
			class="mx-auto grid w-full max-w-5xl grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3"
		>
			{#each systems as system (system)}
				<article
					class="rounded-sm border border-line bg-white/95 px-3 py-2.5 shadow-sm sm:px-3.5 sm:py-3"
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
{/if}
