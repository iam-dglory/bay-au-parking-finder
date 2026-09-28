#!/usr/bin/env python3
"""Build US parking-only OSM archives and Bay map tiles from Geofabrik states.

Install ``osmium`` (see scripts/data-requirements.txt). Full Geofabrik PBFs are
kept locally under datasets/us/raw-pbf, while the relevant parking-only archive
and app tiles are versioned. No live vacancy, legal permission, or prices are
inferred from a mapped parking geometry.
"""
import argparse
import collections
import datetime as dt
import gzip
import hashlib
import json
import math
import re
import shutil
import subprocess
import sys
from pathlib import Path

try:
    import osmium
except ImportError:
    sys.exit("Install osmium: python3 -m pip install osmium")

ROOT = Path(__file__).resolve().parents[1]
TILE_SIZE = .1
SOURCE = 'https://download.geofabrik.de/north-america/us'
STATES = '''alabama alaska arizona arkansas california colorado connecticut delaware district-of-columbia florida georgia hawaii idaho illinois indiana iowa kansas kentucky louisiana maine maryland massachusetts michigan minnesota mississippi missouri montana nebraska nevada new-hampshire new-jersey new-mexico new-york north-carolina north-dakota ohio oklahoma oregon pennsylvania puerto-rico rhode-island south-carolina south-dakota tennessee texas us-virgin-islands utah vermont virginia washington west-virginia wisconsin wyoming american-oceania'''.split()
SKIP_ACCESS = {'private', 'no', 'delivery', 'employees', 'permit'}
PARKING_AMENITIES = {'parking', 'parking_space'}
NO_PARKING = {'no', 'no_parking', 'no_stopping', 'separate'}


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def download(state):
    target = ROOT / 'datasets/us/raw-pbf' / f'{state}-latest.osm.pbf'
    if target.exists() and valid_pbf(target):
        return target
    if target.exists():
        target.unlink()
    target.parent.mkdir(parents=True, exist_ok=True)
    tmp = target.with_suffix('.partial')
    url = source_url(state)
    subprocess.run(['curl', '-fL', '--retry', '3', '--connect-timeout', '20',
                    '--max-time', '3600', '-C', '-', '-o', str(tmp), url], check=True)
    if not valid_pbf(tmp):
        raise ValueError(f'Invalid OSM PBF download for {state}: {url}')
    tmp.replace(target)
    return target


def valid_pbf(path):
    if path.stat().st_size < 1000:
        return False
    with path.open('rb') as source:
        return b'OSMHeader' in source.read(4096)


def source_url(state):
    return ('https://download.geofabrik.de/australia-oceania/american-oceania-latest.osm.pbf'
        if state == 'american-oceania' else f'{SOURCE}/{state}-latest.osm.pbf')


def tags_of(element):
    return {tag.k: tag.v for tag in element.tags}


def point_of(element):
    if element.is_node():
        return [element.location.lat, element.location.lon]
    coords = [[n.location.lat, n.location.lon] for n in element.nodes if n.location.valid()]
    if not coords:
        return None
    # A centroid is a map anchor, not a guaranteed vehicle entrance.
    return [sum(c[0] for c in coords) / len(coords), sum(c[1] for c in coords) / len(coords)]


def classification(tags):
    amenity = tags.get('amenity')
    if amenity in PARKING_AMENITIES:
        if tags.get('parking') in {'private', 'carports'}:
            return None
        return 'bay' if amenity == 'parking_space' and tags.get('capacity') in {None, '1'} else 'area'
    # Parking along a highway is a street zone, not an individually surveyed bay.
    if tags.get('highway') and any(k.startswith(('parking:left', 'parking:right', 'parking:both', 'parking:lane:'))
                                   and v not in NO_PARKING for k, v in tags.items()):
        return 'zone'
    return None


