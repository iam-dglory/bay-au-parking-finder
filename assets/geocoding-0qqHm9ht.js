//#region src/lib/geocoding.ts
/** Best-effort country detection from a dropped pin, via OpenStreetMap's free
* Nominatim API (same data source as our map tiles, no key required). Never
* throws — callers should treat `null` as "ask the user instead". */
async function detectCountry(lat, lng) {
	try {
		const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=3&addressdetails=1`;
		const res = await fetch(url, {
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(8e3)
		});
		if (!res.ok) return null;
		return (await res.json())?.address?.country ?? null;
	} catch {
		return null;
	}
}
/** Turns a raw GPS fix into a readable label like "88 Spencer Street,
* Melbourne" instead of showing the coordinates or a placeholder like "you".
* Falls back gracefully (street only, then suburb only, then null) since not
* every point resolves to a full street address. */
async function reverseGeocodeLabel(lat, lng) {
	try {
		const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
		const res = await fetch(url, {
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(8e3)
		});
		if (!res.ok) return null;
		const a = (await res.json())?.address;
		if (!a) return null;
		const street = [a.house_number, a.road].filter(Boolean).join(" ");
		const place = a.suburb || a.city || a.town || a.village || a.county;
		if (street && place) return `${street}, ${place}`;
		return street || place || null;
	} catch {
		return null;
	}
}
function normalize(s) {
	return s.trim().toLowerCase();
}
/** Live city/suburb search scoped to a country (ISO 3166-1 alpha-2 code) and,
* when given, a state/region name — via Nominatim. Used instead of bundling a
* full worldwide city dataset, which would add several megabytes to the app
* for data that goes stale anyway.
*
* Nominatim doesn't let free-text `q` be combined with a structured `state`
* filter, so the state name is folded into the query text instead (which also
* improves its own text-matching/ranking), and results are then strictly
* filtered to that state — otherwise, picking "New South Wales" and typing a
* Victorian suburb would still surface Victorian results. */
async function searchCities(query, countryCode, stateName, online = false) {
	if (!query.trim()) return [];
	const supportedCities = [
		{
			name: "Melbourne",
			stateName: "Victoria",
			country: "AU",
			lat: -37.8136,
			lng: 144.9631
		},
		{
			name: "Chennai",
			stateName: "Tamil Nadu",
			country: "IN",
			lat: 13.0827,
			lng: 80.2707
		},
		{
			name: "Bengaluru",
			stateName: "Karnataka",
			country: "IN",
			lat: 12.9716,
			lng: 77.5946
		},
		{
			name: "Hyderabad",
			stateName: "Telangana",
			country: "IN",
			lat: 17.385,
			lng: 78.4867
		},
		{
			name: "New York",
			stateName: "New York",
			country: "US",
			lat: 40.7128,
			lng: -74.006
		},
		{
			name: "Los Angeles",
			stateName: "California",
			country: "US",
			lat: 34.0522,
			lng: -118.2437
		},
		{
			name: "Chicago",
			stateName: "Illinois",
			country: "US",
			lat: 41.8781,
			lng: -87.6298
		},
		{
			name: "Houston",
			stateName: "Texas",
			country: "US",
			lat: 29.7604,
			lng: -95.3698
		},
		{
			name: "San Francisco",
			stateName: "California",
			country: "US",
			lat: 37.7749,
			lng: -122.4194
		},
		{
			name: "Seattle",
			stateName: "Washington",
			country: "US",
			lat: 47.6062,
			lng: -122.3321
		},
		{
			name: "Washington",
			stateName: "District of Columbia",
			country: "US",
			lat: 38.9072,
			lng: -77.0369
		},
		{
			name: "Miami",
			stateName: "Florida",
			country: "US",
			lat: 25.7617,
			lng: -80.1918
		},
		{
			name: "Honolulu",
			stateName: "Hawaii",
			country: "US",
			lat: 21.3099,
			lng: -157.8581
		},
		{
			name: "Anchorage",
			stateName: "Alaska",
			country: "US",
			lat: 61.2181,
			lng: -149.9003
		}
	];
	const typed = normalize(query);
	const local = supportedCities.filter((city) => {
		const nameMatch = (city.name === "Bengaluru" ? ["bengaluru", "bangalore"] : [normalize(city.name)]).some((name) => name.includes(typed) || typed.includes(name));
		const stateMatch = !stateName || normalize(city.stateName ?? "") === normalize(stateName);
		return city.country === countryCode && nameMatch && stateMatch;
	});
	if (local.length || !online) return local;
	try {
		const q = stateName ? `${query}, ${stateName}` : query;
		const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&countrycodes=${countryCode.toLowerCase()}&addressdetails=1&limit=10`;
		const res = await fetch(url, {
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(8e3)
		});
		if (!res.ok) return local;
		const results = (await res.json() ?? []).filter((r) => r.lat && r.lon).map((r) => ({
			name: r.address?.city || r.address?.town || r.address?.village || r.address?.suburb || r.display_name.split(",")[0],
			stateName: r.address?.state || r.address?.state_district || "",
			lat: Number(r.lat),
			lng: Number(r.lon)
		}));
		const nameMatches = (r) => {
			const n = normalize(r.name);
			return n.includes(typed) || typed.includes(n);
		};
		const wanted = stateName ? normalize(stateName) : null;
		const stateMatches = (r) => !wanted || !!r.stateName && (normalize(r.stateName).includes(wanted) || wanted.includes(normalize(r.stateName)));
		const remote = results.filter((r) => nameMatches(r) && stateMatches(r));
		const unique = /* @__PURE__ */ new Map();
		for (const row of [...local, ...remote]) unique.set(`${normalize(row.name)}|${normalize(row.stateName ?? "")}`, row);
		return [...unique.values()].slice(0, 8);
	} catch {
		return local;
	}
}
/** Searches for a named place — a shopping centre, restaurant, landmark, exact
* address, anything — rather than a city/suburb, so someone can check parking
* near their destination before they set off. Softly biased toward `near`
* (typically the user's current search centre) without excluding real matches
* elsewhere, in case they're planning a trip somewhere else entirely. */
async function searchPlaces(query, near) {
	if (!query.trim()) return [];
	try {
		const params = new URLSearchParams({
			format: "jsonv2",
			q: query,
			addressdetails: "1",
			limit: "8"
		});
		if (near) {
			const delta = .5;
			params.set("viewbox", `${near.lng - delta},${near.lat + delta},${near.lng + delta},${near.lat - delta}`);
			params.set("bounded", "0");
		}
		const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(8e3)
		});
		if (!res.ok) return [];
		return (await res.json() ?? []).filter((r) => r.lat && r.lon && r.display_name).map((r) => {
			const parts = String(r.display_name).split(",").map((p) => p.trim());
			return {
				name: parts[0],
				address: parts.slice(1, 4).join(", "),
				lat: Number(r.lat),
				lng: Number(r.lon)
			};
		});
	} catch {
		return [];
	}
}
//#endregion
export { searchPlaces as i, reverseGeocodeLabel as n, searchCities as r, detectCountry as t };
