# Dorset housing affordability scrollytelling

SvelteKit + TypeScript + Tailwind front end for the Dorset MSOA housing affordability narrative. Data is read from static copies under `static/data/` (synced from the Python pipeline in `../data/processed/`).

## Prerequisites

- **Node.js 20 or newer** and a matching **npm** (this project’s `package.json` declares `"engines": { "node": ">=20" }`).
- SvelteKit 2 and Vite 6 will not run on legacy Node (for example Node 6).

### If `npm install` fails or `node -v` shows something old (common with conda)

Inside the environment you use for this project (for example `conda activate scrollytelling`), check:

```bash
which node
node -v
which npm
npm -v
```

If `node` is **below v18**, that Node/npm pair is too old for this app and can produce errors like `ENOTDIR` in `.staging` and missing `npx`.

**Fix option A — upgrade Node inside the conda env (conda-forge):**

The `nodejs` package from conda-forge **includes npm**; do not install a separate `npm` package (it may be unavailable on some channel configurations and can trigger `PackagesNotFoundError`).

```bash
conda activate scrollytelling
conda install -c conda-forge "nodejs>=20"
hash -r
node -v
npm -v
```

If the solver still struggles, try pinning a minor line explicitly, for example:

`conda install -c conda-forge nodejs=22`

**Fix option B — use Homebrew Node for frontend work (keeps Python in conda):**

```bash
brew install node
hash -r
node -v
```

Then run `npm install` from `housing-affordability-dorset/web` with the intended Node installation first on `PATH` (open a fresh terminal, or ensure Homebrew `bin` appears before conda paths when using Homebrew Node).

### Clean reinstall after a failed install

```bash
cd housing-affordability-dorset/web
rm -rf node_modules package-lock.json
npm install
npm run sync
npm run dev
```

## Setup

```bash
cd housing-affordability-dorset/web
npm install
npm run sync
npm run dev
```

(`npm run sync` runs `svelte-kit sync` so you do not need `npx` on PATH.)

Open the URL printed in the terminal (usually `http://localhost:5173`).

## Refreshing CSV data

After re-running the Python pipeline, copy updated outputs into `static/data/`. Most build scripts also write a copy to `web/static/data/` automatically.

| File | Typical source script |
|------|------------------------|
| `dorset_msoa_affordability_ratios.csv` | `calculate_dorset_msoa_affordability_ratios.py` |
| `dorset_msoa_rural_urban.csv` | `build_dorset_msoa_rural_urban.py` |
| `dorset_msoa_coastal.csv` | `build_dorset_msoa_coastal.py` |
| `dorset_msoa_age.csv` | `build_dorset_msoa_age.py` |
| `dorset_msoa_housing_market_typology.csv` | `build_dorset_msoa_typology.py` |
| `aff1ratioofhousepricetoworkplacebasedearnings_regions_latest.csv` | `clean_affordability_ratio.py` |
| `aff1ratioofhousepricetoworkplacebasedearnings_latest.csv` | `clean_affordability_ratio.py` |

## Section 8 typology methodology (detailed)

The Section 8 "Different housing markets across Dorset" grouping is produced by
`scripts/build_dorset_msoa_typology.py` using rule-based scoring (not unsupervised clustering).

### Inputs and joins

The script merges three MSOA-level inputs:

- `web/static/data/dorset_msoa_coastal.csv` for `coastal_inland` and `rural_urban`
- `web/static/data/dorset_msoa_age.csv` for `pct_65_plus`
- `web/static/data/dorset_msoa_affordability_ratios.csv` for:
  - overall affordability ratio
  - detached affordability ratio
  - terraced affordability ratio
  - flat affordability ratio

All joins are one-to-one on `MSOA code`. The script errors if row counts do not match expected Dorset MSOA coverage.

### Median-based thresholds

To keep scoring relative to Dorset-wide conditions, the script calculates medians across merged MSOAs for:

- overall affordability ratio
- detached affordability ratio
- terraced affordability ratio
- flat affordability ratio (non-null)
- share aged 65+ (`pct_65_plus`)

These medians are used as dynamic cut points in the rules below.

### Score construction by housing market system

For each MSOA, three scores are calculated:

