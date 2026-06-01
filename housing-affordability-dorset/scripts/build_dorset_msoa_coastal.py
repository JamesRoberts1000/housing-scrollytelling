"""Join Dorset MSOA affordability ratios with coastal MSOA classification."""

from pathlib import Path

import pandas as pd

RATIO_COL = (
    "Table 3a - Median price paid (existing dwellings) by MSOA, England and Wales, "
    "year ending December 1995 to year ending September 2025"
)

OUTPUT_COLUMNS = [
    "MSOA code",
    "MSOA name",
    "affordability_ratio",
    "coastal_inland",
    "rural_urban",
]


def build_dorset_msoa_coastal(
    ratios_csv: Path,
    coastal_xlsx: Path,
    rural_urban_csv: Path,
    output_csv: Path,
) -> pd.DataFrame:
    """Label MSOAs Coastal if listed in coastal_xlsx, else Inland."""
    ratios = pd.read_csv(ratios_csv)
    coastal = pd.read_excel(coastal_xlsx)
    rural_urban = pd.read_csv(rural_urban_csv)

    coastal_codes = set(coastal["MSOA code"].astype(str).str.strip())
    ratio_series = pd.to_numeric(ratios[RATIO_COL], errors="coerce")
    ratios = ratios.assign(affordability_ratio=ratio_series)

    merged = ratios[["MSOA code", "MSOA name", "affordability_ratio"]].merge(
        rural_urban[["MSOA code", "rural_urban"]],
        on="MSOA code",
        how="left",
        validate="one_to_one",
    )

    merged["coastal_inland"] = merged["MSOA code"].astype(str).apply(
        lambda c: "Coastal" if c in coastal_codes else "Inland"
    )

    missing_ru = merged["rural_urban"].isna().sum()
    if missing_ru:
        raise ValueError(f"{missing_ru} MSOA(s) lack rural_urban classification")

    coastal_in_data = coastal_codes & set(merged["MSOA code"].astype(str))
    if coastal_in_data != coastal_codes:
        missing = coastal_codes - coastal_in_data
        raise ValueError(f"Coastal list MSOAs missing from ratios: {sorted(missing)}")

    out = merged[OUTPUT_COLUMNS].sort_values("MSOA code").reset_index(drop=True)
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(output_csv, index=False)
    return out


def print_summary(df: pd.DataFrame) -> None:
    for flag in ["Coastal", "Inland"]:
        subset = df.loc[df["coastal_inland"] == flag, "affordability_ratio"]
        print(
            f"{flag}: n={len(subset)} "
            f"median={subset.median():.2f} min={subset.min():.2f} max={subset.max():.2f}"
        )


if __name__ == "__main__":
    project_root = Path(__file__).resolve().parents[1]
    ratios_input = project_root / "data" / "processed" / "dorset_msoa_affordability_ratios.csv"
    coastal_input = project_root / "data" / "processed" / "dorset_msoas_coastal.xlsx"
    rural_urban_input = project_root / "data" / "processed" / "dorset_msoa_rural_urban.csv"
    output_file = project_root / "data" / "processed" / "dorset_msoa_coastal.csv"
    static_copy = project_root / "web" / "static" / "data" / "dorset_msoa_coastal.csv"

    result = build_dorset_msoa_coastal(
        ratios_csv=ratios_input,
        coastal_xlsx=coastal_input,
        rural_urban_csv=rural_urban_input,
        output_csv=output_file,
    )
    static_copy.parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(static_copy, index=False)

    print(f"Written: {output_file}")
    print(f"Copied:  {static_copy}")
    print(f"Rows: {len(result):,}")
    print_summary(result)
