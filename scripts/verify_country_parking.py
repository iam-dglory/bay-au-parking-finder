#!/usr/bin/env python3
"""Validate the published nationwide India/Australia parking tile catalogs."""
from __future__ import annotations
import argparse,gzip,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
RESTRICTED={'private','no','permit','delivery','employees','emergency','agricultural','forestry'}
EXPECTED={'india':'IN','australia':'AU'}
def read(path): return json.loads(path.read_text())
def read_gz(path): return json.loads(gzip.decompress(path.read_bytes()))
def verify(country):
  index=read(ROOT/f'public/data/{country}/index.json'); seen=set(); rows=[];expected=EXPECTED[country]
  assert index['country']==expected and index['tile_size']>0 and index['records']>=0
  for key in index['tiles']:
    path=ROOT/f'public/data/{country}/{key}.json.gz'; assert path.is_file(),path
    for row in read_gz(path):
      assert row['id'] not in seen,f"duplicate {row['id']}";seen.add(row['id']);rows.append(row)
      assert row['country']==expected and row.get('state') and row.get('source_url') and row.get('source_name')
      assert row['access'] not in RESTRICTED and math.isfinite(row['lat']) and math.isfinite(row['lng'])
      assert f"{math.floor(row['lat']/index['tile_size'])}_{math.floor(row['lng']/index['tile_size'])}"==key
      assert row['occupancy']=='not_provided'
      for tariff in row.get('tariffs',[]):
        assert row.get('pricing_source_url') and row.get('pricing_checked_at')
        assert math.isfinite(tariff['amount']) and tariff['amount']>=0 and tariff['period']
  assert len(rows)==index['records']
  states={r['state'] for r in rows}
  declared=index.get('states', {})
  assert states <= set(declared), 'record state missing from index'
  assert states == {state for state, count in declared.items() if count > 0}, 'state counts do not match populated boundaries'
  assert all(isinstance(count, int) and count >= 0 for count in declared.values()), 'invalid state count'
  manifest=read(next((ROOT/f'datasets/{country}').glob('*/'+country+'-coverage-manifest.json')))
  assert manifest['records']==len(rows) and manifest['country_code']==expected
  return {'country':country,'records_checked':len(rows),'tiles_checked':len(index['tiles']),'populated_states_or_territories':len(states),'declared_state_or_territory_boundaries':len(declared),'zero_record_boundaries':sorted(state for state, count in declared.items() if count == 0),'priced_records':sum(bool(r.get('tariffs')) for r in rows),'status':'passed'}
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--country',choices=sorted(EXPECTED));args=parser.parse_args()
 print(json.dumps(verify(args.country),indent=2))
