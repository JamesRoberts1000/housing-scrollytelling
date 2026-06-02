export type HousingTypeKey = 'overall' | 'detached' | 'semiDetached' | 'terraced' | 'flats';

export type HousingTypeAffordabilityRow = {
	code: string;
	name: string;
	overall: number;
	detached: number;
	semiDetached: number;
	terraced: number;
	flats: number;
	/** positive values mean flats are more affordable than overall */
	overallMinusFlats: number;
	/** number of valid dwelling-type affordability values in this row */
	validTypeCount: number;
	/** true when flats value exists and is finite */
	hasFlats: boolean;
};

export type HousingTypeAffordabilitySummary = {
	count: number;
	availableFlatsCount: number;
	medianOverallMinusFlats: number;
	maxOverallMinusFlats: number;
	minOverallMinusFlats: number;
};

export type HousingTypeAffordabilityBundle = {
	rows: HousingTypeAffordabilityRow[];
	summary: HousingTypeAffordabilitySummary;
};
