<section
	class="relative flex min-h-[85vh] flex-col justify-end gap-6 px-5 pb-20 pt-28 sm:px-10 lg:px-16"
	aria-labelledby="hero-heading"
>
	<div
		class="pointer-events-none absolute inset-0 opacity-[0.04]"
		aria-hidden="true"
		style="background-image: radial-gradient(circle at 30% 20%, #206095 0, transparent 55%), radial-gradient(circle at 70% 60%, #505a5f 0, transparent 50%);"
	></div>
	<h1
		id="hero-heading"
		class="relative max-w-[22ch] text-[54px] font-bold leading-tight tracking-tight text-ink"
	>
		How does housing affordability vary across Dorset?
	</h1>
	<p class="relative max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
		Housing affordability varies across Dorset’s neighbourhoods — from relatively accessible coastal
		towns to rural areas where homes cost many times annual earnings.
	</p>
	<div class="relative flex items-center" aria-hidden="true">
		<svg
			class="scroll-hint-icon"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M12 5v14M5 12l7 7 7-7" />
		</svg>
		<p class="text-sm text-muted">Scroll to explore</p>
	</div>
</section>

<style>
	.scroll-hint-icon {
		width: 48px;
		height: 48px;
		margin-right: 10px;
		flex-shrink: 0;
		color: #505a5f;
		animation: scroll-hint-bounce 2s ease infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		.scroll-hint-icon {
			animation: none;
		}
	}

	@keyframes scroll-hint-bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(10px);
		}
	}
</style>
