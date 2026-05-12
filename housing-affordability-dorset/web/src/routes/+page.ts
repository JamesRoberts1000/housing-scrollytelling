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
	return { msoaRows, bars, ratioByMsoa, msoaDistribution };
};
