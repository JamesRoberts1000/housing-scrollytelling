import type { RuralUrbanGroup } from '$lib/types/ruralUrban';

export type CoastalInlandGroup = 'Coastal' | 'Inland';

export type MsoaCoastalInlandRow = {
	code: string;
	name: string;
	ratio: number;
	group: CoastalInlandGroup;
	ruralUrban: RuralUrbanGroup;
};

export type CoastalInlandGroupSummary = {
	group: CoastalInlandGroup;
	count: number;
	median: number;
	mean: number;
};

export type CoastalInlandBundle = {
	rows: MsoaCoastalInlandRow[];
	coastal: MsoaCoastalInlandRow[];
	inland: MsoaCoastalInlandRow[];
	summary: CoastalInlandGroupSummary[];
	classificationByMsoa: Record<string, CoastalInlandGroup>;
};
