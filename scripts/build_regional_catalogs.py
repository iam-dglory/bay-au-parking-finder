#!/usr/bin/env python3
"""Build reproducible catalogs from source geometries and explicit operator tariffs.
Install scripts/data-requirements.txt. Unknown price/vacancy remains absent.
"""
import collections,gzip,json,math,re
from pathlib import Path
from bs4 import BeautifulSoup
from build_india_catalog import point, inside, capacity, RESTRICTED, tariffs as old_tariffs, CMRL,BMRCL
from group_parking_areas import group_parking_spaces
from qvm_parking import qvm_tariffs
ROOT=Path(__file__).resolve().parents[1];DATE='2026-09-26';TILE=.025

def read(p):
 return json.loads(gzip.decompress(p.read_bytes()) if p.suffix=='.gz' else p.read_text())
def write(p,d):
 p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')
def osm_catalog(city,display,country):
 p=ROOT/f'datasets/{"melbourne" if city=="melbourne" else "india"}/{DATE}/{city}-parking-and-street-zones-osm.json'
 if not p.exists():p=p.with_suffix('.json.gz')
 es=read(p)['elements'];private=[e for e in es if e.get('tags',{}).get('access') in RESTRICTED]
 # Index restricted polygons so the metropolitan snapshot does not require a quadratic scan.
 grid=collections.defaultdict(list)
 for e in private:
  g=e.get('geometry',[])
  if len(g)<3:continue
  la=[v['lat'] for v in g];lo=[v['lon'] for v in g]
  for x in range(math.floor(min(la)/.01),math.floor(max(la)/.01)+1):
   for y in range(math.floor(min(lo)/.01),math.floor(max(lo)/.01)+1):grid[x,y].append(e)
 members={m['ref'] for e in es if e['type']=='relation' and e.get('tags',{}).get('amenity') for m in e.get('members',[]) if m['type']=='way'}
 records=[];skipped=collections.Counter()
 for e in es:
  t=e.get('tags',{});p=point(e)
  if not p:skipped['no_geometry']+=1;continue
  if t.get('access') in RESTRICTED or any(w in t.get('name','').lower() for w in ['staff parking','employee parking','vip and special']):skipped['restricted']+=1;continue
  if e['type']=='way' and e['id'] in members:skipped['relation_member']+=1;continue
  if any(inside(p,w['geometry']) for w in grid[math.floor(p[0]/.01),math.floor(p[1]/.01)]):skipped['inside_private_area']+=1;continue
  street=t.get('amenity') not in ['parking','parking_space','motorcycle_parking']
  if street:
   sides=[(k,v) for k,v in t.items() if k in ['parking:left','parking:right','parking:both','parking:lane:both','parking:lane:left','parking:lane:right'] and v not in ['no','no_parking','no_stopping','separate','yes']]
   if not sides:skipped['no_explicit_parking_layout']+=1;continue
   kind='area'; name=(t.get('name:en') or t.get('name') or 'Road')+' · mapped street parking zone'
  else:
   kind='bay' if t.get('amenity')=='parking_space' and (capacity(t.get('capacity')) or 1)==1 else 'area'
   name=t.get('name:en') or t.get('name') or (('Two-wheeler parking' if t.get('amenity')=='motorcycle_parking' else 'Parking bay' if kind=='bay' else 'Parking area')+f' · {display}')
  extra=old_tariffs(e,city) if city=='hyderabad' else {}
  if extra.get('tariffs'):extra.update({'pricing_checked_at':DATE,'price_summary':'Private car: ₹150 · up to 30 minutes'})
  records.append({'id':f"osm:{e['type']}:{e['id']}",'kind':kind,'address_text':name,'city':display,'country':country,'suburb':t.get('addr:suburb'),'lat':p[0],'lng':p[1],'capacity':capacity(t.get('capacity')),'census_year':None,'access':t.get('access','not_listed'),'fee':t.get('fee'),'opening_hours':t.get('opening_hours'),'vehicle_types':'Two-wheelers' if t.get('amenity')=='motorcycle_parking' else 'Vehicle types not listed','source_url':f"https://www.openstreetmap.org/{e['type']}/{e['id']}",'source_name':'OpenStreetMap','source_updated_at':e.get('timestamp'),'collected_at':DATE,'location_note':('Road segment location; parking side and current sign must be checked' if street else 'Mapped point' if e['type']=='node' else 'Mapped area boundary; entrance may differ'),'occupancy':'not_provided','currency':'AUD' if country=='AU' else 'INR','mapped_zone':street,'source_terms':{k:v for k,v in t.items() if k.startswith(('parking:','charge','fee','maxstay','restriction'))},**extra})
 matches=group_parking_spaces(records,es)
 write(ROOT/f'datasets/{"melbourne" if city=="melbourne" else "india"}/{DATE}/{city}-parking-area-membership.json',matches)
 return records,{'raw_features':len(es),'excluded':dict(skipped)}

