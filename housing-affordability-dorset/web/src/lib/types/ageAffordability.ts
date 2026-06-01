export type MsoaAgeAffordabilityRow = {
	code: string;
	name: string;
	ratio: number;
	pct65Plus: number;
	populationTotal: number;
};

export type AgeAffordabilitySummary = {
	count: number;
	pct65Min: number;
	pct65Max: number;
	/** Population-weighted share aged 65+ across all Dorset MSOAs. */
	dorsetPct65Plus: number;
	ratioMin: number;
	ratioMax: number;
	correlation: number;
};

export type AgeAffordabilityBundle = {
	rows: MsoaAgeAffordabilityRow[];
	summary: AgeAffordabilitySummary;
};
