#!/usr/bin/env python3
"""Archive SFMTA general-use meter points and publish small Bay map tiles.

Meter locations are not physical parking-sign coordinates, live occupancy,
current prices, or a guarantee that a driver may park at a particular time.
"""
import collections
import datetime as dt
import gzip
import hashlib
import json
import math
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'https://services.sfmta.com/arcgis/rest/services/Parking/parking/FeatureServer/11'
WHERE = "ACTIVE_METER_FLAG='M' AND CAP_COLOR='Grey' AND ON_OFFSTREET_TYPE='ON' AND JURISDICTION='SFMTA'"
FIELDS = 'OBJECTID,POST_ID,MS_PAY_STATION_ID,MS_SPACE_NUM,METER_TYPE,ACTIVE_METER_FLAG,CAP_COLOR,STREET_NAME,STREET_NUM,LATITUDE,LONGITUDE,LAST_UPD_DT,SIGNAGE'
TILE_SIZE = .1
PAGE_SIZE = 1000


def query(**params):
    command = ['curl', '-fLsS', '--retry', '3', '--max-time', '60', '-G', SOURCE + '/query']
    for key, value in params.items():
        command += ['--data-urlencode', f'{key}={value}']
    command += ['--data-urlencode', 'f=json']
    response = json.loads(subprocess.check_output(command))
    if 'error' in response:
        raise RuntimeError(f'SFMTA query failed: {response["error"]}')
    return response


