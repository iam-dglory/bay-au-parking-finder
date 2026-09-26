"""Exact QVM facility crosswalk and operator tariff-table import.

Do not borrow the street-sensor feed or infer a live car-park occupancy count.
The official website, rather than its conflicting help article, supplies rates.
"""
import re
from bs4 import BeautifulSoup
from build_india_catalog import inside

OVERVIEW = 'https://qvm.com.au/parking/'
RATES = 'https://qvm.com.au/parking/car-park-rates/'
FACILITIES = {
    'osm:way:7674137': ('Open Air Car Park', 2),
    'osm:node:11140069164': ('Undercover Car Park', 1),
}


def qvm_tariffs(records, elements, folder, date):
    soup = BeautifulSoup((folder / 'qvm-car-park-rates.html').read_text(), 'html.parser')
    tables = soup.find_all('table')
    if len(tables) != 2:
        raise ValueError('QVM tariff table layout requires review')
    parsed = [[[re.sub(r'\s+', ' ', c.get_text(' ', strip=True)) for c in tr.find_all(['td', 'th'])]
               for tr in table.find_all('tr')] for table in tables]
    if parsed[0][0] != ['Tue, Thu, Fri, Sat & Sun', 'Undercover Car Park', 'Open-Air Car Park'] or parsed[1][0] != ['Mon, Wed', 'Undercover Car Park', 'Open-Air Car Park']:
        raise ValueError('QVM facility/day applicability requires review')
    if len(parsed[0]) != 8 or len(parsed[1]) != 10 or any(len(row) != 3 for rows in parsed for row in rows):
        raise ValueError('QVM tariff rows require review')
    found = []
    for record in records:
        if record['id'] not in FACILITIES:
            continue
        name, column = FACILITIES[record['id']]
        tariffs = []
        for category, rows in zip(['Market days: Tue, Thu, Fri, Sat, Sun', 'Non-market days: Mon, Wed'], parsed):
            for period, value1, value2 in rows[1:]:
                value = [None, value1, value2][column]
                if value == '-':
                    continue
                amount = re.fullmatch(r'\$(\d+(?:\.\d+)?)(?:\s*\((.*?)\))?', value)
                if value != 'Free' and not amount:
                    raise ValueError(f'QVM price requires review: {value}')
                tariffs.append({'vehicle': 'Car', 'period': period, 'amount': 0 if value == 'Free' else float(amount[1]),
                                'category': category, 'conditions': amount[2] or '' if amount else 'Applies only within 6am–9am on market days.'})
        if column == 2:
            element = next(e for e in elements if f"osm:{e['type']}:{e['id']}" == record['id'])
            ring = element['geometry']
            # Area centre is for the map only. Directions use the named Queen St entrance.
            p = ((min(v['lat'] for v in ring) + max(v['lat'] for v in ring)) / 2,
                 (min(v['lon'] for v in ring) + max(v['lon'] for v in ring)) / 2)
            if not inside(p, ring):
                raise ValueError('QVM display centre is outside the mapped facility')
            record.update({'lat': p[0], 'lng': p[1], 'boundary': [[v['lat'], v['lon']] for v in ring],
                           'census_aliases': ['Queen Victoria Market Car Park Queen Victoria Market 391 Queen Street MELBOURNE VIC 3000'],
                           'capacity': None, 'opening_hours': 'Mo-Su 05:00-19:00',
                           'opening_hours_summary': 'Daily: 5am–7pm. Night Market sessions: 4:30pm–11pm.',
                           'vehicle_types': 'Cars; accessible, seniors and family spaces; no height limit',
                           'location_note': 'Mapped car park boundary and area centre; entry via Queen Street. Mapped bay count is not current capacity or vacancy.'})
        else:
            record.update({'capacity': 506, 'opening_hours': '24/7', 'opening_hours_summary': 'Open 24 hours, every day. Height limit: 2.2m.',
                           'census_aliases': ['131-151 Therry Street MELBOURNE VIC 3000'],
                           'vehicle_types': 'Cars; accessible and family spaces; 12 EV charging spaces (Type 2, BYO cable)',
                           'location_note': 'Mapped undercover car park point; entry via Queen Street, opposite the open-air entrance.'})
        market_first=next(t['amount'] for t in tariffs if t['category'].startswith('Market days') and t['period']=='First two hours after 9am')
        nonmarket_first=next(t['amount'] for t in tariffs if t['category'].startswith('Non-market days') and t['period']=='0-1 hour')
        market_maximum=next(t['amount'] for t in tariffs if t['category'].startswith('Market days') and t['period']=='Daily maximum')
        record.update({'address_text': 'Queen Victoria Market · ' + name, 'facility_type': name,
                       'kind': 'area', 'fee': 'yes', 'access': 'customers', 'mapped_zone': False,
                       'entrance_summary': 'Entry via Queen Street', 'directions_query': f'Queen Victoria Market {name}, Queen Street, Melbourne',
                       'location_source_url': record['source_url'], 'source_url': OVERVIEW, 'source_name': 'Queen Victoria Market',
                       'occupancy': 'not_provided', 'pricing_source_url': RATES, 'pricing_checked_at': date, 'tariffs': tariffs,
                       'price_summary': f'Market days: A${market_first:g} for first 2 hours after 9am · Mon/Wed: A${nonmarket_first:g} for first hour',
                       'price_summary_conditions': 'Market days: Tue, Thu, Fri, Sat, Sun. Evening, event and public holiday rates differ.',
                       'pricing_notes': f'Early shopping is free only from 6am–9am on market days. The operator separately lists A${market_maximum:g} for 5+ hours on market days; Bay does not calculate a total from these overlapping slabs. A$2 shopping discount requires the QVM app and a market QR scan after 9am on market days; it is not included here. Confirm event dates and applicable rate at entry.'})
        found.append(record['id'])
    if set(found) != set(FACILITIES):
        raise ValueError('QVM facility crosswalk no longer matches the catalog')
