#!/usr/bin/env python3
"""Reproducible OSM snapshot import. Never turn capacity or mapped bays into vacancy.
Run after collect_india.py; source geometry remains in the archived OSM responses.
"""
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATE = '2026-09-25'
RAW = ROOT / 'datasets/india' / DATE
RESTRICTED = {'private', 'no', 'permit', 'delivery', 'emergency', 'agricultural', 'forestry'}
CMRL = 'https://chennaimetrorail.org/wp-content/uploads/2025/03/Approved-Parking-Tariff-Feb-2025-updated.pdf'
BMRCL = 'https://english.bmrc.co.in/parking/'
AIRPORT = 'https://www.hyderabad.aero/rgia/airport-facilities/parking-information'

def point(e):
    if 'lat' in e: return e['lat'], e['lon']
    # A real point on the mapped boundary, not an invented entrance coordinate.
    geometry = e.get('geometry') or next((m.get('geometry') for m in e.get('members', []) if m.get('geometry')), [])
    if geometry: return geometry[0]['lat'], geometry[0]['lon']
    return None

def inside(p, ring):
    lat, lon = p; result = False
    for a,b in zip(ring, ring[1:] + ring[:1]):
        if (a['lat'] > lat) != (b['lat'] > lat):
            x = (b['lon']-a['lon'])*(lat-a['lat'])/(b['lat']-a['lat'])+a['lon']
            if lon < x: result = not result
    return result

def capacity(value):
    return int(value) if str(value).isdigit() and 0 < int(value) < 100000 else None

def tariffs(e, city):
    t=e['tags']; name=t.get('name',''); oid=f"{e['type']}/{e['id']}"
    # Exact named station matches only. Never spread a city's tariff across nearby lots.
    metro_names = ['RV Road','Ragigudda','BTM Layout','Silk Board','Bommanahalli','Hongasandra','Kudlu Gate','Singasandra','Hosa Road','Electronic City','Konappana Agrahara','Hebbagodi','Bommasandra','S V Road','Mysore Road','Rajajinagar','Nagasandra','Peenya','Nayandahalli','Rajarajeshwari Nagar']
    if city=='bengaluru' and 'metro' in name.lower() and any(n.lower() in name.lower() for n in metro_names):
        bike_only=any(n in name for n in metro_names[:9]+metro_names[10:13]+['Nayandahalli','Rajarajeshwari Nagar'])
        rows=[{'vehicle':'Two-wheeler','period':'First 4 hours','amount':15},{'vehicle':'Two-wheeler','period':'Each additional hour or part','amount':5},{'vehicle':'Two-wheeler','period':'Daily maximum','amount':30}]
        if not bike_only: rows += [{'vehicle':'Car','period':'First 4 hours','amount':30},{'vehicle':'Car','period':'Each additional hour or part','amount':10},{'vehicle':'Car','period':'Daily maximum','amount':60}]
        return {'tariffs':rows,'pricing_source_url':BMRCL,'pricing_notes':'Published station parking tariff. No overnight parking. Confirm the vehicle section at the entrance.','vehicle_types':'Two-wheelers only' if bike_only else 'Cars and two-wheelers','pricing_checked_at':DATE}
    if oid in ['way/1280657303','relation/14332770']:
        car=[40,50,65,125] if oid.startswith('way') else [50,75,90,125]
        rows=[]
        for vehicle, amounts in [('Two-wheeler',[25,40,55,70]),('Car',car)]:
            for period,amount in zip(['Up to 6 hours','6–12 hours','Over 12 hours (service hours)','Night halt'],amounts): rows.append({'vehicle':vehicle,'period':period,'amount':amount})
        return {'tariffs':rows,'pricing_source_url':CMRL,'pricing_notes':'Standard non-commuter tariff, effective 1 Feb 2025. Metro-traveller discounts require qualifying card use. Night halt: 1am–4:30am.','vehicle_types':'Cars and two-wheelers','pricing_checked_at':DATE}
    if city=='hyderabad' and oid in ['way/251031349','way/251031354']:
        return {'tariffs':[{'vehicle':'Private car','period':'Up to 30 minutes','amount':150},{'vehicle':'Private car','period':'30–60 minutes','amount':250},{'vehicle':'Private car','period':'Each subsequent hour','amount':100},{'vehicle':'Private car','period':'24 hours','amount':750},{'vehicle':'Two-wheeler','period':'First hour','amount':40},{'vehicle':'Two-wheeler','period':'Each subsequent hour','amount':30},{'vehicle':'Two-wheeler','period':'24 hours','amount':250}], 'pricing_source_url':AIRPORT,'pricing_notes':'Airport general visitor parking tariff. Premium, valet and commercial vehicle rates differ; choose the general parking entrance.','pricing_checked_at':DATE,'address_text':'Hyderabad Airport · general parking','vehicle_types':'Cars and two-wheelers'}
    return {}

