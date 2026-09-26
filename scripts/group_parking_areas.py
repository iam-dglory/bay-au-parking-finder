"""Group mapped off-street spaces by source polygon, never by proximity.

Keep every record for provenance. The client displays the parent facility rather
than treating its mapped spaces as independently observable street bays.
"""
import collections
import math
from build_india_catalog import inside, point

OFF_STREET = {'surface', 'multi-storey', 'underground', 'rooftop', 'garage', 'carports', 'sheds'}


def covers(p, ring):
    """Include shared boundaries with <=0.12m coordinate-rounding tolerance.

    OSM bay and facility vertices can differ by centimetres at a shared edge.
    This tolerance cannot encompass a bay across an aisle or adjacent street.
    """
    if inside(p, ring):
        return True
    lat, lng = p
    for a, b in zip(ring, ring[1:] + ring[:1]):
        dy = b['lat'] - a['lat']; dx = b['lon'] - a['lon']
        length2 = dy * dy + dx * dx
        if not length2:
            continue
        t = ((lat - a['lat']) * dy + (lng - a['lon']) * dx) / length2
        if 0 <= t <= 1 and (lat - a['lat'] - t * dy) ** 2 + (lng - a['lon'] - t * dx) ** 2 <= 1e-12:
            return True
    return False


def group_parking_spaces(records, elements):
    by_id = {r['id']: r for r in records}
    grid = collections.defaultdict(list)
    for e in elements:
        tags = e.get('tags', {})
        ring = e.get('geometry', [])
        identifier = f"osm:{e['type']}:{e['id']}"
        if (e['type'] != 'way' or tags.get('amenity') != 'parking'
                or tags.get('parking') not in OFF_STREET or identifier not in by_id
                or len(ring) < 4 or ring[0] != ring[-1]):
            continue
        lat = [v['lat'] for v in ring]; lng = [v['lon'] for v in ring]
        bounds = (min(lat), max(lat), min(lng), max(lng))
        for x in range(math.floor(bounds[0] / .01), math.floor(bounds[1] / .01) + 1):
            for y in range(math.floor(bounds[2] / .01), math.floor(bounds[3] / .01) + 1):
                grid[x, y].append((identifier, ring, bounds, tags))
    matches = []
    for e in elements:
        tags = e.get('tags', {})
        identifier = f"osm:{e['type']}:{e['id']}"
        p = point(e)
        if tags.get('amenity') != 'parking_space' or identifier not in by_id or not p:
            continue
        # All corners must lie inside; crossing a boundary is not a safe match.
        points = [(v['lat'], v['lon']) for v in e.get('geometry', [])] or [p]
        candidates = []
        for parent, ring, bounds, parent_tags in grid[math.floor(p[0] / .01), math.floor(p[1] / .01)]:
            if any(tags.get(k, '0') != parent_tags.get(k, '0') for k in ('layer', 'level')):
                continue
            if all(covers(v, ring) for v in points):
                candidates.append(((bounds[1] - bounds[0]) * (bounds[3] - bounds[2]), parent))
        if not candidates:
            continue
        parent = min(candidates)[1]
        by_id[identifier]['parent_area_id'] = parent
        by_id[parent]['mapped_bay_count'] = by_id[parent].get('mapped_bay_count', 0) + 1
        matches.append({'space_id': identifier, 'parent_area_id': parent, 'method': 'full_geometry_containment_same_level', 'boundary_rounding_tolerance_degrees': 1e-6})
    return matches