# Explicit operator applicability from the visually checked CMRL tariff/facility PDFs.
CMRL_A={'wimco-nagar-depot-metro','wimco-nagar-metro','tollgate-metro','tondiarpet-metro','sir-thiyagaraya-college-metro','thousand-lights','ag-dms','teynampet','saidapet-metro','little-mount','nehru-park','kilpauk','pachaiyappas-college','shenoy-nagar','anna-nagar-east','anna-nagar-tower','ekkattuthangal','koyambedu','arumbakkam','st-thomas-mount-metro'}
CMRL_B={'thiruvotriyur-metro','thiruvottriyur-theradi-metro','kaladipet-metro','new-washermenpet-metro','highcourt','washermenpet-metro','government-estate','lic','nandanam','guindy','ota-nanganallur-road','meenambakkam','egmore-metro','thirumangalam','ashok-nagar','arignar-anna-alandur-metro'}
CMRL_BIKE={'ag-dms','anna-nagar-tower','tondiarpet-metro','kilpauk','ekkattuthangal','thiruvotriyur-metro','thiruvottriyur-theradi-metro','kaladipet-metro','new-washermenpet-metro','meenambakkam','highcourt','thousand-lights','vadapalani','chennai-international-airport'}
ALIASES={'wimco-nagar-depot-metro':'Wimco Nagar Depot Metro','wimco-nagar-metro':'Wimco Nagar Metro','tollgate-metro':'Tollgate Metro','sir-thiyagaraya-college-metro':'Thiagaraya College Metro','thiruvottriyur-theradi-metro':'Thiruvotriyur Theradi Metro','new-washermenpet-metro':'New Washermenpet Metro','washermenpet-metro':'Washermanpet','puratchi-thalaivar-dr-m-g-ramachandran-central-metro':'Puratchi Thalaivar Dr. M.G. Ramachandran Central','arignar-anna-alandur-metro':'Arignar Anna Alandur ','ota-nanganallur-road':'OTA - Nanganallur Road','chennai-international-airport':'Chennai International Airport','saidapet-metro':'Saidapet','egmore-metro':'Egmore','st-thomas-mount-metro':'St. Thomas Mount','pachaiyappas-college':'Pachaiyappas College','highcourt':'High Court'}
def cmrl_records():
 raw=ROOT/f'datasets/india/{DATE}';snapshots=read(raw/'chennai-metro-availability.json');group={}
 for r in snapshots:
  v=group.setdefault(r['stationName'].strip(),{})
  for name,key in [('Two-wheeler','twoWheeler'),('Car','threeNFourWheeler')]:
   total=v.setdefault(name,{'capacity':0,'occupied':0,'available':0})
   for col,suffix in [('capacity','Capacity'),('occupied','Occupied'),('available','Available')]:total[col]+=r[key+suffix]
 manifest=read(ROOT/'datasets/manifest.json');stamp=next(r['fetched_at'] for r in manifest if r['path'].endswith('/chennai-metro-availability.json'))
 result=[]
 for p in sorted((raw/'cmrl-stations').glob('*.html')):
  slug=p.stem
  # Duplicate operator web pages for the same station are not separate lots.
  if slug.endswith('-2') or 'cmbt' in slug:continue
  soup=BeautifulSoup(p.read_text(),'html.parser');frame=soup.find('iframe',src=re.compile('google.com/maps/embed'));url=frame.get('src','') if frame else ''
  coords=re.search(r'!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)',url)
  if not coords:continue
  lng,lat=map(float,coords.groups())
  if not (12<lat<14 and 79<lng<82):continue
  title=ALIASES.get(slug,slug.replace('-metro','').replace('-',' ').title());entrance=re.search(r'CMRL Parking\s*:\s*(.*?)View Realtime Data',soup.get_text(' ',strip=True))
  entrance=entrance.group(1).strip() if entrance else 'Parking entrance at station'
  if entrance=='No':continue
  tariff=[];car=[];bike=[];periods=['Up to 6 hours','6–12 hours','Over 12 hours (service hours)','Night halt']
  if slug in CMRL_A:bike=[20,30,40,50];car=[30,40,60,100]
  if slug in CMRL_B:bike=[25,40,55,70];car=[40,50,65,125]
  if slug=='mannadi':bike=[25,40,55,70];car=[50,75,90,125]
  if 'central-metro' in slug:bike=[10,20,30,40,100];car=[40,80,150,250,150];periods=['Up to 4 hours','4–8 hours','8–12 hours','Over 12 hours (service hours)','Night halt']
  if slug=='vadapalani':bike=[40,80,120,160,100];periods=['Up to 3 hours','3–6 hours','6–12 hours','Over 12 hours (service hours)','Night halt']
  if slug=='chennai-international-airport':bike=[50,100,150,200,125];periods=['Up to 3 hours','3–6 hours','6–12 hours','Over 12 hours (service hours)','Night halt']
  for vehicle,amounts in [('Two-wheeler',bike),('Car',[] if slug in CMRL_BIKE else car)]:
   tariff += [{'vehicle':vehicle,'period':period,'amount':amount} for period,amount in zip(periods,amounts)]
  vehicles=group.get(title.strip());first=next((r for r in tariff if r['vehicle']=='Car'),tariff[0] if tariff else None)
  extra={}
  if vehicles:extra['occupancy_snapshot']={'source_url':'https://commuters-data.chennaimetrorail.org/parkingavailability','fetched_at':stamp,'vehicles':vehicles}
  result.append({'id':'cmrl:'+slug,'kind':'area','address_text':title+' · Metro parking','city':'Chennai','country':'IN','suburb':None,'lat':lat,'lng':lng,'capacity':None,'census_year':None,'access':'yes','vehicle_types':'Two-wheelers only' if slug in CMRL_BIKE else 'Cars and two-wheelers','source_url':'https://chennaimetrorail.org/station-information/'+slug+'/','source_name':'Chennai Metro Rail','collected_at':DATE,'location_note':f'Operator station map point; parking entrance: {entrance}. Follow station signs to the parking entrance.','occupancy':'operator_snapshot' if vehicles else 'not_provided','currency':'INR','tariffs':tariff,'pricing_source_url':CMRL,'pricing_checked_at':DATE,'pricing_notes':'Published non-commuter slabs (not hourly rates). General groups effective 1 Feb 2025; Vadapalani and Airport Lot 1 effective 1 May 2024. Commuter concessions require qualifying card use. Night halt 1am–4:30am. Airport Lot 2 and Thirumangalam VR Mall use separate tariffs.','price_summary':f"{first['vehicle']}: ₹{first['amount']} · {first['period'].lower()} (non-commuter)" if first else None,**extra})
 return result