def cmrl_snapshot():
    rows=json.loads((RAW/'chennai-parking-availability.json').read_text())
    grouped={}
    for row in rows:
        station=row['stationName']
        totals=grouped.setdefault(station,{'source_url':'https://commuters-data.chennaimetrorail.org/parkingavailability','fetched_at':'2026-09-25T03:08:00Z','vehicles':{}})
        for vehicle,prefix in [('Two-wheeler','twoWheeler'),('Car / three or four wheeler','threeNFourWheeler')]:
            slot=totals['vehicles'].setdefault(vehicle,{'capacity':0,'occupied':0,'available':0})
            slot['capacity']+=row[prefix+'Capacity'];slot['occupied']+=row[prefix+'Occupied'];slot['available']+=row[prefix+'Available']
    return grouped

def build():
    records=[]; audits={}; snapshots=cmrl_snapshot()
    for city,display in [('chennai','Chennai'),('bengaluru','Bengaluru'),('hyderabad','Hyderabad')]:
        elements=json.loads((RAW/f'{city}-osm.json').read_text())['elements']
        restricted=[e for e in elements if e.get('tags',{}).get('access') in RESTRICTED]
        member_ids={m['ref'] for e in elements if e['type']=='relation' and e.get('tags',{}).get('amenity') for m in e.get('members',[]) if m['type']=='way'}
        skipped=Counter(); start=len(records)
        for e in elements:
            t=e.get('tags',{}); p=point(e)
            if not p: skipped['no_geometry']+=1;continue
            if t.get('access') in RESTRICTED or any(w in t.get('name','').lower() for w in ['staff parking','employee parking','vip and special']): skipped['restricted']+=1;continue
            if e['type']=='way' and e['id'] in member_ids: skipped['relation_member']+=1;continue
            if any(inside(p,r.get('geometry',[])) for r in restricted if r.get('geometry')): skipped['inside_private_area']+=1;continue
            kind='bay' if t.get('amenity')=='parking_space' and (capacity(t.get('capacity')) or 1)==1 else 'area'
            access=t.get('access','not_listed')
            extra=tariffs(e,city)
            if city=='chennai' and f"{e['type']}/{e['id']}" in ['way/1280657303','relation/14332770']:
                extra['occupancy_snapshot']=snapshots['Government Estate' if e['id']==1280657303 else 'Mannadi']
            records.append({'id':f"osm:{e['type']}:{e['id']}",'kind':kind,'address_text':t.get('name:en') or t.get('name') or (('Two-wheeler parking' if t.get('amenity')=='motorcycle_parking' else 'Parking bay' if kind=='bay' else 'Parking area')+f' · {display}'),
                'city':display,'country':'IN','suburb':t.get('addr:suburb'),'lat':p[0],'lng':p[1],'capacity':capacity(t.get('capacity')),'census_year':None,
                'access':access,'fee':t.get('fee'),'opening_hours':t.get('opening_hours'),'vehicle_types':'Two-wheelers' if t.get('amenity')=='motorcycle_parking' else 'Vehicle types not listed',
                'source_url':f"https://www.openstreetmap.org/{e['type']}/{e['id']}",'source_name':'OpenStreetMap','source_updated_at':e.get('timestamp'),'collected_at':DATE,'location_note':'Mapped point' if e['type']=='node' else 'Mapped area boundary; entrance may differ',
                'occupancy':'operator_snapshot' if 'occupancy_snapshot' in extra else 'not_provided','currency':'INR',**extra})
        own=records[start:]
        audits[display]={'raw_features':len(elements),'imported':len(own),'bays':sum(r['kind']=='bay' for r in own),'areas':sum(r['kind']=='area' for r in own),'priced_areas':sum(bool(r.get('tariffs')) for r in own),'operator_occupancy_snapshots':sum(bool(r.get('occupancy_snapshot')) for r in own),'sensor_confirmed_bays':0,'excluded':dict(skipped)}
    out={'schema_version':1,'collected_at':DATE,'license':'OpenStreetMap © contributors, ODbL 1.0. Operator tariffs attributed individually.','cities':audits,'records':records}
    dest=ROOT/'public/data/india-parking.json';dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n')
    (RAW/'import-audit.json').write_text(json.dumps(audits,indent=2)+'\n')
    print(json.dumps(audits,indent=2))

if __name__=='__main__':build()
