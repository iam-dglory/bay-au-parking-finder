var ON_ARRIVAL = {
	state: "unknown",
	label: "Availability on arrival",
	color: "#64748b"
};
function fresh(iso, now, limit) {
	const minutes = iso ? (now.getTime() - Date.parse(iso)) / 6e4 : NaN;
	return Number.isFinite(minutes) && minutes >= 0 && minutes <= limit;
}
/** Vacancy requires a fresh, exact council ID match. A tap by a driver is a
* short-lived observation, not a live feed; it never overrides the sensor. */
function availability(spot, now = /* @__PURE__ */ new Date()) {
	const sensor = spot.sensor_status;
	const exactId = Boolean(spot.kerbside_id && sensor?.match_method === "kerbside_id" && (sensor.sensor_kerbside_id != null ? String(sensor.sensor_kerbside_id) === spot.kerbside_id : sensor.match_method === "kerbside_id"));
	if (!sensor || !exactId || !["present", "unoccupied"].includes(sensor.status) || !fresh(sensor.last_confirmed_at, now, 5) || !fresh(sensor.synced_at, now, 5)) return ON_ARRIVAL;
	const state = sensor.status === "present" ? "occupied" : "vacant";
	return {
		state,
		label: state === "occupied" ? "Occupied now" : "Vacant now",
		color: state === "occupied" ? "#e11d48" : "#059669"
	};
}
//#endregion
export { availability as t };
