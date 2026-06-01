export type RuralUrbanGroup = 'Rural' | 'Urban';

export type MsoaRuralUrbanRow = {
	code: string;
	name: string;
	ratio: number;
	group: RuralUrbanGroup;
	ruc21Code: string;
	ruc21Name: string;
};

export type GroupSummary = {
	group: RuralUrbanGroup;
	count: number;
	median: number;
	mean: number;
};

export type RuralUrbanBundle = {
	rows: MsoaRuralUrbanRow[];
	rural: MsoaRuralUrbanRow[];
	urban: MsoaRuralUrbanRow[];
	summary: GroupSummary[];
	classificationByMsoa: Record<string, RuralUrbanGroup>;
};
