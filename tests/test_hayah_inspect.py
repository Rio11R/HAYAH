"""Read-only inspection checks against the original synthetic v0.3 fixture.

Run from the repository root: python -m unittest discover -s tests -v
Malformed/broken examples are written only to temporary files.
"""
import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from hayah_inspect import DataInspectionError, DatasetInspector


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = REPOSITORY_ROOT / 'hayah_master_data_v0.3.json'
CLI_PATH = REPOSITORY_ROOT / 'hayah_inspect.py'
ENTITY_KEYS = {
    'patients': 'patient_id',
    'ambulances': 'ambulance_id',
    'departments': 'department_id',
    'staff': 'staff_id',
    'equipment': 'equipment_id',
    'beds': 'bed_id',
}
EXPECTED_COUNTS = {
    'patients': 50, 'ambulances': 3, 'departments': 5,
    'staff': 15, 'equipment': 5, 'beds': 88,
}


class DatasetInspectorTests(unittest.TestCase):
    def setUp(self):
        self.original_bytes = DATA_PATH.read_bytes()
        self.original = json.loads(self.original_bytes.decode('utf-8-sig'))
        self.inspector = DatasetInspector.load(DATA_PATH)

    def tearDown(self):
        self.assertEqual(DATA_PATH.read_bytes(), self.original_bytes,
                         'The original JSON bytes must remain unchanged')

    def load_fixture(self, data):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'temporary-demo.json'
            path.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
            return DatasetInspector.load(path)

    def test_load_accepts_path_and_string_without_changing_values(self):
        self.assertEqual(self.inspector.snapshot(), self.original)
        self.assertEqual(DatasetInspector.load(str(DATA_PATH)).snapshot(), self.original)

    def test_all_record_counts_match_original_dataset(self):
        self.assertEqual({section: len(self.inspector.records(section))
                          for section in ENTITY_KEYS}, EXPECTED_COUNTS)
        self.assertEqual(self.inspector.snapshot()['meta']['hospital']['hospital_id'],
                         'HOSP-01')
        self.assertIs(self.inspector.snapshot()['meta']['synthetic'], True)

    def test_identifiers_are_present_and_unique_in_every_entity_collection(self):
        for section, key in ENTITY_KEYS.items():
            with self.subTest(section=section):
                ids = [row[key] for row in self.inspector.records(section)]
                self.assertTrue(all(isinstance(value, str) and value for value in ids))
                self.assertEqual(len(ids), len(set(ids)))

    def test_known_patient_is_retrieved_with_original_nested_path(self):
        self.assertEqual(self.inspector.get('patients', 'PAT-001'), {
            'patient_id': 'PAT-001', 'status': 'En_route', 'triage_level': 1,
            'ambulance_id': 'AMB-101', 'current_department_id': 'Ambulance',
            'next_department_id': 'ED-01', 'predicted_path': ['ED-01', 'ICU-01'],
        })

    def test_known_ambulance_is_retrieved_with_original_eta_and_patient(self):
        self.assertEqual(self.inspector.get('ambulances', 'AMB-101'), {
            'ambulance_id': 'AMB-101', 'eta_minutes': 7,
            'status': 'en_route', 'patient_id': 'PAT-001',
        })

    def test_all_entity_types_support_id_lookup(self):
        for section, key in ENTITY_KEYS.items():
            with self.subTest(section=section):
                row = self.original[section][-1]
                self.assertEqual(self.inspector.get(section, row[key]), row)

    def test_nonexistent_and_empty_ids_raise_key_error(self):
        for section in ENTITY_KEYS:
            for value in ('DOES-NOT-EXIST', ''):
                with self.subTest(section=section, value=value):
                    with self.assertRaises(KeyError):
                        self.inspector.get(section, value)
        with self.assertRaises(KeyError):
            self.inspector.resources('MISSING-DEPARTMENT')
        with self.assertRaises(KeyError):
            self.inspector.operational_indicators('MISSING-DEPARTMENT')

    def test_unknown_collection_raises_value_error(self):
        with self.assertRaises(ValueError):
            self.inspector.records('simulation')
        with self.assertRaises(ValueError):
            self.inspector.get('simulation', 'SCENARIO-1')

    def test_interactive_selection_is_exactly_the_eight_existing_ids_in_order(self):
        rows = self.inspector.interactive_patients()
        self.assertEqual([row['patient_id'] for row in rows],
                         ['PAT-001', 'PAT-002', 'PAT-003', 'PAT-004',
                          'PAT-005', 'PAT-006', 'PAT-007', 'PAT-008'])
        self.assertEqual([row['patient_id'] for row in rows],
                         self.original['meta']['interactive_patient_ids'])
        self.assertEqual(rows, self.original['patients'][:8])

    def test_department_resources_match_source_and_do_not_create_beds(self):
        for department in self.original['departments']:
            department_id = department['department_id']
            with self.subTest(department_id=department_id):
                expected = {section: [row for row in self.original[section]
                                      if row['department_id'] == department_id]
                            for section in ('staff', 'equipment', 'beds')}
                self.assertEqual(self.inspector.resources(department_id), expected)
        self.assertEqual(self.inspector.resources('RAD-CT')['beds'], [])
        self.assertEqual(self.inspector.resources('LAB-01')['beds'], [])
        ward = self.inspector.resources('WARD-01')['beds']
        self.assertEqual(len(ward), 40)
        self.assertEqual(sum(row['status'] == 'out_of_service' for row in ward), 1)

    def test_operational_indicators_are_only_existing_department_records(self):
        self.assertEqual(self.inspector.operational_indicators(),
                         self.original['departments'])
        for department in self.original['departments']:
            with self.subTest(department_id=department['department_id']):
                self.assertEqual(self.inspector.operational_indicators(
                    department['department_id']), [department])
        self.assertEqual(self.inspector.get('departments', 'RAD-CT')['predicted_incoming'], 5)
        self.assertEqual(self.inspector.get('departments', 'WARD-01')['capacity'], 40)

    def test_empty_sentinels_case_and_metadata_are_preserved(self):
        self.assertEqual(self.inspector.get('patients', 'PAT-050')['ambulance_id'], '')
        self.assertEqual(self.inspector.get('patients', 'PAT-050')['next_department_id'], '')
        self.assertEqual(self.inspector.get('patients', 'PAT-001')['status'], 'En_route')
        self.assertEqual(self.inspector.get('ambulances', 'AMB-101')['status'], 'en_route')
        self.assertEqual(self.inspector.get('staff', 'TECH-03')['status'], 'Available')
        self.assertEqual(self.inspector.get('equipment', 'EQ-DEF-01')['status'], 'available')
        self.assertEqual(self.inspector.snapshot()['meta'], self.original['meta'])

    def test_mutating_nested_return_values_cannot_change_snapshot_or_file(self):
        snapshot = self.inspector.snapshot()
        snapshot['meta']['interactive_patient_ids'].clear()
        snapshot['patients'][0]['predicted_path'].append('MUTATED')
        snapshot['departments'][0]['capacity'] = 0
        rows = self.inspector.records('patients')
        rows[0]['predicted_path'].clear()
        rows.clear()
        patient = self.inspector.get('patients', 'PAT-001')
        patient['predicted_path'].append('MUTATED')
        cases = self.inspector.interactive_patients()
        cases[0]['predicted_path'].clear()
        resources = self.inspector.resources('ED-01')
        resources['beds'][0]['status'] = 'MUTATED'
        resources['staff'].clear()
        indicators = self.inspector.operational_indicators()
        indicators[0]['occupied'] = 0
        self.assertEqual(self.inspector.snapshot(), self.original)
        self.assertEqual(DatasetInspector.load(DATA_PATH).snapshot(), self.original)
        self.assertEqual(self.inspector.relationship_errors(), [])

    def test_all_original_relationships_are_valid(self):
        self.assertEqual(self.inspector.relationship_errors(), [])
        departments = {row['department_id'] for row in self.original['departments']}
        ambulances = {row['ambulance_id']: row for row in self.original['ambulances']}
        for row in self.original['patients']:
            self.assertIn(row['current_department_id'], departments | {'Ambulance'})
            self.assertIn(row['next_department_id'], departments | {''})
            self.assertTrue(set(row['predicted_path']).issubset(departments))
            if row['ambulance_id']:
                self.assertEqual(ambulances[row['ambulance_id']]['patient_id'], row['patient_id'])

    def test_broken_patient_department_and_ambulance_references_are_reported(self):
        for field in ('current_department_id', 'next_department_id', 'ambulance_id'):
            data = copy.deepcopy(self.original)
            data['patients'][0][field] = 'MISSING'
            with self.subTest(field=field):
                self.assertTrue(self.load_fixture(data).relationship_errors())
        data = copy.deepcopy(self.original)
        data['patients'][0]['predicted_path'].append('MISSING')
        self.assertTrue(self.load_fixture(data).relationship_errors())

    def test_broken_resource_department_references_are_reported(self):
        for section in ('staff', 'equipment', 'beds'):
            data = copy.deepcopy(self.original)
            data[section][0]['department_id'] = 'MISSING'
            with self.subTest(section=section):
                self.assertTrue(self.load_fixture(data).relationship_errors())

    def test_broken_and_nonreciprocal_ambulance_patient_links_are_reported(self):
        for patient_id in ('MISSING', 'PAT-004'):
            data = copy.deepcopy(self.original)
            data['ambulances'][0]['patient_id'] = patient_id
            with self.subTest(patient_id=patient_id):
                self.assertTrue(self.load_fixture(data).relationship_errors())
        data = copy.deepcopy(self.original)
        data['patients'][3]['ambulance_id'] = 'AMB-101'
        self.assertTrue(self.load_fixture(data).relationship_errors())

    def test_broken_metadata_patient_references_are_reported(self):
        data = copy.deepcopy(self.original)
        data['meta']['interactive_patient_ids'][0] = 'MISSING'
        inspector = self.load_fixture(data)
        self.assertTrue(inspector.relationship_errors())
        with self.assertRaises(KeyError):
            inspector.interactive_patients()
        data = copy.deepcopy(self.original)
        data['meta']['triage_basis']['MISSING'] = 'Synthetic description'
        self.assertTrue(self.load_fixture(data).relationship_errors())

    def test_missing_malformed_and_duplicate_entity_ids_are_rejected(self):
        for section, key in ENTITY_KEYS.items():
            for bad_id in ('', None, 123, [], {}):
                data = copy.deepcopy(self.original)
                data[section][0][key] = bad_id
                with self.subTest(section=section, bad_id=bad_id):
                    with self.assertRaises(DataInspectionError):
                        self.load_fixture(data)
            data = copy.deepcopy(self.original)
            del data[section][0][key]
            with self.subTest(section=section, case='missing'):
                with self.assertRaises(DataInspectionError):
                    self.load_fixture(data)
            data = copy.deepcopy(self.original)
            data[section][1][key] = data[section][0][key]
            with self.subTest(section=section, case='duplicate'):
                with self.assertRaises(DataInspectionError):
                    self.load_fixture(data)

    def test_missing_or_malformed_collections_and_rows_are_rejected(self):
        for section in ENTITY_KEYS:
            for bad_rows in (None, {}, 'invalid', [None]):
                data = copy.deepcopy(self.original)
                data[section] = bad_rows
                with self.subTest(section=section, bad_rows=bad_rows):
                    with self.assertRaises(DataInspectionError):
                        self.load_fixture(data)
            data = copy.deepcopy(self.original)
            del data[section]
            with self.subTest(section=section, case='missing'):
                with self.assertRaises(DataInspectionError):
                    self.load_fixture(data)
        with self.assertRaises(DataInspectionError):
            self.load_fixture([])

    def test_load_reports_invalid_json_and_missing_file(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'broken.json'
            path.write_text('{ invalid JSON', encoding='utf-8')
            with self.assertRaises(json.JSONDecodeError):
                DatasetInspector.load(path)
            with self.assertRaises(FileNotFoundError):
                DatasetInspector.load(Path(directory) / 'missing.json')

    def test_constructor_isolates_nested_input_from_caller_mutations(self):
        data = copy.deepcopy(self.original)
        inspector = DatasetInspector(data)
        data['patients'][0]['predicted_path'].clear()
        data['meta']['interactive_patient_ids'].clear()
        data['beds'][0]['status'] = 'MUTATED'
        self.assertEqual(inspector.snapshot(), self.original)

    def test_malformed_metadata_and_interactive_selection_are_rejected(self):
        for metadata in (None, [], 'invalid'):
            data = copy.deepcopy(self.original)
            data['meta'] = metadata
            with self.subTest(metadata=metadata):
                with self.assertRaises(DataInspectionError):
                    self.load_fixture(data)
        data = copy.deepcopy(self.original)
        del data['meta']
        with self.assertRaises(DataInspectionError):
            self.load_fixture(data)
        for selection in (None, {}, 'PAT-001', [None], [''], [123]):
            data = copy.deepcopy(self.original)
            data['meta']['interactive_patient_ids'] = selection
            with self.subTest(selection=selection):
                with self.assertRaises(DataInspectionError):
                    self.load_fixture(data)

    def test_cli_default_data_path_works_outside_repository(self):
        commands = [
            (['get', 'ambulances', 'AMB-101'], self.original['ambulances'][0]),
            (['cases'], self.original['patients'][:8]),
            (['relationships'], []),
        ]
        with tempfile.TemporaryDirectory() as directory:
            for arguments, expected in commands:
                with self.subTest(arguments=arguments):
                    result = subprocess.run(
                        [sys.executable, '-B', str(CLI_PATH), *arguments],
                        cwd=directory, capture_output=True, text=True, check=False,
                    )
                    self.assertEqual(result.returncode, 0, result.stderr)
                    self.assertEqual(json.loads(result.stdout), expected)
                    self.assertEqual(result.stderr, '')

    def test_cli_nonexistent_id_returns_nonzero_without_traceback(self):
        result = subprocess.run(
            [sys.executable, '-B', str(CLI_PATH), 'get', 'patients', 'MISSING'],
            capture_output=True, text=True, check=False,
        )
        self.assertEqual(result.returncode, 2)
        self.assertEqual(result.stdout, '')
        self.assertIn('MISSING', result.stderr)
        self.assertNotIn('Traceback', result.stderr)

    def test_cli_broken_relationships_return_findings_and_nonzero_status(self):
        data = copy.deepcopy(self.original)
        data['patients'][0]['predicted_path'].append('MISSING')
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'broken-relationships.json'
            path.write_text(json.dumps(data), encoding='utf-8')
            before = path.read_bytes()
            result = subprocess.run(
                [sys.executable, '-B', str(CLI_PATH), '--data', str(path),
                 'relationships'], capture_output=True, text=True, check=False,
            )
            self.assertEqual(result.returncode, 1, result.stderr)
            self.assertTrue(json.loads(result.stdout))
            self.assertEqual(result.stderr, '')
            self.assertEqual(path.read_bytes(), before)

    def test_utf8_bom_is_accepted_without_changing_values(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'with-bom.json'
            path.write_text(json.dumps(self.original, ensure_ascii=False), encoding='utf-8-sig')
            before = path.read_bytes()
            inspector = DatasetInspector.load(path)
            self.assertEqual(inspector.snapshot(), self.original)
            self.assertEqual(path.read_bytes(), before)


if __name__ == '__main__':
    unittest.main()
