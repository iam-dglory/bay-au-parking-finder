#!/usr/bin/env python3
"""Validate the published US catalog against archived state-source manifests."""
import argparse
import collections
import gzip
import hashlib
import json
import math
from pathlib import Path

from build_us_parking import ROOT, STATES

SAMPLES = {'New York City': (40.7128, -74.006), 'Los Angeles': (34.0522, -118.2437),
    'Chicago': (41.8781, -87.6298), 'Houston': (29.7604, -95.3698),
    'San Francisco': (37.7749, -122.4194), 'Seattle': (47.6062, -122.3321),
    'Washington DC': (38.9072, -77.0369), 'Miami': (25.7617, -80.1918),
    'Honolulu': (21.3099, -157.8581), 'Anchorage': (61.2181, -149.9003),
    'San Juan': (18.4655, -66.1057), 'Pago Pago': (-14.2781, -170.7025),
    'Hagatna': (13.4757, 144.7489)}


def in_us_region(lat, lng):
    return ((24 <= lat <= 50 and -125 <= lng <= -66)
        or (51 <= lat <= 72 and -180 <= lng <= -129)
        or (-18 <= lat <= 30 and -180 <= lng <= -154)
        or (17 <= lat <= 19 and -68 <= lng <= -64)
        or (0 <= lat <= 25 and 140 <= lng <= 175))


def nearby(a, b):
    lat, lng = a
    other_lat, other_lng = b
    return abs(lat - other_lat) < .05 and abs(lng - other_lng) < .06 / max(.25, math.cos(math.radians(lat)))


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--require-all', action='store_true')
    args = parser.parse_args()
    index = json.loads((ROOT / 'public/data/usa/index.json').read_text())
    states = index['states']
    if args.require_all and set(states) != set(STATES):
        raise ValueError(f"Missing states/territories: {sorted(set(STATES) - set(states))}")
    audit = {'states': {}, 'totals': collections.Counter(), 'city_samples_within_about_5km': collections.Counter()}
    for state, keys in states.items():
        matches = sorted((ROOT / 'datasets/us').glob(f'*/{state}-manifest.json'))
        if not matches:
            raise ValueError(f'{state}: no source manifest')
        manifest = json.loads(matches[-1].read_text())
        archive = ROOT / manifest['parking_archive']
        if digest(archive) != manifest['parking_archive_sha256']:
            raise ValueError(f'{state}: parking archive checksum differs')
        if sorted(keys) != manifest['tiles']:
            raise ValueError(f'{state}: tile index differs from source manifest')
        counts = collections.Counter()
        for key in keys:
            path = ROOT / f'public/data/usa/{state}/{key}.json.gz'
            with gzip.open(path, 'rt', encoding='utf-8') as source:
                rows = json.load(source)
            for row in rows:
                if row['country'] != 'US' or row['occupancy'] != 'not_provided' or row['currency'] != 'USD':
                    raise ValueError(f'{state}/{key}: false availability or country/currency')
                if not in_us_region(row['lat'], row['lng']):
                    raise ValueError(f'{state}/{key}: coordinates outside US import bounds')
                if not row['source_url'].startswith('https://www.openstreetmap.org/'):
                    raise ValueError(f'{state}/{key}: missing record source')
                counts['records'] += 1
                counts[row['kind']] += 1
                if row.get('mapped_zone'):
                    counts['street_zones'] += 1
                if row.get('fee') == 'yes':
                    counts['mapped_fee_yes'] += 1
                if row.get('fee') == 'no':
                    counts['mapped_fee_no'] += 1
                if row.get('source_terms', {}).get('charge'):
                    counts['mapped_charge_tag'] += 1
                for city, center in SAMPLES.items():
                    if nearby(center, (row['lat'], row['lng'])):
                        audit['city_samples_within_about_5km'][city] += 1
        if counts['records'] != manifest['records']:
            raise ValueError(f'{state}: published count differs from manifest')
        if counts['records'] == 0:
            raise ValueError(f'{state}: no published parking')
        audit['states'][state] = {**counts, 'tiles': len(keys), 'source_pbf_sha256': manifest['source_pbf_sha256']}
        audit['totals'].update(counts)
    audit['totals']['states'] = len(states)
    audit['totals']['tiles'] = sum(len(keys) for keys in states.values())
    audit['totals'] = dict(audit['totals'])
    audit['city_samples_within_about_5km'] = {name: audit['city_samples_within_about_5km'][name] for name in SAMPLES}
    if args.require_all and any(count == 0 for count in audit['city_samples_within_about_5km'].values()):
        raise ValueError('One or more major-city parking samples are empty')
    (ROOT / 'datasets/us/coverage-audit.json').write_text(json.dumps(audit, indent=2) + '\n')
    print(json.dumps(audit['totals'], indent=2))


if __name__ == '__main__':
    main()
