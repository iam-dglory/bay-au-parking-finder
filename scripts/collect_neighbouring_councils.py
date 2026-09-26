#!/usr/bin/env python3
"""Archive neighbouring-council parking exports via official catalog resource URLs.
These are context exports, not live occupancy or sign-to-bay assignments.
"""
import datetime as dt, hashlib, json, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; RAW=ROOT/'datasets/melbourne/2026-09-26'
def get(url):
 r=subprocess.run(['curl','-LfSs','--max-time','35',url],capture_output=True)
 if r.returncode:raise RuntimeError('HTTP/network request failed')
 return r.stdout
entries=json.loads((ROOT/'datasets/manifest.json').read_text());failures=[]
def save(name,raw,url):
 p=RAW/name;p.write_bytes(raw);entries.append({'path':str(p.relative_to(ROOT)),'source_url':url,'fetched_at':dt.datetime.now(dt.timezone.utc).isoformat(),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
for portal in ['https://discover.data.vic.gov.au','https://data.gov.au']:
 url=portal+('/data' if portal.endswith('gov.au') and not portal.startswith('https://discover') else '')+'/api/3/action/package_search?q=parking&rows=1000'
 name='datavic' if 'discover' in portal else 'data-gov-au'
 try:
  p=RAW/f'{name}-parking-catalog.json'
  raw=p.read_bytes() if p.exists() else get(url);data=json.loads(raw)
  if not data.get('success'):raise RuntimeError('Catalog unsuccessful')
  if not p.exists():save(p.name,raw,url)
  records=data['result']['results'];print(name,'catalog matches',data['result']['count'])
  for record in records:
   title=(record.get('title','')+' '+record.get('name','')).lower()
   if not (('parking' in title or 'car parks' in title or 'car-parks' in title) and any(city in title for city in ['casey','port phillip','port-phillip','yarra'])):continue
   resources=[r for r in record.get('resources',[]) if r.get('format','').lower() in ['geojson','json','csv']]
   resources.sort(key=lambda r: ['geojson','json','csv'].index(r['format'].lower()))
   if not resources:continue
   r=resources[0];ext=r['format'].lower();path=RAW/f"{record['name']}.{ext}"
   if path.exists():continue
   try:
    raw=get(r['url'])
    if ext in ['geojson','json']:json.loads(raw)
    elif b'<html' in raw.lower():raise RuntimeError('HTML instead of CSV')
    save(path.name,raw,r['url']);print('Archived',path.name,len(raw))
   except Exception as e:failures.append({'dataset':record['name'],'source_url':r['url'],'error':str(e)})
 except Exception as e:failures.append({'source_url':url,'error':str(e)})
(ROOT/'datasets/manifest.json').write_text(json.dumps(entries,indent=2)+'\n')
(ROOT/'datasets/research-2026-09-26/neighbouring-council-fetch-failures.json').write_text(json.dumps(failures,indent=2)+'\n');print('Unavailable exports',len(failures))