# Published station identifiers, explicit aliases and capacity rows; no substring/fuzzy spreading.
def bengaluru_tariffs(records):
 soup=BeautifulSoup((ROOT/f'datasets/india/{DATE}/bengaluru-metro-parking.html').read_text(),'html.parser');rows=[[c.get_text(' ',strip=True) for c in tr.find_all(['td','th'])] for tr in soup.find_all('tr')]
 table={int(r[0]):r for r in rows if len(r)==6 and r[0].isdigit() and int(r[0])>=10}
 aliases={14:['S V Road','Swami Vivekananda Road'],25:['Mysore Road'],28:['Nayandahalli'],29:['Rajarajeshwari Nagar'],38:['Nagasandra'],43:['Peenya'],47:['Rajajinagar'],64:['RV Road'],65:['Ragigudda'],67:['BTM Layout'],68:['Silk Board'],69:['Bommanahalli'],70:['Hongasandra'],71:['Kudlu Gate'],72:['Singasandra'],73:['Hosa Road'],74:['Electronic City'],75:['Konappana Agrahara'],76:['Hebbagodi'],77:['Bommasandra']}
 audit=[]
 for record in records:
  name=record['address_text']
  match=next((i for i,ns in aliases.items() if name in [n+suffix for n in ns for suffix in [' Metro Parking',' Metro Station Parking']]),None)
  if match is None or match not in table:continue
  row=table[match];bike=int(row[2]);cars=int(row[3]);tariffs=[]
  for vehicle,cap,amounts in [('Two-wheeler',bike,[15,5,30]),('Car',cars,[30,10,60])]:
   if cap:tariffs += [{'vehicle':vehicle,'period':period,'amount':amount} for period,amount in zip(['First 4 hours','Each additional hour or part','Daily maximum'],amounts)]
  record.update({'tariffs':tariffs,'vehicle_types':'Cars and two-wheelers' if cars and bike else 'Two-wheelers only' if bike else 'Cars only','pricing_source_url':BMRCL,'pricing_checked_at':DATE,'pricing_notes':'BMRCL published tariff. No overnight parking. Station totals describe capacity, not live vacancy.','price_summary':'Cars: ₹30 · first 4 hours' if cars else 'Two-wheelers: ₹15 · first 4 hours'})
  audit.append({'osm_id':record['id'],'operator_station_row':match,'operator_station_name':row[1],'two_wheeler_capacity':bike,'car_capacity':cars})
 write(ROOT/f'datasets/india/{DATE}/bengaluru-tariff-matches.json',audit)

