#!/usr/bin/env python3
"""Archive current public source evidence without overwriting earlier snapshots.
Downloads are parallel; manifest writes are serialized to retain every result.
Failed sources are recorded separately and are never imported as data.
"""
import concurrent.futures, datetime as dt, hashlib, json, subprocess
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[1]
DATE = '2026-09-26'
ODS = 'https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/'
MELBOURNE = ['on-street-parking-bays', 'on-street-parking-bay-sensors',
    'pay-stay-parking-restrictions', 'pay-stay-zones-linked-to-street-segments',
    'parking-zones-linked-to-street-segments', 'sign-plates-located-in-each-parking-zone',
    'sign-plates-located-in-each-pay-stay-zone', 'on-street-car-park-bay-restrictions',
    'on-street-car-parking-meters-with-location']
SOURCES = [(ODS+n+'/exports/json', f'datasets/melbourne/{DATE}/{n}.json') for n in MELBOURNE]
SOURCES += [(ODS+'?'+urlencode({'where':'search(title,"parking") OR search(title,"sign")','limit':100}),f'datasets/melbourne/{DATE}/parking-and-sign-catalog.json')]
SOURCES += [
    ('https://chennaicorporation.gov.in/gcc/',f'datasets/india/{DATE}/chennai-corporation-home.html'),
    ('https://echallan.tspolice.gov.in/htp/parking.html',f'datasets/india/{DATE}/hyderabad-police-parking-zones.html'),
    ('https://echallan.tspolice.gov.in/htp/road_smart.html',f'datasets/india/{DATE}/hyderabad-police-road-smart.html'),
    ('https://english.bmrc.co.in/parking/',f'datasets/india/{DATE}/bengaluru-metro-parking.html'),
    ('https://commuters-dataapi.chennaimetrorail.org/api/ParkingArea/getParkingAreaAvailability',f'datasets/india/{DATE}/chennai-metro-availability.json'),
    ('https://chennaimetrorail.org/wp-content/uploads/2025/03/Approved-Parking-Tariff-Feb-2025-updated.pdf',f'datasets/india/{DATE}/chennai-metro-tariff.pdf'),
    ('https://chennaimetrorail.org/wp-content/uploads/2025/05/Parking-Facilities-Availabilities-19-05-2025.pdf',f'datasets/india/{DATE}/chennai-metro-facilities.pdf'),
    ('https://www.hyderabad.aero/rgia/airport-facilities/parking-information',f'datasets/india/{DATE}/hyderabad-airport-tariff.html'),
    ('https://hmrl.co.in/wp-content/uploads/2023/04/launching-of-smart-parking.pdf',f'datasets/india/{DATE}/hyderabad-metro-smart-parking-2018.pdf'),
    ('https://discover.data.vic.gov.au/dataset/on-street-parking-bay-sensors',f'datasets/melbourne/{DATE}/sensor-metadata-and-outage-guidance.html'),
]

def download(pair):
    url, relative = pair; dest=ROOT/relative
    if dest.exists(): return None
    dest.parent.mkdir(parents=True, exist_ok=True); part=dest.with_suffix(dest.suffix+'.part')
    result=subprocess.run(['curl','-fLsS','--retry','1','--max-time','90',url,'-o',str(part)],capture_output=True)
    if result.returncode: part.unlink(missing_ok=True); return {'failed':relative,'url':url,'error':result.stderr.decode()[-300:]}
    raw=part.read_bytes()
    try:
        if dest.suffix=='.json':
            data=json.loads(raw)
            if isinstance(data,dict) and (data.get('error') or data.get('remark')): raise ValueError('Source returned an error')
        if dest.suffix=='.pdf' and not raw.startswith(b'%PDF'): raise ValueError('Not a PDF')
    except (ValueError,TypeError) as error:
        part.unlink(missing_ok=True); return {'failed':relative,'url':url,'error':str(error)}
    part.rename(dest)
    return {'path':relative,'source_url':url,'fetched_at':dt.datetime.now(dt.timezone.utc).isoformat(),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}

if __name__=='__main__':
    manifest=ROOT/'datasets/manifest.json'; entries=json.loads(manifest.read_text()); failures=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for row in pool.map(download,SOURCES):
            if not row: continue
            if 'failed' in row: failures.append(row); print('FAILED',row['failed'],row['error'],flush=True)
            else: entries.append(row); print('ARCHIVED',row['path'],row['bytes'],flush=True)
    manifest.write_text(json.dumps(entries,indent=2)+'\n')
    report=ROOT/f'datasets/research-{DATE}/fetch-failures.json'; report.parent.mkdir(exist_ok=True);report.write_text(json.dumps(failures,indent=2)+'\n')
