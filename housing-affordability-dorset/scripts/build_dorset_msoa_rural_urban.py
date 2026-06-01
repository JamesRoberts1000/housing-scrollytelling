"""Join Dorset MSOA affordability ratios with ONS Rural Urban Classification (2021)."""

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
    "rural_urban",
    "ruc21_code",
    "ruc21_name",
]


def build_dorset_msoa_rural_urban(
    ratios_csv: Path,
    classification_xlsx: Path,
    output_csv: Path,
) -> pd.DataFrame:
    """Inner-join ratios with RUC21; raise if any Dorset MSOA lacks classification."""
    ratios = pd.read_csv(ratios_csv)
    ruc = pd.read_excel(classification_xlsx)

    ratios = ratios.rename(
        columns={
            "MSOA code": "MSOA code",
            "MSOA name": "MSOA name",
        }
    )
    ruc = ruc.rename(
        columns={
            "MSOA21CD": "MSOA code",
            "Rural Urban flag": "rural_urban",
            "RUC21CD": "ruc21_code",
            "RUC21NM": "ruc21_name",
        }
    )

    ratio_series = pd.to_numeric(ratios[RATIO_COL], errors="coerce")
    ratios = ratios.assign(affordability_ratio=ratio_series)

    merged = ratios[["MSOA code", "MSOA name", "affordability_ratio"]].merge(
        ruc[["MSOA code", "rural_urban", "ruc21_code", "ruc21_name"]],
        on="MSOA code",
        how="inner",
        validate="one_to_one",
    )

    missing = set(ratios["MSOA code"]) - set(merged["MSOA code"])
    if missing:
        raise ValueError(
            f"{len(missing)} MSOA(s) in affordability data lack RUC21 classification: "
            f"{sorted(missing)[:5]}..."
        )

    out = merged[OUTPUT_COLUMNS].sort_values("MSOA code").reset_index(drop=True)
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(output_csv, index=False)
    return out


def print_summary(df: pd.DataFrame) -> None:
    """Print group stats for caption QA."""
    for flag in sorted(df["rural_urban"].dropna().unique()):
        subset = df.loc[df["rural_urban"] == flag, "affordability_ratio"]
        print(
            f"{flag}: n={len(subset)} "
            f"median={subset.median():.2f} mean={subset.mean():.2f}"
        )


if __name__ == "__main__":
    project_root = Path(__file__).resolve().parents[1]
    ratios_input = project_root / "data" / "processed" / "dorset_msoa_affordability_ratios.csv"
    classification_input = (
        project_root / "data" / "processed" / "rural_urban_classification_dorset_msoas.xlsx"
    )
    output_file = project_root / "data" / "processed" / "dorset_msoa_rural_urban.csv"
    static_copy = project_root / "web" / "static" / "data" / "dorset_msoa_rural_urban.csv"

    result = build_dorset_msoa_rural_urban(
        ratios_csv=ratios_input,
        classification_xlsx=classification_input,
        output_csv=output_file,
    )
    static_copy.parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(static_copy, index=False)

    print(f"Written: {output_file}")
    print(f"Copied:  {static_copy}")
    print(f"Rows: {len(result):,}")
    print_summary(result)
