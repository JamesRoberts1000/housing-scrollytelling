"""Calculate Dorset MSOA affordability ratios from processed datasets."""

from pathlib import Path

import pandas as pd

IDENTIFIER_COLUMNS = [
    "Local authority code",
    "Local authority name",
    "MSOA code",
    "MSOA name",
]

TARGET_AREA = "dorset"
SUPPRESSED_VALUES = ["[x]", "[z]", "x", "z", "-"]


def load_housing_prices(input_csv: Path) -> pd.DataFrame:
    """Load processed Dorset MSOA median price data."""
    return pd.read_csv(input_csv)


def extract_latest_dorset_median_earnings(earnings_xlsx: Path) -> float:
    """Extract latest available Dorset median annual pay from earnings workbook."""
    df = pd.read_excel(earnings_xlsx, sheet_name=0)
    lower_map = {str(col).strip().lower(): col for col in df.columns}

    if "description" not in lower_map:
        raise ValueError("Earnings workbook must include a 'Description' column.")

    description_col = lower_map["description"]
    dorset_rows = (
        df[df[description_col].astype("string").str.strip().str.lower() == TARGET_AREA]
        .copy()
    )
    if dorset_rows.empty:
        raise ValueError("No Dorset row found in earnings workbook.")

    # Prefer explicit median pay field, otherwise use latest numeric column.
    median_col = lower_map.get("median_annual_pay")
    if median_col is not None:
        value = pd.to_numeric(dorset_rows.iloc[0][median_col], errors="coerce")
        if pd.notna(value) and value != 0:
            return float(value)

    numeric_candidates = []
    for col in df.columns:
        series = pd.to_numeric(df[col], errors="coerce")
        if series.notna().any():
            numeric_candidates.append(col)

    if not numeric_candidates:
        raise ValueError("No numeric earnings columns found for Dorset.")

    latest_col = numeric_candidates[-1]
    value = pd.to_numeric(dorset_rows.iloc[0][latest_col], errors="coerce")
    if pd.isna(value) or value == 0:
        raise ValueError("Latest Dorset earnings value is missing or zero.")
    return float(value)


def calculate_affordability_ratios(housing_df: pd.DataFrame, earnings_value: float) -> pd.DataFrame:
    """Return ratios by dividing each numeric metric by Dorset median earnings."""
    out = housing_df.copy()
    metric_columns = [col for col in out.columns if col not in IDENTIFIER_COLUMNS]

    out[metric_columns] = out[metric_columns].replace(SUPPRESSED_VALUES, pd.NA)
    for col in metric_columns:
        out[col] = pd.to_numeric(out[col], errors="coerce") / earnings_value
    return out


def build_dorset_msoa_affordability_ratios(
    housing_input_csv: Path,
    earnings_input_xlsx: Path,
    output_csv: Path,
) -> pd.DataFrame:
    """Compute and write Dorset MSOA affordability ratio output."""
    housing_df = load_housing_prices(housing_input_csv)
    earnings_value = extract_latest_dorset_median_earnings(earnings_input_xlsx)
    ratio_df = calculate_affordability_ratios(housing_df, earnings_value)

    output_csv.parent.mkdir(parents=True, exist_ok=True)
    ratio_df.to_csv(output_csv, index=False)
    return ratio_df


if __name__ == "__main__":
    project_root = Path(__file__).resolve().parents[1]
    housing_input = project_root / "data" / "processed" / "medianpricepaid_latest.csv"
    # Tracked in git: commit this workbook when you refresh pay figures.
    earnings_input = (
        project_root
        / "data"
        / "processed"
        / "Table 7.7a   Annual pay - Gross (£) - full-time.xlsx"
    )
    output_file = project_root / "data" / "processed" / "dorset_msoa_affordability_ratios.csv"

    final_df = build_dorset_msoa_affordability_ratios(
        housing_input_csv=housing_input,
        earnings_input_xlsx=earnings_input,
        output_csv=output_file,
    )
    print(f"Affordability ratios written to: {output_file}")
    print(f"Rows: {len(final_df):,} | Columns: {len(final_df.columns)}")
