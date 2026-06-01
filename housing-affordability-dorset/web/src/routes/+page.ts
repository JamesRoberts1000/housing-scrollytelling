import {
	loadMsoaRatiosFetch,
	loadNationalContextBarsFetch,
	msoaRatioDistribution,
	ratioByMsoaCode
} from '$lib/data/loadAffordabilityData';
import { loadAgeAffordabilityFetch } from '$lib/data/loadAgeAffordabilityData';
import { loadCoastalInlandFetch } from '$lib/data/loadCoastalInlandData';
import { loadRuralUrbanFetch } from '$lib/data/loadRuralUrbanData';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const [msoaRows, bars, ruralUrban, coastalInland, ageAffordability] = await Promise.all([
		loadMsoaRatiosFetch(fetch),
		loadNationalContextBarsFetch(fetch),
		loadRuralUrbanFetch(fetch),
		loadCoastalInlandFetch(fetch),
		loadAgeAffordabilityFetch(fetch)
	]);
	const ratioByMsoa = Object.fromEntries(ratioByMsoaCode(msoaRows));
	const msoaDistribution = msoaRatioDistribution(msoaRows);
	const msoaNameByCode = Object.fromEntries(
		msoaRows.map((r) => {
			const code = String(r['MSOA code'] ?? '').trim();
			const name = String(r['MSOA name'] ?? '').trim();
			return [code, name] as const;
		}).filter(([code]) => code)
	);
	return {
		msoaRows,
		bars,
		ruralUrban,
		coastalInland,
		ageAffordability,
		ratioByMsoa,
		msoaDistribution,
		msoaNameByCode
	};
};
