"""Archive OSM parking features in three explicit metro search bounds. No live claim.
Run once per dated snapshot; preserves all source tags and geometry.
"""
import json
from urllib.parse import urlencode
from archive_dataset import archive, ROOT

CITIES = {
    'chennai': (12.75, 79.95, 13.30, 80.35),
    'bengaluru': (12.75, 77.35, 13.20, 77.85),
    'hyderabad': (17.15, 78.20, 17.65, 78.70),
}
if __name__ == '__main__':
    for city, bounds in CITIES.items():
        bbox = ','.join(map(str, bounds))
        query = f'[out:json][timeout:90];nwr[amenity~"^(parking|parking_space|motorcycle_parking)$"]({bbox});out meta center geom;'
        relative = f'datasets/india/2026-09-25/{city}-osm.json'
        if not (ROOT / relative).exists():
            archive('https://overpass.private.coffee/api/interpreter?' + urlencode({'data': query}), relative)
        data = json.loads((ROOT / relative).read_text())
        if 'remark' in data:
            raise RuntimeError(data['remark'])
        print(city, len(data['elements']), 'features', flush=True)
