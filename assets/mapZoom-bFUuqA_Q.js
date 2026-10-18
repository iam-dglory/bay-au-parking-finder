import { a as __toESM, n as createLucideIcon, r as require_react } from "./jsx-runtime-DNksDsTP.js";
import { n as supabase } from "./supabaseClient-q-CJkvTi.js";
import { a as haversineMeters, r as isMelbourneSearch } from "./melbourneSensors-BZ1Lg3xp.js";
//#region ../bay-audit-4/node_modules/lucide-react/dist/esm/icons/external-link.mjs
/**
* @license lucide-react v1.47.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData = {
	name: "external-link",
	size: 24,
	node: [
		["path", {
			d: "M15 3h6v6",
			key: "1q9fwt"
		}],
		["path", {
			d: "M10 14 21 3",
			key: "gplh6r"
		}],
		["path", {
			d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
			key: "a6xqqp"
		}]
	]
};
__iconData.node;
var ExternalLink = createLucideIcon(__iconData);
//#endregion
//#region src/lib/nationalParking.ts
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var indexes = /* @__PURE__ */ new Map();
var tiles$1 = /* @__PURE__ */ new Map();
async function readTile(path) {
	const response = await fetch(`./data/${path}`, { signal: AbortSignal.timeout(12e3) });
	if (!response.ok) throw new Error("Mapped parking locations could not load. Please refresh.");
	const payload = await response.arrayBuffer();
	const bytes = new Uint8Array(payload);
	const compressed = bytes[0] === 31 && bytes[1] === 139;
	if (compressed && typeof DecompressionStream === "undefined") throw new Error("This browser cannot read the parking catalog. Please update your browser.");
	const text = compressed ? await new Response(new Blob([payload]).stream().pipeThrough(new DecompressionStream("gzip"))).text() : new TextDecoder().decode(payload);
	return JSON.parse(text);
}
function indexFor(country) {
	if (!indexes.has(country)) indexes.set(country, fetch(`./data/${country}/index.json`, { signal: AbortSignal.timeout(12e3) }).then(async (response) => {
		if (!response.ok) throw new Error("Parking coverage could not load. Please refresh.");
		const index = await response.json();
		if (!(index.tile_size > 0) || !Array.isArray(index.tiles)) throw new Error("Parking coverage index is invalid.");
		return index;
	}).catch((error) => {
		indexes.delete(country);
		throw error;
	}));
	return indexes.get(country);
}
function isAustraliaSearch(lat, lng) {
	return lat >= -55 && lat <= -8 && lng >= 95 && lng <= 170;
}
async function nationalNearby(country, lat, lng, radius) {
	const index = await indexFor(country);
	const known = new Set(index.tiles);
	const latDelta = radius / 111e3;
	const lngDelta = radius / Math.max(1e4, 111e3 * Math.cos(lat * Math.PI / 180));
	const wanted = [];
	for (let x = Math.floor((lat - latDelta) / index.tile_size); x <= Math.floor((lat + latDelta) / index.tile_size); x++) for (let y = Math.floor((lng - lngDelta) / index.tile_size); y <= Math.floor((lng + lngDelta) / index.tile_size); y++) {
		const tile = `${x}_${y}`;
		if (known.has(tile)) wanted.push(tile);
	}
	const results = await Promise.allSettled(wanted.map((tile) => {
		const key = `${country}/${tile}`;
		if (!tiles$1.has(key)) tiles$1.set(key, readTile(`${country}/${tile}.json.gz`).catch((error) => {
			tiles$1.delete(key);
			throw error;
		}));
		return tiles$1.get(key);
	}));
	for (const key of tiles$1.keys()) if (key.startsWith(`${country}/`) && !wanted.includes(key.slice(country.length + 1))) tiles$1.delete(key);
	const rows = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
	if (wanted.length && rows.length === 0 && results.every((result) => result.status === "rejected")) throw new Error("Mapped parking locations could not load. Please refresh.");
	return rows.filter((row) => !row.parent_area_id).map((row) => ({
		...row,
		distance_m: haversineMeters({
			lat,
			lng
		}, row)
	})).filter((row) => row.distance_m <= radius).sort((a, b) => a.distance_m - b.distance_m);
}
//#endregion
//#region src/lib/indiaParking.ts
var legacyCatalog;
function isIndiaSearch(lat, lng) {
	return lat >= 6 && lat <= 37.5 && lng >= 68 && lng <= 98.5;
}
function nearbyCatalog(records, lat, lng, radius) {
	return records.filter((row) => !row.parent_area_id).map((row) => ({
		...row,
		distance_m: haversineMeters({
			lat,
			lng
		}, row)
	})).filter((row) => row.distance_m <= radius).sort((a, b) => a.distance_m - b.distance_m);
}
/** Guard the published client catalog too, not just the import script. A bad
* cached or future row is excluded rather than being sent to a driver. */
function isUsableIndiaRecord(row) {
	if (row.country !== "IN" || !Number.isFinite(row.lat) || !Number.isFinite(row.lng)) return false;
	if (!isIndiaSearch(row.lat, row.lng) || !row.state || !row.id || !row.address_text || !row.source_url || !row.source_name) return false;
	if ([
		"private",
		"no",
		"permit",
		"delivery",
		"emergency",
		"agricultural",
		"forestry"
	].includes(row.access ?? "")) return false;
	if (row.tariffs?.length && (!row.pricing_source_url || !row.pricing_checked_at || row.tariffs.some((tariff) => !Number.isFinite(tariff.amount) || tariff.amount < 0))) return false;
	return true;
}
async function legacyIndiaNearby(lat, lng, radius) {
	legacyCatalog ??= fetch(`./data/india-parking.json`, { signal: AbortSignal.timeout(12e3) }).then(async (response) => {
		if (!response.ok) throw new Error("India parking locations could not be loaded. Please refresh.");
		return response.json();
	}).catch((error) => {
		legacyCatalog = void 0;
		throw error;
	});
	return nearbyCatalog((await legacyCatalog).records.filter(isUsableIndiaRecord), lat, lng, radius);
}
async function indiaNearby(lat, lng, radius) {
	if (!isIndiaSearch(lat, lng)) return [];
	try {
		return (await nationalNearby("india", lat, lng, radius)).filter(isUsableIndiaRecord);
	} catch {
		return legacyIndiaNearby(lat, lng, radius);
	}
}
function catalogSpot(row) {
	return {
		...row,
		country: row.country ?? "IN",
		state: null,
		created_by: "catalog",
		photo_url: null,
		moderation_status: "approved",
		kerbside_id: null,
		rules: [],
		latest_ping: null,
		sensor_status: null,
		catalog: row
	};
}
//#endregion
//#region src/lib/usaParking.ts
var index$1;
var loaded = /* @__PURE__ */ new Map();
var sfIndex;
var sfLoaded = /* @__PURE__ */ new Map();
function isSanFrancisco(lat, lng) {
	return lat > 37.6 && lat < 37.85 && lng > -122.55 && lng < -122.3;
}
async function readCompressedTile(path) {
	const response = await fetch(`./data/${path}`, { signal: AbortSignal.timeout(12e3) });
	if (!response.ok) throw new Error("Mapped US parking locations could not load. Please refresh.");
	const payload = await response.arrayBuffer();
	const bytes = new Uint8Array(payload);
	const compressed = bytes[0] === 31 && bytes[1] === 139;
	if (compressed && typeof DecompressionStream === "undefined") throw new Error("This browser cannot read the US parking catalog. Please update your browser.");
	const text = compressed ? await new Response(new Blob([payload]).stream().pipeThrough(new DecompressionStream("gzip"))).text() : new TextDecoder().decode(payload);
	return JSON.parse(text);
}
async function sfMeterNearby(lat, lng, radius) {
	if (!isSanFrancisco(lat, lng)) return [];
	sfIndex ??= fetch(`./data/sf-meters/index.json`, { signal: AbortSignal.timeout(12e3) }).then(async (response) => {
		if (!response.ok) throw new Error("San Francisco meter locations could not load.");
		return response.json();
	}).catch((error) => {
		sfIndex = void 0;
		throw error;
	});
	const { tile_size: size, tiles } = await sfIndex;
	const known = new Set(tiles);
	const latDelta = radius / 111e3;
	const lngDelta = radius / Math.max(1e4, 111e3 * Math.cos(lat * Math.PI / 180));
	const wanted = [];
	for (let x = Math.floor((lat - latDelta) / size); x <= Math.floor((lat + latDelta) / size); x++) for (let y = Math.floor((lng - lngDelta) / size); y <= Math.floor((lng + lngDelta) / size); y++) {
		const key = `${x}_${y}`;
		if (known.has(key)) wanted.push(key);
	}
	const rows = await Promise.all(wanted.map((key) => {
		if (!sfLoaded.has(key)) sfLoaded.set(key, readCompressedTile(`sf-meters/${key}.json.gz`).catch((error) => {
			sfLoaded.delete(key);
			throw error;
		}));
		return sfLoaded.get(key);
	}));
	for (const key of sfLoaded.keys()) if (!wanted.includes(key)) sfLoaded.delete(key);
	return nearbyCatalog(rows.flat(), lat, lng, radius);
}
/** Routing bounds only. Actual coverage comes from the archived state tiles. */
function isUSSearch(lat, lng) {
	return lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66 || lat >= 51 && lat <= 72 && lng >= -180 && lng <= -129 || lat >= -18 && lat <= 30 && lng >= -180 && lng <= -154 || lat >= 17 && lat <= 19 && lng >= -68 && lng <= -64 || lat >= 0 && lat <= 25 && lng >= 140 && lng <= 175;
}
async function tileIndex() {
	index$1 ??= fetch(`./data/usa/index.json`, { signal: AbortSignal.timeout(12e3) }).then(async (response) => {
		if (!response.ok) throw new Error("US parking locations could not load. Please refresh.");
		const data = await response.json();
		const byTile = /* @__PURE__ */ new Map();
		for (const [state, keys] of Object.entries(data.states)) for (const key of keys) byTile.set(key, [...byTile.get(key) ?? [], state]);
		if (!(data.tile_size > 0)) throw new Error("US parking tile index is invalid.");
		return {
			size: data.tile_size,
			byTile
		};
	}).catch((error) => {
		index$1 = void 0;
		throw error;
	});
	return index$1;
}
async function usaNearby(lat, lng, radius) {
	if (!isUSSearch(lat, lng)) return [];
	const { size, byTile } = await tileIndex();
	const latDelta = radius / 111e3;
	const lngDelta = radius / Math.max(1e4, 111e3 * Math.cos(lat * Math.PI / 180));
	const wanted = [];
	for (let x = Math.floor((lat - latDelta) / size); x <= Math.floor((lat + latDelta) / size); x++) for (let y = Math.floor((lng - lngDelta) / size); y <= Math.floor((lng + lngDelta) / size); y++) {
		const key = `${x}_${y}`;
		for (const state of byTile.get(key) ?? []) wanted.push(`${state}/${key}`);
	}
	const results = await Promise.allSettled(wanted.map((key) => {
		if (!loaded.has(key)) loaded.set(key, readCompressedTile(`usa/${key}.json.gz`).catch((error) => {
			loaded.delete(key);
			throw error;
		}));
		return loaded.get(key);
	}));
	for (const key of loaded.keys()) if (!wanted.includes(key)) loaded.delete(key);
	const rows = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
	if (wanted.length && rows.length === 0 && results.every((result) => result.status === "rejected")) throw new Error("Mapped US parking locations could not load. Please refresh.");
	const unique = /* @__PURE__ */ new Map();
	for (const row of rows) unique.set(row.id, row);
	const mapped = nearbyCatalog([...unique.values()], lat, lng, radius);
	const meters = await sfMeterNearby(lat, lng, radius).catch(() => []);
	return [...mapped, ...meters].sort((a, b) => a.distance_m - b.distance_m);
}
//#endregion
//#region src/lib/regionalParking.ts
var index;
var tiles = /* @__PURE__ */ new Map();
async function json(path) {
	const response = await fetch(`./data/${path}`, { signal: AbortSignal.timeout(12e3) });
	if (!response.ok) throw new Error("Mapped parking locations could not load. Please refresh.");
	return response.json();
}
async function regionalNearby(lat, lng, radius) {
	if (!isMelbourneSearch(lat, lng)) {
		if (isAustraliaSearch(lat, lng)) return nationalNearby("australia", lat, lng, radius);
		return (await indiaNearby(lat, lng, radius)).concat(await usaNearby(lat, lng, radius));
	}
	index ??= json("melbourne/index.json").catch((error) => {
		index = void 0;
		throw error;
	});
	const meta = await index;
	const latDelta = radius / 111e3, lngDelta = radius / (111e3 * Math.cos(lat * Math.PI / 180));
	const wanted = [], known = new Set(meta.tiles);
	for (let x = Math.floor((lat - latDelta) / meta.tile_size); x <= Math.floor((lat + latDelta) / meta.tile_size); x++) for (let y = Math.floor((lng - lngDelta) / meta.tile_size); y <= Math.floor((lng + lngDelta) / meta.tile_size); y++) {
		const key = `${x}_${y}`;
		if (known.has(key)) wanted.push(key);
	}
	const results = await Promise.allSettled(wanted.map((key) => {
		if (!tiles.has(key)) tiles.set(key, json(`melbourne/${key}.json`).catch((error) => {
			tiles.delete(key);
			throw error;
		}));
		return tiles.get(key);
	}));
	for (const key of tiles.keys()) if (!wanted.includes(key)) tiles.delete(key);
	const rows = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
	if (wanted.length && rows.length === 0 && results.every((result) => result.status === "rejected")) throw new Error("Mapped parking locations could not load. Please refresh.");
	return nearbyCatalog(rows, lat, lng, radius);
}
/** Remove only co-located catalog bays. This is visual deduplication, never
* a sensor or sign assignment: council evidence remains attached to its ID. */
function mergeMappedBays(remote, local) {
	const grid = /* @__PURE__ */ new Map();
	const key = (lat, lng) => `${Math.floor(lat / 4e-5)}_${Math.floor(lng / 4e-5)}`;
	for (const spot of remote) {
		const k = key(spot.lat, spot.lng);
		grid.set(k, [...grid.get(k) ?? [], spot]);
	}
	return [...remote, ...local.filter((spot) => {
		const x = Math.floor(spot.lat / 4e-5), y = Math.floor(spot.lng / 4e-5);
		for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if ((grid.get(`${x + dx}_${y + dy}`) ?? []).some((other) => haversineMeters(spot, other) <= 2)) return false;
		return true;
	})].sort((a, b) => a.distance_m - b.distance_m);
}
/** Only explicit, reviewed census/operator aliases are replaced. A nearby car
* park is not evidence that two facilities are the same. Preserve the census
* fallback if its current operator record could not load. */
function mergeParkingAreas(census, local) {
	const areas = local.filter((row) => row.kind === "area" && !row.parent_area_id);
	return [...census.filter((row) => !areas.some((area) => row.census_year != null && row.census_year <= 2024 && area.census_aliases?.includes(row.address_text) && haversineMeters(row, area) <= 150)), ...areas].sort((a, b) => a.distance_m - b.distance_m);
}
//#endregion
//#region src/lib/useNearbyCarParks.ts
/** Keep census/operator areas separate from individual bays. The regional
* layer fetches geographic tiles; Home pages the combined display. */
function useNearbyCarParks(center, radiusM, enabled) {
	const [carParks, setCarParks] = (0, import_react.useState)([]);
	const [error, setError] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const sequence = (0, import_react.useRef)(0);
	const lat = center?.lat;
	const lng = center?.lng;
	const refresh = (0, import_react.useCallback)(async () => {
		const request = ++sequence.current;
		setCarParks([]);
		setError(null);
		if (lat == null || lng == null || !enabled) {
			setCarParks([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		const [remote, local] = await Promise.allSettled([isUSSearch(lat, lng) || isIndiaSearch(lat, lng) || isAustraliaSearch(lat, lng) ? Promise.resolve({
			data: [],
			error: null
		}) : supabase.rpc("nearby_car_parks", {
			p_lat: lat,
			p_lng: lng,
			p_radius_m: radiusM
		}).abortSignal(AbortSignal.timeout(15e3)), regionalNearby(lat, lng, radiusM)]);
		if (request !== sequence.current) return;
		const rpcOk = remote.status === "fulfilled" && !remote.value.error;
		const rows = mergeParkingAreas(rpcOk ? remote.value.data ?? [] : [], local.status === "fulfilled" ? local.value : []);
		setCarParks(rows);
		setError(rows.length === 0 && !rpcOk && local.status === "rejected" ? "Parking areas are unavailable right now." : null);
		setLoading(false);
	}, [
		lat,
		lng,
		radiusM,
		enabled
	]);
	(0, import_react.useEffect)(() => {
		refresh();
		return () => {
			sequence.current++;
		};
	}, [refresh]);
	return {
		carParks,
		error,
		loading,
		refresh
	};
}
//#endregion
//#region src/lib/mapZoom.ts
function zoomForRadius(radiusM) {
	return radiusM <= 500 ? 16 : radiusM <= 1e3 ? 15 : radiusM <= 2e3 ? 14 : 13;
}
/**
* A driver can freely zoom the map out to explore a surrounding suburb. Keep
* the requested map data in step with that view instead of leaving an empty
* map outside the last radius chip. The chips still describe the closest
* search; this is only the extra data needed to make zooming useful.
*/
function coverageRadiusForZoom(zoom) {
	if (zoom <= 11) return 2e4;
	if (zoom <= 12) return 1e4;
	if (zoom <= 13) return 5e3;
	if (zoom <= 14) return 2e3;
	if (zoom <= 15) return 1e3;
	return 500;
}
//#endregion
export { regionalNearby as a, isIndiaSearch as c, mergeMappedBays as i, isAustraliaSearch as l, zoomForRadius as n, isUSSearch as o, useNearbyCarParks as r, catalogSpot as s, coverageRadiusForZoom as t, ExternalLink as u };
