const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./MapView-BlipuX2V.js","./MapView-DLwO5otf.js","./jsx-runtime-DNksDsTP.js","./leaflet-src-Dc-ZD4n_.js","./availability-BIfWf5pU.js"])))=>i.map(i=>d[i]);
import { a as __toESM, n as createLucideIcon, r as require_react, t as require_jsx_runtime } from "./jsx-runtime-DNksDsTP.js";
import { a as evaluateSpotStatus, c as BriefcaseBusiness, i as SpotCard, l as Bookmark, n as ParkingAreaDetails, o as rankSpots, r as directionsUrl, s as House, t as SpotDetailSheet } from "./SpotDetailSheet-8zyemK_n.js";
import { t as ChevronRight } from "./chevron-right-BSo6PuBX.js";
import { t as Clock3 } from "./clock-3-Drd5zLsv.js";
import { a as regionalNearby, c as isIndiaSearch, i as mergeMappedBays, l as isAustraliaSearch, n as zoomForRadius, o as isUSSearch, r as useNearbyCarParks, s as catalogSpot, t as coverageRadiusForZoom, u as ExternalLink } from "./mapZoom-bFUuqA_Q.js";
import { n as Map$1, r as LocateFixed, t as Search } from "./search-ZSYPyVax.js";
import { t as MapPin } from "./map-pin-Bun7dCb_.js";
import { t as Navigation } from "./navigation-CLo9KBXI.js";
import { t as X } from "./x-BoaH4iK3.js";
import { n as supabase } from "./supabaseClient-q-CJkvTi.js";
import { i as searchPlaces } from "./geocoding-0qqHm9ht.js";
import { t as __vitePreload } from "./preload-helper-DHlaQ_oz.js";
import { t as BrandMark } from "./BrandMark-Bo5nbxMG.js";
import { t as availability } from "./availability-BIfWf5pU.js";
import { n as SIGN_TYPE_LABELS } from "./types-PVt8N4IJ.js";
import { i as mergeMelbourneSensors, n as fetchMelbourneSensors, r as isMelbourneSearch } from "./melbourneSensors-BZ1Lg3xp.js";
//#region ../bay-audit-4/node_modules/lucide-react/dist/esm/icons/badge-dollar-sign.mjs
/**
* @license lucide-react v1.47.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$8 = {
	name: "badge-dollar-sign",
	size: 24,
	node: [
		["path", {
			d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",
			key: "3c2336"
		}],
		["path", {
			d: "M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8",
			key: "1h4pet"
		}],
		["path", {
			d: "M12 18V6",
			key: "zqpxq5"
		}]
	]
};
__iconData$8.node;
var BadgeDollarSign = createLucideIcon(__iconData$8);
//#endregion
//#region ../bay-audit-4/node_modules/lucide-react/dist/esm/icons/car-front.mjs
/**
* @license lucide-react v1.47.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$7 = {
	name: "car-front",
	size: 24,
	node: [
		["path", {
			d: "m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8",
			key: "1imjwt"
		}],
		["path", {
			d: "M7 14h.01",
			key: "1qa3f1"
		}],
		["path", {
			d: "M17 14h.01",
			key: "7oqj8z"
		}],
		["rect", {
			width: "18",
			height: "8",
			x: "3",
			y: "10",
			rx: "2",
			key: "a7itu8"
		}],
		["path", {
			d: "M5 18v2",
			key: "ppbyun"
		}],
		["path", {
			d: "M19 18v2",
			key: "gy7782"
		}]
	]
};
__iconData$7.node;
var CarFront = createLucideIcon(__iconData$7);
//#endregion
//#region ../bay-audit-4/node_modules/lucide-react/dist/esm/icons/check.mjs
/**
* @license lucide-react v1.47.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$6 = {
	name: "check",
	size: 24,
	node: [["path", {
		d: "M20 6 9 17l-5-5",
		key: "1gmf2c"
	}]]
};
__iconData$6.node;
var Check = createLucideIcon(__iconData$6);
//#endregion
//#region ../bay-audit-4/node_modules/lucide-react/dist/esm/icons/circle-question-mark.mjs
/**
* @license lucide-react v1.47.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$5 = {
	name: "circle-question-mark",
	size: 24,
	node: [
		["circle", {
			cx: "12",
			cy: "12",
			r: "10",
			key: "1mglay"
		}],
		["path", {
			d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",
			key: "1u773s"
		}],
		["path", {
			d: "M12 17h.01",
			key: "p32p05"
		}]
	],
	aliases: ["help-circle", "circle-help"]
};
__iconData$5.node;
var CircleQuestionMark = createLucideIcon(__iconData$5);
//#endregion
//#region ../bay-audit-4/node_modules/lucide-react/dist/esm/icons/funnel.mjs
/**
* @license lucide-react v1.47.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$4 = {
	name: "funnel",
	size: 24,
	node: [["path", {
		d: "M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z",
		key: "sc7q7i"
	}]],
	aliases: ["filter"]
};
__iconData$4.node;
var Funnel = createLucideIcon(__iconData$4);
//#endregion
//#region ../bay-audit-4/node_modules/lucide-react/dist/esm/icons/image-off.mjs
/**
* @license lucide-react v1.47.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$3 = {
	name: "image-off",
	size: 24,
	node: [
		["line", {
			x1: "2",
			x2: "22",
			y1: "2",
			y2: "22",
			key: "a6p6uj"
		}],
		["path", {
			d: "M10.41 10.41a2 2 0 1 1-2.83-2.83",
			key: "1bzlo9"
		}],
		["line", {
			x1: "13.5",
			x2: "6",
			y1: "13.5",
			y2: "21",
			key: "1q0aeu"
		}],
		["line", {
			x1: "18",
			x2: "21",
			y1: "12",
			y2: "15",
			key: "5mozeu"
		}],
		["path", {
			d: "M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59",
			key: "mmje98"
		}],
		["path", {
			d: "M21 15V5a2 2 0 0 0-2-2H9",
			key: "43el77"
		}]
	]
};
__iconData$3.node;
var ImageOff = createLucideIcon(__iconData$3);
//#endregion
//#region ../bay-audit-4/node_modules/lucide-react/dist/esm/icons/list.mjs
/**
* @license lucide-react v1.47.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$2 = {
	name: "list",
	size: 24,
	node: [
		["path", {
			d: "M3 5h.01",
			key: "18ugdj"
		}],
		["path", {
			d: "M3 12h.01",
			key: "nlz23k"
		}],
		["path", {
			d: "M3 19h.01",
			key: "noohij"
		}],
		["path", {
			d: "M8 5h13",
			key: "1pao27"
		}],
		["path", {
			d: "M8 12h13",
			key: "1za7za"
		}],
		["path", {
			d: "M8 19h13",
			key: "m83p4d"
		}]
	]
};
__iconData$2.node;
var List = createLucideIcon(__iconData$2);
//#endregion
//#region ../bay-audit-4/node_modules/lucide-react/dist/esm/icons/sliders-horizontal.mjs
/**
* @license lucide-react v1.47.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$1 = {
	name: "sliders-horizontal",
	size: 24,
	node: [
		["path", {
			d: "M10 5H3",
			key: "1qgfaw"
		}],
		["path", {
			d: "M12 19H3",
			key: "yhmn1j"
		}],
		["path", {
			d: "M14 3v4",
			key: "1sua03"
		}],
		["path", {
			d: "M16 17v4",
			key: "1q0r14"
		}],
		["path", {
			d: "M21 12h-9",
			key: "1o4lsq"
		}],
		["path", {
			d: "M21 19h-5",
			key: "1rlt1p"
		}],
		["path", {
			d: "M21 5h-7",
			key: "1oszz2"
		}],
		["path", {
			d: "M8 10v4",
			key: "tgpxqk"
		}],
		["path", {
			d: "M8 12H3",
			key: "a7s4jb"
		}]
	]
};
__iconData$1.node;
var SlidersHorizontal = createLucideIcon(__iconData$1);
//#endregion
//#region ../bay-audit-4/node_modules/lucide-react/dist/esm/icons/tag.mjs
/**
* @license lucide-react v1.47.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData = {
	name: "tag",
	size: 24,
	node: [["path", {
		d: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z",
		key: "vktsd0"
	}], ["circle", {
		cx: "7.5",
		cy: "7.5",
		r: ".5",
		fill: "currentColor",
		key: "kqv944"
	}]]
};
__iconData.node;
var Tag = createLucideIcon(__iconData);
//#endregion
//#region src/components/ParkingAreaSheet.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function ParkingAreaSheet({ area, onClose }) {
	if (!area) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[1000] flex items-end justify-center bg-slate-950/30 p-0 sm:items-center sm:p-5",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			role: "dialog",
			"aria-label": "Parking area details",
			className: "bay-sheet max-h-[84dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-white px-5 pb-7 pt-3 sm:rounded-[28px]",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto h-1.5 w-11 rounded-full bg-slate-200" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-bold uppercase tracking-[.14em] text-[#1769ff]",
								children: "Parking area"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-1 text-xl font-bold tracking-tight text-[#0b1730]",
								children: area.address_text
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 flex items-center gap-1 text-sm text-[#64748b]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-4 w-4" }),
									Math.round(area.distance_m),
									" m away · availability on arrival"
								]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "bay-icon-button h-10 w-10 shrink-0",
						"aria-label": "Close parking area",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParkingAreaPhoto, { area }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParkingAreaDetails, { area })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-5 flex items-start gap-2 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-[#64748b]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "mt-0.5 h-3.5 w-3.5 shrink-0" }), "Entry, capacity and price details are source-provided. Check current signs and operator terms on arrival."]
				})
			]
		})
	});
}
function ParkingAreaPhoto({ area }) {
	const [failed, setFailed] = (0, import_react.useState)(false);
	const url = area.photo_url?.startsWith("https://") ? area.photo_url : null;
	if (!url || failed) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-5 flex items-center gap-2 rounded-2xl border border-dashed border-[#dce7f8] bg-[#f7faff] px-3 py-3 text-xs text-[#64748b]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageOff, { className: "h-4 w-4 shrink-0 text-[#94a3b8]" }), "Photo not supplied by this parking source."]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className: "mt-5 overflow-hidden rounded-2xl border border-[#e3eaf3] bg-[#f7faff]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: url,
			alt: `Parking area: ${area.address_text}`,
			onError: () => setFailed(true),
			className: "h-44 w-full object-cover"
		}), area.photo_attribution && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", {
			className: "px-3 py-2 text-[11px] text-[#64748b]",
			children: area.photo_attribution
		})]
	});
}
//#endregion
//#region src/components/FilterBar.tsx
var RADIUS_OPTIONS = [
	{
		label: "500 m",
		value: 500
	},
	{
		label: "1 km",
		value: 1e3
	},
	{
		label: "2 km",
		value: 2e3
	},
	{
		label: "5 km",
		value: 5e3
	}
];
var CATEGORY_OPTIONS = [
	{
		label: "All zones",
		value: "all"
	},
	{
		label: SIGN_TYPE_LABELS.PAID_METER,
		value: "PAID_METER"
	},
	{
		label: SIGN_TYPE_LABELS.TIME_LIMITED,
		value: "TIME_LIMITED"
	},
	{
		label: SIGN_TYPE_LABELS.PERMIT_ONLY,
		value: "PERMIT_ONLY"
	},
	{
		label: SIGN_TYPE_LABELS.LOADING_ZONE,
		value: "LOADING_ZONE"
	},
	{
		label: SIGN_TYPE_LABELS.ACCESSIBLE_PERMIT,
		value: "ACCESSIBLE_PERMIT"
	}
];
function FilterBar({ vacantOnly, onVacantOnlyChange, radiusM, onRadiusChange, freeOnly, onFreeOnlyChange, category, onCategoryChange, showCarParks, onShowCarParksChange, mappedOnly = false, onClose }) {
	const reset = () => {
		onRadiusChange(500);
		onVacantOnlyChange(false);
		onFreeOnlyChange(false);
		onCategoryChange("all");
		onShowCarParksChange(true);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"aria-label": "Parking filters",
		className: "max-h-[82dvh] overflow-y-auto rounded-t-[28px] bg-white px-5 pb-6 pt-3 sm:rounded-[28px]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto h-1.5 w-11 rounded-full bg-slate-200" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-bold uppercase tracking-[.14em] text-[#1769ff]",
					children: "Refine the map"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-0.5 text-xl font-bold tracking-tight text-[#0b1730]",
					children: "Filters"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onClose,
					className: "bay-icon-button h-10 w-10",
					"aria-label": "Close filters",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold text-[#0b1730]",
					children: "Search radius"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 grid grid-cols-4 gap-2",
					children: RADIUS_OPTIONS.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => onRadiusChange(o.value),
						className: `rounded-xl border px-2 py-2.5 text-xs font-bold ${radiusM === o.value ? "border-[#1769ff] bg-[#1769ff] text-white shadow-lg shadow-blue-500/20" : "border-[#e3eaf3] text-[#64748b]"}`,
						children: o.label
					}, o.value))
				})]
			}),
			!mappedOnly && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold text-[#0b1730]",
						children: "Parking type"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 grid grid-cols-3 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleTile, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Funnel, { className: "h-4 w-4" }),
								label: "All zones",
								active: category === "all",
								onClick: () => onCategoryChange("all")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleTile, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, { className: "h-4 w-4" }),
								label: "Time limits",
								active: category === "TIME_LIMITED",
								onClick: () => onCategoryChange("TIME_LIMITED")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleTile, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "h-4 w-4" }),
								label: "Paid",
								active: category === "PAID_METER",
								onClick: () => onCategoryChange("PAID_METER")
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
					className: "mt-3 rounded-2xl border border-[#e3eaf3] p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
						className: "cursor-pointer text-sm font-semibold text-[#40516d]",
						children: "More sign types"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: CATEGORY_OPTIONS.slice(3).map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onCategoryChange(o.value),
							className: `rounded-full border px-3 py-2 text-xs font-semibold ${category === o.value ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`,
							children: o.label
						}, o.value))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						label: "Show only fresh vacant readings",
						detail: "Only where a current source publishes a bay reading.",
						on: vacantOnly,
						onChange: onVacantOnlyChange
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						label: "Show no-fee parking",
						detail: "Uses mapped parking terms where available.",
						on: freeOnly,
						onChange: onFreeOnlyChange
					})]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CarFront, { className: "h-4 w-4" }),
					label: "Parking areas",
					detail: "Lots, garages and other off-street facilities.",
					on: showCarParks,
					onChange: onShowCarParksChange
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: reset,
					className: "flex-1 rounded-2xl border border-[#e3eaf3] py-3.5 text-sm font-bold text-[#40516d]",
					children: "Reset"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onClose,
					className: "flex-1 rounded-2xl bg-[#1769ff] py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25",
					children: "Apply filters"
				})]
			})
		]
	});
}
function ToggleTile({ icon, label, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: `flex min-h-18 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 text-xs font-bold ${active ? "border-[#1769ff] bg-blue-50 text-[#1769ff]" : "border-[#e3eaf3] text-[#64748b]"}`,
		children: [icon, label]
	});
}
function Switch({ icon, label, detail, on, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick: () => onChange(!on),
		"aria-pressed": on,
		className: "relative flex w-full items-center gap-3 rounded-2xl border border-[#e3eaf3] p-3 text-left",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: `flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${on ? "bg-blue-50 text-[#1769ff]" : "bg-slate-50 text-slate-400"}`,
				children: icon ?? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeDollarSign, { className: "h-4 w-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-sm font-semibold text-[#0b1730]",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-0.5 block text-xs leading-4 text-[#64748b]",
					children: detail
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: `flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${on ? "bg-[#1769ff] justify-end" : "bg-slate-200 justify-start"}`,
				children: [on && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "absolute ml-1 h-3 w-3 text-blue-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-5 w-5 rounded-full bg-white shadow-sm" })]
			})
		]
	});
}
//#endregion
//#region src/lib/searchEvents.ts
/** Fire-and-forget: logs a real "find parking near me" search that actually
* returned results. The one honest signal for "are people actually using
* Bay" -- distinct from survey opinions, which only capture who bothered to
* respond. Never blocks the search UI on failure. */
function logSearchEvent(center, radiusM, resultCount) {
	supabase.auth.getUser().then(({ data }) => {
		const userId = data.user?.id;
		if (!userId) return;
		supabase.from("search_events").insert({
			user_id: userId,
			lat: center.lat,
			lng: center.lng,
			radius_m: radiusM,
			result_count: resultCount
		}).then();
	});
}
//#endregion
//#region src/lib/nearbyPages.ts
/** Fetch every page, including when the server applies a lower row cap than
* requested. Offset advances by rows received, never by the requested size. */
async function loadNearbyPages(read, cancelled = () => false) {
	let offset = 0;
	const rows = /* @__PURE__ */ new Map();
	while (!cancelled()) {
		const page = await read(offset);
		if (!page.rows.length) break;
		const before = rows.size;
		for (const row of page.rows) rows.set(row.id, row);
		offset += page.rows.length;
		if (page.total != null && offset >= page.total) break;
		if (rows.size === before) throw new Error("Parking pagination stalled. Please retry.");
	}
	return [...rows.values()];
}
//#endregion
//#region src/lib/useNearbyParking.ts
function useNearbyParking(center, radiusM) {
	const [spots, setSpots] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [updatedAt, setUpdatedAt] = (0, import_react.useState)(null);
	const sequence = (0, import_react.useRef)(0);
	const lat = center?.lat;
	const lng = center?.lng;
	const refresh = (0, import_react.useCallback)(async (recordSearch = false) => {
		if (lat == null || lng == null) return;
		const request = ++sequence.current;
		setLoading(true);
		setError(null);
		try {
			const remoteDeadline = AbortSignal.timeout(15e3);
			const regionalOnly = isUSSearch(lat, lng) || isIndiaSearch(lat, lng) || isAustraliaSearch(lat, lng);
			const [remote, local, council] = await Promise.allSettled([
				regionalOnly ? Promise.resolve([]) : loadNearbyPages(async (offset) => {
					const { data, error: rpcError, count } = await supabase.rpc("nearby_parking", {
						p_lat: lat,
						p_lng: lng,
						p_radius_m: radiusM
					}, { count: "exact" }).order("distance_m").order("id").range(offset, offset + 999).abortSignal(remoteDeadline);
					if (rpcError) throw rpcError;
					return {
						rows: data ?? [],
						total: count
					};
				}, () => sequence.current !== request),
				regionalNearby(lat, lng, radiusM),
				fetchMelbourneSensors(lat, lng, radiusM)
			]);
			if (remote.status === "rejected" && local.status === "rejected" && council.status === "rejected") throw remote.reason;
			let rows = mergeMappedBays(remote.status === "fulfilled" ? remote.value : [], local.status === "fulfilled" ? local.value.filter((row) => row.kind === "bay").map(catalogSpot) : []);
			if (request !== sequence.current) return;
			if (isMelbourneSearch(lat, lng)) {
				rows = rows.map((row) => ({
					...row,
					sensor_status: row.sensor_status?.match_method === "kerbside_id" ? row.sensor_status : null
				}));
				if (council.status === "fulfilled") rows = mergeMelbourneSensors(rows, council.value, {
					lat,
					lng
				}, (/* @__PURE__ */ new Date()).toISOString());
			}
			setError(rows.length === 0 && remote.status === "rejected" && local.status === "rejected" ? "Parking data is unavailable right now." : null);
			setSpots(rows);
			setUpdatedAt(/* @__PURE__ */ new Date());
			if (recordSearch) logSearchEvent({
				lat,
				lng
			}, radiusM, rows.length);
		} catch (err) {
			if (request === sequence.current) {
				console.error("Bay parking data request failed", err);
				const message = err instanceof TypeError || String(err?.message ?? err).toLowerCase().includes("fetch") ? "Parking data is temporarily unavailable. Check your connection and try again." : err instanceof Error ? err.message : err?.message ?? "Could not refresh parking";
				setError(message);
			}
		} finally {
			if (request === sequence.current) setLoading(false);
		}
	}, [
		lat,
		lng,
		radiusM
	]);
	(0, import_react.useEffect)(() => {
		setSpots([]);
		setUpdatedAt(null);
		refresh(true);
		const timer = setInterval(() => {
			if (!document.hidden) refresh();
		}, 6e4);
		const onVisible = () => {
			if (!document.hidden) refresh();
		};
		document.addEventListener("visibilitychange", onVisible);
		return () => {
			sequence.current++;
			clearInterval(timer);
			document.removeEventListener("visibilitychange", onVisible);
		};
	}, [refresh]);
	return {
		spots,
		loading,
		error,
		updatedAt,
		refresh: () => refresh(false)
	};
}
//#endregion
//#region src/lib/useClock.ts
function useClock() {
	const [now, setNow] = (0, import_react.useState)(() => /* @__PURE__ */ new Date());
	(0, import_react.useEffect)(() => {
		const update = () => setNow(/* @__PURE__ */ new Date());
		const timer = setInterval(update, 15e3);
		document.addEventListener("visibilitychange", update);
		return () => {
			clearInterval(timer);
			document.removeEventListener("visibilitychange", update);
		};
	}, []);
	return now;
}
//#endregion
//#region src/pages/Home.tsx
var MapView = (0, import_react.lazy)(() => __vitePreload(() => import("./MapView-BlipuX2V.js").then((module) => ({ default: module.MapView })), __vite__mapDeps([0,1,2,3,4]), import.meta.url));
var RADII = [
	{
		label: "500 m",
		value: 500
	},
	{
		label: "1 km",
		value: 1e3
	},
	{
		label: "2 km",
		value: 2e3
	},
	{
		label: "5 km",
		value: 5e3
	}
];
function Home({ center, myLocation, locationLabel, onChangeLocation, onUseCurrentLocation, savedLocations, onSavePlace, onSelectSavedPlace }) {
	const [radiusM, setRadiusM] = (0, import_react.useState)(500);
	const [vacantOnly, setVacantOnly] = (0, import_react.useState)(false);
	const [freeOnly, setFreeOnly] = (0, import_react.useState)(false);
	const [category, setCategory] = (0, import_react.useState)("all");
	const [showCarParks, setShowCarParks] = (0, import_react.useState)(true);
	const [view, setView] = (0, import_react.useState)("map");
	const [filtersOpen, setFiltersOpen] = (0, import_react.useState)(false);
	const [savedOpen, setSavedOpen] = (0, import_react.useState)(false);
	const [infoOpen, setInfoOpen] = (0, import_react.useState)(false);
	const [selectedSpot, setSelectedSpot] = (0, import_react.useState)(null);
	const [selectedArea, setSelectedArea] = (0, import_react.useState)(null);
	const [destination, setDestination] = (0, import_react.useState)(null);
	const [showDestSearch, setShowDestSearch] = (0, import_react.useState)(false);
	const [destQuery, setDestQuery] = (0, import_react.useState)("");
	const [destResults, setDestResults] = (0, import_react.useState)([]);
	const [destSearching, setDestSearching] = (0, import_react.useState)(false);
	const [showDestSuggestions, setShowDestSuggestions] = (0, import_react.useState)(false);
	const [coverageRadiusM, setCoverageRadiusM] = (0, import_react.useState)(500);
	const destBoxRef = (0, import_react.useRef)(null);
	const destRequest = (0, import_react.useRef)(0);
	const effectiveCenter = destination ?? center;
	const dataRadiusM = Math.max(radiusM, coverageRadiusM);
	const now = useClock();
	const { spots, loading, updatedAt, refresh } = useNearbyParking(effectiveCenter, dataRadiusM);
	const { carParks, loading: areasLoading, refresh: refreshAreas } = useNearbyCarParks(effectiveCenter, dataRadiusM, showCarParks && !vacantOnly);
	const usa = isUSSearch(effectiveCenter.lat, effectiveCenter.lng);
	const india = isIndiaSearch(effectiveCenter.lat, effectiveCenter.lng);
	(0, import_react.useEffect)(() => {
		if (usa) {
			setVacantOnly(false);
			setFreeOnly(false);
			setCategory("all");
		}
	}, [usa]);
	(0, import_react.useEffect)(() => {
		setSelectedSpot(null);
		setSelectedArea(null);
	}, [
		effectiveCenter.lat,
		effectiveCenter.lng,
		radiusM
	]);
	(0, import_react.useEffect)(() => {
		const close = (e) => {
			if (destBoxRef.current && !destBoxRef.current.contains(e.target)) setShowDestSuggestions(false);
		};
		document.addEventListener("mousedown", close);
		return () => document.removeEventListener("mousedown", close);
	}, []);
	const ranked = (0, import_react.useMemo)(() => {
		let list = rankSpots(spots, now);
		if (vacantOnly) list = list.filter((s) => availability(s, now).state === "vacant");
		if (freeOnly) list = list.filter((s) => s.status.status === "free");
		if (category !== "all") list = list.filter((s) => s.rules.some((r) => r.sign_type === category));
		return list;
	}, [
		spots,
		now,
		vacantOnly,
		freeOnly,
		category
	]);
	const selectedRow = selectedSpot ? spots.find((s) => s.id === selectedSpot.id) : null;
	const selected = selectedRow ? {
		...selectedRow,
		status: evaluateSpotStatus(selectedRow.rules, selectedRow.lat, selectedRow.lng, now)
	} : null;
	const total = ranked.length + carParks.length;
	const availabilitySummary = (0, import_react.useMemo)(() => ranked.reduce((summary, spot) => {
		summary[availability(spot, now).state] += 1;
		return summary;
	}, {
		vacant: 0,
		occupied: 0,
		uncertain: 0,
		unknown: 0
	}), [ranked, now]);
	async function searchDestination() {
		if (destQuery.trim().length < 3) return;
		const request = ++destRequest.current;
		setDestSearching(true);
		const found = await searchPlaces(destQuery, center);
		if (request === destRequest.current) {
			setDestResults(found);
			setDestSearching(false);
			setShowDestSuggestions(true);
		}
	}
	function selectDestination(place) {
		setDestination({
			lat: place.lat,
			lng: place.lng,
			label: place.name
		});
		setDestQuery("");
		setDestResults([]);
		setShowDestSuggestions(false);
		setShowDestSearch(false);
	}
	function clearDestination() {
		setDestination(null);
		setDestQuery("");
		setDestResults([]);
	}
	const resetRefresh = () => {
		refresh();
		refreshAreas();
	};
	const filterCount = Number(vacantOnly) + Number(freeOnly) + Number(category !== "all") + Number(!showCarParks);
	const previewArea = carParks[0] ?? null;
	const previewSpot = previewArea ? null : ranked[0] ?? null;
	const closestPlace = previewArea ?? previewSpot;
	const closestDirections = closestPlace ? directionsUrl(closestPlace.lat, closestPlace.lng) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative flex h-full min-h-0 flex-col overflow-hidden bg-[#f7faff]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative min-h-0 flex-1",
				children: [
					view === "map" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
						fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapLoading, {}),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapView, {
							center: effectiveCenter,
							myLocation,
							spots: ranked,
							carParks,
							onSelectSpot: setSelectedSpot,
							onSelectCarPark: setSelectedArea,
							onZoomChange: (zoom) => setCoverageRadiusM(coverageRadiusForZoom(zoom)),
							zoom: zoomForRadius(radiusM),
							glowMe: true,
							radiusM
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParkingList, {
						loading: loading || areasLoading,
						ranked,
						areas: carParks,
						usa,
						vacantOnly,
						filtered: freeOnly || category !== "all",
						onSpot: setSelectedSpot,
						onArea: setSelectedArea
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
						className: "pointer-events-none absolute inset-x-0 top-0 z-[500] px-3 pt-[max(.75rem,env(safe-area-inset-top))] sm:px-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pointer-events-auto mx-auto max-w-3xl",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: onChangeLocation,
											className: "rounded-2xl bg-white/95 px-2.5 py-2 shadow-[0_10px_28px_rgba(15,23,42,.12)] backdrop-blur transition hover:bg-white",
											"aria-label": "Choose a parking location",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandMark, { className: "w-[88px]" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "ml-auto flex rounded-2xl border border-white/80 bg-white/95 p-1 shadow-[0_10px_28px_rgba(15,23,42,.12)] backdrop-blur",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												onClick: () => setView("map"),
												className: `inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${view === "map" ? "bg-[#1769ff] text-white shadow-lg shadow-blue-500/25" : "text-[#64748b]"}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map$1, { className: "h-4 w-4" }), "Map"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												onClick: () => setView("list"),
												className: `inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${view === "list" ? "bg-[#1769ff] text-white shadow-lg shadow-blue-500/25" : "text-[#64748b]"}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, { className: "h-4 w-4" }), "List"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => {
												clearDestination();
												onUseCurrentLocation();
											},
											className: "bay-icon-button !h-11 !w-11 !rounded-2xl !border-white/80 !bg-white/95 shadow-[0_10px_28px_rgba(15,23,42,.12)] backdrop-blur",
											"aria-label": "Use my current location",
											title: "Use my current location",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LocateFixed, { className: "h-5 w-5" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => setSavedOpen((v) => !v),
												className: "bay-icon-button !h-11 !w-11 !rounded-2xl !border-white/80 !bg-white/95 shadow-[0_10px_28px_rgba(15,23,42,.12)] backdrop-blur",
												"aria-label": "Saved locations",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { className: "h-5 w-5" })
											}), savedOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SavedMenu, {
												saved: savedLocations,
												onSave: onSavePlace,
												onSelect: onSelectSavedPlace,
												onClose: () => setSavedOpen(false)
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-3 rounded-[26px] border border-white/85 bg-white/95 p-2 shadow-[0_14px_30px_rgba(15,23,42,.12)] backdrop-blur",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => setShowDestSearch(true),
										className: "flex w-full items-center gap-3 rounded-[20px] px-3 py-3 text-left transition hover:bg-[#f5f8fd]",
										"aria-label": "Search another destination",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-5 w-5 shrink-0 text-[#40516d]" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "min-w-0 flex-1 truncate text-base font-bold text-[#0b1730]",
												children: destination ? `Near ${destination.label}` : locationLabel
											}),
											destination ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												onClick: (event) => {
													event.stopPropagation();
													clearDestination();
												},
												role: "button",
												tabIndex: 0,
												onKeyDown: (event) => {
													if (event.key === "Enter" || event.key === " ") {
														event.preventDefault();
														clearDestination();
													}
												},
												className: "rounded-xl p-1 text-[#64748b] hover:bg-white",
												"aria-label": "Clear destination",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5" })
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-5 w-5 text-[#94a3b8]" })
										]
									})
								}),
								showDestSearch && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									ref: destBoxRef,
									className: "relative mt-2 rounded-2xl border border-white/80 bg-white/95 p-2 shadow-xl backdrop-blur",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "ml-2 h-4 w-4 shrink-0 text-[#64748b]" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												autoFocus: true,
												value: destQuery,
												onChange: (e) => {
													destRequest.current++;
													setDestQuery(e.target.value);
													setDestResults([]);
													setShowDestSuggestions(true);
												},
												onKeyDown: (e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														searchDestination();
													}
												},
												className: "min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-slate-400",
												placeholder: "Search a destination"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => void searchDestination(),
												disabled: destSearching || destQuery.trim().length < 3,
												className: "rounded-xl bg-[#1769ff] px-3 py-2 text-xs font-bold text-white disabled:opacity-50",
												children: destSearching ? "Searching" : "Search"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => setShowDestSearch(false),
												className: "p-2 text-slate-400",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
											})
										]
									}), showDestSuggestions && destQuery.trim() && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-1 max-h-48 overflow-y-auto border-t border-[#e3eaf3] pt-1",
										children: [!destSearching && destResults.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "px-3 py-3 text-sm text-[#64748b]",
											children: "Press Search to find a destination."
										}), destResults.map((place, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: () => selectDestination(place),
											className: "block w-full rounded-xl px-3 py-2.5 text-left hover:bg-blue-50",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "block text-sm font-semibold text-[#0b1730]",
												children: place.name
											}), place.address && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "block truncate text-xs text-[#64748b]",
												children: place.address
											})]
										}, `${place.name}-${index}`))]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]",
									children: [
										RADII.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => setRadiusM(option.value),
											className: `shrink-0 rounded-2xl border border-white/90 px-4 py-3 text-sm font-bold shadow-[0_8px_20px_rgba(15,23,42,.10)] backdrop-blur transition ${radiusM === option.value ? "bg-[#1769ff] text-white shadow-blue-500/25" : "bg-white/95 text-[#40516d]"}`,
											children: option.label
										}, option.value)),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: () => setShowCarParks((value) => !value),
											className: `flex shrink-0 items-center gap-2 rounded-2xl border border-white/90 px-4 py-3 text-sm font-bold shadow-[0_8px_20px_rgba(15,23,42,.10)] backdrop-blur transition ${showCarParks ? "bg-white/95 text-[#0b1730]" : "bg-white/80 text-[#94a3b8]"}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CarFront, { className: "h-4.5 w-4.5" }), "Parking areas"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: () => setFiltersOpen(true),
											className: "relative flex shrink-0 items-center justify-center rounded-2xl border border-white/90 bg-white/95 p-3 text-[#40516d] shadow-[0_8px_20px_rgba(15,23,42,.10)] backdrop-blur",
											"aria-label": "Open filters",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "h-5 w-5" }), filterCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#1769ff] ring-2 ring-white" })]
										})
									]
								})
							]
						})
					}),
					view === "map" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute inset-x-3 bottom-3 z-[450] mx-auto max-w-lg space-y-2 sm:bottom-4",
						children: [
							closestDirections && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: closestDirections,
								target: "_blank",
								rel: "noreferrer",
								className: "flex min-h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-[#1769ff] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(23,105,255,.30)] transition hover:bg-blue-700",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, { className: "h-4.5 w-4.5" }), "Navigate to closest parking"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setView("list"),
								className: "flex w-full items-center gap-3 rounded-[24px] border border-white/85 bg-white/95 p-2.5 text-left shadow-[0_14px_30px_rgba(15,23,42,.14)] backdrop-blur transition hover:bg-white",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultThumb, {
										area: previewArea,
										spot: previewSpot
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "min-w-0 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-sm font-bold text-[#0b1730]",
											children: loading || areasLoading ? "Updating nearby places…" : `${total.toLocaleString()} nearby places`
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "mt-0.5 block truncate text-xs text-[#64748b]",
											children: [showCarParks && carParks.length ? `${carParks.length} parking areas · ` : "", usa || india || availabilitySummary.vacant + availabilitySummary.occupied === 0 ? "availability on arrival" : `${availabilitySummary.vacant} fresh vacant · ${availabilitySummary.occupied} occupied`]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-5 w-5 shrink-0 text-[#40516d]" })
								]
							}),
							(previewArea || previewSpot) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => previewArea ? setSelectedArea(previewArea) : previewSpot && setSelectedSpot(previewSpot),
								className: "flex w-full items-center gap-3 rounded-[24px] border border-white/85 bg-white/95 p-2.5 text-left shadow-[0_14px_30px_rgba(15,23,42,.14)] backdrop-blur transition hover:bg-white",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultThumb, {
										area: previewArea,
										spot: previewSpot,
										large: true
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "min-w-0 flex-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "block truncate text-[11px] font-bold uppercase tracking-[.12em] text-[#1769ff]",
												children: previewArea ? "Parking area" : "Parking spot"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mt-1 block truncate text-base font-bold text-[#0b1730]",
												children: previewArea?.address_text ?? previewSpot?.address_text
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "mt-1 flex items-center gap-1 text-xs text-[#64748b]",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, { className: "h-3.5 w-3.5" }),
													Math.round(previewArea?.distance_m ?? previewSpot?.distance_m ?? 0),
													" m away"
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-5 w-5 shrink-0 text-[#1769ff]" })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "absolute -right-0 -top-14",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setInfoOpen((v) => !v),
									className: "bay-icon-button !h-11 !w-11 !rounded-2xl !border-white/90 !bg-white/95 shadow-lg backdrop-blur",
									"aria-label": "About map data",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleQuestionMark, { className: "h-5 w-5" })
								}), infoOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "absolute bottom-14 right-0 w-[min(330px,calc(100vw-24px))] rounded-2xl border border-[#e3eaf3] bg-white p-3 text-xs leading-5 text-[#64748b] shadow-xl",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: resetRefresh,
											className: "float-right ml-2 font-bold text-[#1769ff]",
											children: "Refresh"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-bold text-[#0b1730]",
											children: "Map data"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1",
											children: usa ? "Mapped street parking and parking areas. Check street signs and meters on arrival." : india ? "Mapped parking areas and source-listed terms. Live vacancy appears only where a current provider publishes it." : "Availability is only shown where a connected source provides a fresh reading. Physical signs control parking."
										}),
										updatedAt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1 text-[11px]",
											children: ["Last map update ", updatedAt.toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit"
											})]
										})
									]
								})]
							})
						]
					})
				]
			}),
			filtersOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-[1000] flex items-end justify-center bg-slate-950/30 sm:items-center sm:p-5",
				onClick: () => setFiltersOpen(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "w-full max-w-lg",
					onClick: (e) => e.stopPropagation(),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterBar, {
						vacantOnly,
						onVacantOnlyChange: setVacantOnly,
						radiusM,
						onRadiusChange: setRadiusM,
						freeOnly,
						onFreeOnlyChange: setFreeOnly,
						category,
						onCategoryChange: setCategory,
						showCarParks,
						onShowCarParksChange: setShowCarParks,
						mappedOnly: usa,
						onClose: () => setFiltersOpen(false)
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpotDetailSheet, {
				spot: selected,
				onClose: () => setSelectedSpot(null),
				onUpdated: refresh
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParkingAreaSheet, {
				area: selectedArea,
				onClose: () => setSelectedArea(null)
			})
		]
	});
}
function MapLoading() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-full items-center justify-center bg-[#eef4ff] text-sm font-semibold text-[#64748b]",
		children: "Loading map…"
	});
}
function ParkingList({ loading, ranked, areas, usa, vacantOnly, filtered, onSpot, onArea }) {
	const empty = vacantOnly ? "No fresh vacant bays in this search. Turn off the vacancy filter to see mapped parking." : filtered ? "No places match these filters. Try a wider radius or reset filters." : "No mapped parking is available for this search yet. Try a wider radius.";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-full overflow-y-auto bg-[#f7faff] px-3 pb-6 pt-[15.5rem] sm:px-5",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-3xl",
			children: [
				loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "py-8 text-center text-sm text-[#64748b]",
					children: "Updating nearby parking…"
				}),
				!loading && ranked.length === 0 && areas.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-2xl bg-white p-5 text-center text-sm text-[#64748b]",
					children: empty
				}),
				!usa && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AreaList, {
					areas,
					onArea
				}),
				ranked.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mb-2 text-xs font-bold uppercase tracking-[.14em] text-[#64748b]",
						children: [
							usa ? "Mapped street parking" : "Parking spots",
							" · ",
							ranked.length
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-2",
						children: ranked.map((spot) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpotCard, {
							spot,
							onClick: () => onSpot(spot)
						}, spot.id))
					})]
				}),
				usa && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AreaList, {
					areas,
					onArea
				})
			]
		})
	});
}
function AreaList({ areas, onArea }) {
	if (!areas.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "mb-2 text-xs font-bold uppercase tracking-[.14em] text-[#64748b]",
		children: ["Parking areas · ", areas.length]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-2",
		children: areas.map((area) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "bay-card rounded-2xl p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-end",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => onArea(area),
					className: "-mt-1 -mr-1 flex items-center gap-1 text-xs font-bold text-[#1769ff]",
					children: ["View ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-3.5 w-3.5" })]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParkingAreaDetails, {
				area,
				compact: true
			})]
		}, area.id))
	})] });
}
function ResultThumb({ area, spot, large = false }) {
	const url = area?.photo_url ?? spot?.photo_url;
	const [failed, setFailed] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setFailed(false), [url]);
	const size = large ? "h-16 w-16 rounded-2xl" : "h-12 w-12 rounded-xl";
	if (url?.startsWith("https://") && !failed) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: url,
		alt: "Parking place",
		onError: () => setFailed(true),
		className: `${size} shrink-0 object-cover`
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `flex ${size} shrink-0 items-center justify-center bg-gradient-to-br from-[#dbeafe] to-[#eff6ff] text-[#1769ff]`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: large ? "h-7 w-7" : "h-5 w-5" })
	});
}
function SavedMenu({ saved, onSave, onSelect, onClose }) {
	const act = (fn) => {
		fn();
		onClose();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "absolute bottom-12 right-0 z-[700] w-56 rounded-2xl border border-[#e3eaf3] bg-white p-1.5 shadow-xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => act(() => onSave("home")),
				className: "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold hover:bg-slate-50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "h-4 w-4 text-[#1769ff]" }), "Save current as home"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => act(() => onSave("work")),
				className: "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold hover:bg-slate-50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BriefcaseBusiness, { className: "h-4 w-4 text-[#1769ff]" }), "Save current as work"]
			}),
			saved.home && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => act(() => onSelect("home")),
				className: "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold hover:bg-blue-50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "h-4 w-4 text-slate-500" }), "Go to home"]
			}),
			saved.work && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => act(() => onSelect("work")),
				className: "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold hover:bg-blue-50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BriefcaseBusiness, { className: "h-4 w-4 text-slate-500" }), "Go to work"]
			})
		]
	});
}
//#endregion
export { Home };
