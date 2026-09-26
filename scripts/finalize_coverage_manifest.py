#!/usr/bin/env python3
"""Hash every coverage archive/derivative and published tile, retaining provenance."""
import datetime as dt,hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];DATE='2026-09-26'
p=ROOT/'datasets/manifest.json';indexed={r['path']:r for r in json.loads(p.read_text())};entries=list(indexed.values())
paths=[]
for folder in [f'datasets/india/{DATE}',f'datasets/melbourne/{DATE}',f'datasets/research-{DATE}','public/data/melbourne']:
 paths += [x for x in (ROOT/folder).rglob('*') if x.is_file()]
paths += [ROOT/'public/data/india-parking.json']
for path in sorted(paths):
 key=str(path.relative_to(ROOT));raw=path.read_bytes();r=indexed.get(key)
 if not r:
  r={'path':key,'kind':'derived_or_research_record','generated_at':dt.datetime.fromtimestamp(path.stat().st_mtime,dt.timezone.utc).isoformat(),'source_url':None,'provenance_note':'See coverage release source ledger and reproducible build_regional_catalogs.py. This is a derivative, not a new live observation.'}
  if key.startswith('public/data/melbourne'):r['source_paths']=[f'datasets/melbourne/{DATE}/melbourne-parking-and-street-zones-osm.json.gz',f'datasets/melbourne/{DATE}/secure-operator',f'datasets/melbourne/{DATE}/qv-melbourne-car-park-rates.html']
  if key=='public/data/india-parking.json':r['source_paths']=[f'datasets/india/{DATE}']
  entries.append(r);indexed[key]=r
 r.update({'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
p.write_text(json.dumps(entries,indent=2)+'\n');print('Tracked archive/derivative files:',len(entries))