1. `rural_lifestyle`
2. `urban_working_coastal`
3. `retirement_amenity`

#### 1) Rural lifestyle score

Points are added when an area shows rural, detached-led, older-population characteristics:

- `+3` if `rural_urban == Rural`
- `+2` if detached ratio is at or above Dorset median
- `+2` if overall affordability ratio is at or above Dorset median
- `+2` if flats are sparse/absent, or (where present) flat ratio is at or above overall ratio
- `+1` if `% aged 65+` is at or above Dorset median
- `+1` extra if rural and overall affordability ratio is `>= 11`

#### 2) Urban and working coastal score

Points are added for urban, lower-cost, entry-level market signals:

- `+2` if `rural_urban == Urban`
- `+2` if overall affordability ratio is at or below Dorset median
- `+2` if flats exist and flat ratio is at or below Dorset median
- `+1` if terraced ratio is at or below Dorset median
- `+2` if coastal and flats exist with flat ratio `< 8`
- `+2` if coastal, urban, and overall affordability ratio `< 10`
- `+4` for specific Weymouth/Portland-style "flat access" exemplar MSOAs in the code list

#### 3) Retirement and amenity score

Points are added for coastal, older, higher-cost amenity market patterns:

- `+2` if `coastal_inland == Coastal`
- `+2` if `% aged 65+` is at or above Dorset median
- `+2` if flats exist and flat ratio is at or above Dorset median
- `+1` if overall affordability ratio is `>= 12`
- `+5` for specific "expensive flats coast" exemplar MSOAs in the code list
- `+2` extra if coastal + rural + older (`>= median pct65`) + overall ratio `>= 11`

### Assignment and overrides

Initial assignment is the label with the highest score among the three systems above.

After scoring, optional manual/editorial overrides are applied from:

- `data/processed/housing_market_typology_overrides.csv`

This file includes `MSOA code`, final `housing_market_system`, and a short `reason` for traceability to narrative exemplars.

In the current dataset, overrides are present for 16 MSOAs, but only 3 change the final assignment from the raw top-score outcome. In all three cases, the raw outcome was `rural_lifestyle` and the final overridden label is `retirement_amenity`:

- `E02004246` — St Leonards
- `E02004268` — Swanage
- `E02004275` — Burton Bradstock & Chideock

### Outputs

Primary output:

- `data/processed/dorset_msoa_housing_market_typology.csv`

A static copy is then written for the web app:

- `web/static/data/dorset_msoa_housing_market_typology.csv`

Both include the final system plus component scores (`score_rural_lifestyle`, `score_urban_working`, `score_retirement_amenity`) and supporting fields used in the assignment.

## MSOA boundaries (GeoJSON)

The choropleth uses `static/geo/dorset_msoa_2021.geojson`, built from ONS MSOA December 2021 boundaries for the Dorset LAD list of MSOA codes in `dorset_msoa_affordability_ratios.csv`.

To regenerate (requires network), query the ArcGIS FeatureServer used in the project tooling, or replace the file with your own GeoJSON keyed by `MSOA21CD` matching the CSV `MSOA code` column.

## Basemap and typography

The map uses **Carto Positron** (`light_all`) raster tiles — light grey roads and settlement labels over OpenStreetMap data, with slight desaturation in MapLibre for a calmer backdrop. Attribution appears on the map (OpenStreetMap + CARTO).

Page typography uses **Open Sans** with **Arial** and system sans-serif fallbacks, similar to public ONS/GOV.UK pages. The official **GDS Transport** font is not bundled here (licence). Colours follow GOV.UK-style neutrals (e.g. `#0b0c0c` text, `#206095` link/accent blue).

## Build

```bash
npm run build
npm run preview
```

GitHub Pages preview (matches CI base path):

```bash
npm run build:pages
npm run preview
```

## Accessibility

Global styles respect `prefers-reduced-motion`. Map and charts are progressively enhanced in the client; narrative remains readable without them.

Maps use `role="region"` with step-specific descriptions, skip links to expandable data tables (Sections 3 and 8), and `aria-hidden` on MapLibre canvases so screen readers focus on text alternatives. SVG charts use `role="img"` with summary `aria-label`s and labelled data points where applicable.
