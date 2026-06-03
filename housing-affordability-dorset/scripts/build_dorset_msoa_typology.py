"""Assign Dorset MSOAs to housing market typologies via rule-based scoring."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import pandas as pd

RATIO_COL = (
    "Table 3a - Median price paid (existing dwellings) by MSOA, England and Wales, "
    "year ending December 1995 to year ending September 2025"
)
DETACHED_COL = (
    "Table 3b - Median price paid (existing dwellings) for detached houses by MSOA, "
    "England and Wales, year ending December 1995 to year ending September 2025"
)
TERRACED_COL = (
    "Table 3d - Median price paid (existing dwellings) for terraced houses by MSOA, "
    "England and Wales, year ending December 1995 to year ending September 2025"
)
FLAT_COL = (
    "Table 3e - Median price paid (existing dwellings) for flats/maisonettes by MSOA, "
    "England and Wales, year ending December 1995 to year ending September 2025"
)

SYSTEM_RURAL = "rural_lifestyle"
SYSTEM_URBAN = "urban_working_coastal"
SYSTEM_RETIREMENT = "retirement_amenity"

VALID_SYSTEMS = {SYSTEM_RURAL, SYSTEM_URBAN, SYSTEM_RETIREMENT}

OUTPUT_COLUMNS = [
    "MSOA code",
    "MSOA name",
    "housing_market_system",
    "score_rural_lifestyle",
    "score_urban_working",
    "score_retirement_amenity",
    "affordability_ratio",
    "coastal_inland",
    "rural_urban",
    "pct_65_plus",
    "detached_ratio",
    "terraced_ratio",
    "flat_ratio",
]

# Narrative exemplars from Sections 3–7 (editorial overrides when rules disagree).
FLAT_ACCESS_CODES = {
    "E02004284",
    "E02004285",
    "E02004286",
    "E02004287",
    "E02004288",
    "E02004289",
}
FLAT_EXPENSIVE_CODES = {"E02004246", "E02004267", "E02004273"}


def _num(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce")


def _median(series: pd.Series) -> float:
    return float(series.median())


def score_row(row: pd.Series, medians: dict[str, float]) -> tuple[float, float, float]:
    """Return (rural_lifestyle, urban_working, retirement_amenity) scores."""
    rural = 0.0
    urban = 0.0
    retirement = 0.0

    is_rural = row["rural_urban"] == "Rural"
    is_urban = row["rural_urban"] == "Urban"
    is_coastal = row["coastal_inland"] == "Coastal"
    overall = row["affordability_ratio"]
    detached = row["detached_ratio"]
    terraced = row["terraced_ratio"]
    flats = row["flat_ratio"]
    pct65 = row["pct_65_plus"]
    code = row["MSOA code"]

    has_flats = pd.notna(flats) and flats > 0
    sparse_flats = not has_flats

    # --- Rural lifestyle ---
    if is_rural:
        rural += 3
    if pd.notna(detached) and detached >= medians["detached"]:
        rural += 2
    if overall >= medians["overall"]:
        rural += 2
    if sparse_flats or (has_flats and flats >= overall):
        rural += 2
    if pct65 >= medians["pct65"]:
        rural += 1
    if is_rural and overall >= 11:
        rural += 1

    # --- Urban / working coastal ---
    if is_urban:
        urban += 2
    if overall <= medians["overall"]:
        urban += 2
    if has_flats and flats <= medians["flats"]:
        urban += 2
    if pd.notna(terraced) and terraced <= medians["terraced"]:
        urban += 1
    if is_coastal and has_flats and flats < 8:
        urban += 2
    if is_coastal and is_urban and overall < 10:
        urban += 2
    if code in FLAT_ACCESS_CODES:
        urban += 4

    # --- Retirement & amenity ---
    if is_coastal:
        retirement += 2
    if pct65 >= medians["pct65"]:
        retirement += 2
    if has_flats and flats >= medians["flats"]:
        retirement += 2
    if overall >= 12:
        retirement += 1
    if code in FLAT_EXPENSIVE_CODES:
        retirement += 5
    if is_coastal and is_rural and pct65 >= medians["pct65"] and overall >= 11:
        retirement += 2

    return rural, urban, retirement


def assign_system(
    scores: tuple[float, float, float], override: Optional[str]
) -> str:
    if override:
        return override
    rural, urban, retirement = scores
    best = max(
        [(rural, SYSTEM_RURAL), (urban, SYSTEM_URBAN), (retirement, SYSTEM_RETIREMENT)],
        key=lambda x: x[0],
    )
    return best[1]


def build_dorset_msoa_typology(
    coastal_csv: Path,
    age_csv: Path,
    ratios_csv: Path,
    overrides_csv: Optional[Path],
    output_csv: Path,
) -> pd.DataFrame:
    coastal = pd.read_csv(coastal_csv)
    age = pd.read_csv(age_csv)
    ratios = pd.read_csv(ratios_csv)

    ratios = ratios.assign(
        affordability_ratio=_num(ratios[RATIO_COL]),
        detached_ratio=_num(ratios[DETACHED_COL]),
        terraced_ratio=_num(ratios[TERRACED_COL]),
        flat_ratio=_num(ratios[FLAT_COL]),
    )

    merged = coastal.merge(
        age[["MSOA code", "pct_65_plus"]],
        on="MSOA code",
        how="inner",
        validate="one_to_one",
    ).merge(
        ratios[
            [
                "MSOA code",
                "detached_ratio",
                "terraced_ratio",
                "flat_ratio",
            ]
        ],
        on="MSOA code",
        how="inner",
        validate="one_to_one",
    )

    if len(merged) != len(coastal):
        raise ValueError(f"Expected {len(coastal)} MSOAs after merge, got {len(merged)}")

    overrides: dict[str, str] = {}
    if overrides_csv and overrides_csv.exists():
        ov = pd.read_csv(overrides_csv)
        for _, r in ov.iterrows():
            code = str(r["MSOA code"]).strip()
            system = str(r["housing_market_system"]).strip()
            if system not in VALID_SYSTEMS:
                raise ValueError(f"Invalid system in overrides: {system} for {code}")
            overrides[code] = system

    medians = {
        "overall": _median(merged["affordability_ratio"]),
        "detached": _median(merged["detached_ratio"].dropna()),
        "terraced": _median(merged["terraced_ratio"].dropna()),
        "flats": _median(merged["flat_ratio"].dropna()),
        "pct65": _median(merged["pct_65_plus"]),
    }

    score_rows = []
    for _, row in merged.iterrows():
        scores = score_row(row, medians)
        code = str(row["MSOA code"]).strip()
        system = assign_system(scores, overrides.get(code))
        score_rows.append(
            {
                "MSOA code": code,
                "MSOA name": row["MSOA name"],
                "housing_market_system": system,
                "score_rural_lifestyle": scores[0],
                "score_urban_working": scores[1],
                "score_retirement_amenity": scores[2],
                "affordability_ratio": row["affordability_ratio"],
                "coastal_inland": row["coastal_inland"],
                "rural_urban": row["rural_urban"],
                "pct_65_plus": row["pct_65_plus"],
                "detached_ratio": row["detached_ratio"],
                "terraced_ratio": row["terraced_ratio"],
                "flat_ratio": row["flat_ratio"],
            }
        )

    out = pd.DataFrame(score_rows)[OUTPUT_COLUMNS].sort_values("MSOA code").reset_index(drop=True)

    unassigned = out[out["housing_market_system"].isna() | (out["housing_market_system"] == "")]
    if len(unassigned):
        raise ValueError(f"{len(unassigned)} MSOA(s) lack typology assignment")

    output_csv.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(output_csv, index=False)
    return out


def print_summary(df: pd.DataFrame) -> None:
    counts = df["housing_market_system"].value_counts()
    print("Assignments:")
    for system, n in counts.items():
        print(f"  {system}: {n}")
    print("\nExemplar checks:")
    checks = [
        ("Weymouth cluster", FLAT_ACCESS_CODES, SYSTEM_URBAN),
        ("Expensive flats coast", FLAT_EXPENSIVE_CODES, SYSTEM_RETIREMENT),
    ]
    for label, codes, expected in checks:
        for code in sorted(codes):
            row = df[df["MSOA code"] == code]
            if row.empty:
                print(f"  MISSING {code}")
                continue
            got = row.iloc[0]["housing_market_system"]
            ok = "OK" if got == expected else f"GOT {got}"
            print(f"  {code}: {ok}")


if __name__ == "__main__":
    project_root = Path(__file__).resolve().parents[1]
    coastal_input = project_root / "web" / "static" / "data" / "dorset_msoa_coastal.csv"
    age_input = project_root / "web" / "static" / "data" / "dorset_msoa_age.csv"
    ratios_input = project_root / "web" / "static" / "data" / "dorset_msoa_affordability_ratios.csv"
    overrides_input = project_root / "data" / "processed" / "housing_market_typology_overrides.csv"
    output_file = project_root / "data" / "processed" / "dorset_msoa_housing_market_typology.csv"
    static_copy = project_root / "web" / "static" / "data" / "dorset_msoa_housing_market_typology.csv"

    result = build_dorset_msoa_typology(
        coastal_csv=coastal_input,
        age_csv=age_input,
        ratios_csv=ratios_input,
        overrides_csv=overrides_input,
        output_csv=output_file,
    )
    static_copy.parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(static_copy, index=False)

    print(f"Written: {output_file}")
    print(f"Copied:  {static_copy}")
    print(f"Rows: {len(result):,}")
    print_summary(result)
