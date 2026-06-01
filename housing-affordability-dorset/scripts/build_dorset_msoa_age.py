"""Join Dorset MSOA affordability ratios with population age structure (2021-based)."""

from pathlib import Path

import pandas as pd

OUTPUT_COLUMNS = [
    "MSOA code",
    "MSOA name",
    "affordability_ratio",
    "pct_65_plus",
    "population_total",
]


def build_dorset_msoa_age(
    rural_urban_csv: Path,
    age_xlsx: Path,
    output_csv: Path,
) -> pd.DataFrame:
    """Join ratios with MSOA population aged 65+ share."""
    ratios = pd.read_csv(rural_urban_csv)
    age = pd.read_excel(age_xlsx)

    age = age.rename(
        columns={
            "2021 super output area - middle layer": "msoa_label",
            "Aged 0 to 15": "aged_0_15",
            "Aged 16 to 64": "aged_16_64",
            "Aged 65+": "aged_65_plus",
        }
    )
    age["MSOA code"] = age["msoa_label"].astype(str).str.extract(r"(E\d+)", expand=False)
    age["population_total"] = age["aged_0_15"] + age["aged_16_64"] + age["aged_65_plus"]
    age["pct_65_plus"] = 100 * age["aged_65_plus"] / age["population_total"]

    merged = ratios[["MSOA code", "MSOA name", "affordability_ratio"]].merge(
        age[["MSOA code", "pct_65_plus", "population_total"]],
        on="MSOA code",
        how="inner",
        validate="one_to_one",
    )

    missing = set(ratios["MSOA code"]) - set(merged["MSOA code"])
    if missing:
        raise ValueError(
            f"{len(missing)} MSOA(s) in affordability data lack age estimates: "
            f"{sorted(missing)[:5]}..."
        )

    out = merged[OUTPUT_COLUMNS].sort_values("MSOA code").reset_index(drop=True)
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(output_csv, index=False)
    return out


def print_summary(df: pd.DataFrame) -> None:
    r = df["affordability_ratio"].corr(df["pct_65_plus"])
    print(
        f"pct_65_plus: min={df['pct_65_plus'].min():.1f}% "
        f"max={df['pct_65_plus'].max():.1f}% "
        f"correlation with ratio={r:.2f}"
    )


if __name__ == "__main__":
    project_root = Path(__file__).resolve().parents[1]
    rural_urban_input = project_root / "data" / "processed" / "dorset_msoa_rural_urban.csv"
    age_input = (
        project_root
        / "data"
        / "processed"
        / "Population estimates - small area (2021 based) by single year of age.xlsx"
    )
    output_file = project_root / "data" / "processed" / "dorset_msoa_age.csv"
    static_copy = project_root / "web" / "static" / "data" / "dorset_msoa_age.csv"

    result = build_dorset_msoa_age(
        rural_urban_csv=rural_urban_input,
        age_xlsx=age_input,
        output_csv=output_file,
    )
    static_copy.parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(static_copy, index=False)

    print(f"Written: {output_file}")
    print(f"Copied:  {static_copy}")
    print(f"Rows: {len(result):,}")
    print_summary(result)
