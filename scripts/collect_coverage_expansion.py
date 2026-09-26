#!/usr/bin/env python3
"""Archive explicit regional parking and street-zone tags; never infer vacancy."""
import concurrent.futures, datetime as dt, gzip, hashlib, json, subprocess
from pathlib import Path
from urllib.parse import urlencode
ROOT=Path(__file__).resolve().parents[1]; DATE='2026-09-26'
def archive(url,path):
 p=ROOT/path
 if p.exists() or p.with_suffix(p.suffix+'.gz').exists(): return None
 r=subprocess.run(['curl','-fLsS','--max-time','150',url],capture_output=True)
 if r.returncode: return {'path':path,'error':'HTTP/network download failed','source_url':url}
 if path.endswith('.json'):
  d=json.loads(r.stdout)
  if isinstance(d,dict) and 'remark' in d: return {'path':path,'error':d['remark'],'source_url':url}
 p.parent.mkdir(parents=True,exist_ok=True)
 content=r.stdout
 if 'melbourne-parking-and-street-zones-osm.json' in path:
  content=gzip.compress(content,mtime=0);p=p.with_suffix(p.suffix+'.gz');path=str(p.relative_to(ROOT))
 p.write_bytes(content)
 return {'path':path,'source_url':url,'fetched_at':dt.datetime.now(dt.timezone.utc).isoformat(),'bytes':len(content),'sha256':hashlib.sha256(content).hexdigest()}
bounds={'chennai':(12.65,79.95,13.35,80.4),'bengaluru':(12.65,77.3,13.35,77.9),'hyderabad':(17.0,78.15,17.8,78.8),'melbourne':(-38.5,144.3,-37.3,145.7)}
jobs=[]
for city,b in bounds.items():
 bbox=','.join(map(str,b)); predicates=['[amenity~"^(parking|parking_space|motorcycle_parking)$"]','["parking:left"]','["parking:right"]','["parking:both"]','["parking:lane:both"]','["parking:lane:left"]','["parking:lane:right"]']
 q='[out:json][timeout:120];('+''.join('nwr'+p+'('+bbox+');' for p in predicates)+');out meta geom;'
 path=f'datasets/{"melbourne" if city=="melbourne" else "india"}/{DATE}/{city}-parking-and-street-zones-osm.json'
 jobs.append(('https://overpass.private.coffee/api/interpreter?'+urlencode({'data':q}),path))
jobs += [('https://mvga-prod-files.s3.ap-southeast-4.amazonaws.com/public/2024-05/parking-kerbside-management-plan.pdf',f'datasets/melbourne/{DATE}/council-parking-kerbside-management-plan.pdf'),('https://www.secureparking.com.au/en-au/car-park-rates/melbourne/',f'datasets/melbourne/{DATE}/secure-parking-melbourne-rate-directory.html'),('https://www.qv.com.au/visit/qv-melbourne-car-park.html',f'datasets/melbourne/{DATE}/qv-melbourne-car-park-rates.html')]
if __name__=='__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
     results=list(pool.map(lambda j:archive(*j),jobs))
    manifest=ROOT/'datasets/manifest.json'; entries=json.loads(manifest.read_text()); entries += [r for r in results if r and 'error' not in r];manifest.write_text(json.dumps(entries,indent=2)+'\n')
    failures=[r for r in results if r and 'error' in r];(ROOT/f'datasets/research-{DATE}/expansion-failures.json').write_text(json.dumps(failures,indent=2)+'\n')
    for r in results:
     if r: print(r['path'],r.get('bytes',r.get('error')),flush=True)
