const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./MapView-BlipuX2V.js","./MapView-DLwO5otf.js","./jsx-runtime-DNksDsTP.js","./leaflet-src-Dc-ZD4n_.js","./availability-BIfWf5pU.js"])))=>i.map(i=>d[i]);
import { a as __toESM, n as createLucideIcon, r as require_react, t as require_jsx_runtime } from "./jsx-runtime-DNksDsTP.js";
import { t as CalendarCheck2 } from "./calendar-check-2-W7SVB7oM.js";
import { n as CircleAlert, t as ShieldCheck } from "./shield-check-CqZoHc1d.js";
import { n as zoomForRadius, r as useNearbyCarParks, u as ExternalLink } from "./mapZoom-bFUuqA_Q.js";
import { t as MapPin } from "./map-pin-Bun7dCb_.js";
import { t as Navigation } from "./navigation-CLo9KBXI.js";
import { t as __vitePreload } from "./preload-helper-DHlaQ_oz.js";
//#region ../bay-audit-4/node_modules/lucide-react/dist/esm/icons/arrow-left.mjs
/**
* @license lucide-react v1.47.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData = {
	name: "arrow-left",
	size: 24,
	node: [["path", {
		d: "m12 19-7-7 7-7",
		key: "1l729n"
	}], ["path", {
		d: "M19 12H5",
		key: "x3x0zl"
	}]]
};
__iconData.node;
var ArrowLeft = createLucideIcon(__iconData);
//#endregion
//#region src/lib/bookingEligibility.ts
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var VERIFIED_BOOKING_PROVIDERS = [];
function verifiedExternalBooking(area) {
	const provider = VERIFIED_BOOKING_PROVIDERS.find((candidate) => candidate.areaId === area.id) ?? null;
	if (!provider) return null;
	try {
		if (new URL(provider.bookingUrl).protocol !== "https:" || !provider.operatorName.trim() || !provider.providerLocationId.trim()) return null;
	} catch {
		return null;
	}
	return provider;
}
function bookableAreas(areas) {
	return areas.flatMap((area) => {
		if (area.kind !== "area" || area.mapped_zone) return [];
		const provider = verifiedExternalBooking(area);
		return provider ? [{
			area,
			provider
		}] : [];
	});
}
//#endregion
//#region src/pages/BookSpot.tsx
var import_jsx_runtime = require_jsx_runtime();
var MapView = (0, import_react.lazy)(() => __vitePreload(() => import("./MapView-BlipuX2V.js").then((module) => ({ default: module.MapView })), __vite__mapDeps([0,1,2,3,4]), import.meta.url));
/** A safe booking entry point. It renders only verified external provider
* links. There is deliberately no Bay checkout until provider availability,
* deposit rules and payment confirmation are connected server-side. */
function BookSpot({ center, onFindParking }) {
	const { carParks, loading } = useNearbyCarParks(center, 5e3, true);
	const eligible = (0, import_react.useMemo)(() => bookableAreas(carParks), [carParks]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "h-full overflow-y-auto bg-[#f7faff] pb-6 text-[#0b1730]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-20 border-b border-white/80 bg-[#f7faff]/95 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: onFindParking,
							className: "bay-icon-button !h-11 !w-11 !rounded-2xl",
							"aria-label": "Back to parking map",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-5 w-5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] font-bold uppercase tracking-[.16em] text-[#1769ff]",
									children: "Book parking"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "mt-1 text-xl font-bold tracking-tight",
									children: "Reserve a parking spot"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-[#64748b]",
									children: "Book ahead at parking areas that support online reservations."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-[#1769ff]",
							children: "Step 1 of 3"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
					className: "mt-5 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "text-[#1769ff]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mx-auto mb-1.5 block h-2.5 w-2.5 rounded-full bg-[#1769ff] ring-4 ring-blue-100" }), "Choose parking"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "text-[#94a3b8]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mx-auto mb-1.5 block h-2.5 w-2.5 rounded-full bg-[#dbe7f8]" }), "Details & deposit"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "text-[#94a3b8]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mx-auto mb-1.5 block h-2.5 w-2.5 rounded-full bg-[#dbe7f8]" }), "Confirmation"]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mx-4 mt-4 h-48 overflow-hidden rounded-[26px] border border-[#dce7f8] bg-white shadow-[0_14px_30px_rgba(37,99,235,.08)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
					fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-full items-center justify-center text-sm text-[#64748b]",
						children: "Loading map…"
					}),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapView, {
						center,
						myLocation: center,
						spots: [],
						carParks: eligible.map((item) => item.area),
						zoom: zoomForRadius(5e3)
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mx-4 mt-4 rounded-[26px] border border-[#dce7f8] bg-white p-5 shadow-[0_14px_30px_rgba(37,99,235,.08)]",
				children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 text-sm text-[#64748b]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarCheck2, { className: "h-5 w-5 animate-pulse text-[#1769ff]" }), "Checking verified booking providers…"]
				}) : eligible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#1769ff]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarCheck2, { className: "h-6 w-6" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-4 text-lg font-bold",
						children: "No online-bookable parking areas found nearby."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-6 text-[#64748b]",
						children: "Try another location or explore nearby parking on the map."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: onFindParking,
						className: "mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1769ff] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, { className: "h-4 w-4" }), "Find parking"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 flex gap-2 rounded-xl bg-[#f7faff] px-3 py-3 text-xs leading-5 text-[#64748b]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "mt-0.5 h-4 w-4 shrink-0 text-[#1769ff]" }), "Bay has no verified operator reservation or payment integration for this area yet, so checkout is unavailable."]
					})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3",
					children: eligible.map(({ area, provider }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-2xl border border-[#dce7f8] p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-bold uppercase tracking-[.12em] text-[#1769ff]",
								children: "External booking"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-1 text-base font-bold",
								children: area.address_text
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 flex items-center gap-1 text-sm text-[#64748b]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-4 w-4" }),
									Math.round(area.distance_m),
									" m away · ",
									provider.operatorName
								]
							}),
							area.price_summary && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm font-semibold text-[#0b1730]",
								children: area.price_summary
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: provider.bookingUrl,
								target: "_blank",
								rel: "noreferrer",
								className: "mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1769ff] px-4 py-2.5 text-sm font-bold text-white",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "h-4 w-4" }), "Book with operator"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 flex gap-1.5 text-xs text-[#64748b]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-3.5 w-3.5 shrink-0 text-[#1769ff]" }),
									"Booking takes place with ",
									provider.operatorName,
									". Its prices, deposit and terms apply."
								]
							})
						]
					}, area.id))
				})
			})
		]
	});
}
//#endregion
export { BookSpot };
