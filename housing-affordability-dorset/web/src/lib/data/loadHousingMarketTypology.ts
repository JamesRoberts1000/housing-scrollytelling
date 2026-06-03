import { csvParse } from 'd3';
import type {
	HousingMarketSystem,
	HousingMarketTypologyBundle,
	HousingMarketTypologySummary,
	MsoaHousingMarketTypologyRow
} from '$lib/types/housingMarketTypology';
import { assetPath } from '$lib/utils/assetPath';

const VALID_SYSTEMS = new Set<HousingMarketSystem>([
	'rural_lifestyle',
	'urban_working_coastal',
	'retirement_amenity'
]);

function num(v: string | undefined): number {
	if (v === undefined || v === '') return NaN;
	const n = Number(String(v).replace(/,/g, ''));
	return Number.isFinite(n) ? n : NaN;
}

function optionalNum(v: string | undefined): number | null {
	const n = num(v);
	return Number.isFinite(n) && n > 0 ? n : null;
}

function parseSystem(v: string | undefined): HousingMarketSystem | null {
	const s = String(v ?? '').trim() as HousingMarketSystem;
	return VALID_SYSTEMS.has(s) ? s : null;
}

export function parseHousingMarketTypologyRows(
	records: Record<string, string>[]
): MsoaHousingMarketTypologyRow[] {
	return records
		.map((r) => {
			const code = String(r['MSOA code'] ?? '').trim();
			const name = String(r['MSOA name'] ?? '').trim();
			const system = parseSystem(r['housing_market_system']);
			const ratio = num(r['affordability_ratio']);
			const pct65Plus = num(r['pct_65_plus']);
			const coastalInland = String(r['coastal_inland'] ?? '').trim();
			const ruralUrban = String(r['rural_urban'] ?? '').trim();

			if (
				!code ||
				!system ||
				!Number.isFinite(ratio) ||
				ratio <= 0 ||
				!Number.isFinite(pct65Plus) ||
				(coastalInland !== 'Coastal' && coastalInland !== 'Inland') ||
				(ruralUrban !== 'Rural' && ruralUrban !== 'Urban')
			) {
				return null;
			}

			return {
				code,
				name,
				system,
				scoreRuralLifestyle: num(r['score_rural_lifestyle']),
				scoreUrbanWorking: num(r['score_urban_working']),
				scoreRetirementAmenity: num(r['score_retirement_amenity']),
				ratio,
				coastalInland,
				ruralUrban,
				pct65Plus,
				detachedRatio: optionalNum(r['detached_ratio']),
				terracedRatio: optionalNum(r['terraced_ratio']),
				flatRatio: optionalNum(r['flat_ratio'])
			};
		})
		.filter((x): x is MsoaHousingMarketTypologyRow => x !== null);
}

export function summariseHousingMarketTypology(
	rows: MsoaHousingMarketTypologyRow[]
): HousingMarketTypologySummary {
	const countBy = (system: HousingMarketSystem) => rows.filter((r) => r.system === system).length;
	return {
		count: rows.length,
		ruralLifestyleCount: countBy('rural_lifestyle'),
		urbanWorkingCount: countBy('urban_working_coastal'),
		retirementAmenityCount: countBy('retirement_amenity')
	};
}

export function buildHousingMarketTypologyBundle(
	rows: MsoaHousingMarketTypologyRow[]
): HousingMarketTypologyBundle {
	if (rows.length !== 48) {
		throw new Error(`Expected 48 MSOA typology rows, got ${rows.length}`);
	}
	return {
		rows,
		summary: summariseHousingMarketTypology(rows),
		systemByMsoa: Object.fromEntries(rows.map((r) => [r.code, r.system]))
	};
}

export async function loadHousingMarketTypologyFetch(
	fetchFn: typeof fetch
): Promise<HousingMarketTypologyBundle> {
	const text = await fetchFn(assetPath('/data/dorset_msoa_housing_market_typology.csv')).then((r) => {
		if (!r.ok) throw new Error(`Failed to load housing market typology data: ${r.status}`);
		return r.text();
	});
	const records = csvParse(text) as Record<string, string>[];
	return buildHousingMarketTypologyBundle(parseHousingMarketTypologyRows(records));
}
