"""Read-only inspection of the existing HAYAH v0.3 synthetic JSON snapshot.

Python 3.9+ standard library only. This is offline tooling, not an application
backend, shared state store, approved JSON schema, or prediction engine.
"""

import argparse
from copy import deepcopy
import json
from pathlib import Path
from typing import Optional

from validate_hayah_data import KEYS


class DataInspectionError(ValueError):
    """The input cannot be inspected safely as the existing record collections."""


class DatasetInspector:
    """Keep an isolated snapshot; every public data result is a fresh copy."""

    def __init__(self, data: dict):
        if not isinstance(data, dict):
            raise DataInspectionError('Dataset root must be an object')
        data = deepcopy(data)
        for section, key in KEYS.items():
            rows = data.get(section)
            if not isinstance(rows, list):
                raise DataInspectionError(f'{section}: expected an array')
            seen = set()
            for row in rows:
                if not isinstance(row, dict):
                    raise DataInspectionError(f'{section}: expected object records')
                entity_id = row.get(key)
                if not isinstance(entity_id, str) or not entity_id:
                    raise DataInspectionError(f'{section}: invalid {key}')
                if entity_id in seen:
                    raise DataInspectionError(f'{section}: duplicate {key}: {entity_id}')
                seen.add(entity_id)
        if not isinstance(data.get('meta'), dict):
            raise DataInspectionError('meta: expected an object')
        selection = data['meta'].get('interactive_patient_ids')
        if not isinstance(selection, list) or any(
            not isinstance(value, str) or not value for value in selection
        ):
            raise DataInspectionError('meta.interactive_patient_ids: expected ID array')
        self._data = data

    @classmethod
    def load(cls, path):
        """Read UTF-8 JSON (optional BOM). IO/JSON errors retain native types."""
        return cls(json.loads(Path(path).read_text(encoding='utf-8-sig')))

    def snapshot(self) -> dict:
        return deepcopy(self._data)

    def records(self, section: str) -> list:
        if section not in KEYS:
            raise ValueError(f'Unknown entity collection: {section}')
        return deepcopy(self._data[section])

    def get(self, section: str, entity_id: str) -> dict:
        """Exact, case-sensitive lookup; missing IDs raise KeyError."""
        if section not in KEYS:
            raise ValueError(f'Unknown entity collection: {section}')
        for row in self._data[section]:
            if row[KEYS[section]] == entity_id:
                return deepcopy(row)
        raise KeyError(f'{section}: unknown ID {entity_id!r}')

    def interactive_patients(self) -> list:
        """Use the stored selection and order, never invent replacement cases."""
        return [self.get('patients', pid)
                for pid in self._data['meta']['interactive_patient_ids']]

    def resources(self, department_id: str) -> dict:
        self.get('departments', department_id)
        return {section: [deepcopy(row) for row in self._data[section]
                          if row.get('department_id') == department_id]
                for section in ('staff', 'equipment', 'beds')}

    def operational_indicators(self, department_id: Optional[str] = None) -> list:
        """Return stored department records only; do not derive new pressure."""
        if department_id is not None:
            return [self.get('departments', department_id)]
        return self.records('departments')

    def relationship_errors(self) -> list:
        """Check existing links, including all path entries and both directions.

        Missing link fields are errors. Only the documented empty-string optional
        links and current_department_id='Ambulance' sentinel are accepted.
        This does not validate clinical meaning or finalize DEC-06.
        """
        errors = []
        ids = {section: {row[key] for row in self._data[section]}
               for section, key in KEYS.items()}
        patients = {p['patient_id']: p for p in self._data['patients']}
        ambulances = {a['ambulance_id']: a for a in self._data['ambulances']}

        def check(owner, field, value, allowed):
            if not isinstance(value, str) or value not in allowed:
                errors.append(f'{owner}: invalid reference {field}={value!r}')

        for pid, patient in patients.items():
            current = patient.get('current_department_id')
            next_id = patient.get('next_department_id')
            aid = patient.get('ambulance_id')
            check(pid, 'current_department_id', current, ids['departments'] | {'Ambulance'})
            check(pid, 'next_department_id', next_id, ids['departments'] | {''})
            check(pid, 'ambulance_id', aid, ids['ambulances'] | {''})
            path = patient.get('predicted_path')
            if not isinstance(path, list) or not path:
                errors.append(f'{pid}: missing/invalid predicted_path')
            else:
                for value in path:
                    check(pid, 'predicted_path', value, ids['departments'])
                expected = next_id if current == 'Ambulance' else current
                if path[0] != expected or (next_id and next_id not in path):
                    errors.append(f'{pid}: path/current/next linkage inconsistent')
                if next_id == '' and len(path) > 1:
                    errors.append(f'{pid}: future path without next department')
            if isinstance(aid, str) and aid in ambulances:
                if ambulances[aid].get('patient_id') != pid:
                    errors.append(f'{pid}: nonreciprocal ambulance linkage')
            if (current == 'Ambulance' or patient.get('status') == 'En_route') and not aid:
                errors.append(f'{pid}: ambulance context without ambulance_id')

        for aid, ambulance in ambulances.items():
            pid = ambulance.get('patient_id')
            check(aid, 'patient_id', pid, ids['patients'])
            linked = [p['patient_id'] for p in patients.values()
                      if p.get('ambulance_id') == aid]
            if linked != [pid]:
                errors.append(f'{aid}: nonreciprocal patient linkage')

        for section in ('staff', 'equipment', 'beds'):
            for row in self._data[section]:
                check(row[KEYS[section]], 'department_id', row.get('department_id'),
                      ids['departments'])

        selection = self._data['meta']['interactive_patient_ids']
        if len(selection) != len(set(selection)):
            errors.append('meta.interactive_patient_ids: duplicate IDs')
        for pid in selection:
            check('meta', 'interactive_patient_ids', pid, ids['patients'])
        triage_basis = self._data['meta'].get('triage_basis', {})
        if not isinstance(triage_basis, dict):
            errors.append('meta.triage_basis: expected an object')
        else:
            for pid in triage_basis:
                check('meta', 'triage_basis', pid, ids['patients'])
        return errors


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    default_data = Path(__file__).resolve().parent / 'data' / 'hayah_master_data_v0_3.json'
    parser.add_argument('--data', type=Path, default=default_data)
    commands = parser.add_subparsers(dest='command', required=True)
    commands.add_parser('snapshot')
    listing = commands.add_parser('list')
    listing.add_argument('section', choices=KEYS)
    lookup = commands.add_parser('get')
    lookup.add_argument('section', choices=KEYS)
    lookup.add_argument('id')
    commands.add_parser('cases')
    resources = commands.add_parser('resources')
    resources.add_argument('department_id')
    indicators = commands.add_parser('indicators')
    indicators.add_argument('department_id', nargs='?')
    commands.add_parser('relationships')
    args = parser.parse_args(argv)
    try:
        inspector = DatasetInspector.load(args.data)
        if args.command == 'snapshot':
            result = inspector.snapshot()
        elif args.command == 'list':
            result = inspector.records(args.section)
        elif args.command == 'get':
            result = inspector.get(args.section, args.id)
        elif args.command == 'cases':
            result = inspector.interactive_patients()
        elif args.command == 'resources':
            result = inspector.resources(args.department_id)
        elif args.command == 'indicators':
            result = inspector.operational_indicators(args.department_id)
        else:
            result = inspector.relationship_errors()
    except (OSError, UnicodeError, ValueError, KeyError) as exc:
        parser.exit(2, f'Inspection failed: {exc}\n')
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 1 if args.command == 'relationships' and result else 0


if __name__ == '__main__':
    raise SystemExit(main())
