"""Clean and reshape affordability ratio workbook data."""

from pathlib import Path
from typing import Callable

import pandas as pd

LOCAL_IDENTIFIER_COLUMNS = [
    "Country/Region code",
    "Country/Region name",
    "Local authority code",
    "Local authority name",
]
REGIONAL_IDENTIFIER_COLUMNS = ["Code", "Name"]

SUPPRESSED_VALUES = ["[x]", "[z]", "x", "z", "-"]
LOCAL_REQUIRED_SHEETS = ["5a", "5b", "5c", "6a", "6b", "6c"]
REGIONAL_REQUIRED_SHEETS = ["1a", "1b", "1c", "2a", "2b", "2c"]
TARGET_AUTHORITY = "dorset"
TARGET_REGIONS = {"england and wales", "england", "south west"}
METRIC_COLUMN = "Year ending Sep 2025"
FALLBACK_METRIC_COLUMN = "2025"


def read_sheet_title(input_path: Path, sheet_name: str) -> str:
    """Read the table descriptor from row 1 column A."""
    title_df = pd.read_excel(input_path, sheet_name=sheet_name, header=None, nrows=1)
    title = str(title_df.iloc[0, 0]).strip()
    if not title or title.lower() == "nan":
        raise ValueError(f"Missing table title in sheet {sheet_name}.")
    return title


def extract_latest_sheet_data(
    input_path: Path, sheet_name: str, identifier_columns: list[str]
) -> pd.DataFrame:
    """Extract identifiers and the fixed metric column for a given sheet."""
    # In this workbook, row 2 (0-based index 1) contains the column headers.
    df = pd.read_excel(input_path, sheet_name=sheet_name, header=1)
    missing_ids = [col for col in identifier_columns if col not in df.columns]
    if missing_ids:
        raise ValueError(f"Sheet {sheet_name} missing required columns: {missing_ids}")

    metric_col = METRIC_COLUMN if METRIC_COLUMN in df.columns else None
    if metric_col is None and FALLBACK_METRIC_COLUMN in df.columns:
        metric_col = FALLBACK_METRIC_COLUMN
    if metric_col is None:
        raise ValueError(
            "Sheet "
            f"{sheet_name} missing required metric column: {METRIC_COLUMN} "
            f"(or fallback {FALLBACK_METRIC_COLUMN})"
        )

    metric_title = read_sheet_title(input_path, sheet_name)

    out = df[identifier_columns + [metric_col]].copy()
    out = out.rename(columns={metric_col: metric_title})
    return out


def filter_dorset_rows(df: pd.DataFrame) -> pd.DataFrame:
    """Keep only Dorset rows using trimmed, case-insensitive matching."""
    local_authority = (
        df["Local authority name"].astype("string").str.strip().str.lower()
    )
    return df[local_authority == TARGET_AUTHORITY].copy()


def filter_target_regions(df: pd.DataFrame) -> pd.DataFrame:
    """Keep only requested rows from Name using trimmed, case-insensitive matching."""
    region_name = df["Name"].astype("string").str.strip().str.lower()
    return df[region_name.isin(TARGET_REGIONS)].copy()


def clean_slice(
    input_path: Path,
    output_path: Path,
    required_sheets: list[str],
    identifier_columns: list[str],
    row_filter: Callable[[pd.DataFrame], pd.DataFrame] | None = None,
) -> pd.DataFrame:
    """Load workbook slice, keep latest metric from required sheets, and write output."""
    workbook = pd.ExcelFile(input_path)
    missing_sheets = [sheet for sheet in required_sheets if sheet not in workbook.sheet_names]
    if missing_sheets:
        raise ValueError(f"Workbook missing required sheets: {missing_sheets}")

    merged_df: pd.DataFrame | None = None
    metric_columns: list[str] = []

    for sheet_name in required_sheets:
        sheet_df = extract_latest_sheet_data(input_path, sheet_name, identifier_columns)
        metric_name = [col for col in sheet_df.columns if col not in identifier_columns][0]
        metric_columns.append(metric_name)

        if merged_df is None:
            merged_df = sheet_df
        else:
            merged_df = merged_df.merge(sheet_df, on=identifier_columns, how="outer")

    if merged_df is None:
        raise ValueError("No data was extracted from the workbook.")

    if row_filter is not None:
        merged_df = row_filter(merged_df)
    merged_df = merged_df.replace(SUPPRESSED_VALUES, pd.NA)
    for col in metric_columns:
        merged_df[col] = pd.to_numeric(merged_df[col], errors="coerce")

    merged_df = merged_df.drop_duplicates(subset=identifier_columns)
    merged_df = merged_df.sort_values(by=identifier_columns).reset_index(drop=True)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    merged_df.to_csv(output_path, index=False)
    return merged_df


def clean_affordability_ratio_data(input_path: Path, output_path: Path) -> pd.DataFrame:
    """Load workbook, keep latest metric from sheets 5a-6c, and write output."""
    return clean_slice(
        input_path=input_path,
        output_path=output_path,
        required_sheets=LOCAL_REQUIRED_SHEETS,
        identifier_columns=LOCAL_IDENTIFIER_COLUMNS,
        row_filter=filter_dorset_rows,
    )


def clean_affordability_ratio_regional_data(
    input_path: Path, output_path: Path
) -> pd.DataFrame:
    """Load workbook, keep latest metric from sheets 1a-2c, and write output."""
    return clean_slice(
        input_path=input_path,
        output_path=output_path,
        required_sheets=REGIONAL_REQUIRED_SHEETS,
        identifier_columns=REGIONAL_IDENTIFIER_COLUMNS,
        row_filter=filter_target_regions,
    )


if __name__ == "__main__":
    project_root = Path(__file__).resolve().parents[1]
    raw_file = (
        project_root
        / "data"
        / "raw"
        / "aff1ratioofhousepricetoworkplacebasedearnings.xlsx"
    )
    cleaned_file = (
        project_root
        / "data"
        / "processed"
        / "aff1ratioofhousepricetoworkplacebasedearnings_latest.csv"
    )
    regional_cleaned_file = (
        project_root
        / "data"
        / "processed"
        / "aff1ratioofhousepricetoworkplacebasedearnings_regions_latest.csv"
    )

    final_df = clean_affordability_ratio_data(raw_file, cleaned_file)
    metric_cols = [col for col in final_df.columns if col not in LOCAL_IDENTIFIER_COLUMNS]
    missing_summary = final_df[metric_cols].isna().sum().to_dict()
    regional_df = clean_affordability_ratio_regional_data(raw_file, regional_cleaned_file)
    regional_metric_cols = [
        col for col in regional_df.columns if col not in REGIONAL_IDENTIFIER_COLUMNS
    ]
    regional_missing_summary = regional_df[regional_metric_cols].isna().sum().to_dict()

    print(f"Cleaned data written to: {cleaned_file}")
    print(f"Rows: {len(final_df):,} | Columns: {len(final_df.columns)}")
    print(f"Missing values by metric column: {missing_summary}")
    print(f"Regional cleaned data written to: {regional_cleaned_file}")
    print(f"Regional rows: {len(regional_df):,} | Columns: {len(regional_df.columns)}")
    print(f"Regional missing values by metric column: {regional_missing_summary}")
