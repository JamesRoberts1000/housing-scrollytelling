export type RegionRow = {
	Code: string;
	Name: string;
	medianRatio: number;
	lowerQuartileRatio: number;
};

export type DorsetLaRow = {
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
	medianRatio: number;
	lowerQuartileRatio: number;
};
