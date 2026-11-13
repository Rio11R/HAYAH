#!/usr/bin/env python3
"""Read-only validator for HAYAH synthetic demo data v0.3.
Usage: python info/validate_hayah_data.py data/hayah_master_data_v0_3.json
Requires: Python 3.9+ standard library only.
"""
import collections
import json
import sys
from pathlib import Path

KEYS = {
    'patients': 'patient_id', 'ambulances': 'ambulance_id',
    'departments': 'department_id', 'staff': 'staff_id',
    'equipment': 'equipment_id', 'beds': 'bed_id'
}


def validate(path):
    errors, warnings = [], []
    try:
        data = json.loads(path.read_text(encoding='utf-8-sig'))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        return [f'Cannot read valid JSON: {exc}'], [], {}

    ids = {}
    counts = {}
    for section, key in KEYS.items():
        rows = data.get(section)
        if not isinstance(rows, list):
            errors.append(f'{section}: missing or not an array')
            rows = []
        counts[section] = len(rows)
        keys = [r.get(key) for r in rows if isinstance(r, dict)]
        if len(keys) != len(rows) or any(v is None or v == '' for v in keys):
            errors.append(f'{section}: missing/invalid {key}')
        dupe = [v for v, n in collections.Counter(keys).items() if n > 1]
        if dupe:
            errors.append(f'{section}: duplicate {key}: {dupe}')
        ids[section] = set(keys)

    patients = data.get('patients', [])
    ambulances = data.get('ambulances', [])
    departments = data.get('departments', [])
    beds = data.get('beds', [])

    if counts.get('patients') != 50:
        errors.append(f'Expected 50 patients; found {counts.get("patients")}')
    if counts.get('ambulances') != 3:
        errors.append(f'Expected 3 ambulances; found {counts.get("ambulances")}')

    for p in patients:
        pid = p['patient_id']
        current, next_id, aid = p['current_department_id'], p['next_department_id'], p['ambulance_id']
        path_list = p.get('predicted_path', [])
        if current not in ids['departments'] | {'Ambulance'}:
            errors.append(f'{pid}: unknown current_department_id {current}')
        if next_id and next_id not in ids['departments']:
            errors.append(f'{pid}: unknown next_department_id {next_id}')
        if aid and aid not in ids['ambulances']:
            errors.append(f'{pid}: unknown ambulance_id {aid}')
        expected_first = next_id if current == 'Ambulance' else current
        if not path_list or path_list[0] != expected_first:
            errors.append(f'{pid}: predicted_path does not start with expected department')
        if next_id and next_id not in path_list:
            errors.append(f'{pid}: predicted_path missing next department')
        if not next_id and len(path_list) > 1:
            errors.append(f'{pid}: has future path despite empty next department')
        if p['status'] == 'En_route' and not aid:
            errors.append(f'{pid}: En_route patient without ambulance')

    for a in ambulances:
        aid, pid = a['ambulance_id'], a['patient_id']
        if pid not in ids['patients']:
            errors.append(f'{aid}: unknown patient_id {pid}')
        if [p['patient_id'] for p in patients if p['ambulance_id'] == aid] != [pid]:
            errors.append(f'{aid}: nonreciprocal patient linkage')
        if not isinstance(a.get('eta_minutes'), (float, int)) or a['eta_minutes'] < 0:
            errors.append(f'{aid}: invalid eta_minutes')

    for section in ('staff', 'equipment', 'beds'):
        for item in data.get(section, []):
            if item['department_id'] not in ids['departments']:
                errors.append(f'{section}: unknown department {item["department_id"]}')

    for d in departments:
        dept = d['department_id']
        incoming = sum(p['next_department_id'] == dept and p['current_department_id'] != dept for p in patients)
        waiting = sum(p['status'] == 'Waiting' and p['current_department_id'] == dept for p in patients)
        if d['predicted_incoming'] != incoming:
            errors.append(f'{dept}: predicted_incoming {d["predicted_incoming"]} != calculated {incoming}')
        if d['queue_length'] != waiting:
            errors.append(f'{dept}: queue_length {d["queue_length"]} != calculated {waiting}')
        cap = d['capacity']
        if not isinstance(cap, (int, float)) or cap <= 0:
            errors.append(f'{dept}: invalid capacity')
            continue
        ratio = (d['occupied'] + d['predicted_incoming']) / cap
        status = 'Critical' if ratio >= 0.9 else ('Warning' if ratio >= 0.7 else 'Normal')
        if d['status'] != status:
            errors.append(f'{dept}: status {d["status"]} != derived {status}')
        dept_beds = [b for b in beds if b['department_id'] == dept]
        if dept_beds and (len(dept_beds) != cap or sum(b['status'] == 'occupied' for b in dept_beds) != d['occupied']):
            errors.append(f'{dept}: beds/occupied do not agree with department snapshot')
        if any(b['status'] == 'out_of_service' for b in dept_beds):
            warnings.append(f'{dept}: out-of-service beds included in total capacity; confirm effective-capacity rule')

    interactive = data.get('meta', {}).get('interactive_patient_ids', [])
    if not 5 <= len(interactive) <= 10 or not set(interactive).issubset(ids['patients']):
        errors.append('Interactive patient selection must contain 5-10 valid unique IDs')
    if len(interactive) != len(set(interactive)):
        errors.append('Duplicate interactive patient IDs')

    warnings += [
        'predicted_incoming is a static snapshot; ETA changes need an approved time-window/recalculation rule',
        'department occupied may include untracked background patients: do not recompute it as count(patients) alone',
        'mixed case status values: do not normalize until DEC-06 is approved',
        'scenario engine and operational prediction formulas still require team approval (DEC-04 / DEC-06)',
    ]
    return errors, warnings, counts


if __name__ == '__main__':
    default_data = Path(__file__).resolve().parents[1] / 'data' / 'hayah_master_data_v0_3.json'
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else default_data
    errors, warnings, counts = validate(path)
    print('HAYAH DATA AUDIT')
    print('Counts:', ', '.join(f'{k}={v}' for k, v in counts.items()))
    print(f'Errors: {len(errors)}')
    for e in errors:
        print('  ERROR:', e)
    print(f'Warnings/decisions: {len(warnings)}')
    for w in warnings:
        print('  NOTE:', w)
    print('PASS: structural and snapshot consistency checks' if not errors else 'FAIL')
    sys.exit(1 if errors else 0)
