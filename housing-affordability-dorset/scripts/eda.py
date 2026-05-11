"""Basic EDA entrypoint for the processed MSOA housing dataset."""

from pathlib import Path

import pandas as pd

KEEP_COLUMNS = [
    "Local authority code",
    "Local authority name",
    "MSOA code",
    "MSOA name",
]


def load_processed_data(csv_path: Path) -> pd.DataFrame:
    """Load the processed latest-price CSV dataset."""
    df = pd.read_csv(csv_path)

    # Keep identifier columns plus table 1a-1e metrics only as the other columns contain too many nulls
    keep = KEEP_COLUMNS + [
        col
        for col in df.columns
        if col.startswith("Table 1a")
        or col.startswith("Table 1b")
        or col.startswith("Table 1c")
        or col.startswith("Table 1d")
        or col.startswith("Table 1e")
    ]
    df = df[keep].copy()
    df = df[df["Local authority name"] == "Dorset"].copy()
    return df


def run_eda(df: pd.DataFrame) -> None:
    """Print a lightweight first-pass EDA summary."""
    print("Dataset shape:", df.shape)
    print("\nColumns:")
    print(df.columns.tolist())
    print("\nMissing values (all columns):")
    print(df.isna().sum().sort_values(ascending=False))
    print("\nPreview:")
    print(df.head(5))


if __name__ == "__main__":
    project_root = Path(__file__).resolve().parents[1]
    input_csv = project_root / "data" / "processed" / "medianpricepaid_latest.csv"

    data = load_processed_data(input_csv)
    run_eda(data)
