"""Accuracy checks for off-street grouping and Queen Victoria Market sources."""
import gzip
import json
import unittest
from pathlib import Path
from group_parking_areas import group_parking_spaces
from qvm_parking import qvm_tariffs

ROOT = Path(__file__).resolve().parents[1]


class ParkingAreaGroupingTests(unittest.TestCase):
    def test_boundary_crossing_street_side_and_different_level_are_not_grouped(self):
        ring = [{'lat': y, 'lon': x} for y, x in [(0, 0), (0, 1), (1, 1), (1, 0), (0, 0)]]
        elements = [dict(type='way', id=1, geometry=ring, tags={'amenity': 'parking', 'parking': 'surface'}),
                    dict(type='way', id=2, geometry=ring, tags={'amenity': 'parking', 'parking': 'street_side'})]
        for identifier, lat, lon, extra in [(3, .5, .5, {}), (4, 1.1, .5, {}), (5, .5, .5, {'layer': '-1'})]:
            elements.append(dict(type='node', id=identifier, lat=lat, lon=lon, tags={'amenity': 'parking_space', **extra}))
        elements.append(dict(type='way', id=6, geometry=[{'lat': .5, 'lon': .5}, {'lat': 1.1, 'lon': .5}], tags={'amenity': 'parking_space'}))
        records = [{'id': f"osm:{e['type']}:{e['id']}", 'kind': 'area' if e['id'] < 3 else 'bay'} for e in elements]
        audit = group_parking_spaces(records, elements)
        self.assertEqual([r['space_id'] for r in audit], ['osm:node:3'])
        self.assertEqual(audit[0]['parent_area_id'], 'osm:way:1')

    def test_qvm_source_geometry_groups_all_603_spaces_without_street_bays(self):
        raw = ROOT / 'datasets/melbourne/2026-09-26'
        elements = json.loads(gzip.decompress((raw / 'melbourne-parking-and-street-zones-osm.json.gz').read_bytes()))['elements']
        records = [{'id': f"osm:{e['type']}:{e['id']}", 'source_url': f"https://www.openstreetmap.org/{e['type']}/{e['id']}"} for e in elements]
        audit = group_parking_spaces(records, elements)
        qvm = [r for r in audit if r['parent_area_id'] == 'osm:way:7674137']
        self.assertEqual(len(qvm), 603)
        qvm_tariffs(records, elements, raw / 'qvm-operator', '2026-09-26')
        facilities = [r for r in records if r.get('facility_type')]
        self.assertEqual(len(facilities), 2)
        surface = next(r for r in facilities if r['id'] == 'osm:way:7674137')
        underground = next(r for r in facilities if r['id'] == 'osm:node:11140069164')
        self.assertIsNone(surface['capacity'])
        self.assertEqual(underground['capacity'], 506)
        self.assertTrue(all(r['kind'] == 'area' and r['occupancy'] == 'not_provided' for r in facilities))
        evening = next(t for t in surface['tariffs'] if t['category'].startswith('Market days') and t['period'].startswith('Evening'))
        self.assertEqual(evening['amount'], 12)
        self.assertEqual(evening['conditions'], 'Exit by 7pm')
        first = next(t for t in surface['tariffs'] if t['period'] == 'First two hours after 9am')
        self.assertEqual(first['amount'], 8)
        self.assertTrue(any(t['amount'] == 0 and '6am-9am' in t['period'] for t in surface['tariffs']))


if __name__ == '__main__':
    unittest.main()
