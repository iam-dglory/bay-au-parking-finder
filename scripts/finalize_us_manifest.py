#!/usr/bin/env python3
"""Register every US parking archive and published tile in the source ledger."""
import datetime as dt
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ledger = ROOT / 'datasets/manifest.json'
existing = {row['path']: row for row in json.loads(ledger.read_text())}
artifacts = [p for p in (ROOT / 'datasets/us').glob('*/*') if p.is_file() and 'raw-pbf' not in p.parts]
artifacts += list((ROOT / 'public/data/usa').rglob('*.json'))
artifacts += list((ROOT / 'public/data/usa').rglob('*.json.gz'))
artifacts += [ROOT / 'datasets/us/coverage-audit.json'] if (ROOT / 'datasets/us/coverage-audit.json').exists() else []
for path in artifacts:
    relative = str(path.relative_to(ROOT))
    state = path.name.split('-parking-osm')[0] if path.name.endswith('-parking-osm.jsonl.gz') else path.parent.name
    source = existing.get(relative, {})
    digest = hashlib.sha256()
    with path.open('rb') as data:
        for block in iter(lambda: data.read(1024 * 1024), b''):
            digest.update(block)
    source.update({'path': relative, 'kind': 'us_parking_source_archive' if relative.endswith('-parking-osm.jsonl.gz')
        else 'us_parking_catalog_or_audit', 'bytes': path.stat().st_size, 'sha256': digest.hexdigest(),
        'generated_at': dt.datetime.fromtimestamp(path.stat().st_mtime, dt.timezone.utc).isoformat(),
        'provenance_note': 'Filtered from Geofabrik state OSM PBF; source SHA-256 and download URL are in each state manifest. OSM © contributors, ODbL 1.0.'})
    if relative.endswith('-parking-osm.jsonl.gz'):
        source['source_url'] = ('https://download.geofabrik.de/australia-oceania/american-oceania-latest.osm.pbf'
            if state == 'american-oceania' else f'https://download.geofabrik.de/north-america/us/{state}-latest.osm.pbf')
    existing[relative] = source
ledger.write_text(json.dumps(list(existing.values()), indent=2) + '\n')
print('US files tracked:', len(artifacts))