def bengaluru_station_parking(existing):
 soup=BeautifulSoup((ROOT/f'datasets/india/{DATE}/bengaluru-metro-parking.html').read_text(),'html.parser');rows=[[c.get_text(' ',strip=True) for c in tr.find_all(['td','th'])] for tr in soup.find_all('tr')]
 rows=[r for r in rows if len(r)==6 and r[0].isdigit()][:77]
 stations={e['id']:e for e in read(ROOT/f'datasets/india/{DATE}/bengaluru-metro-station-locations-osm.json')['elements']}
 # Curated official table-row / OSM station ID crosswalk. Coordinates denote stations,
 # not individual bays or an inferred lot entrance. Side-specific rows are aggregated.
 crosswalk={1:5760197744,2:5760197745,3:11941186870,4:5760197749,5:5760197754,6:5760197755,7:5760197757,8:5760197761,9:5760197764,10:5760197765,11:5760197765,12:6400857549,13:6400857549,14:6400857550,15:6400857551,16:6400857552,17:6400857558,18:6400857559,19:6400857559,20:6400857560,21:6400857561,22:6400857562,23:6400857563,24:6400857564,25:6400857565,26:6400857565,27:6400857565,28:9050797592,29:9051410519,30:9049846515,31:9051417969,32:9051395755,33:9051405243,34:9919570131,35:1576973953,36:1576973954,37:1576973980,38:11941173068,39:11941173068,40:5960788724,41:5960788725,42:6410706696,43:6410706695,44:6410706692,45:6410706691,46:6410706691,47:6410706690,48:6410706689,49:5960788726,50:6410706688,51:6432710301,52:6432710301,53:6432710299,54:6432710299,55:6432710296,56:6432710294,57:6432710293,58:6432710292,59:9919651777,60:9919651776,61:9919651775,62:9919651774,63:9919651773,64:6432710295,65:5760198239,66:3302642058,67:5760198226,68:5760198212,69:5760198202,70:5760198198,71:5760198187,72:5760198182,73:5760198162,74:5760198145,75:5760198133,76:11521199307,77:5760197806}
 grouped={};audit=[]
 for row in rows:
  number=int(row[0]);sid=crosswalk.get(number)
  if sid not in stations:continue
  g=grouped.setdefault(sid,{'Two-wheeler':0,'Car':0})
  g['Two-wheeler']+=int(row[2]);g['Car']+=int(row[3]);audit.append({'row':number,'operator_name':row[1],'station_osm_id':sid})
 result=[]
 for sid,capacities in grouped.items():
  e=stations[sid];lat,lng=point(e);name=e['tags'].get('name:en') or e['tags']['name']
  # Existing explicitly named parking lots keep their more precise location. Skip their
  # station-level duplicate when their known tariff and station name agree.
  alias={'Swami Vivekananda Road':'S V Road','Rashtreeya Vidyalaya Road':'RV Road','Central Silk Board':'Silk Board','Pantharapalya - Nayandahalli':'Nayandahalli','Infosys Foundation Konappana Agrahara':'Konappana Agrahara','Biocon Hebbagodi':'Hebbagodi','Delta Electronics Bommasandra':'Bommasandra'}.get(name,name)
  if any(r.get('tariffs') and r['address_text'] in [alias+' Metro Parking',alias+' Metro Station Parking'] for r in existing):continue
  tariffs=[]
  for vehicle,amounts in [('Two-wheeler',[15,5,30]),('Car',[30,10,60])]:
   if capacities[vehicle]:tariffs += [{'vehicle':vehicle,'period':period,'amount':amount} for period,amount in zip(['First 4 hours','Each additional hour or part','Daily maximum'],amounts)]
  car=capacities['Car']>0
  result.append({'id':'bmrcl:station:'+str(sid),'kind':'area','address_text':name+' · Metro parking','city':'Bengaluru','country':'IN','suburb':None,'lat':lat,'lng':lng,'capacity':None,'vehicle_capacity':capacities,'census_year':None,'access':'yes','vehicle_types':'Cars and two-wheelers' if car else 'Two-wheelers only','source_name':'Bengaluru Metro Rail + OpenStreetMap','source_url':BMRCL,'collected_at':DATE,'location_note':'Station map point (OpenStreetMap). BMRCL lists parking at this station; follow entrance signs. Multiple sides are combined, not individual bay positions.','location_source_url':f"https://www.openstreetmap.org/{e['type']}/{sid}",'occupancy':'not_provided','currency':'INR','tariffs':tariffs,'pricing_source_url':BMRCL,'pricing_checked_at':DATE,'pricing_notes':'Published BMRCL station parking tariff. No overnight parking. Capacity is the station total, not available spaces.','price_summary':'Cars: ₹30 · first 4 hours' if car else 'Two-wheelers: ₹15 · first 4 hours'})
 write(ROOT/f'datasets/india/{DATE}/bengaluru-station-parking-crosswalk.json',audit)
 return result

