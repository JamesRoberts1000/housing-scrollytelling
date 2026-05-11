# Dorset housing affordability (scrolly MVP)

SvelteKit + TypeScript + Tailwind front end for the Dorset MSOA housing affordability narrative. Data is read from static copies under `static/data/` (synced from the Python pipeline in `../data/processed/`).

## Prerequisites

- Node 20+ and npm (or pnpm/yarn, adjusting commands accordingly).

## Setup

```bash
cd housing-affordability-dorset/web
npm install
npx svelte-kit sync
npm run dev
```

Open the URL printed in the terminal (usually `http://localhost:5173`).

## Refreshing CSV data

After re-running the Python cleaners / ratio script, copy updated outputs into `static/data/`:

- `dorset_msoa_affordability_ratios.csv`
- `aff1ratioofhousepricetoworkplacebasedearnings_regions_latest.csv`
- `aff1ratioofhousepricetoworkplacebasedearnings_latest.csv`

## MSOA boundaries (GeoJSON)

The choropleth uses `static/geo/dorset_msoa_2021.geojson`, built from ONS MSOA December 2021 boundaries for the Dorset LAD list of MSOA codes in `dorset_msoa_affordability_ratios.csv`.

To regenerate (requires network), query the ArcGIS FeatureServer used in the project tooling, or replace the file with your own GeoJSON keyed by `MSOA21CD` matching the CSV `MSOA code` column.

## Build

```bash
npm run build
npm run preview
```

## Accessibility

Global styles respect `prefers-reduced-motion`. Map and charts are progressively enhanced in the client; narrative remains readable without them.
