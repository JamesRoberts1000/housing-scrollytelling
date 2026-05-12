import {
	loadMsoaRatiosFetch,
	loadNationalContextBarsFetch,
	msoaRatioDistribution,
	ratioByMsoaCode
} from '$lib/data/loadAffordabilityData';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const msoaRows = await loadMsoaRatiosFetch(fetch);
	const bars = await loadNationalContextBarsFetch(fetch);
	const ratioByMsoa = Object.fromEntries(ratioByMsoaCode(msoaRows));
	const msoaDistribution = msoaRatioDistribution(msoaRows);
	const msoaNameByCode = Object.fromEntries(
		msoaRows.map((r) => {
			const code = String(r['MSOA code'] ?? '').trim();
			const name = String(r['MSOA name'] ?? '').trim();
			return [code, name] as const;
		}).filter(([code]) => code)
	);
	return { msoaRows, bars, ratioByMsoa, msoaDistribution, msoaNameByCode };
};
