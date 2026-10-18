//#region src/lib/distance.ts
var EARTH_RADIUS_M = 6371e3;
/** Great-circle distance in metres between two lat/lng points. */
function haversineMeters(a, b) {
	const toRad = (deg) => deg * Math.PI / 180;
	const dLat = toRad(b.lat - a.lat);
	const dLng = toRad(b.lng - a.lng);
	const lat1 = toRad(a.lat);
	const lat2 = toRad(b.lat);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
	return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}
//#endregion
//#region src/lib/melbourneSensors.ts
var MELBOURNE_SENSOR_SOURCE = "https://data.melbourne.vic.gov.au/explore/dataset/on-street-parking-bay-sensors/";
function isMelbourneSearch(lat, lng) {
	return lat >= -38.5 && lat <= -37.3 && lng >= 144.3 && lng <= 145.7;
}
async function fetchMelbourneSensors(lat, lng, radius) {
	if (!isMelbourneSearch(lat, lng)) return [];
	const params = new URLSearchParams({ where: `within_distance(location, GEOM'POINT(${lng} ${lat})', ${radius}m)` });
	const response = await fetch(`https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/on-street-parking-bay-sensors/exports/json?${params}`, {
		cache: "no-store",
		signal: AbortSignal.timeout(12e3)
	});
	if (!response.ok) throw new Error("Council availability feed could not refresh.");
	const rows = await response.json();
	if (!Array.isArray(rows)) throw new Error("Council availability feed returned an unexpected response.");
	return rows;
}
/** Join only the council's own identifiers. Never guess the adjacent bay.
* Supplemental sensor locations are published council points, not invented bays. */
function mergeMelbourneSensors(spots, sensors, center, syncedAt) {
	const byId = /* @__PURE__ */ new Map();
	for (const row of sensors) {
		if (!Number.isInteger(row.kerbsideid) || !Number.isFinite(row.location?.lat) || !Number.isFinite(row.location?.lon) || !isMelbourneSearch(row.location.lat, row.location.lon) || !Number.isFinite(Date.parse(row.lastupdated))) continue;
		const previous = byId.get(String(row.kerbsideid));
		if (!previous || Date.parse(row.lastupdated) > Date.parse(previous.lastupdated)) byId.set(String(row.kerbsideid), row);
	}
	const reading = (row) => {
		if (!["Present", "Unoccupied"].includes(row.status_description)) return null;
		return {
			status: row.status_description === "Present" ? "present" : "unoccupied",
			sensor_kerbside_id: String(row.kerbsideid),
			status_timestamp: row.status_timestamp,
			last_confirmed_at: row.lastupdated,
			synced_at: syncedAt,
			match_method: "kerbside_id"
		};
	};
	const matched = /* @__PURE__ */ new Set();
	const closest = /* @__PURE__ */ new Map();
	for (const spot of spots) {
		const row = spot.kerbside_id ? byId.get(spot.kerbside_id) : void 0;
		if (!row || haversineMeters(spot, {
			lat: row.location.lat,
			lng: row.location.lon
		}) > 15) continue;
		const current = closest.get(spot.kerbside_id);
		if (!current || haversineMeters(spot, {
			lat: row.location.lat,
			lng: row.location.lon
		}) < haversineMeters(current, {
			lat: row.location.lat,
			lng: row.location.lon
		})) closest.set(spot.kerbside_id, spot);
	}
	const result = spots.filter((spot) => {
		return !(spot.kerbside_id ? byId.get(spot.kerbside_id) : void 0) || closest.get(spot.kerbside_id)?.id === spot.id;
	}).map((spot) => {
		const row = spot.kerbside_id ? byId.get(spot.kerbside_id) : void 0;
		if (!row || closest.get(spot.kerbside_id)?.id !== spot.id) return {
			...spot,
			sensor_status: null
		};
		matched.add(String(row.kerbsideid));
		return {
			...spot,
			sensor_status: reading(row)
		};
	});
	for (const [id, row] of byId) {
		if (matched.has(id)) continue;
		const lat = row.location.lat, lng = row.location.lon;
		result.push({
			id: `council-sensor:${id}`,
			address_text: `Council parking bay · ${id}`,
			suburb: "Melbourne",
			state: "VIC",
			country: "Australia",
			lat,
			lng,
			distance_m: haversineMeters(center, {
				lat,
				lng
			}),
			created_by: "council",
			photo_url: null,
			moderation_status: "approved",
			kerbside_id: id,
			rules: [],
			latest_ping: null,
			sensor_status: reading(row)
		});
	}
	return result.sort((a, b) => a.distance_m - b.distance_m);
}
//#endregion
export { haversineMeters as a, mergeMelbourneSensors as i, fetchMelbourneSensors as n, isMelbourneSearch as r, MELBOURNE_SENSOR_SOURCE as t };
