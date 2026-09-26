#!/usr/bin/env python3
"""Read-only production/source reconciliation; no location-based sensor guesses."""
import collections, datetime as dt, hashlib, json, math, subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATE='2026-09-26'
RAW=ROOT/f'datasets/melbourne/{DATE}'

def public_rows(table, fields, filters=''):
    env={}
    for line in (ROOT/'.env').read_text().splitlines():
        if '=' in line and not line.startswith('#'):
            key,value=line.split('=',1); env[key]=value.strip().strip(chr(34)).strip(chr(39))
    base=env['VITE_SUPABASE_URL']; key=env['VITE_SUPABASE_ANON_KEY']; rows=[]; offset=0
    while True:
        url=f'{base}/rest/v1/{table}?select={fields}&'+(filters+'&' if filters else '')+'order='+('id' if table=='parking_spots' else 'spot_id')+f'&limit=1000&offset={offset}'
        result=subprocess.run(['curl','-LsS','--max-time','45',url,'-H','apikey: '+key],capture_output=True)
        if result.returncode: raise RuntimeError('Public source request failed')
        page=json.loads(result.stdout)
        if not isinstance(page,list): raise RuntimeError(str(page))
        rows+=page
        if len(page)<1000: break
        offset+=1000
    return rows,base+'/rest/v1/'+table

def save(name, rows, url):
    path=RAW/name; raw=(json.dumps(rows,separators=(',',':'))+'\n').encode(); path.write_bytes(raw)
    manifest=ROOT/'datasets/manifest.json'; entries=json.loads(manifest.read_text())
    entries.append({'path':str(path.relative_to(ROOT)),'source_url':url,'fetched_at':dt.datetime.now(dt.timezone.utc).isoformat(),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
    manifest.write_text(json.dumps(entries,indent=2)+'\n')

if __name__=='__main__':
    spots=json.loads((RAW/'bay-production-approved-spots.json').read_text()); spots=[s for s in spots if s.get('state')=='VIC']
    statuses=json.loads((RAW/'bay-production-sensor-status.json').read_text())
    bays=json.loads((RAW/'on-street-parking-bays.json').read_text())
    sensors=json.loads((RAW/'on-street-parking-bay-sensors.json').read_text())
    entries=json.loads((ROOT/'datasets/manifest.json').read_text())
    source_time=next(e['fetched_at'] for e in entries if e['path']==str((RAW/'on-street-parking-bay-sensors.json').relative_to(ROOT)))
    now=dt.datetime.fromisoformat(source_time)
    production_time=next(e['fetched_at'] for e in entries if e['path']==str((RAW/'bay-production-sensor-status.json').relative_to(ROOT)))
    prod_now=dt.datetime.fromisoformat(production_time)
    by_spot={s['id']:s for s in spots}
    ids={str(b['kerbsideid']) for b in bays if b.get('kerbsideid')}; prodids={str(b['kerbside_id']) for b in spots if b.get('kerbside_id')}
    coords={str(r['kerbsideid']):r['location'] for r in sensors}
    def distance(spot,location):
        lat1,lat2=map(math.radians,[spot['lat'],location['lat']]); delta=math.radians(location['lon']-spot['lng']); dlat=lat2-lat1
        return 6371000*2*math.asin(min(1,math.sqrt(math.sin(dlat/2)**2+math.cos(lat1)*math.cos(lat2)*math.sin(delta/2)**2)))
    fresh=lambda t: t and 0<=(now-dt.datetime.fromisoformat(t)).total_seconds()<=1200
    report={'observed_at':now.isoformat(),'source_bays':len(bays),'source_unique_kerbside_ids':len(ids),'source_sensor_rows':len(sensors),
      'source_fresh_sensors_20m':sum(bool(fresh(s['lastupdated'])) for s in sensors),'source_missing_from_bay_inventory':sum(str(s['kerbsideid']) not in ids for s in sensors),
      'source_fresh_sensors_5m':sum(bool(s['lastupdated']) and 0<=(now-dt.datetime.fromisoformat(s['lastupdated'])).total_seconds()<=300 for s in sensors),
      'production_snapshot_at':production_time,'production_spots':len(spots),'production_with_kerbside_id':sum(bool(s['kerbside_id']) for s in spots),
      'source_sensors_missing_from_production_ids':sum(str(s['kerbsideid']) not in prodids for s in sensors),
      'production_sensor_ids_at_displaced_coordinates_over_15m':sum(bool(s.get('kerbside_id') in coords) and distance(s,coords[s['kerbside_id']])>15 for s in spots),'production_duplicate_council_ids':sum(n-1 for n in collections.Counter(s['kerbside_id'] for s in spots if s.get('kerbside_id')).values()),'production_sensor_rows':len(statuses),'production_match_methods':dict(collections.Counter(s.get('match_method','legacy') for s in statuses)),
      'production_fresh_trusted_sensors_20m':sum(s.get('match_method')=='kerbside_id' and bool(s['last_confirmed_at'] and 0<=(prod_now-dt.datetime.fromisoformat(s['last_confirmed_at'])).total_seconds()<=1200) and bool(s['synced_at'] and 0<=(prod_now-dt.datetime.fromisoformat(s['synced_at'])).total_seconds()<=1200) for s in statuses),
      'production_mismatched_sensor_ids':sum(str(by_spot.get(s['spot_id'],{}).get('kerbside_id'))!=str(s['sensor_kerbside_id']) for s in statuses),
      'production_fresh_exact_ids_20m':sum(str(by_spot.get(s['spot_id'],{}).get('kerbside_id'))==str(s['sensor_kerbside_id']) and bool(s['last_confirmed_at'] and 0<=(prod_now-dt.datetime.fromisoformat(s['last_confirmed_at'])).total_seconds()<=1200) and bool(s['synced_at'] and 0<=(prod_now-dt.datetime.fromisoformat(s['synced_at'])).total_seconds()<=1200) for s in statuses)}
    (RAW/'coverage-audit.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
