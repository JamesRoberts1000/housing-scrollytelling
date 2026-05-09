"""Utilities for cleaning raw housing affordability data."""

from pathlib import Path

import pandas as pd


def clean_housing_data(input_path: Path, output_path: Path) -> None:
    """Load raw data, apply basic cleaning, and write cleaned output."""
    df = pd.read_csv(input_path)

    # Standardize column names for easier downstream use.
    df.columns = (
        df.columns.str.strip().str.lower().str.replace(" ", "_", regex=False)
    )

    # Drop fully empty rows and deduplicate repeated records.
    df = df.dropna(how="all").drop_duplicates()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)


if __name__ == "__main__":
    project_root = Path(__file__).resolve().parents[1]
    raw_file = project_root / "data" / "raw" / "housing_data.csv"
    cleaned_file = project_root / "data" / "clean" / "housing_data_clean.csv"

    clean_housing_data(raw_file, cleaned_file)
    print(f"Cleaned data written to: {cleaned_file}")
