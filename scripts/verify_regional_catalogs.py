#!/usr/bin/env python3
"""Validate published catalog invariants against archived source IDs and tariffs."""
import collections,hashlib,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(path):return json.loads(path.read_text())
def verify():
 india=read(ROOT/'public/data/india-parking.json'); index=read(ROOT/'public/data/melbourne/index.json')
 all_records=list(india['records']); melbourne=[]
 for tile in index['tiles']:
  rows=read(ROOT/f'public/data/melbourne/{tile}.json')
  for r in rows:assert f"{math.floor(r['lat']/index['tile_size'])}_{math.floor(r['lng']/index['tile_size'])}"==tile
  melbourne+=rows
 assert len(melbourne)==index['coverage']['imported'];all_records+=melbourne
 assert len({r['id'] for r in all_records})==len(all_records),'Duplicate source IDs'
 by_id={r['id']:r for r in all_records};memberships=collections.Counter()
 for r in all_records:
  assert math.isfinite(r['lat']) and math.isfinite(r['lng'])
  assert r['access'] not in {'private','no','permit','delivery','emergency','agricultural','forestry'}
  assert r['occupancy'] in ['not_provided','operator_snapshot']
  assert r.get('source_url') and r.get('collected_at')
  if r.get('tariffs'):
   assert r.get('pricing_source_url') and r.get('pricing_checked_at')
   assert r.get('fee')!='no'
   for t in r['tariffs']:assert math.isfinite(t['amount']) and t['amount']>=0 and t['vehicle'] and t['period']
   if r['vehicle_types']=='Two-wheelers only':assert not any(t['vehicle']=='Car' for t in r['tariffs'])
  if r.get('vehicle_capacity',{}).get('Car')==0:assert not any(t['vehicle']=='Car' for t in r.get('tariffs',[]))
  # Snapshots without a source observation time must never become sensor readings.
  assert 'sensor_status' not in r
  if r.get('parent_area_id'):
   parent=by_id[r['parent_area_id']]
   assert parent['kind']=='area' and not parent.get('mapped_zone') and not parent.get('parent_area_id')
   assert parent['country']==r['country'] and parent['city']==r['city']
   memberships[parent['id']]+=1
 for identifier,count in memberships.items():assert by_id[identifier]['mapped_bay_count']==count
 qvm=[by_id[k] for k in ['osm:way:7674137','osm:node:11140069164']]
 assert memberships['osm:way:7674137']==603
 assert all(r['kind']=='area' and r['fee']=='yes' and r['occupancy']=='not_provided' and r.get('tariffs') for r in qvm)
 assert qvm[0]['capacity'] is None and qvm[1]['capacity']==506
 qv=[r for r in all_records if r['id'] in ['osm:node:415507065','osm:node:415507076']]
 assert len(qv)==2 and all([t['amount'] for t in r['tariffs'][:5]]==[6,25,39,49,65] for r in qv)
 for city,stats in india['cities'].items():
  rows=[r for r in india['records'] if r['city']==city]
  assert len(rows)==stats['imported']
  assert sum(bool(r.get('tariffs')) for r in rows)==stats['priced_areas']
 manifest=read(ROOT/'datasets/manifest.json')
 for r in manifest:
  p=ROOT/r['path'];assert p.is_file(),r['path']
  assert p.stat().st_size==r['bytes'],r['path']
  assert hashlib.sha256(p.read_bytes()).hexdigest()==r['sha256'],r['path']
 return {'catalog_records_checked':len(all_records),'published_tile_count':len(index['tiles']),'manifest_files_checked':len(manifest),'grouped_parking_spaces_checked':sum(memberships.values()),'qvm_grouped_spaces':memberships['osm:way:7674137'],'price_and_access_checks':'passed','duplicate_source_id_check':'passed','sensor_vs_snapshot_check':'passed'}
if __name__=='__main__':print(json.dumps(verify(),indent=2))
