# Housing scrollytelling — Dorset affordability

An interactive scrollytelling article exploring **housing affordability across Dorset** at Middle Super Output Area (MSOA) level. The story moves from national context through maps and charts on rurality, coastal geography, age structure, and dwelling type, ending with a typology of Dorset’s distinct housing markets.

**Live site:** [jamesroberts1000.github.io/housing-scrollytelling](https://jamesroberts1000.github.io/housing-scrollytelling/)

## Repository layout

```
housing-scrollytelling/
├── .github/workflows/deploy-pages.yml   # GitHub Pages deploy on push to main
└── housing-affordability-dorset/
    ├── data/processed/                  # Source CSVs and Excel inputs
    ├── scripts/                         # Python data pipeline
    ├── web/                             # SvelteKit front end (the article)
    └── Dorset Housing Affordability Scrollytelling Plan.md
```

## Quick start (web app)

Requires **Node.js 20+**.

```bash
cd housing-affordability-dorset/web
npm install
npm run sync
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

Further setup notes, data refresh steps, and troubleshooting are in [`housing-affordability-dorset/web/README.md`](housing-affordability-dorset/web/README.md).

## Data pipeline (optional)

Processed outputs live in `housing-affordability-dorset/data/processed/` and are copied into `web/static/data/` for the site. Python dependencies:

```bash
cd housing-affordability-dorset
pip install -r requirements.txt
```

Key scripts in `scripts/`:

| Script | Purpose |
|--------|---------|
| `calculate_dorset_msoa_affordability_ratios.py` | MSOA affordability ratios |
| `build_dorset_msoa_rural_urban.py` | Rural/urban classification |
| `build_dorset_msoa_coastal.py` | Coastal/inland labels |
| `build_dorset_msoa_age.py` | Age structure by MSOA |
| `build_dorset_msoa_typology.py` | Housing market typology (Section 8) |

After re-running scripts, copy updated CSVs into `web/static/data/` (or use the copy step built into each script where provided).

## Tech stack

- **Front end:** SvelteKit 2, Svelte 5, TypeScript, Tailwind CSS, D3, MapLibre GL
- **Data:** Python, pandas
- **Hosting:** GitHub Pages (static adapter, base path `/housing-scrollytelling`)

## Build and deploy

Local production preview:

```bash
cd housing-affordability-dorset/web
npm run build
npm run preview
```

GitHub Pages build (matches CI):

```bash
npm run build:pages
```

Pushes to `main` trigger automatic deployment via GitHub Actions.

## Data sources

House prices and earnings are from ONS **HPSSA** and **ASHE** releases. Population and classification data are documented in the article’s Methodology section. See the plan document for the full editorial structure and narrative goals.
