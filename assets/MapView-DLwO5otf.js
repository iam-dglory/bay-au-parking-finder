import { a as __toESM, i as __commonJSMin, n as createLucideIcon, r as require_react, t as require_jsx_runtime } from "./jsx-runtime-DNksDsTP.js";
import { n as require_react_dom, t as require_leaflet_src } from "./leaflet-src-Dc-ZD4n_.js";
import { t as availability } from "./availability-BIfWf5pU.js";
//#region ../bay-audit-4/node_modules/lucide-react/dist/esm/icons/compass.mjs
/**
* @license lucide-react v1.47.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$2 = {
	name: "compass",
	size: 24,
	node: [["circle", {
		cx: "12",
		cy: "12",
		r: "10",
		key: "1mglay"
	}], ["path", {
		d: "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",
		key: "9ktpf1"
	}]]
};
__iconData$2.node;
var Compass = createLucideIcon(__iconData$2);
//#endregion
//#region ../bay-audit-4/node_modules/lucide-react/dist/esm/icons/rotate-ccw.mjs
/**
* @license lucide-react v1.47.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$1 = {
	name: "rotate-ccw",
	size: 24,
	node: [["path", {
		d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
		key: "1357e3"
	}], ["path", {
		d: "M3 3v5h5",
		key: "1xhq8a"
	}]]
};
__iconData$1.node;
var RotateCcw = createLucideIcon(__iconData$1);
//#endregion
//#region ../bay-audit-4/node_modules/lucide-react/dist/esm/icons/rotate-cw.mjs
/**
* @license lucide-react v1.47.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData = {
	name: "rotate-cw",
	size: 24,
	node: [["path", {
		d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8",
		key: "1p45f6"
	}], ["path", {
		d: "M21 3v5h-5",
		key: "1q7to0"
	}]]
};
__iconData.node;
var RotateCw = createLucideIcon(__iconData);
require_react_dom();
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
function useAttribution(map, attribution) {
	const attributionRef = (0, import_react.useRef)(attribution);
	(0, import_react.useEffect)(function updateAttribution() {
		if (attribution !== attributionRef.current && map.attributionControl != null) {
			if (attributionRef.current != null) map.attributionControl.removeAttribution(attributionRef.current);
			if (attribution != null) map.attributionControl.addAttribution(attribution);
		}
		attributionRef.current = attribution;
	}, [map, attribution]);
}
//#endregion
//#region ../bay-audit-4/node_modules/@react-leaflet/core/lib/circle.js
function updateCircle(layer, props, prevProps) {
	if (props.center !== prevProps.center) layer.setLatLng(props.center);
	if (props.radius != null && props.radius !== prevProps.radius) layer.setRadius(props.radius);
}
function createLeafletContext(map) {
	return Object.freeze({
		__version: 1,
		map
	});
}
function extendContext(source, extra) {
	return Object.freeze({
		...source,
		...extra
	});
}
var LeafletContext = (0, import_react.createContext)(null);
function useLeafletContext() {
	const context = (0, import_react.use)(LeafletContext);
	if (context == null) throw new Error("No context provided: useLeafletContext() can only be used in a descendant of <MapContainer>");
	return context;
}
//#endregion
//#region ../bay-audit-4/node_modules/@react-leaflet/core/lib/component.js
function createContainerComponent(useElement) {
	function ContainerComponent(props, forwardedRef) {
		const { instance, context } = useElement(props).current;
		(0, import_react.useImperativeHandle)(forwardedRef, () => instance);
		const { children } = props;
		return children == null ? null : /*#__PURE__*/ import_react.createElement(LeafletContext, { value: context }, children);
	}
	return /*#__PURE__*/ (0, import_react.forwardRef)(ContainerComponent);
}
function createLeafComponent(useElement) {
	function LeafComponent(props, forwardedRef) {
		const { instance } = useElement(props).current;
		(0, import_react.useImperativeHandle)(forwardedRef, () => instance);
		return null;
	}
	return /*#__PURE__*/ (0, import_react.forwardRef)(LeafComponent);
}
//#endregion
//#region ../bay-audit-4/node_modules/@react-leaflet/core/lib/control.js
function createControlHook(useElement) {
	return function useLeafletControl(props) {
		const context = useLeafletContext();
		const elementRef = useElement(props, context);
		const { instance } = elementRef.current;
		const positionRef = (0, import_react.useRef)(props.position);
		const { position } = props;
		(0, import_react.useEffect)(function addControl() {
			instance.addTo(context.map);
			return function removeControl() {
				instance.remove();
			};
		}, [context.map, instance]);
		(0, import_react.useEffect)(function updateControl() {
			if (position != null && position !== positionRef.current) {
				instance.setPosition(position);
				positionRef.current = position;
			}
		}, [instance, position]);
		return elementRef;
	};
}
//#endregion
//#region ../bay-audit-4/node_modules/@react-leaflet/core/lib/events.js
function useEventHandlers(element, eventHandlers) {
	const eventHandlersRef = (0, import_react.useRef)(void 0);
	(0, import_react.useEffect)(function addEventHandlers() {
		if (eventHandlers != null) element.instance.on(eventHandlers);
		eventHandlersRef.current = eventHandlers;
		return function removeEventHandlers() {
			if (eventHandlersRef.current != null) element.instance.off(eventHandlersRef.current);
			eventHandlersRef.current = null;
		};
	}, [element, eventHandlers]);
}
//#endregion
//#region ../bay-audit-4/node_modules/@react-leaflet/core/lib/pane.js
function withPane(props, context) {
	const pane = props.pane ?? context.pane;
	return pane ? {
		...props,
		pane
	} : props;
}
//#endregion
//#region ../bay-audit-4/node_modules/@react-leaflet/core/lib/element.js
function createElementObject(instance, context, container) {
	return Object.freeze({
		instance,
		context,
		container
	});
}
function createElementHook(createElement, updateElement) {
	if (updateElement == null) return function useImmutableLeafletElement(props, context) {
		const elementRef = (0, import_react.useRef)(void 0);
		if (!elementRef.current) elementRef.current = createElement(props, context);
		return elementRef;
	};
	return function useMutableLeafletElement(props, context) {
		const elementRef = (0, import_react.useRef)(void 0);
		if (!elementRef.current) elementRef.current = createElement(props, context);
		const propsRef = (0, import_react.useRef)(props);
		const { instance } = elementRef.current;
		(0, import_react.useEffect)(function updateElementProps() {
			if (propsRef.current !== props) {
				updateElement(instance, props, propsRef.current);
				propsRef.current = props;
			}
		}, [
			instance,
			props,
			updateElement
		]);
		return elementRef;
	};
}
//#endregion
//#region ../bay-audit-4/node_modules/@react-leaflet/core/lib/layer.js
function useLayerLifecycle(element, context) {
	(0, import_react.useEffect)(function addLayer() {
		(context.layerContainer ?? context.map).addLayer(element.instance);
		return function removeLayer() {
			context.layerContainer?.removeLayer(element.instance);
			context.map.removeLayer(element.instance);
		};
	}, [context, element]);
}
function createLayerHook(useElement) {
	return function useLayer(props) {
		const context = useLeafletContext();
		const elementRef = useElement(withPane(props, context), context);
		useAttribution(context.map, props.attribution);
		useEventHandlers(elementRef.current, props.eventHandlers);
		useLayerLifecycle(elementRef.current, context);
		return elementRef;
	};
}
//#endregion
//#region ../bay-audit-4/node_modules/@react-leaflet/core/lib/path.js
function usePathOptions(element, props) {
	const optionsRef = (0, import_react.useRef)(void 0);
	(0, import_react.useEffect)(function updatePathOptions() {
		if (props.pathOptions !== optionsRef.current) {
			const options = props.pathOptions ?? {};
			element.instance.setStyle(options);
			optionsRef.current = options;
		}
	}, [element, props]);
}
function createPathHook(useElement) {
	return function usePath(props) {
		const context = useLeafletContext();
		const elementRef = useElement(withPane(props, context), context);
		useEventHandlers(elementRef.current, props.eventHandlers);
		useLayerLifecycle(elementRef.current, context);
		usePathOptions(elementRef.current, props);
		return elementRef;
	};
}
//#endregion
//#region ../bay-audit-4/node_modules/@react-leaflet/core/lib/generic.js
function createControlComponent(createInstance) {
	function createElement(props, context) {
		return createElementObject(createInstance(props), context);
	}
	return createLeafComponent(createControlHook(createElementHook(createElement)));
}
function createLayerComponent(createElement, updateElement) {
	return createContainerComponent(createLayerHook(createElementHook(createElement, updateElement)));
}
function createPathComponent(createElement, updateElement) {
	return createContainerComponent(createPathHook(createElementHook(createElement, updateElement)));
}
function createTileLayerComponent(createElement, updateElement) {
	return createLeafComponent(createLayerHook(createElementHook(createElement, updateElement)));
}
//#endregion
//#region ../bay-audit-4/node_modules/@react-leaflet/core/lib/grid-layer.js
function updateGridLayer(layer, props, prevProps) {
	const { opacity, zIndex } = props;
	if (opacity != null && opacity !== prevProps.opacity) layer.setOpacity(opacity);
	if (zIndex != null && zIndex !== prevProps.zIndex) layer.setZIndex(zIndex);
}
//#endregion
//#region ../bay-audit-4/node_modules/react-leaflet/lib/hooks.js
function useMap() {
	return useLeafletContext().map;
}
function useMapEvents(handlers) {
	const map = useMap();
	(0, import_react.useEffect)(function addMapEventHandlers() {
		map.on(handlers);
		return function removeMapEventHandlers() {
			map.off(handlers);
		};
	}, [map, handlers]);
	return map;
}
//#endregion
//#region ../bay-audit-4/node_modules/react-leaflet/lib/Circle.js
var import_leaflet_src = /* @__PURE__ */ __toESM(require_leaflet_src(), 1);
var Circle = createPathComponent(function createCircle({ center, children: _c, ...options }, ctx) {
	const circle = new import_leaflet_src.Circle(center, options);
	return createElementObject(circle, extendContext(ctx, { overlayContainer: circle }));
}, updateCircle);
//#endregion
//#region ../bay-audit-4/node_modules/react-leaflet/lib/MapContainer.js
function MapContainerComponent({ bounds, boundsOptions, center, children, className, id, placeholder, style, whenReady, zoom, ...options }, forwardedRef) {
	const [props] = (0, import_react.useState)({
		className,
		id,
		style
	});
	const [context, setContext] = (0, import_react.useState)(null);
	const mapInstanceRef = (0, import_react.useRef)(void 0);
	(0, import_react.useImperativeHandle)(forwardedRef, () => context?.map ?? null, [context]);
	const mapRef = (0, import_react.useCallback)((node) => {
		if (node !== null && !mapInstanceRef.current) {
			const map = new import_leaflet_src.Map(node, options);
			mapInstanceRef.current = map;
			if (center != null && zoom != null) map.setView(center, zoom);
			else if (bounds != null) map.fitBounds(bounds, boundsOptions);
			if (whenReady != null) map.whenReady(whenReady);
			setContext(createLeafletContext(map));
		}
	}, []);
	(0, import_react.useEffect)(() => {
		return () => {
			context?.map.remove();
		};
	}, [context]);
	const contents = context ? /*#__PURE__*/ import_react.createElement(LeafletContext, { value: context }, children) : placeholder ?? null;
	return /*#__PURE__*/ import_react.createElement("div", {
		...props,
		ref: mapRef
	}, contents);
}
var MapContainer = /*#__PURE__*/ (0, import_react.forwardRef)(MapContainerComponent);
//#endregion
//#region ../bay-audit-4/node_modules/react-leaflet/lib/Marker.js
var Marker = createLayerComponent(function createMarker({ position, ...options }, ctx) {
	const marker = new import_leaflet_src.Marker(position, options);
	return createElementObject(marker, extendContext(ctx, { overlayContainer: marker }));
}, function updateMarker(marker, props, prevProps) {
	if (props.position !== prevProps.position) marker.setLatLng(props.position);
	if (props.icon != null && props.icon !== prevProps.icon) marker.setIcon(props.icon);
	if (props.zIndexOffset != null && props.zIndexOffset !== prevProps.zIndexOffset) marker.setZIndexOffset(props.zIndexOffset);
	if (props.opacity != null && props.opacity !== prevProps.opacity) marker.setOpacity(props.opacity);
	if (marker.dragging != null && props.draggable !== prevProps.draggable) {
		if (props.draggable === true) marker.dragging.enable();
		else marker.dragging.disable();
	}
});
//#endregion
//#region ../bay-audit-4/node_modules/react-leaflet/lib/Polygon.js
var Polygon = createPathComponent(function createPolygon({ positions, ...options }, ctx) {
	const polygon = new import_leaflet_src.Polygon(positions, options);
	return createElementObject(polygon, extendContext(ctx, { overlayContainer: polygon }));
}, function updatePolygon(layer, props, prevProps) {
	if (props.positions !== prevProps.positions) layer.setLatLngs(props.positions);
});
//#endregion
//#region ../bay-audit-4/node_modules/react-leaflet/lib/TileLayer.js
var TileLayer = createTileLayerComponent(function createTileLayer({ url, ...options }, context) {
	return createElementObject(new import_leaflet_src.TileLayer(url, withPane(options, context)), context);
}, function updateTileLayer(layer, props, prevProps) {
	updateGridLayer(layer, props, prevProps);
	const { url } = props;
	if (url != null && url !== prevProps.url) layer.setUrl(url);
});
//#endregion
//#region ../bay-audit-4/node_modules/react-leaflet/lib/ZoomControl.js
var ZoomControl = createControlComponent(function createZoomControl(props) {
	return new import_leaflet_src.Control.Zoom(props);
});
(/* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(global, factory) {
		typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = global || self, factory((global.Leaflet = global.Leaflet || {}, global.Leaflet.markercluster = {})));
	})(exports, function(exports$1) {
		"use strict";
		var MarkerClusterGroup = L.MarkerClusterGroup = L.FeatureGroup.extend({
			options: {
				maxClusterRadius: 80,
				iconCreateFunction: null,
				clusterPane: L.Marker.prototype.options.pane,
				spiderfyOnEveryZoom: false,
				spiderfyOnMaxZoom: true,
				showCoverageOnHover: true,
				zoomToBoundsOnClick: true,
				singleMarkerMode: false,
				disableClusteringAtZoom: null,
				removeOutsideVisibleBounds: true,
				animate: true,
				animateAddingMarkers: false,
				spiderfyShapePositions: null,
				spiderfyDistanceMultiplier: 1,
				spiderLegPolylineOptions: {
					weight: 1.5,
					color: "#222",
					opacity: .5
				},
				chunkedLoading: false,
				chunkInterval: 200,
				chunkDelay: 50,
				chunkProgress: null,
				polygonOptions: {}
			},
			initialize: function(options) {
				L.Util.setOptions(this, options);
				if (!this.options.iconCreateFunction) this.options.iconCreateFunction = this._defaultIconCreateFunction;
				this._featureGroup = L.featureGroup();
				this._featureGroup.addEventParent(this);
				this._nonPointGroup = L.featureGroup();
				this._nonPointGroup.addEventParent(this);
				this._inZoomAnimation = 0;
				this._needsClustering = [];
				this._needsRemoving = [];
				this._currentShownBounds = null;
				this._queue = [];
				this._childMarkerEventHandlers = {
					"dragstart": this._childMarkerDragStart,
					"move": this._childMarkerMoved,
					"dragend": this._childMarkerDragEnd
				};
				var animate = L.DomUtil.TRANSITION && this.options.animate;
				L.extend(this, animate ? this._withAnimation : this._noAnimation);
				this._markerCluster = animate ? L.MarkerCluster : L.MarkerClusterNonAnimated;
			},
			addLayer: function(layer) {
				if (layer instanceof L.LayerGroup) return this.addLayers([layer]);
				if (!layer.getLatLng) {
					this._nonPointGroup.addLayer(layer);
					this.fire("layeradd", { layer });
					return this;
				}
				if (!this._map) {
					this._needsClustering.push(layer);
					this.fire("layeradd", { layer });
					return this;
				}
				if (this.hasLayer(layer)) return this;
				if (this._unspiderfy) this._unspiderfy();
				this._addLayer(layer, this._maxZoom);
				this.fire("layeradd", { layer });
				this._topClusterLevel._recalculateBounds();
				this._refreshClustersIcons();
				var visibleLayer = layer, currentZoom = this._zoom;
				if (layer.__parent) while (visibleLayer.__parent._zoom >= currentZoom) visibleLayer = visibleLayer.__parent;
				if (this._currentShownBounds.contains(visibleLayer.getLatLng())) {
					if (this.options.animateAddingMarkers) this._animationAddLayer(layer, visibleLayer);
					else this._animationAddLayerNonAnimated(layer, visibleLayer);
				}
				return this;
			},
			removeLayer: function(layer) {
				if (layer instanceof L.LayerGroup) return this.removeLayers([layer]);
				if (!layer.getLatLng) {
					this._nonPointGroup.removeLayer(layer);
					this.fire("layerremove", { layer });
					return this;
				}
				if (!this._map) {
					if (!this._arraySplice(this._needsClustering, layer) && this.hasLayer(layer)) this._needsRemoving.push({
						layer,
						latlng: layer._latlng
					});
					this.fire("layerremove", { layer });
					return this;
				}
				if (!layer.__parent) return this;
				if (this._unspiderfy) {
					this._unspiderfy();
					this._unspiderfyLayer(layer);
				}
				this._removeLayer(layer, true);
				this.fire("layerremove", { layer });
				this._topClusterLevel._recalculateBounds();
				this._refreshClustersIcons();
				layer.off(this._childMarkerEventHandlers, this);
				if (this._featureGroup.hasLayer(layer)) {
					this._featureGroup.removeLayer(layer);
					if (layer.clusterShow) layer.clusterShow();
				}
				return this;
			},
			addLayers: function(layersArray, skipLayerAddEvent) {
				if (!L.Util.isArray(layersArray)) return this.addLayer(layersArray);
				var fg = this._featureGroup, npg = this._nonPointGroup, chunked = this.options.chunkedLoading, chunkInterval = this.options.chunkInterval, chunkProgress = this.options.chunkProgress, l = layersArray.length, offset = 0, originalArray = true, m;
				if (this._map) {
					var started = (/* @__PURE__ */ new Date()).getTime();
					var process = L.bind(function() {
						var start = (/* @__PURE__ */ new Date()).getTime();
						if (this._map && this._unspiderfy) this._unspiderfy();
						for (; offset < l; offset++) {
							if (chunked && offset % 200 === 0) {
								if ((/* @__PURE__ */ new Date()).getTime() - start > chunkInterval) break;
							}
							m = layersArray[offset];
							if (m instanceof L.LayerGroup) {
								if (originalArray) {
									layersArray = layersArray.slice();
									originalArray = false;
								}
								this._extractNonGroupLayers(m, layersArray);
								l = layersArray.length;
								continue;
							}
							if (!m.getLatLng) {
								npg.addLayer(m);
								if (!skipLayerAddEvent) this.fire("layeradd", { layer: m });
								continue;
							}
							if (this.hasLayer(m)) continue;
							this._addLayer(m, this._maxZoom);
							if (!skipLayerAddEvent) this.fire("layeradd", { layer: m });
							if (m.__parent) {
								if (m.__parent.getChildCount() === 2) {
									var markers = m.__parent.getAllChildMarkers(), otherMarker = markers[0] === m ? markers[1] : markers[0];
									fg.removeLayer(otherMarker);
								}
							}
						}
						if (chunkProgress) chunkProgress(offset, l, (/* @__PURE__ */ new Date()).getTime() - started);
						if (offset === l) {
							this._topClusterLevel._recalculateBounds();
							this._refreshClustersIcons();
							this._topClusterLevel._recursivelyAddChildrenToMap(null, this._zoom, this._currentShownBounds);
						} else setTimeout(process, this.options.chunkDelay);
					}, this);
					process();
				} else {
					var needsClustering = this._needsClustering;
					for (; offset < l; offset++) {
						m = layersArray[offset];
						if (m instanceof L.LayerGroup) {
							if (originalArray) {
								layersArray = layersArray.slice();
								originalArray = false;
							}
							this._extractNonGroupLayers(m, layersArray);
							l = layersArray.length;
							continue;
						}
						if (!m.getLatLng) {
							npg.addLayer(m);
							continue;
						}
						if (this.hasLayer(m)) continue;
						needsClustering.push(m);
					}
				}
				return this;
			},
			removeLayers: function(layersArray) {
				var i, m, l = layersArray.length, fg = this._featureGroup, npg = this._nonPointGroup, originalArray = true;
				if (!this._map) {
					for (i = 0; i < l; i++) {
						m = layersArray[i];
						if (m instanceof L.LayerGroup) {
							if (originalArray) {
								layersArray = layersArray.slice();
								originalArray = false;
							}
							this._extractNonGroupLayers(m, layersArray);
							l = layersArray.length;
							continue;
						}
						this._arraySplice(this._needsClustering, m);
						npg.removeLayer(m);
						if (this.hasLayer(m)) this._needsRemoving.push({
							layer: m,
							latlng: m._latlng
						});
						this.fire("layerremove", { layer: m });
					}
					return this;
				}
				if (this._unspiderfy) {
					this._unspiderfy();
					var layersArray2 = layersArray.slice(), l2 = l;
					for (i = 0; i < l2; i++) {
						m = layersArray2[i];
						if (m instanceof L.LayerGroup) {
							this._extractNonGroupLayers(m, layersArray2);
							l2 = layersArray2.length;
							continue;
						}
						this._unspiderfyLayer(m);
					}
				}
				for (i = 0; i < l; i++) {
					m = layersArray[i];
					if (m instanceof L.LayerGroup) {
						if (originalArray) {
							layersArray = layersArray.slice();
							originalArray = false;
						}
						this._extractNonGroupLayers(m, layersArray);
						l = layersArray.length;
						continue;
					}
					if (!m.__parent) {
						npg.removeLayer(m);
						this.fire("layerremove", { layer: m });
						continue;
					}
					this._removeLayer(m, true, true);
					this.fire("layerremove", { layer: m });
					if (fg.hasLayer(m)) {
						fg.removeLayer(m);
						if (m.clusterShow) m.clusterShow();
					}
				}
				this._topClusterLevel._recalculateBounds();
				this._refreshClustersIcons();
				this._topClusterLevel._recursivelyAddChildrenToMap(null, this._zoom, this._currentShownBounds);
				return this;
			},
			clearLayers: function() {
				if (!this._map) {
					this._needsClustering = [];
					this._needsRemoving = [];
					delete this._gridClusters;
					delete this._gridUnclustered;
				}
				if (this._noanimationUnspiderfy) this._noanimationUnspiderfy();
				this._featureGroup.clearLayers();
				this._nonPointGroup.clearLayers();
				this.eachLayer(function(marker) {
					marker.off(this._childMarkerEventHandlers, this);
					delete marker.__parent;
				}, this);
				if (this._map) this._generateInitialClusters();
				return this;
			},
			getBounds: function() {
				var bounds = new L.LatLngBounds();
				if (this._topClusterLevel) bounds.extend(this._topClusterLevel._bounds);
				for (var i = this._needsClustering.length - 1; i >= 0; i--) bounds.extend(this._needsClustering[i].getLatLng());
				bounds.extend(this._nonPointGroup.getBounds());
				return bounds;
			},
			eachLayer: function(method, context) {
				var markers = this._needsClustering.slice(), needsRemoving = this._needsRemoving, thisNeedsRemoving, i, j;
				if (this._topClusterLevel) this._topClusterLevel.getAllChildMarkers(markers);
				for (i = markers.length - 1; i >= 0; i--) {
					thisNeedsRemoving = true;
					for (j = needsRemoving.length - 1; j >= 0; j--) if (needsRemoving[j].layer === markers[i]) {
						thisNeedsRemoving = false;
						break;
					}
					if (thisNeedsRemoving) method.call(context, markers[i]);
				}
				this._nonPointGroup.eachLayer(method, context);
			},
			getLayers: function() {
				var layers = [];
				this.eachLayer(function(l) {
					layers.push(l);
				});
				return layers;
			},
			getLayer: function(id) {
				var result = null;
				id = parseInt(id, 10);
				this.eachLayer(function(l) {
					if (L.stamp(l) === id) result = l;
				});
				return result;
			},
			hasLayer: function(layer) {
				if (!layer) return false;
				var i, anArray = this._needsClustering;
				for (i = anArray.length - 1; i >= 0; i--) if (anArray[i] === layer) return true;
				anArray = this._needsRemoving;
				for (i = anArray.length - 1; i >= 0; i--) if (anArray[i].layer === layer) return false;
				return !!(layer.__parent && layer.__parent._group === this) || this._nonPointGroup.hasLayer(layer);
			},
			zoomToShowLayer: function(layer, callback) {
				var map = this._map;
				if (typeof callback !== "function") callback = function() {};
				var showMarker = function() {
					if ((map.hasLayer(layer) || map.hasLayer(layer.__parent)) && !this._inZoomAnimation) {
						this._map.off("moveend", showMarker, this);
						this.off("animationend", showMarker, this);
						if (map.hasLayer(layer)) callback();
						else if (layer.__parent._icon) {
							this.once("spiderfied", callback, this);
							layer.__parent.spiderfy();
						}
					}
				};
				if (layer._icon && this._map.getBounds().contains(layer.getLatLng())) callback();
				else if (layer.__parent._zoom < Math.round(this._map._zoom)) {
					this._map.on("moveend", showMarker, this);
					this._map.panTo(layer.getLatLng());
				} else {
					this._map.on("moveend", showMarker, this);
					this.on("animationend", showMarker, this);
					layer.__parent.zoomToBounds();
				}
			},
			onAdd: function(map) {
				this._map = map;
				var i, l, layer;
				if (!isFinite(this._map.getMaxZoom())) throw "Map has no maxZoom specified";
				this._featureGroup.addTo(map);
				this._nonPointGroup.addTo(map);
				if (!this._gridClusters) this._generateInitialClusters();
				this._maxLat = map.options.crs.projection.MAX_LATITUDE;
				for (i = 0, l = this._needsRemoving.length; i < l; i++) {
					layer = this._needsRemoving[i];
					layer.newlatlng = layer.layer._latlng;
					layer.layer._latlng = layer.latlng;
				}
				for (i = 0, l = this._needsRemoving.length; i < l; i++) {
					layer = this._needsRemoving[i];
					this._removeLayer(layer.layer, true);
					layer.layer._latlng = layer.newlatlng;
				}
				this._needsRemoving = [];
				this._zoom = Math.round(this._map._zoom);
				this._currentShownBounds = this._getExpandedVisibleBounds();
				this._map.on("zoomend", this._zoomEnd, this);
				this._map.on("moveend", this._moveEnd, this);
				if (this._spiderfierOnAdd) this._spiderfierOnAdd();
				this._bindEvents();
				l = this._needsClustering;
				this._needsClustering = [];
				this.addLayers(l, true);
			},
			onRemove: function(map) {
				map.off("zoomend", this._zoomEnd, this);
				map.off("moveend", this._moveEnd, this);
				this._unbindEvents();
				this._map._mapPane.className = this._map._mapPane.className.replace(" leaflet-cluster-anim", "");
				if (this._spiderfierOnRemove) this._spiderfierOnRemove();
				delete this._maxLat;
				this._hideCoverage();
				this._featureGroup.remove();
				this._nonPointGroup.remove();
				this._featureGroup.clearLayers();
				this._map = null;
			},
			getVisibleParent: function(marker) {
				var vMarker = marker;
				while (vMarker && !vMarker._icon) vMarker = vMarker.__parent;
				return vMarker || null;
			},
			_arraySplice: function(anArray, obj) {
				for (var i = anArray.length - 1; i >= 0; i--) if (anArray[i] === obj) {
					anArray.splice(i, 1);
					return true;
				}
			},
			/**
			* Removes a marker from all _gridUnclustered zoom levels, starting at the supplied zoom.
			* @param marker to be removed from _gridUnclustered.
			* @param z integer bottom start zoom level (included)
			* @private
			*/
			_removeFromGridUnclustered: function(marker, z) {
				var map = this._map, gridUnclustered = this._gridUnclustered, minZoom = Math.floor(this._map.getMinZoom());
				for (; z >= minZoom; z--) if (!gridUnclustered[z].removeObject(marker, map.project(marker.getLatLng(), z))) break;
			},
			_childMarkerDragStart: function(e) {
				e.target.__dragStart = e.target._latlng;
			},
			_childMarkerMoved: function(e) {
				if (!this._ignoreMove && !e.target.__dragStart) {
					var isPopupOpen = e.target._popup && e.target._popup.isOpen();
					this._moveChild(e.target, e.oldLatLng, e.latlng);
					if (isPopupOpen) e.target.openPopup();
				}
			},
			_moveChild: function(layer, from, to) {
				layer._latlng = from;
				this.removeLayer(layer);
				layer._latlng = to;
				this.addLayer(layer);
			},
			_childMarkerDragEnd: function(e) {
				var dragStart = e.target.__dragStart;
				delete e.target.__dragStart;
				if (dragStart) this._moveChild(e.target, dragStart, e.target._latlng);
			},
			_removeLayer: function(marker, removeFromDistanceGrid, dontUpdateMap) {
				var gridClusters = this._gridClusters, gridUnclustered = this._gridUnclustered, fg = this._featureGroup, map = this._map, minZoom = Math.floor(this._map.getMinZoom());
				if (removeFromDistanceGrid) this._removeFromGridUnclustered(marker, this._maxZoom);
				var cluster = marker.__parent, markers = cluster._markers, otherMarker;
				this._arraySplice(markers, marker);
				while (cluster) {
					cluster._childCount--;
					cluster._boundsNeedUpdate = true;
					if (cluster._zoom < minZoom) break;
					else if (removeFromDistanceGrid && cluster._childCount <= 1) {
						otherMarker = cluster._markers[0] === marker ? cluster._markers[1] : cluster._markers[0];
						gridClusters[cluster._zoom].removeObject(cluster, map.project(cluster._cLatLng, cluster._zoom));
						gridUnclustered[cluster._zoom].addObject(otherMarker, map.project(otherMarker.getLatLng(), cluster._zoom));
						this._arraySplice(cluster.__parent._childClusters, cluster);
						cluster.__parent._markers.push(otherMarker);
						otherMarker.__parent = cluster.__parent;
						if (cluster._icon) {
							fg.removeLayer(cluster);
							if (!dontUpdateMap) fg.addLayer(otherMarker);
						}
					} else cluster._iconNeedsUpdate = true;
					cluster = cluster.__parent;
				}
				delete marker.__parent;
			},
			_isOrIsParent: function(el, oel) {
				while (oel) {
					if (el === oel) return true;
					oel = oel.parentNode;
				}
				return false;
			},
			fire: function(type, data, propagate) {
				if (data && data.layer instanceof L.MarkerCluster) {
					if (data.originalEvent && this._isOrIsParent(data.layer._icon, data.originalEvent.relatedTarget)) return;
					type = "cluster" + type;
				}
				L.FeatureGroup.prototype.fire.call(this, type, data, propagate);
			},
			listens: function(type, propagate) {
				return L.FeatureGroup.prototype.listens.call(this, type, propagate) || L.FeatureGroup.prototype.listens.call(this, "cluster" + type, propagate);
			},
			_defaultIconCreateFunction: function(cluster) {
				var childCount = cluster.getChildCount();
				var c = " marker-cluster-";
				if (childCount < 10) c += "small";
				else if (childCount < 100) c += "medium";
				else c += "large";
				return new L.DivIcon({
					html: "<div><span>" + childCount + "</span></div>",
					className: "marker-cluster" + c,
					iconSize: new L.Point(40, 40)
				});
			},
			_bindEvents: function() {
				var map = this._map, spiderfyOnMaxZoom = this.options.spiderfyOnMaxZoom, showCoverageOnHover = this.options.showCoverageOnHover, zoomToBoundsOnClick = this.options.zoomToBoundsOnClick, spiderfyOnEveryZoom = this.options.spiderfyOnEveryZoom;
				if (spiderfyOnMaxZoom || zoomToBoundsOnClick || spiderfyOnEveryZoom) this.on("clusterclick clusterkeypress", this._zoomOrSpiderfy, this);
				if (showCoverageOnHover) {
					this.on("clustermouseover", this._showCoverage, this);
					this.on("clustermouseout", this._hideCoverage, this);
					map.on("zoomend", this._hideCoverage, this);
				}
			},
			_zoomOrSpiderfy: function(e) {
				var cluster = e.layer, bottomCluster = cluster;
				if (e.type === "clusterkeypress" && e.originalEvent && e.originalEvent.keyCode !== 13) return;
				while (bottomCluster._childClusters.length === 1) bottomCluster = bottomCluster._childClusters[0];
				if (bottomCluster._zoom === this._maxZoom && bottomCluster._childCount === cluster._childCount && this.options.spiderfyOnMaxZoom) cluster.spiderfy();
				else if (this.options.zoomToBoundsOnClick) cluster.zoomToBounds();
				if (this.options.spiderfyOnEveryZoom) cluster.spiderfy();
				if (e.originalEvent && e.originalEvent.keyCode === 13) this._map._container.focus();
			},
			_showCoverage: function(e) {
				var map = this._map;
				if (this._inZoomAnimation) return;
				if (this._shownPolygon) map.removeLayer(this._shownPolygon);
				if (e.layer.getChildCount() > 2 && e.layer !== this._spiderfied) {
					this._shownPolygon = new L.Polygon(e.layer.getConvexHull(), this.options.polygonOptions);
					map.addLayer(this._shownPolygon);
				}
			},
			_hideCoverage: function() {
				if (this._shownPolygon) {
					this._map.removeLayer(this._shownPolygon);
					this._shownPolygon = null;
				}
			},
			_unbindEvents: function() {
				var spiderfyOnMaxZoom = this.options.spiderfyOnMaxZoom, showCoverageOnHover = this.options.showCoverageOnHover, zoomToBoundsOnClick = this.options.zoomToBoundsOnClick, spiderfyOnEveryZoom = this.options.spiderfyOnEveryZoom, map = this._map;
				if (spiderfyOnMaxZoom || zoomToBoundsOnClick || spiderfyOnEveryZoom) this.off("clusterclick clusterkeypress", this._zoomOrSpiderfy, this);
				if (showCoverageOnHover) {
					this.off("clustermouseover", this._showCoverage, this);
					this.off("clustermouseout", this._hideCoverage, this);
					map.off("zoomend", this._hideCoverage, this);
				}
			},
			_zoomEnd: function() {
				if (!this._map) return;
				this._mergeSplitClusters();
				this._zoom = Math.round(this._map._zoom);
				this._currentShownBounds = this._getExpandedVisibleBounds();
			},
			_moveEnd: function() {
				if (this._inZoomAnimation) return;
				var newBounds = this._getExpandedVisibleBounds();
				this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, Math.floor(this._map.getMinZoom()), this._zoom, newBounds);
				this._topClusterLevel._recursivelyAddChildrenToMap(null, Math.round(this._map._zoom), newBounds);
				this._currentShownBounds = newBounds;
			},
			_generateInitialClusters: function() {
				var maxZoom = Math.ceil(this._map.getMaxZoom()), minZoom = Math.floor(this._map.getMinZoom()), radius = this.options.maxClusterRadius, radiusFn = radius;
				if (typeof radius !== "function") radiusFn = function() {
					return radius;
				};
				if (this.options.disableClusteringAtZoom !== null) maxZoom = this.options.disableClusteringAtZoom - 1;
				this._maxZoom = maxZoom;
				this._gridClusters = {};
				this._gridUnclustered = {};
				for (var zoom = maxZoom; zoom >= minZoom; zoom--) {
					this._gridClusters[zoom] = new L.DistanceGrid(radiusFn(zoom));
					this._gridUnclustered[zoom] = new L.DistanceGrid(radiusFn(zoom));
				}
				this._topClusterLevel = new this._markerCluster(this, minZoom - 1);
			},
			_addLayer: function(layer, zoom) {
				var gridClusters = this._gridClusters, gridUnclustered = this._gridUnclustered, minZoom = Math.floor(this._map.getMinZoom()), markerPoint, z;
				if (this.options.singleMarkerMode) this._overrideMarkerIcon(layer);
				layer.on(this._childMarkerEventHandlers, this);
				for (; zoom >= minZoom; zoom--) {
					markerPoint = this._map.project(layer.getLatLng(), zoom);
					var closest = gridClusters[zoom].getNearObject(markerPoint);
					if (closest) {
						closest._addChild(layer);
						layer.__parent = closest;
						return;
					}
					closest = gridUnclustered[zoom].getNearObject(markerPoint);
					if (closest) {
						var parent = closest.__parent;
						if (parent) this._removeLayer(closest, false);
						var newCluster = new this._markerCluster(this, zoom, closest, layer);
						gridClusters[zoom].addObject(newCluster, this._map.project(newCluster._cLatLng, zoom));
						closest.__parent = newCluster;
						layer.__parent = newCluster;
						var lastParent = newCluster;
						for (z = zoom - 1; z > parent._zoom; z--) {
							lastParent = new this._markerCluster(this, z, lastParent);
							gridClusters[z].addObject(lastParent, this._map.project(closest.getLatLng(), z));
						}
						parent._addChild(lastParent);
						this._removeFromGridUnclustered(closest, zoom);
						return;
					}
					gridUnclustered[zoom].addObject(layer, markerPoint);
				}
				this._topClusterLevel._addChild(layer);
				layer.__parent = this._topClusterLevel;
			},
			/**
			* Refreshes the icon of all "dirty" visible clusters.
			* Non-visible "dirty" clusters will be updated when they are added to the map.
			* @private
			*/
			_refreshClustersIcons: function() {
				this._featureGroup.eachLayer(function(c) {
					if (c instanceof L.MarkerCluster && c._iconNeedsUpdate) c._updateIcon();
				});
			},
			_enqueue: function(fn) {
				this._queue.push(fn);
				if (!this._queueTimeout) this._queueTimeout = setTimeout(L.bind(this._processQueue, this), 300);
			},
			_processQueue: function() {
				for (var i = 0; i < this._queue.length; i++) this._queue[i].call(this);
				this._queue.length = 0;
				clearTimeout(this._queueTimeout);
				this._queueTimeout = null;
			},
			_mergeSplitClusters: function() {
				var mapZoom = Math.round(this._map._zoom);
				this._processQueue();
				if (this._zoom < mapZoom && this._currentShownBounds.intersects(this._getExpandedVisibleBounds())) {
					this._animationStart();
					this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, Math.floor(this._map.getMinZoom()), this._zoom, this._getExpandedVisibleBounds());
					this._animationZoomIn(this._zoom, mapZoom);
				} else if (this._zoom > mapZoom) {
					this._animationStart();
					this._animationZoomOut(this._zoom, mapZoom);
				} else this._moveEnd();
			},
			_getExpandedVisibleBounds: function() {
				if (!this.options.removeOutsideVisibleBounds) return this._mapBoundsInfinite;
				else if (L.Browser.mobile) return this._checkBoundsMaxLat(this._map.getBounds());
				return this._checkBoundsMaxLat(this._map.getBounds().pad(1));
			},
			/**
			* Expands the latitude to Infinity (or -Infinity) if the input bounds reach the map projection maximum defined latitude
			* (in the case of Web/Spherical Mercator, it is 85.0511287798 / see https://en.wikipedia.org/wiki/Web_Mercator#Formulas).
			* Otherwise, the removeOutsideVisibleBounds option will remove markers beyond that limit, whereas the same markers without
			* this option (or outside MCG) will have their position floored (ceiled) by the projection and rendered at that limit,
			* making the user think that MCG "eats" them and never displays them again.
			* @param bounds L.LatLngBounds
			* @returns {L.LatLngBounds}
			* @private
			*/
			_checkBoundsMaxLat: function(bounds) {
				var maxLat = this._maxLat;
				if (maxLat !== void 0) {
					if (bounds.getNorth() >= maxLat) bounds._northEast.lat = Infinity;
					if (bounds.getSouth() <= -maxLat) bounds._southWest.lat = -Infinity;
				}
				return bounds;
			},
			_animationAddLayerNonAnimated: function(layer, newCluster) {
				if (newCluster === layer) this._featureGroup.addLayer(layer);
				else if (newCluster._childCount === 2) {
					newCluster._addToMap();
					var markers = newCluster.getAllChildMarkers();
					this._featureGroup.removeLayer(markers[0]);
					this._featureGroup.removeLayer(markers[1]);
				} else newCluster._updateIcon();
			},
			/**
			* Extracts individual (i.e. non-group) layers from a Layer Group.
			* @param group to extract layers from.
			* @param output {Array} in which to store the extracted layers.
			* @returns {*|Array}
			* @private
			*/
			_extractNonGroupLayers: function(group, output) {
				var layers = group.getLayers(), i = 0, layer;
				output = output || [];
				for (; i < layers.length; i++) {
					layer = layers[i];
					if (layer instanceof L.LayerGroup) {
						this._extractNonGroupLayers(layer, output);
						continue;
					}
					output.push(layer);
				}
				return output;
			},
			/**
			* Implements the singleMarkerMode option.
			* @param layer Marker to re-style using the Clusters iconCreateFunction.
			* @returns {L.Icon} The newly created icon.
			* @private
			*/
			_overrideMarkerIcon: function(layer) {
				return layer.options.icon = this.options.iconCreateFunction({
					getChildCount: function() {
						return 1;
					},
					getAllChildMarkers: function() {
						return [layer];
					}
				});
			}
		});
		L.MarkerClusterGroup.include({ _mapBoundsInfinite: new L.LatLngBounds(new L.LatLng(-Infinity, -Infinity), new L.LatLng(Infinity, Infinity)) });
		L.MarkerClusterGroup.include({
			_noAnimation: {
				_animationStart: function() {},
				_animationZoomIn: function(previousZoomLevel, newZoomLevel) {
					this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, Math.floor(this._map.getMinZoom()), previousZoomLevel);
					this._topClusterLevel._recursivelyAddChildrenToMap(null, newZoomLevel, this._getExpandedVisibleBounds());
					this.fire("animationend");
				},
				_animationZoomOut: function(previousZoomLevel, newZoomLevel) {
					this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, Math.floor(this._map.getMinZoom()), previousZoomLevel);
					this._topClusterLevel._recursivelyAddChildrenToMap(null, newZoomLevel, this._getExpandedVisibleBounds());
					this.fire("animationend");
				},
				_animationAddLayer: function(layer, newCluster) {
					this._animationAddLayerNonAnimated(layer, newCluster);
				}
			},
			_withAnimation: {
				_animationStart: function() {
					this._map._mapPane.className += " leaflet-cluster-anim";
					this._inZoomAnimation++;
				},
				_animationZoomIn: function(previousZoomLevel, newZoomLevel) {
					var bounds = this._getExpandedVisibleBounds(), fg = this._featureGroup, minZoom = Math.floor(this._map.getMinZoom()), i;
					this._ignoreMove = true;
					this._topClusterLevel._recursively(bounds, previousZoomLevel, minZoom, function(c) {
						var startPos = c._latlng, markers = c._markers, m;
						if (!bounds.contains(startPos)) startPos = null;
						if (c._isSingleParent() && previousZoomLevel + 1 === newZoomLevel) {
							fg.removeLayer(c);
							c._recursivelyAddChildrenToMap(null, newZoomLevel, bounds);
						} else {
							c.clusterHide();
							c._recursivelyAddChildrenToMap(startPos, newZoomLevel, bounds);
						}
						for (i = markers.length - 1; i >= 0; i--) {
							m = markers[i];
							if (!bounds.contains(m._latlng)) fg.removeLayer(m);
						}
					});
					this._forceLayout();
					this._topClusterLevel._recursivelyBecomeVisible(bounds, newZoomLevel);
					fg.eachLayer(function(n) {
						if (!(n instanceof L.MarkerCluster) && n._icon) n.clusterShow();
					});
					this._topClusterLevel._recursively(bounds, previousZoomLevel, newZoomLevel, function(c) {
						c._recursivelyRestoreChildPositions(newZoomLevel);
					});
					this._ignoreMove = false;
					this._enqueue(function() {
						this._topClusterLevel._recursively(bounds, previousZoomLevel, minZoom, function(c) {
							fg.removeLayer(c);
							c.clusterShow();
						});
						this._animationEnd();
					});
				},
				_animationZoomOut: function(previousZoomLevel, newZoomLevel) {
					this._animationZoomOutSingle(this._topClusterLevel, previousZoomLevel - 1, newZoomLevel);
					this._topClusterLevel._recursivelyAddChildrenToMap(null, newZoomLevel, this._getExpandedVisibleBounds());
					this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, Math.floor(this._map.getMinZoom()), previousZoomLevel, this._getExpandedVisibleBounds());
				},
				_animationAddLayer: function(layer, newCluster) {
					var me = this, fg = this._featureGroup;
					fg.addLayer(layer);
					if (newCluster !== layer) {
						if (newCluster._childCount > 2) {
							newCluster._updateIcon();
							this._forceLayout();
							this._animationStart();
							layer._setPos(this._map.latLngToLayerPoint(newCluster.getLatLng()));
							layer.clusterHide();
							this._enqueue(function() {
								fg.removeLayer(layer);
								layer.clusterShow();
								me._animationEnd();
							});
						} else {
							this._forceLayout();
							me._animationStart();
							me._animationZoomOutSingle(newCluster, this._map.getMaxZoom(), this._zoom);
						}
					}
				}
			},
			_animationZoomOutSingle: function(cluster, previousZoomLevel, newZoomLevel) {
				var bounds = this._getExpandedVisibleBounds(), minZoom = Math.floor(this._map.getMinZoom());
				cluster._recursivelyAnimateChildrenInAndAddSelfToMap(bounds, minZoom, previousZoomLevel + 1, newZoomLevel);
				var me = this;
				this._forceLayout();
				cluster._recursivelyBecomeVisible(bounds, newZoomLevel);
				this._enqueue(function() {
					if (cluster._childCount === 1) {
						var m = cluster._markers[0];
						this._ignoreMove = true;
						m.setLatLng(m.getLatLng());
						this._ignoreMove = false;
						if (m.clusterShow) m.clusterShow();
					} else cluster._recursively(bounds, newZoomLevel, minZoom, function(c) {
						c._recursivelyRemoveChildrenFromMap(bounds, minZoom, previousZoomLevel + 1);
					});
					me._animationEnd();
				});
			},
			_animationEnd: function() {
				if (this._map) this._map._mapPane.className = this._map._mapPane.className.replace(" leaflet-cluster-anim", "");
				this._inZoomAnimation--;
				this.fire("animationend");
			},
			_forceLayout: function() {
				L.Util.falseFn(document.body.offsetWidth);
			}
		});
		L.markerClusterGroup = function(options) {
			return new L.MarkerClusterGroup(options);
		};
		var MarkerCluster = L.MarkerCluster = L.Marker.extend({
			options: L.Icon.prototype.options,
			initialize: function(group, zoom, a, b) {
				L.Marker.prototype.initialize.call(this, a ? a._cLatLng || a.getLatLng() : new L.LatLng(0, 0), {
					icon: this,
					pane: group.options.clusterPane
				});
				this._group = group;
				this._zoom = zoom;
				this._markers = [];
				this._childClusters = [];
				this._childCount = 0;
				this._iconNeedsUpdate = true;
				this._boundsNeedUpdate = true;
				this._bounds = new L.LatLngBounds();
				if (a) this._addChild(a);
				if (b) this._addChild(b);
			},
			getAllChildMarkers: function(storageArray, ignoreDraggedMarker) {
				storageArray = storageArray || [];
				for (var i = this._childClusters.length - 1; i >= 0; i--) this._childClusters[i].getAllChildMarkers(storageArray, ignoreDraggedMarker);
				for (var j = this._markers.length - 1; j >= 0; j--) {
					if (ignoreDraggedMarker && this._markers[j].__dragStart) continue;
					storageArray.push(this._markers[j]);
				}
				return storageArray;
			},
			getChildCount: function() {
				return this._childCount;
			},
			zoomToBounds: function(fitBoundsOptions) {
				var childClusters = this._childClusters.slice(), map = this._group._map, boundsZoom = map.getBoundsZoom(this._bounds), zoom = this._zoom + 1, mapZoom = map.getZoom(), i;
				while (childClusters.length > 0 && boundsZoom > zoom) {
					zoom++;
					var newClusters = [];
					for (i = 0; i < childClusters.length; i++) newClusters = newClusters.concat(childClusters[i]._childClusters);
					childClusters = newClusters;
				}
				if (boundsZoom > zoom) this._group._map.setView(this._latlng, zoom);
				else if (boundsZoom <= mapZoom) this._group._map.setView(this._latlng, mapZoom + 1);
				else this._group._map.fitBounds(this._bounds, fitBoundsOptions);
			},
			getBounds: function() {
				var bounds = new L.LatLngBounds();
				bounds.extend(this._bounds);
				return bounds;
			},
			_updateIcon: function() {
				this._iconNeedsUpdate = true;
				if (this._icon) this.setIcon(this);
			},
			createIcon: function() {
				if (this._iconNeedsUpdate) {
					this._iconObj = this._group.options.iconCreateFunction(this);
					this._iconNeedsUpdate = false;
				}
				return this._iconObj.createIcon();
			},
			createShadow: function() {
				return this._iconObj.createShadow();
			},
			_addChild: function(new1, isNotificationFromChild) {
				this._iconNeedsUpdate = true;
				this._boundsNeedUpdate = true;
				this._setClusterCenter(new1);
				if (new1 instanceof L.MarkerCluster) {
					if (!isNotificationFromChild) {
						this._childClusters.push(new1);
						new1.__parent = this;
					}
					this._childCount += new1._childCount;
				} else {
					if (!isNotificationFromChild) this._markers.push(new1);
					this._childCount++;
				}
				if (this.__parent) this.__parent._addChild(new1, true);
			},
			/**
			* Makes sure the cluster center is set. If not, uses the child center if it is a cluster, or the marker position.
			* @param child L.MarkerCluster|L.Marker that will be used as cluster center if not defined yet.
			* @private
			*/
			_setClusterCenter: function(child) {
				if (!this._cLatLng) this._cLatLng = child._cLatLng || child._latlng;
			},
			/**
			* Assigns impossible bounding values so that the next extend entirely determines the new bounds.
			* This method avoids having to trash the previous L.LatLngBounds object and to create a new one, which is much slower for this class.
			* As long as the bounds are not extended, most other methods would probably fail, as they would with bounds initialized but not extended.
			* @private
			*/
			_resetBounds: function() {
				var bounds = this._bounds;
				if (bounds._southWest) {
					bounds._southWest.lat = Infinity;
					bounds._southWest.lng = Infinity;
				}
				if (bounds._northEast) {
					bounds._northEast.lat = -Infinity;
					bounds._northEast.lng = -Infinity;
				}
			},
			_recalculateBounds: function() {
				var markers = this._markers, childClusters = this._childClusters, latSum = 0, lngSum = 0, totalCount = this._childCount, i, child, childLatLng, childCount;
				if (totalCount === 0) return;
				this._resetBounds();
				for (i = 0; i < markers.length; i++) {
					childLatLng = markers[i]._latlng;
					this._bounds.extend(childLatLng);
					latSum += childLatLng.lat;
					lngSum += childLatLng.lng;
				}
				for (i = 0; i < childClusters.length; i++) {
					child = childClusters[i];
					if (child._boundsNeedUpdate) child._recalculateBounds();
					this._bounds.extend(child._bounds);
					childLatLng = child._wLatLng;
					childCount = child._childCount;
					latSum += childLatLng.lat * childCount;
					lngSum += childLatLng.lng * childCount;
				}
				this._latlng = this._wLatLng = new L.LatLng(latSum / totalCount, lngSum / totalCount);
				this._boundsNeedUpdate = false;
			},
			_addToMap: function(startPos) {
				if (startPos) {
					this._backupLatlng = this._latlng;
					this.setLatLng(startPos);
				}
				this._group._featureGroup.addLayer(this);
			},
			_recursivelyAnimateChildrenIn: function(bounds, center, maxZoom) {
				this._recursively(bounds, this._group._map.getMinZoom(), maxZoom - 1, function(c) {
					var markers = c._markers, i, m;
					for (i = markers.length - 1; i >= 0; i--) {
						m = markers[i];
						if (m._icon) {
							m._setPos(center);
							m.clusterHide();
						}
					}
				}, function(c) {
					var childClusters = c._childClusters, j, cm;
					for (j = childClusters.length - 1; j >= 0; j--) {
						cm = childClusters[j];
						if (cm._icon) {
							cm._setPos(center);
							cm.clusterHide();
						}
					}
				});
			},
			_recursivelyAnimateChildrenInAndAddSelfToMap: function(bounds, mapMinZoom, previousZoomLevel, newZoomLevel) {
				this._recursively(bounds, newZoomLevel, mapMinZoom, function(c) {
					c._recursivelyAnimateChildrenIn(bounds, c._group._map.latLngToLayerPoint(c.getLatLng()).round(), previousZoomLevel);
					if (c._isSingleParent() && previousZoomLevel - 1 === newZoomLevel) {
						c.clusterShow();
						c._recursivelyRemoveChildrenFromMap(bounds, mapMinZoom, previousZoomLevel);
					} else c.clusterHide();
					c._addToMap();
				});
			},
			_recursivelyBecomeVisible: function(bounds, zoomLevel) {
				this._recursively(bounds, this._group._map.getMinZoom(), zoomLevel, null, function(c) {
					c.clusterShow();
				});
			},
			_recursivelyAddChildrenToMap: function(startPos, zoomLevel, bounds) {
				this._recursively(bounds, this._group._map.getMinZoom() - 1, zoomLevel, function(c) {
					if (zoomLevel === c._zoom) return;
					for (var i = c._markers.length - 1; i >= 0; i--) {
						var nm = c._markers[i];
						if (!bounds.contains(nm._latlng)) continue;
						if (startPos) {
							nm._backupLatlng = nm.getLatLng();
							nm.setLatLng(startPos);
							if (nm.clusterHide) nm.clusterHide();
						}
						c._group._featureGroup.addLayer(nm);
					}
				}, function(c) {
					c._addToMap(startPos);
				});
			},
			_recursivelyRestoreChildPositions: function(zoomLevel) {
				for (var i = this._markers.length - 1; i >= 0; i--) {
					var nm = this._markers[i];
					if (nm._backupLatlng) {
						nm.setLatLng(nm._backupLatlng);
						delete nm._backupLatlng;
					}
				}
				if (zoomLevel - 1 === this._zoom) for (var j = this._childClusters.length - 1; j >= 0; j--) this._childClusters[j]._restorePosition();
				else for (var k = this._childClusters.length - 1; k >= 0; k--) this._childClusters[k]._recursivelyRestoreChildPositions(zoomLevel);
			},
			_restorePosition: function() {
				if (this._backupLatlng) {
					this.setLatLng(this._backupLatlng);
					delete this._backupLatlng;
				}
			},
			_recursivelyRemoveChildrenFromMap: function(previousBounds, mapMinZoom, zoomLevel, exceptBounds) {
				var m, i;
				this._recursively(previousBounds, mapMinZoom - 1, zoomLevel - 1, function(c) {
					for (i = c._markers.length - 1; i >= 0; i--) {
						m = c._markers[i];
						if (!exceptBounds || !exceptBounds.contains(m._latlng)) {
							c._group._featureGroup.removeLayer(m);
							if (m.clusterShow) m.clusterShow();
						}
					}
				}, function(c) {
					for (i = c._childClusters.length - 1; i >= 0; i--) {
						m = c._childClusters[i];
						if (!exceptBounds || !exceptBounds.contains(m._latlng)) {
							c._group._featureGroup.removeLayer(m);
							if (m.clusterShow) m.clusterShow();
						}
					}
				});
			},
			_recursively: function(boundsToApplyTo, zoomLevelToStart, zoomLevelToStop, runAtEveryLevel, runAtBottomLevel) {
				var childClusters = this._childClusters, zoom = this._zoom, i, c;
				if (zoomLevelToStart <= zoom) {
					if (runAtEveryLevel) runAtEveryLevel(this);
					if (runAtBottomLevel && zoom === zoomLevelToStop) runAtBottomLevel(this);
				}
				if (zoom < zoomLevelToStart || zoom < zoomLevelToStop) for (i = childClusters.length - 1; i >= 0; i--) {
					c = childClusters[i];
					if (c._boundsNeedUpdate) c._recalculateBounds();
					if (boundsToApplyTo.intersects(c._bounds)) c._recursively(boundsToApplyTo, zoomLevelToStart, zoomLevelToStop, runAtEveryLevel, runAtBottomLevel);
				}
			},
			_isSingleParent: function() {
				return this._childClusters.length > 0 && this._childClusters[0]._childCount === this._childCount;
			}
		});
		L.Marker.include({
			clusterHide: function() {
				var backup = this.options.opacity;
				this.setOpacity(0);
				this.options.opacity = backup;
				return this;
			},
			clusterShow: function() {
				return this.setOpacity(this.options.opacity);
			}
		});
		L.DistanceGrid = function(cellSize) {
			this._cellSize = cellSize;
			this._sqCellSize = cellSize * cellSize;
			this._grid = {};
			this._objectPoint = {};
		};
		L.DistanceGrid.prototype = {
			addObject: function(obj, point) {
				var x = this._getCoord(point.x), y = this._getCoord(point.y), grid = this._grid, row = grid[y] = grid[y] || {}, cell = row[x] = row[x] || [], stamp = L.Util.stamp(obj);
				this._objectPoint[stamp] = point;
				cell.push(obj);
			},
			updateObject: function(obj, point) {
				this.removeObject(obj);
				this.addObject(obj, point);
			},
			removeObject: function(obj, point) {
				var x = this._getCoord(point.x), y = this._getCoord(point.y), grid = this._grid, row = grid[y] = grid[y] || {}, cell = row[x] = row[x] || [], i, len;
				delete this._objectPoint[L.Util.stamp(obj)];
				for (i = 0, len = cell.length; i < len; i++) if (cell[i] === obj) {
					cell.splice(i, 1);
					if (len === 1) delete row[x];
					return true;
				}
			},
			eachObject: function(fn, context) {
				var i, j, k, len, row, cell, removed, grid = this._grid;
				for (i in grid) {
					row = grid[i];
					for (j in row) {
						cell = row[j];
						for (k = 0, len = cell.length; k < len; k++) {
							removed = fn.call(context, cell[k]);
							if (removed) {
								k--;
								len--;
							}
						}
					}
				}
			},
			getNearObject: function(point) {
				var x = this._getCoord(point.x), y = this._getCoord(point.y), i, j, k, row, cell, len, obj, dist, objectPoint = this._objectPoint, closestDistSq = this._sqCellSize, closest = null;
				for (i = y - 1; i <= y + 1; i++) {
					row = this._grid[i];
					if (row) for (j = x - 1; j <= x + 1; j++) {
						cell = row[j];
						if (cell) for (k = 0, len = cell.length; k < len; k++) {
							obj = cell[k];
							dist = this._sqDist(objectPoint[L.Util.stamp(obj)], point);
							if (dist < closestDistSq || dist <= closestDistSq && closest === null) {
								closestDistSq = dist;
								closest = obj;
							}
						}
					}
				}
				return closest;
			},
			_getCoord: function(x) {
				var coord = Math.floor(x / this._cellSize);
				return isFinite(coord) ? coord : x;
			},
			_sqDist: function(p, p2) {
				var dx = p2.x - p.x, dy = p2.y - p.y;
				return dx * dx + dy * dy;
			}
		};
		(function() {
			L.QuickHull = {
				getDistant: function(cpt, bl) {
					var vY = bl[1].lat - bl[0].lat;
					return (bl[0].lng - bl[1].lng) * (cpt.lat - bl[0].lat) + vY * (cpt.lng - bl[0].lng);
				},
				findMostDistantPointFromBaseLine: function(baseLine, latLngs) {
					var maxD = 0, maxPt = null, newPoints = [], i, pt, d;
					for (i = latLngs.length - 1; i >= 0; i--) {
						pt = latLngs[i];
						d = this.getDistant(pt, baseLine);
						if (d > 0) newPoints.push(pt);
						else continue;
						if (d > maxD) {
							maxD = d;
							maxPt = pt;
						}
					}
					return {
						maxPoint: maxPt,
						newPoints
					};
				},
				buildConvexHull: function(baseLine, latLngs) {
					var convexHullBaseLines = [], t = this.findMostDistantPointFromBaseLine(baseLine, latLngs);
					if (t.maxPoint) {
						convexHullBaseLines = convexHullBaseLines.concat(this.buildConvexHull([baseLine[0], t.maxPoint], t.newPoints));
						convexHullBaseLines = convexHullBaseLines.concat(this.buildConvexHull([t.maxPoint, baseLine[1]], t.newPoints));
						return convexHullBaseLines;
					} else return [baseLine[0]];
				},
				getConvexHull: function(latLngs) {
					var maxLat = false, minLat = false, maxLng = false, minLng = false, maxLatPt = null, minLatPt = null, maxLngPt = null, minLngPt = null, maxPt = null, minPt = null, i;
					for (i = latLngs.length - 1; i >= 0; i--) {
						var pt = latLngs[i];
						if (maxLat === false || pt.lat > maxLat) {
							maxLatPt = pt;
							maxLat = pt.lat;
						}
						if (minLat === false || pt.lat < minLat) {
							minLatPt = pt;
							minLat = pt.lat;
						}
						if (maxLng === false || pt.lng > maxLng) {
							maxLngPt = pt;
							maxLng = pt.lng;
						}
						if (minLng === false || pt.lng < minLng) {
							minLngPt = pt;
							minLng = pt.lng;
						}
					}
					if (minLat !== maxLat) {
						minPt = minLatPt;
						maxPt = maxLatPt;
					} else {
						minPt = minLngPt;
						maxPt = maxLngPt;
					}
					return [].concat(this.buildConvexHull([minPt, maxPt], latLngs), this.buildConvexHull([maxPt, minPt], latLngs));
				}
			};
		})();
		L.MarkerCluster.include({ getConvexHull: function() {
			var childMarkers = this.getAllChildMarkers(), points = [], p, i;
			for (i = childMarkers.length - 1; i >= 0; i--) {
				p = childMarkers[i].getLatLng();
				points.push(p);
			}
			return L.QuickHull.getConvexHull(points);
		} });
		L.MarkerCluster.include({
			_2PI: Math.PI * 2,
			_circleFootSeparation: 25,
			_circleStartAngle: 0,
			_spiralFootSeparation: 28,
			_spiralLengthStart: 11,
			_spiralLengthFactor: 5,
			_circleSpiralSwitchover: 9,
			spiderfy: function() {
				if (this._group._spiderfied === this || this._group._inZoomAnimation) return;
				var childMarkers = this.getAllChildMarkers(null, true), center = this._group._map.latLngToLayerPoint(this._latlng), positions;
				this._group._unspiderfy();
				this._group._spiderfied = this;
				if (this._group.options.spiderfyShapePositions) positions = this._group.options.spiderfyShapePositions(childMarkers.length, center);
				else if (childMarkers.length >= this._circleSpiralSwitchover) positions = this._generatePointsSpiral(childMarkers.length, center);
				else {
					center.y += 10;
					positions = this._generatePointsCircle(childMarkers.length, center);
				}
				this._animationSpiderfy(childMarkers, positions);
			},
			unspiderfy: function(zoomDetails) {
				if (this._group._inZoomAnimation) return;
				this._animationUnspiderfy(zoomDetails);
				this._group._spiderfied = null;
			},
			_generatePointsCircle: function(count, centerPt) {
				var legLength = this._group.options.spiderfyDistanceMultiplier * this._circleFootSeparation * (2 + count) / this._2PI, angleStep = this._2PI / count, res = [], i, angle;
				legLength = Math.max(legLength, 35);
				res.length = count;
				for (i = 0; i < count; i++) {
					angle = this._circleStartAngle + i * angleStep;
					res[i] = new L.Point(centerPt.x + legLength * Math.cos(angle), centerPt.y + legLength * Math.sin(angle))._round();
				}
				return res;
			},
			_generatePointsSpiral: function(count, centerPt) {
				var spiderfyDistanceMultiplier = this._group.options.spiderfyDistanceMultiplier, legLength = spiderfyDistanceMultiplier * this._spiralLengthStart, separation = spiderfyDistanceMultiplier * this._spiralFootSeparation, lengthFactor = spiderfyDistanceMultiplier * this._spiralLengthFactor * this._2PI, angle = 0, res = [], i;
				res.length = count;
				for (i = count; i >= 0; i--) {
					if (i < count) res[i] = new L.Point(centerPt.x + legLength * Math.cos(angle), centerPt.y + legLength * Math.sin(angle))._round();
					angle += separation / legLength + i * 5e-4;
					legLength += lengthFactor / angle;
				}
				return res;
			},
			_noanimationUnspiderfy: function() {
				var group = this._group, map = group._map, fg = group._featureGroup, childMarkers = this.getAllChildMarkers(null, true), m, i;
				group._ignoreMove = true;
				this.setOpacity(1);
				for (i = childMarkers.length - 1; i >= 0; i--) {
					m = childMarkers[i];
					fg.removeLayer(m);
					if (m._preSpiderfyLatlng) {
						m.setLatLng(m._preSpiderfyLatlng);
						delete m._preSpiderfyLatlng;
					}
					if (m.setZIndexOffset) m.setZIndexOffset(0);
					if (m._spiderLeg) {
						map.removeLayer(m._spiderLeg);
						delete m._spiderLeg;
					}
				}
				group.fire("unspiderfied", {
					cluster: this,
					markers: childMarkers
				});
				group._ignoreMove = false;
				group._spiderfied = null;
			}
		});
		L.MarkerClusterNonAnimated = L.MarkerCluster.extend({
			_animationSpiderfy: function(childMarkers, positions) {
				var group = this._group, map = group._map, fg = group._featureGroup, legOptions = this._group.options.spiderLegPolylineOptions, i, m, leg, newPos;
				group._ignoreMove = true;
				for (i = 0; i < childMarkers.length; i++) {
					newPos = map.layerPointToLatLng(positions[i]);
					m = childMarkers[i];
					leg = new L.Polyline([this._latlng, newPos], legOptions);
					map.addLayer(leg);
					m._spiderLeg = leg;
					m._preSpiderfyLatlng = m._latlng;
					m.setLatLng(newPos);
					if (m.setZIndexOffset) m.setZIndexOffset(1e6);
					fg.addLayer(m);
				}
				this.setOpacity(.3);
				group._ignoreMove = false;
				group.fire("spiderfied", {
					cluster: this,
					markers: childMarkers
				});
			},
			_animationUnspiderfy: function() {
				this._noanimationUnspiderfy();
			}
		});
		L.MarkerCluster.include({
			_animationSpiderfy: function(childMarkers, positions) {
				var me = this, group = this._group, map = group._map, fg = group._featureGroup, thisLayerLatLng = this._latlng, thisLayerPos = map.latLngToLayerPoint(thisLayerLatLng), svg = L.Path.SVG, legOptions = L.extend({}, this._group.options.spiderLegPolylineOptions), finalLegOpacity = legOptions.opacity, i, m, leg, legPath, legLength, newPos;
				if (finalLegOpacity === void 0) finalLegOpacity = L.MarkerClusterGroup.prototype.options.spiderLegPolylineOptions.opacity;
				if (svg) {
					legOptions.opacity = 0;
					legOptions.className = (legOptions.className || "") + " leaflet-cluster-spider-leg";
				} else legOptions.opacity = finalLegOpacity;
				group._ignoreMove = true;
				for (i = 0; i < childMarkers.length; i++) {
					m = childMarkers[i];
					newPos = map.layerPointToLatLng(positions[i]);
					leg = new L.Polyline([thisLayerLatLng, newPos], legOptions);
					map.addLayer(leg);
					m._spiderLeg = leg;
					if (svg) {
						legPath = leg._path;
						legLength = legPath.getTotalLength() + .1;
						legPath.style.strokeDasharray = legLength;
						legPath.style.strokeDashoffset = legLength;
					}
					if (m.setZIndexOffset) m.setZIndexOffset(1e6);
					if (m.clusterHide) m.clusterHide();
					fg.addLayer(m);
					if (m._setPos) m._setPos(thisLayerPos);
				}
				group._forceLayout();
				group._animationStart();
				for (i = childMarkers.length - 1; i >= 0; i--) {
					newPos = map.layerPointToLatLng(positions[i]);
					m = childMarkers[i];
					m._preSpiderfyLatlng = m._latlng;
					m.setLatLng(newPos);
					if (m.clusterShow) m.clusterShow();
					if (svg) {
						leg = m._spiderLeg;
						legPath = leg._path;
						legPath.style.strokeDashoffset = 0;
						leg.setStyle({ opacity: finalLegOpacity });
					}
				}
				this.setOpacity(.3);
				group._ignoreMove = false;
				setTimeout(function() {
					group._animationEnd();
					group.fire("spiderfied", {
						cluster: me,
						markers: childMarkers
					});
				}, 200);
			},
			_animationUnspiderfy: function(zoomDetails) {
				var me = this, group = this._group, map = group._map, fg = group._featureGroup, thisLayerPos = zoomDetails ? map._latLngToNewLayerPoint(this._latlng, zoomDetails.zoom, zoomDetails.center) : map.latLngToLayerPoint(this._latlng), childMarkers = this.getAllChildMarkers(null, true), svg = L.Path.SVG, m, i, leg, legPath, legLength, nonAnimatable;
				group._ignoreMove = true;
				group._animationStart();
				this.setOpacity(1);
				for (i = childMarkers.length - 1; i >= 0; i--) {
					m = childMarkers[i];
					if (!m._preSpiderfyLatlng) continue;
					m.closePopup();
					m.setLatLng(m._preSpiderfyLatlng);
					delete m._preSpiderfyLatlng;
					nonAnimatable = true;
					if (m._setPos) {
						m._setPos(thisLayerPos);
						nonAnimatable = false;
					}
					if (m.clusterHide) {
						m.clusterHide();
						nonAnimatable = false;
					}
					if (nonAnimatable) fg.removeLayer(m);
					if (svg) {
						leg = m._spiderLeg;
						legPath = leg._path;
						legLength = legPath.getTotalLength() + .1;
						legPath.style.strokeDashoffset = legLength;
						leg.setStyle({ opacity: 0 });
					}
				}
				group._ignoreMove = false;
				setTimeout(function() {
					var stillThereChildCount = 0;
					for (i = childMarkers.length - 1; i >= 0; i--) {
						m = childMarkers[i];
						if (m._spiderLeg) stillThereChildCount++;
					}
					for (i = childMarkers.length - 1; i >= 0; i--) {
						m = childMarkers[i];
						if (!m._spiderLeg) continue;
						if (m.clusterShow) m.clusterShow();
						if (m.setZIndexOffset) m.setZIndexOffset(0);
						if (stillThereChildCount > 1) fg.removeLayer(m);
						map.removeLayer(m._spiderLeg);
						delete m._spiderLeg;
					}
					group._animationEnd();
					group.fire("unspiderfied", {
						cluster: me,
						markers: childMarkers
					});
				}, 200);
			}
		});
		L.MarkerClusterGroup.include({
			_spiderfied: null,
			unspiderfy: function() {
				this._unspiderfy.apply(this, arguments);
			},
			_spiderfierOnAdd: function() {
				this._map.on("click", this._unspiderfyWrapper, this);
				if (this._map.options.zoomAnimation) this._map.on("zoomstart", this._unspiderfyZoomStart, this);
				this._map.on("zoomend", this._noanimationUnspiderfy, this);
				if (!L.Browser.touch) this._map.getRenderer(this);
			},
			_spiderfierOnRemove: function() {
				this._map.off("click", this._unspiderfyWrapper, this);
				this._map.off("zoomstart", this._unspiderfyZoomStart, this);
				this._map.off("zoomanim", this._unspiderfyZoomAnim, this);
				this._map.off("zoomend", this._noanimationUnspiderfy, this);
				this._noanimationUnspiderfy();
			},
			_unspiderfyZoomStart: function() {
				if (!this._map) return;
				this._map.on("zoomanim", this._unspiderfyZoomAnim, this);
			},
			_unspiderfyZoomAnim: function(zoomDetails) {
				if (L.DomUtil.hasClass(this._map._mapPane, "leaflet-touching")) return;
				this._map.off("zoomanim", this._unspiderfyZoomAnim, this);
				this._unspiderfy(zoomDetails);
			},
			_unspiderfyWrapper: function() {
				this._unspiderfy();
			},
			_unspiderfy: function(zoomDetails) {
				if (this._spiderfied) this._spiderfied.unspiderfy(zoomDetails);
			},
			_noanimationUnspiderfy: function() {
				if (this._spiderfied) this._spiderfied._noanimationUnspiderfy();
			},
			_unspiderfyLayer: function(layer) {
				if (layer._spiderLeg) {
					this._featureGroup.removeLayer(layer);
					if (layer.clusterShow) layer.clusterShow();
					if (layer.setZIndexOffset) layer.setZIndexOffset(0);
					this._map.removeLayer(layer._spiderLeg);
					delete layer._spiderLeg;
				}
			}
		});
		/**
		* Adds 1 public method to MCG and 1 to L.Marker to facilitate changing
		* markers' icon options and refreshing their icon and their parent clusters
		* accordingly (case where their iconCreateFunction uses data of childMarkers
		* to make up the cluster icon).
		*/
		L.MarkerClusterGroup.include({
			/**
			* Updates the icon of all clusters which are parents of the given marker(s).
			* In singleMarkerMode, also updates the given marker(s) icon.
			* @param layers L.MarkerClusterGroup|L.LayerGroup|Array(L.Marker)|Map(L.Marker)|
			* L.MarkerCluster|L.Marker (optional) list of markers (or single marker) whose parent
			* clusters need to be updated. If not provided, retrieves all child markers of this.
			* @returns {L.MarkerClusterGroup}
			*/
			refreshClusters: function(layers) {
				if (!layers) layers = this._topClusterLevel.getAllChildMarkers();
				else if (layers instanceof L.MarkerClusterGroup) layers = layers._topClusterLevel.getAllChildMarkers();
				else if (layers instanceof L.LayerGroup) layers = layers._layers;
				else if (layers instanceof L.MarkerCluster) layers = layers.getAllChildMarkers();
				else if (layers instanceof L.Marker) layers = [layers];
				this._flagParentsIconsNeedUpdate(layers);
				this._refreshClustersIcons();
				if (this.options.singleMarkerMode) this._refreshSingleMarkerModeMarkers(layers);
				return this;
			},
			/**
			* Simply flags all parent clusters of the given markers as having a "dirty" icon.
			* @param layers Array(L.Marker)|Map(L.Marker) list of markers.
			* @private
			*/
			_flagParentsIconsNeedUpdate: function(layers) {
				var id, parent;
				for (id in layers) {
					parent = layers[id].__parent;
					while (parent) {
						parent._iconNeedsUpdate = true;
						parent = parent.__parent;
					}
				}
			},
			/**
			* Re-draws the icon of the supplied markers.
			* To be used in singleMarkerMode only.
			* @param layers Array(L.Marker)|Map(L.Marker) list of markers.
			* @private
			*/
			_refreshSingleMarkerModeMarkers: function(layers) {
				var id, layer;
				for (id in layers) {
					layer = layers[id];
					if (this.hasLayer(layer)) layer.setIcon(this._overrideMarkerIcon(layer));
				}
			}
		});
		L.Marker.include({ 
		/**
		* Updates the given options in the marker's icon and refreshes the marker.
		* @param options map object of icon options.
		* @param directlyRefreshClusters boolean (optional) true to trigger
		* MCG.refreshClustersOf() right away with this single marker.
		* @returns {L.Marker}
		*/
refreshIconOptions: function(options, directlyRefreshClusters) {
			var icon = this.options.icon;
			L.setOptions(icon, options);
			this.setIcon(icon);
			if (directlyRefreshClusters && this.__parent) this.__parent._group.refreshClusters(this);
			return this;
		} });
		exports$1.MarkerClusterGroup = MarkerClusterGroup;
		exports$1.MarkerCluster = MarkerCluster;
		Object.defineProperty(exports$1, "__esModule", { value: true });
	});
})))();
function getPropsAndEvents(props) {
	let clusterProps = {};
	let clusterEvents = {};
	const { children, ...rest } = props;
	Object.entries(rest).forEach(([propName, prop]) => {
		if (propName.startsWith("on")) clusterEvents = {
			...clusterEvents,
			[propName]: prop
		};
		else clusterProps = {
			...clusterProps,
			[propName]: prop
		};
	});
	return {
		clusterProps,
		clusterEvents
	};
}
function createMarkerClusterGroup(props, context) {
	const { clusterProps, clusterEvents } = getPropsAndEvents(props);
	const markerClusterGroup = new import_leaflet_src.default.MarkerClusterGroup(clusterProps);
	Object.entries(clusterEvents).forEach(([eventAsProp, callback]) => {
		const clusterEvent = `cluster${eventAsProp.substring(2).toLowerCase()}`;
		markerClusterGroup.on(clusterEvent, callback);
	});
	const proto = import_leaflet_src.default.MarkerClusterGroup.prototype;
	let addBuffer = [];
	let removeBuffer = [];
	let flushScheduled = false;
	function flush() {
		flushScheduled = false;
		const netOps = /* @__PURE__ */ new Map();
		for (const l of addBuffer) netOps.set(l, (netOps.get(l) ?? 0) + 1);
		for (const l of removeBuffer) netOps.set(l, (netOps.get(l) ?? 0) - 1);
		const toAdd = [];
		const toRemove = [];
		for (const [layer, count] of netOps) if (count > 0) toAdd.push(layer);
		else if (count < 0) toRemove.push(layer);
		removeBuffer = [];
		addBuffer = [];
		if (toRemove.length > 0) markerClusterGroup.removeLayers(toRemove);
		if (toAdd.length > 0) markerClusterGroup.addLayers(toAdd);
	}
	function scheduleFlush() {
		if (flushScheduled) return;
		flushScheduled = true;
		queueMicrotask(flush);
	}
	markerClusterGroup.addLayer = function(layer) {
		if (!this._map) return proto.addLayer.call(this, layer);
		addBuffer.push(layer);
		scheduleFlush();
		return this;
	};
	markerClusterGroup.removeLayer = function(layer) {
		if (!this._map) return proto.removeLayer.call(this, layer);
		removeBuffer.push(layer);
		scheduleFlush();
		return this;
	};
	const originalClearLayers = markerClusterGroup.clearLayers;
	markerClusterGroup.clearLayers = function() {
		addBuffer = [];
		removeBuffer = [];
		flushScheduled = false;
		return originalClearLayers.call(this);
	};
	markerClusterGroup._moveChild = function(layer, from, to) {
		layer._latlng = from;
		proto.removeLayer.call(this, layer);
		layer._latlng = to;
		proto.addLayer.call(this, layer);
	};
	return createElementObject(markerClusterGroup, extendContext(context, { layerContainer: markerClusterGroup }));
}
var updateMarkerCluster = (instance, props, prevProps) => {
	const { clusterProps, clusterEvents } = getPropsAndEvents(props);
	const { clusterProps: prevClusterProps, clusterEvents: prevClusterEvents } = getPropsAndEvents(prevProps);
	Object.keys(clusterProps).forEach((key) => {
		if (clusterProps[key] !== prevClusterProps[key]) instance.options[key] = clusterProps[key];
	});
	Object.entries(prevClusterEvents).forEach(([eventAsProp, callback]) => {
		const clusterEvent = `cluster${eventAsProp.substring(2).toLowerCase()}`;
		instance.off(clusterEvent, callback);
	});
	Object.entries(clusterEvents).forEach(([eventAsProp, callback]) => {
		const clusterEvent = `cluster${eventAsProp.substring(2).toLowerCase()}`;
		instance.on(clusterEvent, callback);
	});
};
var index_default = createPathComponent(createMarkerClusterGroup, updateMarkerCluster);
//#endregion
//#region src/lib/heading.ts
function compassBearing(event, screenAngle = 0) {
	if (event.webkitCompassAccuracy != null && (event.webkitCompassAccuracy < 0 || event.webkitCompassAccuracy > 30)) return null;
	const heading = Number.isFinite(event.webkitCompassHeading) ? event.webkitCompassHeading : event.absolute && event.alpha != null && Number.isFinite(event.alpha) ? 360 - event.alpha : null;
	return heading == null ? null : ((-heading - screenAngle) % 360 + 360) % 360;
}
//#endregion
//#region src/components/MapOrientation.tsx
var import_jsx_runtime = require_jsx_runtime();
function MapOrientation() {
	const map = useMap();
	const [following, setFollowing] = (0, import_react.useState)(false);
	const [message, setMessage] = (0, import_react.useState)("");
	const [popupOpen, setPopupOpen] = (0, import_react.useState)(false);
	const active = (0, import_react.useRef)(false);
	const alive = (0, import_react.useRef)(true);
	(0, import_react.useEffect)(() => {
		alive.current = true;
		return () => {
			alive.current = false;
			active.current = false;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const open = () => setPopupOpen(true), close = () => setPopupOpen(false);
		map.on("popupopen", open);
		map.on("popupclose", close);
		return () => {
			map.off("popupopen", open);
			map.off("popupclose", close);
		};
	}, [map]);
	(0, import_react.useEffect)(() => {
		if (!following) return;
		let gotReading = false;
		const timeout = setTimeout(() => {
			if (!gotReading) {
				active.current = false;
				setFollowing(false);
				setMessage("No compass signal. Use the rotation arrows.");
			}
		}, 6e3);
		const onOrientation = (raw) => {
			const bearing = compassBearing(raw, window.screen.orientation?.angle ?? window.orientation ?? 0);
			if (bearing == null || !active.current) return;
			gotReading = true;
			clearTimeout(timeout);
			map.setBearing(bearing);
			setMessage("Compass on. Keep your phone flat for best results.");
		};
		window.addEventListener("deviceorientationabsolute", onOrientation);
		window.addEventListener("deviceorientation", onOrientation);
		return () => {
			clearTimeout(timeout);
			window.removeEventListener("deviceorientationabsolute", onOrientation);
			window.removeEventListener("deviceorientation", onOrientation);
		};
	}, [map, following]);
	async function toggleCompass() {
		if (following) {
			active.current = false;
			setFollowing(false);
			setMessage("Compass off");
			return;
		}
		if (!window.isSecureContext || !("DeviceOrientationEvent" in window)) {
			setMessage("Compass unavailable. Use the rotation arrows.");
			return;
		}
		try {
			const api = DeviceOrientationEvent;
			if (api.requestPermission && await api.requestPermission() !== "granted") {
				if (alive.current) setMessage("Compass permission denied. You can still rotate manually.");
				return;
			}
			if (!alive.current) return;
			active.current = true;
			setFollowing(true);
			setMessage("Waiting for compass…");
		} catch {
			if (alive.current) setMessage("Could not start compass. Use the rotation arrows.");
		}
	}
	function rotate(delta) {
		active.current = false;
		setFollowing(false);
		map.setBearing(delta == null ? 0 : map.getBearing() + delta);
		setMessage(delta == null ? "North up" : "Manual rotation");
	}
	if (popupOpen) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "absolute right-2 top-2 z-[500] max-w-[230px]",
		onPointerDown: (e) => e.stopPropagation(),
		onDoubleClick: (e) => e.stopPropagation(),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-1 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "rounded-xl p-2 transition hover:bg-blue-50 hover:text-blue-700",
					"aria-label": "Rotate map left",
					onClick: () => rotate(-30),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { size: 19 })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "rounded-xl px-3 font-bold transition hover:bg-blue-50 hover:text-blue-700",
					"aria-label": "Reset map north",
					onClick: () => rotate(null),
					children: "N"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "rounded-xl p-2 transition hover:bg-blue-50 hover:text-blue-700",
					"aria-label": "Rotate map right",
					onClick: () => rotate(30),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCw, { size: 19 })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: `rounded p-2 ${following ? "bg-indigo-100 text-indigo-700" : ""}`,
					"aria-label": "Follow compass",
					"aria-pressed": following,
					onClick: toggleCompass,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compass, { size: 19 })
				})
			]
		}), message && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			role: "status",
			className: "mt-1 rounded bg-white/95 p-2 text-xs text-slate-700 shadow",
			children: message
		})]
	});
}
//#endregion
//#region src/components/MapView.tsx
function pinMarkup(color, label, content) {
	return `<div title="${label}" aria-label="${label}" style="position:relative;width:40px;height:48px;filter:drop-shadow(0 3px 5px rgba(15,23,42,.22))"><div style="position:absolute;left:4px;top:1px;width:32px;height:32px;border-radius:50% 50% 50% 0;background:${color};border:3px solid white;transform:rotate(-45deg)"><span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform:rotate(45deg);color:white;font:800 12px/1 sans-serif">${content}</span></div></div>`;
}
function pinIcon(color, state) {
	const label = state === "unknown" || state === "uncertain" ? "Availability on arrival" : state === "vacant" ? "Vacant" : "Occupied";
	const visualColor = state === "unknown" || state === "uncertain" ? "#1769ff" : color;
	return import_leaflet_src.default.divIcon({
		className: "",
		html: pinMarkup(visualColor, label, "P"),
		iconSize: [40, 48],
		iconAnchor: [20, 40]
	});
}
/** The blue "you are here" dot. With `glow`, it gets a soft pulsing ring so
* it's unmistakable at a glance, e.g. right after location resolves. */
function meIcon(glow) {
	const pulse = glow ? `<div style="position:absolute;inset:-10px;border-radius:50%;background:rgba(59,130,246,0.35);animation:bay-me-pulse 1.8s ease-out infinite"></div>
       <style>@keyframes bay-me-pulse{0%{transform:scale(0.4);opacity:0.9}100%{transform:scale(2.2);opacity:0}}</style>` : "";
	return import_leaflet_src.default.divIcon({
		className: "",
		html: `<div style="position:relative;width:16px;height:16px">${pulse}<div style="position:relative;width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div></div>`,
		iconSize: [16, 16],
		iconAnchor: [8, 8]
	});
}
/** A distinct square "P" marker for off-street car parks -- deliberately not
* a coloured dot like on-street bays, since these are a different kind of
* thing (a building with a total capacity, not a legal-status pin). */
function carParkIcon() {
	return import_leaflet_src.default.divIcon({
		className: "",
		html: pinMarkup("#1769ff", "Parking area", "P"),
		iconSize: [40, 48],
		iconAnchor: [20, 40]
	});
}
function meterIcon() {
	return import_leaflet_src.default.divIcon({
		className: "",
		html: pinMarkup("#1769ff", "Mapped SFMTA parking meter · availability on arrival", "P"),
		iconSize: [40, 48],
		iconAnchor: [20, 40]
	});
}
function meterGroupIcon(count) {
	const label = `${count} SFMTA meter locations · zoom in for details`;
	return import_leaflet_src.default.divIcon({
		className: "",
		iconSize: [40, 48],
		iconAnchor: [20, 40],
		html: pinMarkup("#1769ff", label, String(count))
	});
}
function clusterIcon(cluster, areas = false) {
	const count = cluster.getChildCount();
	const label = `${count} ${areas ? "parking areas" : "mapped parking spots"} · zoom in for details`;
	return import_leaflet_src.default.divIcon({
		className: "",
		iconSize: [40, 48],
		iconAnchor: [20, 40],
		html: pinMarkup("#1769ff", label, String(count))
	});
}
/** Clusters are a visual-performance aid only. Tapping one must always move
* into its actual points, never leave a driver with an inert count badge. */
function openCluster(event) {
	event.layer?.zoomToBounds?.();
}
/** Aggregate dense meter inventory before making Leaflet markers. At street
* zoom, only markers in the visible map bounds are mounted on the phone. */
function SfMeterMarkers({ spots, onSelectSpot }) {
	const map = useMap();
	const [view, setView] = (0, import_react.useState)(() => ({
		zoom: map.getZoom(),
		bounds: map.getBounds()
	}));
	useMapEvents({
		zoomend: () => setView({
			zoom: map.getZoom(),
			bounds: map.getBounds()
		}),
		moveend: () => setView({
			zoom: map.getZoom(),
			bounds: map.getBounds()
		})
	});
	const markers = (0, import_react.useMemo)(() => {
		const bounds = view.bounds.pad(.3);
		const visible = spots.filter((spot) => bounds.contains([spot.lat, spot.lng]));
		if (view.zoom >= 17) return visible.map((spot) => ({
			lat: spot.lat,
			lng: spot.lng,
			spot,
			count: 1
		}));
		const cell = view.zoom <= 15 ? .003 : view.zoom === 16 ? .002 : view.zoom === 17 ? .0012 : 35e-5;
		const bins = /* @__PURE__ */ new Map();
		for (const spot of visible) {
			const key = `${Math.floor(spot.lat / cell)}_${Math.floor(spot.lng / cell)}`;
			const group = bins.get(key);
			if (group) group.push(spot);
			else bins.set(key, [spot]);
		}
		return [...bins.values()].map((group) => ({
			lat: group.reduce((n, spot) => n + spot.lat, 0) / group.length,
			lng: group.reduce((n, spot) => n + spot.lng, 0) / group.length,
			spot: group.length === 1 ? group[0] : null,
			count: group.length
		}));
	}, [spots, view]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: markers.map((marker, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Marker, {
		position: [marker.lat, marker.lng],
		icon: marker.spot ? meterIcon() : meterGroupIcon(marker.count),
		eventHandlers: { click: () => marker.spot ? onSelectSpot?.(marker.spot) : map.flyTo([marker.lat, marker.lng], Math.min(18, view.zoom + 2)) }
	}, marker.spot?.id ?? `meter-group-${i}`)) });
}
function pickIcon() {
	return import_leaflet_src.default.divIcon({
		className: "",
		html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#6366f1;border:3px solid white;transform:rotate(-45deg);box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
		iconSize: [28, 28],
		iconAnchor: [14, 28]
	});
}
function ResizeMap() {
	const map = useMap();
	(0, import_react.useEffect)(() => {
		const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
		observer.observe(map.getContainer());
		return () => observer.disconnect();
	}, [map]);
	return null;
}
/** Keep off-street facilities above dense bay clusters. They are a separate
* destination type and must remain tappable even in a busy CBD. */
function ParkingPanes() {
	const map = useMap();
	(0, import_react.useEffect)(() => {
		const ensurePane = (name, zIndex) => {
			const pane = map.getPane(name) ?? map.createPane(name);
			pane.style.zIndex = String(zIndex);
		};
		ensurePane("bay-marker-pane", 610);
		ensurePane("bay-cluster-pane", 620);
		ensurePane("area-marker-pane", 640);
		ensurePane("area-cluster-pane", 645);
	}, [map]);
	return null;
}
function Recenter({ center, zoom }) {
	const map = useMap();
	const [lat, lng] = center;
	(0, import_react.useEffect)(() => {
		map.setView([lat, lng], zoom);
	}, [
		lat,
		lng,
		zoom,
		map
	]);
	return null;
}
/** Reports only meaningful zoom changes. This lets the search layer fetch
* nearby areas as someone zooms out, without reloading on every map pan. */
function CoverageZoom({ onChange }) {
	const map = useMap();
	useMapEvents({ zoomend: () => onChange?.(map.getZoom()) });
	return null;
}
function ClickCatcher({ onPick }) {
	useMapEvents({ click(e) {
		onPick(e.latlng.lat, e.latlng.lng);
	} });
	return null;
}
function MapView({ center, spots, onSelectSpot, pickMode, pickedLocation, onPickLocation, zoom = 15, glowMe = false, radiusM, myLocation, carParks = [], onSelectCarPark, onZoomChange }) {
	const mePosition = myLocation ?? center;
	const meterSpots = spots.filter((spot) => spot.catalog?.source_name === "SFMTA meter inventory");
	const otherSpots = spots.filter((spot) => spot.catalog?.source_name !== "SFMTA meter inventory");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MapContainer, {
		center: [center.lat, center.lng],
		zoom: Math.min(zoom, 18),
		maxZoom: 19,
		className: "h-full w-full",
		zoomControl: false,
		scrollWheelZoom: true,
		doubleClickZoom: true,
		dragging: true,
		touchZoom: true,
		rotate: true,
		touchRotate: true,
		rotateControl: false,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResizeMap, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParkingPanes, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapOrientation, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoverageZoom, { onChange: onZoomChange }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomControl, { position: "bottomleft" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TileLayer, {
				attribution: "© <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
				url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
				maxNativeZoom: 18,
				maxZoom: 19,
				updateWhenZooming: false
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Recenter, {
				center: [center.lat, center.lng],
				zoom
			}),
			radiusM && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, {
				center: [center.lat, center.lng],
				radius: radiusM,
				pathOptions: {
					color: "#64748b",
					weight: 1.5,
					dashArray: "6 6",
					fillOpacity: .03
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Marker, {
				position: [mePosition.lat, mePosition.lng],
				icon: meIcon(glowMe)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SfMeterMarkers, {
				spots: meterSpots,
				onSelectSpot
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(index_default, {
				iconCreateFunction: (cluster) => clusterIcon(cluster),
				clusterPane: "bay-cluster-pane",
				eventHandlers: { clusterclick: openCluster },
				chunkedLoading: true,
				maxClusterRadius: 42,
				disableClusteringAtZoom: 17,
				zoomToBoundsOnClick: true,
				spiderfyOnMaxZoom: true,
				children: otherSpots.map((spot) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Marker, {
					position: [spot.lat, spot.lng],
					pane: "bay-marker-pane",
					icon: pinIcon(availability(spot).color, availability(spot).state),
					eventHandlers: { click: () => onSelectSpot?.(spot) }
				}, spot.id))
			}),
			carParks.filter((area) => area.boundary?.length).map((area) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Polygon, {
				positions: area.boundary,
				pathOptions: {
					color: "#1769ff",
					weight: 2,
					fillOpacity: .1
				},
				eventHandlers: { click: () => onSelectCarPark?.(area) }
			}, `boundary:${area.id}`)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(index_default, {
				iconCreateFunction: (cluster) => clusterIcon(cluster, true),
				clusterPane: "area-cluster-pane",
				eventHandlers: { clusterclick: openCluster },
				chunkedLoading: true,
				maxClusterRadius: 35,
				disableClusteringAtZoom: 17,
				zoomToBoundsOnClick: true,
				spiderfyOnMaxZoom: true,
				children: carParks.map((cp) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Marker, {
					position: [cp.lat, cp.lng],
					pane: "area-marker-pane",
					icon: carParkIcon(),
					eventHandlers: { click: () => onSelectCarPark?.(cp) }
				}, cp.id))
			}),
			pickMode && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClickCatcher, { onPick: (lat, lng) => onPickLocation?.(lat, lng) }),
			pickedLocation && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Marker, {
				position: [pickedLocation.lat, pickedLocation.lng],
				icon: pickIcon()
			})
		]
	});
}
//#endregion
export { RotateCcw as n, MapView as t };