# Secure prices require current validity windows, vehicle conditions and explicit coordinates.
def secure_records():
 result=[]
 for p in sorted((ROOT/f'datasets/melbourne/{DATE}/secure-operator').glob('*.html')):
  soup=BeautifulSoup(p.read_text(),'html.parser');location=soup.find(attrs={'data-btnaction':'carparkdetails-search'})
  if not location:continue
  lat=float(location.get('data-latitude','0'));lng=float(location.get('data-longitude','0'));name=location.get('data-term');identifier=location.get('data-carparkid')
  if not name or not (-39<lat<-37 and 144<lng<146):continue
  prices=[]
  for group in soup.select('.car-park-detail__accordion-item[data-ecomm-category]'):
   start=group.get('data-valid-from','');end=group.get('data-valid-to','')
   if start[:10]>DATE or end[:10]<DATE or group.get('data-is-special-day')=='true':continue
   category=group.get('data-ecomm-category');general=group.select_one('.general');conditions=general.get_text(' ',strip=True) if general else ''
   for detail in group.select('.details'):
    duration=detail.select_one('.time');pricing=detail.select_one('.pricing')
    if not pricing or not duration:continue
    drive=re.search(r'Drive-up\s*\$(\d+(?:\.\d+)?)',pricing.get_text(' ',strip=True))
    if not drive:continue
    prices.append({'vehicle':'Car','period':duration.get_text(' ',strip=True),'amount':float(drive.group(1)),'category':category,'conditions':conditions})
  if not prices:continue
  first=next((r for r in prices if r['category']=='Hourly'),prices[0]);url='https://www.secureparking.com.au/en-au/car-parks/australia/vic/'+p.stem+'/'
  result.append({'id':'secure:'+identifier,'kind':'area','address_text':name,'city':'Melbourne','country':'AU','suburb':None,'lat':lat,'lng':lng,'capacity':None,'census_year':None,'access':'yes','vehicle_types':'Cars (check clearance at entrance)','source_url':url,'source_name':'Secure Parking','collected_at':DATE,'location_note':'Operator-published car park location; follow entrance directions.','occupancy':'not_provided','currency':'AUD','tariffs':prices,'pricing_source_url':url,'pricing_checked_at':DATE,'pricing_notes':'Drive-up rates, checked on collection date. Categories have different entry/exit conditions. Promotions, booking fees, events and future dates may differ. These are duration slabs, not a uniform hourly rate.','price_summary':f"Drive-up: A${first['amount']:g} · {first['period']} ({first['category']})",'price_summary_conditions':first['conditions']})
 return result