def display_record(raw, state, collected):
    tags = raw['tags']
    kind = raw['kind']
    name = tags.get('name:en') or tags.get('name')
    parking_type = {'multi-storey': 'Multi-storey parking', 'underground': 'Underground parking',
                    'surface': 'Surface parking', 'street_side': 'Street-side parking',
                    'lane': 'Street parking', 'rooftop': 'Rooftop parking'}.get(tags.get('parking'))
    if not name and tags.get('addr:street'):
        address = ' '.join(filter(None, [tags.get('addr:housenumber'), tags['addr:street']]))
        name = f'Parking · {address}'
    if not name:
        name = 'Mapped parking space' if kind == 'bay' else 'Mapped street parking' if kind == 'zone' else parking_type or 'Parking area'
    elif kind == 'zone':
        name += ' · mapped street parking'
    cap = tags.get('capacity')
    cap = int(cap) if cap and re.fullmatch(r'\d+', cap) else None
    source_terms = {k: v for k, v in tags.items() if k.startswith(('parking:', 'charge', 'fee', 'maxstay', 'restriction'))
                    or k in {'parking', 'parking_space', 'access', 'motorcar', 'motor_vehicle', 'hgv', 'bus', 'motorcycle'}}
    return {
        'id': f"osm:{raw['type']}:{raw['id']}", 'kind': 'bay' if kind == 'bay' else 'area',
        'address_text': name, 'city': None, 'country': 'US', 'suburb': tags.get('addr:city'),
        'lat': raw['lat'], 'lng': raw['lng'], 'capacity': cap, 'census_year': None,
        'access': tags.get('access', 'not_listed'), 'fee': tags.get('fee'),
        'opening_hours': tags.get('opening_hours'),
        'vehicle_types': ('Accessible permit holders only' if tags.get('parking_space') == 'disabled'
            else 'Cars listed' if tags.get('motorcar') in {'yes', 'designated'}
            else 'Vehicle types not listed'),
        'source_url': f"https://www.openstreetmap.org/{raw['type']}/{raw['id']}",
        'source_name': 'OpenStreetMap', 'source_updated_at': raw['timestamp'],
        'collected_at': collected, 'location_note': ('Mapped road segment; check the parking side and signs'
            if kind == 'zone' else 'Mapped point; bay outline or entrance may differ' if raw['type'] == 'node'
            else 'Mapped area centre; use the signed entrance'),
        'occupancy': 'not_provided', 'currency': 'USD', 'mapped_zone': kind == 'zone',
        'source_terms': source_terms,
        'facility_type': parking_type if kind == 'area' else None,
    }


class ParkingHandler(osmium.SimpleHandler):
    def __init__(self, archive, counts):
        super().__init__()
        self.archive = archive
        self.counts = counts

    def _record(self, element, element_type):
        tags = tags_of(element)
        kind = classification(tags)
        if not kind:
            return
        self.counts['candidate'] += 1
        restricted = tags.get('access') in SKIP_ACCESS or tags.get('motorcar') in {'no', 'private'}
        if restricted:
            self.counts['excluded_access'] += 1
        try:
            point = point_of(element)
        except osmium.InvalidLocationError:
            point = None
        if point is None:
            self.counts['missing_geometry'] += 1
            return
        # Preserve all relevant source tags and the geometry needed to rebuild.
        raw = {'type': element_type, 'id': element.id, 'lat': round(point[0], 7),
               'lng': round(point[1], 7), 'timestamp': element.timestamp.isoformat() if element.timestamp else None,
               'kind': kind, 'tags': tags, 'restricted': restricted}
        if element_type == 'way':
            raw['geometry'] = [[round(n.location.lat, 7), round(n.location.lon, 7)]
                               for n in element.nodes if n.location.valid()]
        self.archive.write(json.dumps(raw, ensure_ascii=False, separators=(',', ':')) + '\n')
        if not restricted:
            self.counts[kind] += 1

    def node(self, n):
        self._record(n, 'node')

    def way(self, w):
        self._record(w, 'way')

    def area(self, area):
        # Simple closed ways are already captured above. Multipolygon relations
        # have their own tags/ID and must be retained independently.
        if area.from_way():
            return
        tags = tags_of(area)
        if tags.get('amenity') not in PARKING_AMENITIES:
            return
        self.counts['candidate'] += 1
        restricted = tags.get('access') in SKIP_ACCESS or tags.get('motorcar') in {'no', 'private'}
        if restricted:
            self.counts['excluded_access'] += 1
        rings = []
        try:
            for ring in area.outer_rings():
                coords = [[round(n.location.lat, 7), round(n.location.lon, 7)] for n in ring if n.location.valid()]
                if len(coords) >= 3:
                    rings.append(coords)
        except osmium.InvalidLocationError:
            pass
        if not rings:
            self.counts['missing_geometry'] += 1
            return
        coords = [point for ring in rings for point in ring]
        raw = {'type': 'relation', 'id': area.orig_id(), 'lat': round(sum(p[0] for p in coords) / len(coords), 7),
               'lng': round(sum(p[1] for p in coords) / len(coords), 7),
               'timestamp': area.timestamp.isoformat() if area.timestamp else None,
               'kind': 'bay' if tags.get('amenity') == 'parking_space' and tags.get('capacity') in {None, '1'} else 'area',
               'tags': tags, 'geometry': rings, 'restricted': restricted}
        self.archive.write(json.dumps(raw, ensure_ascii=False, separators=(',', ':')) + '\n')
        if not restricted:
            self.counts[raw['kind']] += 1


