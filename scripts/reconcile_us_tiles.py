#!/usr/bin/env python3
"""Refresh display fields in US tiles from the archived OSM parking records.

This keeps tile labels consistent after display logic changes without fetching
new PBFs. Run after an import is complete; geometry/grouping is unchanged.
"""
import gzip
import json
from pathlib import Path

from build_us_parking import ROOT, display_record, write_json_gz


def main():
    index = json.loads((ROOT / 'public/data/usa/index.json').read_text())
    refreshed = 0
    for state, keys in index['states'].items():
        manifest_path = max((ROOT / 'datasets/us').glob(f'*/{state}-manifest.json'))
        manifest = json.loads(manifest_path.read_text())
        source = ROOT / manifest['parking_archive']
        raw_by_id = {}
        with gzip.open(source, 'rt', encoding='utf-8') as archive:
            for line in archive:
                raw = json.loads(line)
                raw_by_id[f"osm:{raw['type']}:{raw['id']}"] = raw
        for key in keys:
            path = ROOT / 'public/data/usa' / state / f'{key}.json.gz'
            with gzip.open(path, 'rt', encoding='utf-8') as tile:
                rows = json.load(tile)
            for row in rows:
                raw = raw_by_id.get(row['id'])
                if raw is None:
                    raise ValueError(f'{state}/{key}: source record missing for {row["id"]}')
                row.update(display_record(raw, state, row['collected_at']))
                refreshed += 1
            write_json_gz(path, rows)
        print(f'{state}: refreshed {len(keys)} tiles', flush=True)
    print(f'Refreshed {refreshed:,} parking records from archived source tags')


if __name__ == '__main__':
    main()