def qv_tariffs(records):
 """QV's named mapped entrances share one published facility tariff.
 No shopping discount is represented as an unconditional free rate.
 """
 url='https://www.qv.com.au/visit/qv-melbourne-car-park.html'
 soup=BeautifulSoup((ROOT/f'datasets/melbourne/{DATE}/qv-melbourne-car-park-rates.html').read_text(),'html.parser')
 table=soup.find('table'); rows=[]
 if table:
  for tr in table.find_all('tr'):
   cells=[c.get_text(' ',strip=True) for c in tr.find_all('td')]
   if len(cells)==2 and re.fullmatch(r'\$\d+\.\d{2}',cells[1]):
    rows.append({'vehicle':'Car','period':cells[0],'amount':float(cells[1][1:]),'category':'Standard','conditions':'Rates applied per day; each new day starts at 6am.'})
 # Fail closed if the archived operator page changes shape.
 if len(rows)!=5:raise ValueError('QV standard tariff table requires review')
 rows += [{'vehicle':'Car','period':'Flat rate','amount':20,'category':'Night','conditions':'Enter after 5pm and exit before 6am the next day.'},{'vehicle':'Car','period':'Per day','amount':20,'category':'Weekend / Victorian public holiday','conditions':'Enter and exit between 6am Saturday and 6am Monday, or on designated Victorian public holidays.'}]
 for r in records:
  if r['id'] in ['osm:node:415507065','osm:node:415507076'] and r['address_text']=='QV Parking':
   r.update({'tariffs':rows,'price_summary':f"Standard: A${rows[0]['amount']:g} · {rows[0]['period']}",'price_summary_conditions':'Night, weekend and Victorian public holiday rates differ. Open Prices for entry and exit conditions.','pricing_source_url':url,'pricing_checked_at':DATE,'pricing_notes':'Operator duration slabs, not uniform hourly prices. Shopping discounts require qualifying purchases and validation; they are not applied here. Clearance 2.1m. Rates may change.','operator_facility_id':'qv-melbourne'})

def stats(records,base):
 return {**base,'imported':len(records),'bays':sum(r['kind']=='bay' for r in records),'areas':sum(r['kind']=='area' for r in records),'grouped_parking_spaces':sum(bool(r.get('parent_area_id')) for r in records),'displayed_bays':sum(r['kind']=='bay' and not r.get('parent_area_id') for r in records),'displayed_areas':sum(r['kind']=='area' and not r.get('parent_area_id') for r in records),'mapped_street_zones':sum(bool(r.get('mapped_zone')) for r in records),'priced_areas':sum(bool(r.get('tariffs')) for r in records),'operator_snapshots':sum(bool(r.get('occupancy_snapshot')) for r in records),'sensor_confirmed_bays':0}
if __name__=='__main__':
 records=[];audits={}
 for city,display in [('chennai','Chennai'),('bengaluru','Bengaluru'),('hyderabad','Hyderabad')]:
  own,base=osm_catalog(city,display,'IN')
  if city=='chennai':
   operator=cmrl_records(); own=[r for r in own if r['id'] not in ['osm:way:1280657303','osm:relation:14332770']]+operator
  if city=='bengaluru':
   bengaluru_tariffs(own);own+=bengaluru_station_parking(own)
  audits[display]=stats(own,base);records+=own
 write(ROOT/'public/data/india-parking.json',{'schema_version':2,'collected_at':DATE,'license':'OpenStreetMap © contributors, ODbL 1.0; operator facts attributed per record.','cities':audits,'records':records})
 melbourne,base=osm_catalog('melbourne','Melbourne','AU');qv_tariffs(melbourne)
 raw=ROOT/f'datasets/melbourne/{DATE}'
 qvm_tariffs(melbourne,read(raw/'melbourne-parking-and-street-zones-osm.json.gz')['elements'],raw/'qvm-operator',DATE)
 melbourne+=secure_records();audits['Greater Melbourne']=stats(melbourne,base)
 tiles=collections.defaultdict(list)
 for r in melbourne:tiles[f"{math.floor(r['lat']/TILE)}_{math.floor(r['lng']/TILE)}"].append(r)
 directory=ROOT/'public/data/melbourne'
 for key,rows in tiles.items():write(directory/(key+'.json'),rows)
 write(directory/'index.json',{'schema_version':2,'collected_at':DATE,'tile_size':TILE,'tiles':sorted(tiles),'license':'OpenStreetMap © contributors, ODbL 1.0; operator facts attributed per record.','coverage':audits['Greater Melbourne']})
 write(ROOT/f'datasets/research-{DATE}/catalog-import-audit.json',audits)
 print(json.dumps(audits,indent=2))
