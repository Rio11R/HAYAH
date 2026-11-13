# HAYAH Data Audit

HAYAH is a synthetic hospital operations dataset and validation project designed to test operational flow, capacity tracking, and patient-routing logic in a controlled demo environment. The repository includes a dataset, a Python validator, and an audit report that together help assess whether the data is structurally sound and internally consistent.

## Project purpose

This project is not a medical decision system and is not based on real patient records. It is a demo dataset intended for:

- validating hospital workflow data integrity
- checking patient and resource linkage consistency
- verifying department-level operational metrics
- auditing a draft snapshot of emergency and department flow

The core goal is to confirm that the dataset follows the expected schema and that its operational summaries are internally consistent before they are used for analysis or simulation.

## Repository contents

- `data/hayah_master_data_v0_3.json` — the synthetic hospital dataset used by the project
- `data/hayah_equipment_beds_sensors_v0_1.json` — draft resource availability and virtual-sensor reference data
- `info/validate_hayah_data.py` — Python script that validates schema, counts, IDs, and operational relationships
- `hayah_inspect.py` — local read-only inspection utility
- `tests/test_hayah_inspect.py` — inspection and dataset-path regression tests
- `docs/phase1/README_AR.md` — Phase 1 usage, provenance, and validation notes
- `info/HAYAH_Data_Audit_v0.3_AR.md` — Arabic audit summary of the dataset and its assumptions
- `info/HAYAH_Master_Project_Specification_v0.3_AR.pdf` and `info/علاقات التوائم الرقمية HAYAH.pdf` — project and digital-twin relationship references
- `assests/logo/` — Noor's three SVG logo assets, with existing paths and filenames preserved
- `README.md` — project overview and usage guidance

## What the dataset contains

The dataset models a single virtual hospital and includes the following sections:

- `meta` — dataset metadata, rules, known limitations, and reference notes
- `patients` — 50 tracked patients with triage and department route information
- `ambulances` — 3 ambulances linked to patient transport and ETA information
- `departments` — 5 departments with capacity, occupancy, queue, and predicted load
- `staff` — staffing records
- `equipment` — equipment assets
- `beds` — bed-level inventory and states

The project reflects a draft operational snapshot of a hospital flow model, where departments such as ED, RAD-CT, LAB, ICU, and WARD are tracked in a simplified simulation scenario.

## Validation logic

The validator checks the following:

- required sections are present and in the expected array format
- required IDs are present and unique per entity type
- patient IDs, ambulance IDs, and department IDs are consistently linked
- `current_department_id`, `next_department_id`, and `predicted_path` match expected rules
- department metrics such as `queue_length`, `predicted_incoming`, and status are derived consistently
- department capacity and bed totals are aligned with the recorded occupancy values
- interactive patient selection contains valid IDs and no duplicates

The validator also produces warnings for areas that are intentionally draft or uncertain rather than outright invalid. This is important because some fields are marked as operational assumptions rather than final business rules.

## Quick start

Run the validator from the project folder:

```bash
python -B info/validate_hayah_data.py data/hayah_master_data_v0_3.json
python -B info/validate_hayah_data.py
```

This checks the dataset and prints a summary of counts, validation errors, warnings, and final pass/fail status.

Inspect the unchanged snapshot and run the tests with Python 3.9+ and its standard library:

```bash
python -B hayah_inspect.py relationships
python -B hayah_inspect.py --data data/hayah_master_data_v0_3.json relationships
python -B hayah_inspect.py get patients PAT-001
python -B hayah_inspect.py resources WARD-01
python -B -m unittest discover -s tests -v
```

The inspector and validator resolve their default dataset relative to the script, so they can also be invoked by script path from another working directory. Explicit dataset paths remain relative to the caller's working directory. The inspector exposes existing snapshot values; it does not update ETA, run simulations, or write to Firestore.

## Current project status

The current dataset passes the existing structural and snapshot consistency checks.

Reconciliation validation output (2026-11-13):

```text
HAYAH DATA AUDIT
Counts: patients=50, ambulances=3, departments=5, staff=15, equipment=5, beds=88
Errors: 0
Warnings/decisions: 5
PASS: structural and snapshot consistency checks
```

The script still reports five operational warnings, which highlight draft assumptions that should be reviewed before using the data for production-grade operational modeling.

The reconciled test suite passed all 31 tests (27 original Phase 1 tests and 4 path regressions). Exact commands and observed results are documented in [Phase 1 validation notes](docs/phase1/README_AR.md#reconciliation-validation--2026-11-13). The original `docs/phase1/test-output.txt` and `validation-output.txt` remain unchanged historical reports, not the current run logs.

## Important limitations

This project is intentionally limited and should be treated as a demo or prototype dataset:

- `predicted_incoming` is a static snapshot, not a live recalculated value
- some department occupancy includes background patients outside the tracked 50-patient list
- status values use draft casing and assumptions that may be normalized later
- the scenario engine and prediction formulas are still under review
- the data is synthetic and should not be used for real clinical or operational decisions

## Use case

This repository is useful for:

- learning data validation patterns for healthcare simulations
- testing logic around patient flow and bed capacity
- reviewing inter-department routing rules in a synthetic environment
- auditing operational assumptions before building a more formal decision-support tool

## Recommended next steps

1. Keep the dataset as a draft dataset until approval is finalized.
2. Review the warning items before extending the model or simulation.
3. Use the validator as a gate for schema and consistency checks before any data change.
4. Treat all operational predictions as scenario assumptions rather than final clinical or operational truth.

## Summary

HAYAH is a compact, practical example of a healthcare data audit project: a synthetic dataset paired with a Python validation script that checks whether the records follow the intended structure and business rules. It is useful for understanding how to build validation checks for hospital operations data while keeping the project clearly marked as a non-production, demo-only model.
