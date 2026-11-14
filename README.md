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

- `hayah_master_data_v0.3.json` — the synthetic hospital dataset used by the project
- `validate_hayah_data.py` — Python script that validates schema, counts, IDs, and operational relationships
- `HAYAH_Data_Audit_v0.3_AR.md` — Arabic audit summary of the dataset and its assumptions
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
python validate_hayah_data.py hayah_master_data_v0.3.json
```

This checks the dataset and prints a summary of counts, validation errors, warnings, and final pass/fail status.

## Current project status

The current dataset passes the existing structural and snapshot consistency checks.

Fresh validation output:

```text
HAYAH DATA AUDIT
Counts: patients=50, ambulances=3, departments=5, staff=15, equipment=5, beds=88
Errors: 0
Warnings/decisions: 5
PASS: structural and snapshot consistency checks
```

The script still reports five operational warnings, which highlight draft assumptions that should be reviewed before using the data for production-grade operational modeling.

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
