#!/usr/bin/env python3
"""Archive official SF curb-regulation layers without publishing them as parking advice.

The SFMTA layer metadata explicitly warns that these records have not been
comprehensively updated or vetted. They are retained for source analysis only.
"""
import datetime as dt
import gzip
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://services.sfmta.com/arcgis/rest/services/Parking/parking/FeatureServer'
LAYERS = {9: 'time-limited-parking', 10: 'other-parking-regulations', 18: 'color-curb'}
PAGE_SIZE = 1000


def get(url, **params):
    command = ['curl', '-fLsS', '--retry', '3', '--max-time', '90']
    if params:
        command += ['-G', url]
        for key, value in params.items():
            command += ['--data-urlencode', f'{key}={value}']
        command += ['--data-urlencode', 'f=json']
    else:
        command += [url + '?f=json']
    result = json.loads(subprocess.check_output(command))
    if 'error' in result:
        raise RuntimeError(f'{url}: {result["error"]}')
    return result


def main():
    observed = dt.datetime.now(dt.timezone.utc).isoformat()
    source_dir = ROOT / 'datasets/us' / observed[:10]
    source_dir.mkdir(parents=True, exist_ok=True)
    archived = []
    for layer, name in LAYERS.items():
        url = f'{BASE}/{layer}'
        metadata = get(url)
        object_id = metadata['objectIdField']
        total = get(url + '/query', where='1=1', returnCountOnly='true')['count']
        rows = []
        for offset in range(0, total, PAGE_SIZE):
            page = get(url + '/query', where='1=1', outFields='*', returnGeometry='true',
                       orderByFields=object_id, resultOffset=offset, resultRecordCount=PAGE_SIZE,
                       outSR='4326')
            rows.extend(page['features'])
            print(f'{name}: {len(rows)}/{total}', flush=True)
        ids = [row['attributes'][object_id] for row in rows]
        if len(rows) != total or len(set(ids)) != total:
            raise ValueError(f'{name}: source changed during pagination or duplicate IDs')
        path = source_dir / f'san-francisco-sfmta-{name}.json.gz'
        payload = {'source': url, 'collected_at': observed, 'metadata': metadata,
                   'feature_count': total, 'features': rows,
                   'usage_note': 'Research archive only; not sufficiently vetted for parking permission in Bay.'}
        path.write_bytes(gzip.compress((json.dumps(payload, separators=(',', ':')) + '\n').encode(), mtime=0))
        archived.append({'layer': layer, 'name': name, 'source': url,
                         'description': metadata.get('description', ''), 'feature_count': total,
                         'path': str(path.relative_to(ROOT)), 'bytes': path.stat().st_size,
                         'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    manifest_path = source_dir / 'san-francisco-sfmta-regulations-manifest.json'
    manifest_path.write_text(json.dumps({'collected_at': observed, 'published_in_app': False,
        'reason': 'SFMTA says regulation data is not comprehensively updated or vetted; no verified per-meter sign match.',
        'layers': archived}, indent=2) + '\n')
    ledger_path = ROOT / 'datasets/manifest.json'
    ledger = {entry['path']: entry for entry in json.loads(ledger_path.read_text())}
    for path in [manifest_path, *(ROOT / entry['path'] for entry in archived)]:
        relative = str(path.relative_to(ROOT))
        source_url = BASE if path == manifest_path else next(entry['source'] for entry in archived if entry['path'] == relative)
        ledger[relative] = {'path': relative, 'source_url': source_url, 'kind': 'sfmta_regulation_research_archive',
                            'fetched_at': observed, 'bytes': path.stat().st_size,
                            'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                            'provenance_note': 'Official SFMTA layer retained for research; source cautions against treating it as complete or vetted parking advice.'}
    ledger_path.write_text(json.dumps(list(ledger.values()), indent=2) + '\n')
    print(f'Archived {len(archived)} regulation layers; none published in the app')


if __name__ == '__main__':
    main()