def inside(point, polygon):
    y, x = point
    hit = False
    for i in range(len(polygon)):
        a, b = polygon[i - 1], polygon[i]
        ay, ax = a
        by, bx = b
        if (ay > y) != (by > y) and x < (bx - ax) * (y - ay) / (by - ay) + ax:
            hit = not hit
    return hit


def raw_polygons(raw):
    if raw['kind'] != 'area' or raw['type'] == 'node':
        return []
    geometry = raw.get('geometry', [])
    return geometry if raw['type'] == 'relation' else [geometry]


def restricted_grid(raw_rows):
    grid = collections.defaultdict(list)
    for raw in raw_rows:
        if not raw.get('restricted'):
            continue
        for polygon in raw_polygons(raw):
            if len(polygon) < 4 or polygon[0] != polygon[-1]:
                continue
            ys = [p[0] for p in polygon]
            xs = [p[1] for p in polygon]
            bbox = (min(ys), min(xs), max(ys), max(xs))
            if (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]) > .01:
                continue
            for yy in range(math.floor(bbox[0] / .01), math.floor(bbox[2] / .01) + 1):
                for xx in range(math.floor(bbox[1] / .01), math.floor(bbox[3] / .01) + 1):
                    grid[yy, xx].append((bbox, polygon))
    return grid


def inside_restricted(raw, grid):
    point = (raw['lat'], raw['lng'])
    for bbox, polygon in grid.get((math.floor(point[0] / .01), math.floor(point[1] / .01)), []):
        if bbox[0] <= point[0] <= bbox[2] and bbox[1] <= point[1] <= bbox[3] and inside(point, polygon):
            return True
    return False


def group_bays(records, raw_rows):
    # Map individual spaces into their containing off-street area. They remain
    # in the source archive; the map shows the facility once, with a count.
    polygons = collections.defaultdict(list)
    for row, raw in zip(records, raw_rows):
        if row['kind'] != 'area' or raw['kind'] != 'area' or raw['type'] == 'node':
            continue
        for polygon in raw_polygons(raw):
            if len(polygon) < 4 or polygon[0] != polygon[-1]:
                continue
            ys = [p[0] for p in polygon]
            xs = [p[1] for p in polygon]
            bbox = (min(ys), min(xs), max(ys), max(xs))
            area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
            if area > .01:  # malformed/humongous parking polygons are not used
                continue
            grid = .01
            for yy in range(math.floor(bbox[0] / grid), math.floor(bbox[2] / grid) + 1):
                for xx in range(math.floor(bbox[1] / grid), math.floor(bbox[3] / grid) + 1):
                    polygons[yy, xx].append((area, row, bbox, polygon))
    for row in records:
        if row['kind'] != 'bay':
            continue
        point = (row['lat'], row['lng'])
        candidates = sorted(polygons.get((math.floor(point[0] / .01), math.floor(point[1] / .01)), []), key=lambda x: x[0])
        for _, area_row, bbox, polygon in candidates:
            if bbox[0] <= point[0] <= bbox[2] and bbox[1] <= point[1] <= bbox[3] and inside(point, polygon):
                row['parent_area_id'] = area_row['id']
                area_row['mapped_bay_count'] = area_row.get('mapped_bay_count', 0) + 1
                break


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n')


