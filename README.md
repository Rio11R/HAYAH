# HAYAH | حياة

HAYAH is a prototype for exploring hospital operations and patient flow with synthetic data. It pairs a React-based dashboard with a Python data validator.

> **Live demo:** [hayah-9exm.vercel.app](https://hayah-9exm.vercel.app/)

![HAYAH live demo screenshot](assets/hayah-live-demo.png)

## What you can explore

- A hospital network view, available as a 3D scene or a map
- A 90-minute operational timeline with department and ambulance activity
- Patient, department, and resource details
- Prototype scenario simulations for comparing operational interventions

The interface supports operational exploration only. It does not provide clinical advice, and its predictions and scenario assumptions are not approved for real-world decisions.

## Data

The project uses synthetic data only; it is not connected to a real hospital or medical system. The master dataset includes:

- 50 patients and 3 ambulances
- 5 departments
- 15 staff records, 5 equipment records, and 88 beds

The dataset is in [`data/hayah_master_data_v0_3.json`](data/hayah_master_data_v0_3.json). The web app also contains a copy under `web/src/data/`.

## Run the web app locally

```bash
cd web
npm install
npm run dev
```

Vite prints the local URL when the development server starts. To create a production build:

```bash
npm run build
```

## Validate the dataset

The validator requires Python 3.9 or later and uses only the standard library. From the repository root, run:

```bash
python validate_hayah_data.py data/hayah_master_data_v0_3.json
```

It checks required sections, unique IDs, patient and ambulance links, department metrics, bed totals, and the interactive patient selection. A successful run exits with status `0`; validation errors produce a non-zero exit status.

The current dataset passes with **0 errors** and **5 warnings/decisions**. The warnings document assumptions that still need review, including static incoming-patient estimates, background occupancy, bed-capacity rules, status casing, and unapproved prediction formulas.

## Repository layout

```text
data/                       Synthetic source datasets
web/                        React, Vite, and Three.js frontend
validate_hayah_data.py      Dataset validator
HAYAH_Data_Audit_v0.3_AR.md Arabic audit summary
```

## Limitations

- All records are synthetic and intended for demonstration.
- Incoming-patient estimates are a static snapshot, not live calculations.
- Some occupancy figures include untracked background patients.
- Prediction and simulation rules remain prototype assumptions.
- Do not use this project for clinical care, staffing decisions, or live hospital operations.
