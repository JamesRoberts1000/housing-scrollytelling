"""Clean and reshape MSOA median price paid workbook data."""

from pathlib import Path

import pandas as pd

IDENTIFIER_COLUMNS = [
    "Local authority code",
    "Local authority name",
    "MSOA code",
    "MSOA name",
]

SUPPRESSED_VALUES = ["[x]", "[z]", "x", "z", "-"]
TARGET_LOCAL_AUTHORITY = "dorset"


def required_sheet_names() -> list[str]:
    """Return all required table sheet names from 1a to 3e."""
    return [f"{number}{letter}" for number in range(1, 4) for letter in "abcde"]


def latest_metric_column(df: pd.DataFrame) -> str:
    """Find the rightmost time-series column for a sheet."""
    non_id_columns = [col for col in df.columns if col not in IDENTIFIER_COLUMNS]
    if not non_id_columns:
        raise ValueError("No metric columns found after identifier columns.")
    return non_id_columns[-1]


def read_sheet_title(input_path: Path, sheet_name: str) -> str:
    """Read the table descriptor from row 1 column A."""
    title_df = pd.read_excel(input_path, sheet_name=sheet_name, header=None, nrows=1)
    title = str(title_df.iloc[0, 0]).strip()
    if not title or title.lower() == "nan":
        raise ValueError(f"Missing table title in sheet {sheet_name}.")
    return title


def extract_latest_sheet_data(input_path: Path, sheet_name: str) -> pd.DataFrame:
    """Extract identifiers and latest metric for a given sheet."""
    df = pd.read_excel(input_path, sheet_name=sheet_name, header=2)
    missing_ids = [col for col in IDENTIFIER_COLUMNS if col not in df.columns]
    if missing_ids:
        raise ValueError(f"Sheet {sheet_name} missing required columns: {missing_ids}")

    metric_col = latest_metric_column(df)
    metric_title = read_sheet_title(input_path, sheet_name)

    out = df[IDENTIFIER_COLUMNS + [metric_col]].copy()
    out = out.rename(columns={metric_col: metric_title})
    return out


def clean_housing_data(input_path: Path, output_path: Path) -> pd.DataFrame:
    """Load workbook, keep latest metric from sheets 1a-3e, and write output."""
    workbook = pd.ExcelFile(input_path)
    required_sheets = required_sheet_names()
    missing_sheets = [sheet for sheet in required_sheets if sheet not in workbook.sheet_names]
    if missing_sheets:
        raise ValueError(f"Workbook missing required sheets: {missing_sheets}")

    merged_df: pd.DataFrame | None = None
    metric_columns: list[str] = []

    for sheet_name in required_sheets:
        sheet_df = extract_latest_sheet_data(input_path, sheet_name)
        metric_name = [col for col in sheet_df.columns if col not in IDENTIFIER_COLUMNS][0]
        metric_columns.append(metric_name)

        if merged_df is None:
            merged_df = sheet_df
        else:
            merged_df = merged_df.merge(sheet_df, on=IDENTIFIER_COLUMNS, how="outer")

    if merged_df is None:
        raise ValueError("No data was extracted from the workbook.")

    merged_df = merged_df.replace(SUPPRESSED_VALUES, pd.NA)
    for col in metric_columns:
        merged_df[col] = pd.to_numeric(merged_df[col], errors="coerce")

    merged_df = merged_df.drop_duplicates(subset=IDENTIFIER_COLUMNS)
    merged_df = merged_df.sort_values(by=IDENTIFIER_COLUMNS).reset_index(drop=True)
    local_authority = merged_df["Local authority name"].astype("string").str.strip().str.lower()
    merged_df = merged_df[local_authority == TARGET_LOCAL_AUTHORITY].reset_index(drop=True)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    merged_df.to_csv(output_path, index=False)
    return merged_df


if __name__ == "__main__":
    project_root = Path(__file__).resolve().parents[1]
    raw_file = project_root / "data" / "raw" / "medianpricepaidmsoa.xlsx"
    cleaned_file = project_root / "data" / "processed" / "medianpricepaid_latest.csv"

    final_df = clean_housing_data(raw_file, cleaned_file)
    metric_cols = [col for col in final_df.columns if col not in IDENTIFIER_COLUMNS]
    missing_summary = final_df[metric_cols].isna().sum().to_dict()

    print(f"Cleaned data written to: {cleaned_file}")
    print(f"Rows: {len(final_df):,} | Columns: {len(final_df.columns)}")
    print(f"Missing values by metric column: {missing_summary}")