def write_json_gz(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = (json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n').encode()
    path.write_bytes(gzip.compress(payload, compresslevel=6, mtime=0))


def build(state, pbf):
    collected = dt.datetime.now(dt.timezone.utc).date().isoformat()
    root = ROOT / 'datasets/us' / collected
    archive = root / f'{state}-parking-osm.jsonl.gz'
    archive.parent.mkdir(parents=True, exist_ok=True)
    counts = collections.Counter()
    with gzip.open(archive, 'wt', encoding='utf-8', compresslevel=6) as output:
        handler = ParkingHandler(output, counts)
        # C++ filters reject millions of unrelated OSM objects before invoking
        # Python. Area assembly is limited to parking multipolygons.
        processor = (osmium.FileProcessor(str(pbf)).with_locations()
            .with_areas(osmium.filter.TagFilter(('amenity', 'parking'), ('amenity', 'parking_space')))
            .with_filter(osmium.filter.EmptyTagFilter())
            .with_filter(osmium.filter.KeyFilter('amenity', 'parking:left', 'parking:right', 'parking:both',
                'parking:lane:left', 'parking:lane:right', 'parking:lane:both')))
        for element in processor:
            if element.is_area():
                handler.area(element)
            elif element.is_node():
                handler.node(element)
            elif element.is_way():
                handler.way(element)
    tiles = collections.defaultdict(list)
    records, raw_rows = [], []
    with gzip.open(archive, 'rt', encoding='utf-8') as source:
        for line in source:
            raw_rows.append(json.loads(line))
    restricted = restricted_grid(raw_rows)
    visible = []
    for raw in raw_rows:
        if raw.get('restricted'):
            continue
        if inside_restricted(raw, restricted):
            counts['excluded_inside_restricted'] += 1
            continue
        visible.append(raw)
        records.append(display_record(raw, state, collected))
    raw_rows = visible
    group_bays(records, raw_rows)
    for record in records:
        if record.get('parent_area_id'):
            continue
        key = f"{math.floor(record['lat'] / TILE_SIZE)}_{math.floor(record['lng'] / TILE_SIZE)}"
        tiles[key].append(record)
    data_dir = ROOT / 'public/data/usa'
    state_dir = data_dir / state
    if state_dir.exists():
        shutil.rmtree(state_dir)
    # One source state per tile file avoids boundary-state overwrite and makes
    # incremental state imports safe.
    for key, rows in tiles.items():
        write_json_gz(state_dir / (key + '.json.gz'), rows)
    sha = digest(pbf)
    manifest = {'state': state, 'collected_at': collected, 'source_url': source_url(state),
                'source_pbf_bytes': pbf.stat().st_size, 'source_pbf_sha256': sha,
                'parking_archive': str(archive.relative_to(ROOT)), 'parking_archive_bytes': archive.stat().st_size,
                'parking_archive_sha256': digest(archive), 'counts': dict(counts),
                'tiles': sorted(tiles), 'records': sum(len(rows) for rows in tiles.values()),
                'grouped_bays': sum('parent_area_id' in r for r in records),
                'license': 'OpenStreetMap © contributors, ODbL 1.0'}
    write_json(root / f'{state}-manifest.json', manifest)
    print(f"{state}: {manifest['records']} mapped parking records in {len(tiles)} tiles", flush=True)
    return manifest


def update_index():
    data_dir = ROOT / 'public/data/usa'
    states = {}
    for state in STATES:
        directory = data_dir / state
        if directory.exists():
            states[state] = [f.name.removesuffix('.json.gz') for f in sorted(directory.glob('*.json.gz'))]
    write_json(data_dir / 'index.json', {'schema_version': 1, 'tile_size': TILE_SIZE,
        'states': states, 'license': 'OpenStreetMap © contributors, ODbL 1.0',
        'coverage_note': 'Mapped locations only. No nationwide live occupancy or complete bay inventory.'})
    print(f'Index: {len(states)} states/territories', flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--state', choices=STATES)
    parser.add_argument('--all', action='store_true')
    parser.add_argument('--missing', action='store_true', help='Import only states without completed compressed tiles')
    parser.add_argument('--local-pbf', type=Path)
    args = parser.parse_args()
    if not (args.state or args.all or args.missing):
        parser.error('Provide --state, --all or --missing')
    if args.local_pbf and not args.state:
        parser.error('--local-pbf requires --state')
    for state in STATES if args.all or args.missing else [args.state]:
        manifest = ROOT / 'datasets/us' / dt.datetime.now(dt.timezone.utc).date().isoformat() / f'{state}-manifest.json'
        if args.missing and manifest.exists():
            keys = json.loads(manifest.read_text())['tiles']
            if keys and all((ROOT / 'public/data/usa' / state / f'{key}.json.gz').exists() for key in keys):
                continue
        pbf = args.local_pbf if args.local_pbf else download(state)
        build(state, pbf)
        update_index()
    if args.missing:
        update_index()


if __name__ == '__main__':
    main()
