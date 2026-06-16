export type RegionRow = {
	Code: string;
	Name: string;
	medianHousePrice: number;
	medianEarnings: number;
	medianRatio: number;
	lowerQuartileRatio: number;
};

export type DorsetLaRow = {
	medianHousePrice: number;
	medianEarnings: number;
	medianRatio: number;
	lowerQuartileRatio: number;
};

export type MsoaRatioRow = {
	'Local authority code': string;
	'Local authority name': string;
	'MSOA code': string;
	'MSOA name': string;
	[key: string]: string | number | undefined;
};

export type BarDatum = {
	label: string;
	medianHousePrice: number;
	medianEarnings: number;
	medianRatio: number;
	lowerQuartileRatio: number;
};
