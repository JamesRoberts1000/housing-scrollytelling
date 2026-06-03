export type HousingMarketSystem =
	| 'rural_lifestyle'
	| 'urban_working_coastal'
	| 'retirement_amenity';

export type MsoaHousingMarketTypologyRow = {
	code: string;
	name: string;
	system: HousingMarketSystem;
	scoreRuralLifestyle: number;
	scoreUrbanWorking: number;
	scoreRetirementAmenity: number;
	ratio: number;
	coastalInland: 'Coastal' | 'Inland';
	ruralUrban: 'Rural' | 'Urban';
	pct65Plus: number;
	detachedRatio: number | null;
	terracedRatio: number | null;
	flatRatio: number | null;
};

export type HousingMarketTypologySummary = {
	count: number;
	ruralLifestyleCount: number;
	urbanWorkingCount: number;
	retirementAmenityCount: number;
};

export type HousingMarketTypologyBundle = {
	rows: MsoaHousingMarketTypologyRow[];
	summary: HousingMarketTypologySummary;
	systemByMsoa: Record<string, HousingMarketSystem>;
};
