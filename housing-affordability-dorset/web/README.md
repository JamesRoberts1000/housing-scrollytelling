# Dorset housing affordability (scrolly MVP)

SvelteKit + TypeScript + Tailwind front end for the Dorset MSOA housing affordability narrative. Data is read from static copies under `static/data/` (synced from the Python pipeline in `../data/processed/`).

## Prerequisites

- **Node.js 20 or newer** and a matching **npm** (this project’s `package.json` declares `"engines": { "node": ">=20" }`).
- SvelteKit 2 and Vite 6 will not run on legacy Node (for example Node 6).

### If `npm install` fails or `node -v` shows something old (common with conda)

Inside `conda activate scrollytelling`, check:

```bash
which node
node -v
which npm
npm -v
```

If `node` is **below v18** (your log showed **v6.13.1**), that Node/npm pair is too old for this app and can produce errors like `ENOTDIR` in `.staging` and **no `npx`**.

**Fix option A — upgrade Node inside the conda env (conda-forge):**

The `nodejs` package from conda-forge **includes npm**; do not install a separate `npm` package (it often does not exist on your channels and triggers `PackagesNotFoundError`).

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

Then run `npm install` from `housing-affordability-dorset/web` **without** conda’s old Node earlier on your `PATH` (open a fresh terminal, or put Homebrew’s `bin` before conda’s when working on the web app).

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

After re-running the Python cleaners / ratio script, copy updated outputs into `static/data/`:

- `dorset_msoa_affordability_ratios.csv`
- `aff1ratioofhousepricetoworkplacebasedearnings_regions_latest.csv`
- `aff1ratioofhousepricetoworkplacebasedearnings_latest.csv`

## MSOA boundaries (GeoJSON)

The choropleth uses `static/geo/dorset_msoa_2021.geojson`, built from ONS MSOA December 2021 boundaries for the Dorset LAD list of MSOA codes in `dorset_msoa_affordability_ratios.csv`.

To regenerate (requires network), query the ArcGIS FeatureServer used in the project tooling, or replace the file with your own GeoJSON keyed by `MSOA21CD` matching the CSV `MSOA code` column.

## Basemap and typography

The map uses **Carto Positron** (`light_all`) raster tiles — light grey roads and settlement labels over OpenStreetMap data, with slight desaturation in MapLibre for a calmer backdrop. Attribution appears on the map (OpenStreetMap + CARTO).

Page typography uses an **Arial-first** stack similar to public ONS/GOV.UK pages. The official **GDS Transport** font is not bundled here (licence); Arial is the usual fallback. Colours follow GOV.UK-style neutrals (e.g. `#0b0c0c` text, `#1d70b8` link/accent blue).

## Build

```bash
npm run build
npm run preview
```

## Accessibility

Global styles respect `prefers-reduced-motion`. Map and charts are progressively enhanced in the client; narrative remains readable without them.
