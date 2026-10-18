import { a as __toESM, n as createLucideIcon, r as require_react, t as require_jsx_runtime } from "./jsx-runtime-DNksDsTP.js";
import { c as Bookmark, i as evaluateSpotStatus, o as House, r as SpotCard, s as BriefcaseBusiness, t as SpotDetailSheet } from "./SpotDetailSheet-nXf-E0fN.js";
import { t as CalendarCheck2 } from "./calendar-check-2-W7SVB7oM.js";
import { t as ChevronRight } from "./chevron-right-BSo6PuBX.js";
import { t as CircleCheck } from "./circle-check-DF8hO2Ih.js";
import { t as Clock3 } from "./clock-3-Drd5zLsv.js";
import { t as MapPin } from "./map-pin-Bun7dCb_.js";
import { n as supabase } from "./supabaseClient-q-CJkvTi.js";
import { t as BrandMark } from "./BrandMark-Bo5nbxMG.js";
//#region ../bay-audit-4/node_modules/lucide-react/dist/esm/icons/file-text.mjs
/**
* @license lucide-react v1.47.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$3 = {
	name: "file-text",
	size: 24,
	node: [
		["path", {
			d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
			key: "1oefj6"
		}],
		["path", {
			d: "M14 2v5a1 1 0 0 0 1 1h5",
			key: "wfsgrz"
		}],
		["path", {
			d: "M10 9H8",
			key: "b1mrlr"
		}],
		["path", {
			d: "M16 13H8",
			key: "t4e002"
		}],
		["path", {
			d: "M16 17H8",
			key: "z1uh3a"
		}]
	]
};
__iconData$3.node;
var FileText = createLucideIcon(__iconData$3);
//#endregion
//#region ../bay-audit-4/node_modules/lucide-react/dist/esm/icons/headphones.mjs
/**
* @license lucide-react v1.47.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$2 = {
	name: "headphones",
	size: 24,
	node: [["path", {
		d: "M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3",
		key: "1xhozi"
	}]]
};
__iconData$2.node;
var Headphones = createLucideIcon(__iconData$2);
//#endregion
//#region ../bay-audit-4/node_modules/lucide-react/dist/esm/icons/image.mjs
/**
* @license lucide-react v1.47.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$1 = {
	name: "image",
	size: 24,
	node: [
		["rect", {
			width: "18",
			height: "18",
			x: "3",
			y: "3",
			rx: "2",
			ry: "2",
			key: "1m3agn"
		}],
		["circle", {
			cx: "9",
			cy: "9",
			r: "2",
			key: "af1f0g"
		}],
		["path", {
			d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",
			key: "1xmnt7"
		}]
	]
};
__iconData$1.node;
var Image = createLucideIcon(__iconData$1);
//#endregion
//#region ../bay-audit-4/node_modules/lucide-react/dist/esm/icons/message-square-plus.mjs
/**
* @license lucide-react v1.47.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData = {
	name: "message-square-plus",
	size: 24,
	node: [
		["path", {
			d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",
			key: "18887p"
		}],
		["path", {
			d: "M12 8v6",
			key: "1ib9pf"
		}],
		["path", {
			d: "M9 11h6",
			key: "1fldmi"
		}]
	]
};
__iconData.node;
var MessageSquarePlus = createLucideIcon(__iconData);
//#endregion
//#region src/pages/MyActivity.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function formatWhen(iso) {
	return new Date(iso).toLocaleString("en-AU", {
		weekday: "short",
		day: "numeric",
		month: "short",
		hour: "numeric",
		minute: "2-digit"
	});
}
var MODERATION_BADGE = {
	pending: {
		icon: Clock3,
		text: "Pending review",
		className: "bg-amber-100 text-amber-700"
	},
	approved: {
		icon: CircleCheck,
		text: "Published on the map",
		className: "bg-emerald-100 text-emerald-700"
	},
	rejected: {
		icon: Image,
		text: "Update the photo to match the sign",
		className: "bg-amber-100 text-amber-700"
	}
};
function MyActivity({ center, savedLocations, onOpenFeedback, onAddSign }) {
	const [visits, setVisits] = (0, import_react.useState)([]);
	const [signs, setSigns] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [selectedSign, setSelectedSign] = (0, import_react.useState)(null);
	async function load() {
		setLoading(true);
		const { data: userData } = await supabase.auth.getUser();
		const userId = userData.user?.id;
		if (!userId) {
			setLoading(false);
			return;
		}
		const [visitsRes, signsRes] = await Promise.all([supabase.from("spot_visits").select("*").eq("user_id", userId).order("visited_at", { ascending: false }).limit(20), supabase.from("parking_spots").select("id, address_text, suburb, state, country, lat, lng, created_by, photo_url, moderation_status, kerbside_id, parking_rules(*)").eq("created_by", userId).order("created_at", { ascending: false })]);
		setVisits(visitsRes.data ?? []);
		setSigns((signsRes.data ?? []).map((row) => {
			const spot = {
				id: row.id,
				address_text: row.address_text,
				suburb: row.suburb,
				state: row.state,
				country: row.country,
				lat: row.lat,
				lng: row.lng,
				distance_m: 0,
				created_by: row.created_by,
				photo_url: row.photo_url,
				moderation_status: row.moderation_status,
				kerbside_id: row.kerbside_id ?? null,
				rules: row.parking_rules ?? [],
				latest_ping: null,
				sensor_status: null
			};
			return {
				...spot,
				status: evaluateSpotStatus(spot.rules, spot.lat, spot.lng)
			};
		}));
		setLoading(false);
	}
	(0, import_react.useEffect)(() => {
		load();
	}, [center.lat, center.lng]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "h-full overflow-y-auto bg-[#f7faff] pb-6 text-[#0b1730]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "relative overflow-hidden px-5 pb-7 pt-[max(1.25rem,env(safe-area-inset-top))]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -right-16 top-5 h-48 w-48 rounded-full bg-blue-100/70 blur-3xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandMark, { className: "w-[94px]" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-8 text-[11px] font-bold uppercase tracking-[.18em] text-[#1769ff]",
							children: "Your Bay"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-2 text-4xl font-bold tracking-[-.055em]",
							children: "My activity"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 max-w-sm text-base leading-6 text-[#64748b]",
							children: "Your saved places, parking history and signs you’ve contributed."
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4 px-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { className: "h-5 w-5" }),
						title: "Saved places",
						detail: "Locations you’ve saved for quick access.",
						children: savedLocations.home || savedLocations.work ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 space-y-2",
							children: [savedLocations.home && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SavedPlace, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "h-5 w-5" }),
								label: "Home",
								value: savedLocations.home.label
							}), savedLocations.work && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SavedPlace, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BriefcaseBusiness, { className: "h-5 w-5" }),
								label: "Work",
								value: savedLocations.work.label
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyText, { children: "No saved places yet. Save home or work from the map bookmark." })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarCheck2, { className: "h-5 w-5" }),
						title: "My bookings",
						detail: "Confirmed parking reservations will appear here.",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 rounded-2xl bg-[#f7faff] px-4 py-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: "No verified Bay bookings yet"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm leading-5 text-[#64748b]",
								children: "Bay only records a booking after an operator accepts it and payment is confirmed."
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, { className: "h-5 w-5" }),
						title: "Parking history",
						detail: "Places you’ve opened directions to.",
						children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-sm text-[#64748b]",
							children: "Loading your activity…"
						}) : visits.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyText, { children: "Directions you open will appear here." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 divide-y divide-[#eef2f7]",
							children: visits.map((visit) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3 py-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1769ff]",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-5 w-5" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "min-w-0 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block truncate text-sm font-bold",
											children: visit.address_text
										}), visit.country && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block truncate text-xs text-[#64748b]",
											children: visit.country
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "max-w-20 text-right text-[11px] leading-4 text-[#94a3b8]",
										children: formatWhen(visit.visited_at)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4 text-[#94a3b8]" })
								]
							}, visit.id))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-5 w-5" }),
						title: "Signs I’ve reported",
						detail: "Your contributions keep parking information useful.",
						children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-sm text-[#64748b]",
							children: "Loading your reports…"
						}) : signs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 rounded-2xl bg-[#f7faff] px-4 py-5 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "mx-auto h-8 w-8 text-[#1769ff]" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 font-semibold",
									children: "No signs reported yet"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm leading-5 text-[#64748b]",
									children: "Add a photo of a parking sign when you see one."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: onAddSign,
									className: "mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#1769ff] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20",
									children: "Add a sign"
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 space-y-3",
							children: signs.map((spot) => {
								const badge = MODERATION_BADGE[spot.moderation_status];
								const Icon = badge.icon;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-3 w-3" }), badge.text]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpotCard, {
										spot,
										onClick: () => setSelectedSign(spot)
									})]
								}, spot.id);
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: onOpenFeedback,
						className: "flex w-full items-center gap-3 rounded-2xl border border-[#dce7f8] bg-white p-4 text-left shadow-[0_12px_30px_rgba(37,99,235,.06)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1769ff]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Headphones, { className: "h-5 w-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-sm font-bold",
									children: "App support"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-xs text-[#64748b]",
									children: "Get help or tell us what needs fixing."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquarePlus, { className: "h-5 w-5 text-[#64748b]" })
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpotDetailSheet, {
				spot: selectedSign,
				onClose: () => setSelectedSign(null)
			})
		]
	});
}
function SectionCard({ icon, title, detail, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-[26px] border border-[#dce7f8] bg-white p-5 shadow-[0_12px_30px_rgba(37,99,235,.06)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1769ff]",
				children: icon
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-bold tracking-tight",
				children: title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 text-sm text-[#64748b]",
				children: detail
			})] })]
		}), children]
	});
}
function EmptyText({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-4 rounded-2xl bg-[#f7faff] px-4 py-4 text-sm leading-5 text-[#64748b]",
		children
	});
}
function SavedPlace({ icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 rounded-2xl border border-[#e6edf8] bg-[#fbfdff] px-3 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[#1769ff]",
				children: icon
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-sm font-bold",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block truncate text-xs text-[#64748b]",
					children: value
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4 text-[#94a3b8]" })
		]
	});
}
//#endregion
export { MyActivity };