def write_gzip(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = (json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n').encode()
    path.write_bytes(gzip.compress(payload, compresslevel=6, mtime=0))


def register_artifacts(date):
    """Track the raw snapshot and every published tile in the source ledger."""
    ledger = ROOT / 'datasets/manifest.json'
    existing = {row['path']: row for row in json.loads(ledger.read_text())}
    source_dir = ROOT / 'datasets/us' / date
    snapshot = json.loads((source_dir / 'san-francisco-sfmta-general-meters-manifest.json').read_text())
    paths = [source_dir / 'san-francisco-sfmta-general-meters.json.gz',
             source_dir / 'san-francisco-sfmta-general-meters-manifest.json',
             ROOT / 'public/data/sf-meters/index.json']
    paths += sorted((ROOT / 'public/data/sf-meters').glob('*.json.gz'))
    for path in paths:
        relative = str(path.relative_to(ROOT))
        existing[relative] = {
            'path': relative, 'source_url': SOURCE,
            'kind': 'sfmta_meter_source_archive' if path.parent == source_dir else 'sfmta_meter_catalog',
            'fetched_at': snapshot['collected_at'], 'bytes': path.stat().st_size,
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'provenance_note': 'SFMTA active general-use on-street meter inventory; additional-signage rows remain only in the raw archive. No live vacancy, sign-plate rules, or current rates.'
        }
    ledger.write_text(json.dumps(list(existing.values()), indent=2) + '\n')
    print(f'Registered {len(paths)} SFMTA artifacts in datasets/manifest.json')


def main():
    observed = dt.datetime.now(dt.timezone.utc).isoformat()
    total = query(where=WHERE, returnCountOnly='true')['count']
    rows = []
    for offset in range(0, total, PAGE_SIZE):
        page = query(where=WHERE, outFields=FIELDS, returnGeometry='false',
                     orderByFields='OBJECTID', resultOffset=offset,
                     resultRecordCount=PAGE_SIZE)
        rows += [feature['attributes'] for feature in page['features']]
        print(f'SFMTA meter records: {len(rows)}/{total}', flush=True)
    ids = [row['OBJECTID'] for row in rows]
    if len(rows) != total or len(set(ids)) != total:
        raise ValueError('SFMTA meter snapshot changed or pagination was incomplete')

    date = observed[:10]
    source_dir = ROOT / 'datasets/us' / date
    archive = source_dir / 'san-francisco-sfmta-general-meters.json.gz'
    write_gzip(archive, rows)
    tiles = collections.defaultdict(list)
    skipped = collections.Counter()
    for row in rows:
        # A grey cap can still have a loading/permit/vehicle-specific sign.
        # Keep those in the archive, but do not imply general-use parking.
        if row['SIGNAGE'] and row['SIGNAGE'].strip():
            skipped['additional_signage'] += 1
            continue
        lat, lng = row['LATITUDE'], row['LONGITUDE']
        if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)):
            skipped['missing_coordinates'] += 1
            continue
        if not (37.6 < lat < 37.85 and -122.55 < lng < -122.3):
            skipped['outside_san_francisco'] += 1
            continue
        street = row['STREET_NAME'] or 'San Francisco'
        number = row['STREET_NUM']
        label = f'{int(number)} {street}' if isinstance(number, (int, float)) else street
        updated = (dt.datetime.fromtimestamp(row['LAST_UPD_DT'] / 1000, dt.timezone.utc).isoformat()
                   if row['LAST_UPD_DT'] else None)
        record = {
            'id': f'sfmta:meter:{row["OBJECTID"]}', 'kind': 'bay',
            'address_text': f'Metered parking · {label}', 'suburb': 'San Francisco',
            'city': 'San Francisco', 'country': 'US', 'lat': lat, 'lng': lng,
            'distance_m': 0, 'capacity': None, 'census_year': None,
            'facility_type': 'SFMTA mapped meter location', 'access': 'not_listed',
            'fee': 'yes', 'occupancy': 'not_provided', 'currency': 'USD',
            'source_url': SOURCE, 'source_name': 'SFMTA meter inventory',
            'source_updated_at': updated, 'collected_at': observed,
            'location_note': 'Meter or pay-station space location; exact curb position and current signs must be checked on site',
            'price_summary_conditions': 'Meter rates and operating hours are not included in this inventory.',
            'vehicle_types': 'General metered parking',
            'source_terms': {'post_id': row['POST_ID'] or '', 'meter_type': row['METER_TYPE'] or '',
                             'pay_station_id': row['MS_PAY_STATION_ID'] or '',
                             'space_number': str(int(row['MS_SPACE_NUM'])) if row['MS_SPACE_NUM'] else '',
                             'signage': row['SIGNAGE'] or ''},
        }
        key = f'{math.floor(lat / TILE_SIZE)}_{math.floor(lng / TILE_SIZE)}'
        tiles[key].append(record)
    if not tiles:
        raise ValueError('No geocoded SFMTA meter points')
    tile_dir = ROOT / 'public/data/sf-meters'
    tile_dir.mkdir(parents=True, exist_ok=True)
    for old in tile_dir.glob('*.json.gz'):
        old.unlink()
    for key, records in tiles.items():
        write_gzip(tile_dir / f'{key}.json.gz', records)
    (tile_dir / 'index.json').write_text(json.dumps({'schema_version': 1,
        'tile_size': TILE_SIZE, 'tiles': sorted(tiles), 'source': SOURCE,
        'collected_at': observed, 'coverage_note': 'General-use SFMTA meter locations only; no sign-plate inventory, current price, legal schedule, or live vacancy.'},
        indent=2) + '\n')
    manifest = {'source': SOURCE, 'where': WHERE, 'fields': FIELDS.split(','),
                'collected_at': observed, 'raw_count': total, 'published_count': sum(map(len, tiles.values())),
                'skipped': dict(skipped), 'tiles': {key: len(value) for key, value in tiles.items()},
                'archive': str(archive.relative_to(ROOT)),
                'archive_sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
                'meaning': 'Mapped general-use parking meter locations, not signed parking permissions or occupancy.'}
    (source_dir / 'san-francisco-sfmta-general-meters-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    register_artifacts(date)
    print(f'Published {manifest["published_count"]} SFMTA meter locations in {len(tiles)} tiles')


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == '--register-only':
        register_artifacts(sys.argv[2])
    else:
        main()
