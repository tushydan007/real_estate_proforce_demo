import L from "leaflet";
import "leaflet-draw";
import type { Map, DrawMap } from "leaflet";
import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import {
  addAoiToCart,
  removeAoiFromCart,
  formatArea,
  formatCoordinates,
  type AoiCartItem,
} from "../redux/features/cart/AoiCartSlice";
import toast from "react-hot-toast";
import "leaflet-draw/dist/leaflet.draw.css";

/* ---------------------------
   Types
   --------------------------- */
export interface Aoi {
  id?: number;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  is_active: boolean;
  monitoring_enabled: boolean;
  created_at?: Date;
  name?: string;
  description?: string;
  tags?: string[];
}

interface UseAoiLayerProps {
  map: Map;
  aois: Aoi[];
  onCreate: (
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
    area: number
  ) => void;
  onEdit: (
    id: number,
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
    area: number
  ) => void;
  onDelete: (id: number) => void;
  onSelect: (id: number) => void;
  previewAoiId?: number;
  autoAddToCart?: boolean;
}

/* ---------------------------
   Utility helpers
   --------------------------- */

const createTooltip = () => {
  const tooltip = document.createElement("div");
  tooltip.style.position = "fixed";
  tooltip.style.pointerEvents = "none";
  tooltip.style.background = "rgba(0,0,0,0.9)";
  tooltip.style.color = "#fff";
  tooltip.style.padding = "8px 12px";
  tooltip.style.borderRadius = "6px";
  tooltip.style.fontSize = "12px";
  tooltip.style.zIndex = "9999";
  tooltip.style.transition = "opacity 0.2s";
  tooltip.style.opacity = "0.95";
  tooltip.style.maxWidth = "300px";
  tooltip.style.wordWrap = "break-word";
  document.body.appendChild(tooltip);
  return tooltip;
};

const removeTooltip = (tooltip: HTMLElement | null) => {
  if (tooltip && tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
};

/**
 * Use Leaflet's GeometryUtil if available (from leaflet-geometryutil plugin),
 * otherwise fall back to a spherical-ish shoelace implementation.
 */
type GeometryUtilType = {
  geodesicArea: (latlngs: L.LatLng[]) => number;
};

const getPolygonArea = (latlngs: L.LatLng[]): number => {
  const geometryUtil = (L as unknown as { GeometryUtil?: GeometryUtilType })
    .GeometryUtil;
  if (geometryUtil && typeof geometryUtil.geodesicArea === "function") {
    return geometryUtil.geodesicArea(latlngs);
  }

  // Fallback: approximate using spherical area (works fine for moderate polygons)
  const R = 6371000;
  if (latlngs.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < latlngs.length; i++) {
    const j = (i + 1) % latlngs.length;
    const lat1 = (latlngs[i].lat * Math.PI) / 180;
    const lat2 = (latlngs[j].lat * Math.PI) / 180;
    const lng1 = (latlngs[i].lng * Math.PI) / 180;
    const lng2 = (latlngs[j].lng * Math.PI) / 180;
    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  area = (Math.abs(area) * R * R) / 2;
  return area;
};

const calculateAreaFromGeometry = (
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): number => {
  let totalArea = 0;
  if (geometry.type === "Polygon") {
    const coords = geometry.coordinates[0];
    const latlngs = coords.map((coord) => L.latLng(coord[1], coord[0]));
    totalArea = getPolygonArea(latlngs);
  } else {
    // MultiPolygon
    for (const polygon of geometry.coordinates) {
      const coords = polygon[0];
      const latlngs = coords.map((coord) => L.latLng(coord[1], coord[0]));
      totalArea += getPolygonArea(latlngs);
    }
  }
  return totalArea;
};

const isValidGeoJsonGeometry = (
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | undefined
): geometry is GeoJSON.Polygon | GeoJSON.MultiPolygon => {
  if (!geometry) return false;
  if (!geometry.type || !geometry.coordinates) return false;
  if (geometry.type === "Polygon")
    return (
      Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0
    );
  if (geometry.type === "MultiPolygon")
    return (
      Array.isArray(geometry.coordinates) &&
      geometry.coordinates.every(
        (poly) => Array.isArray(poly) && poly.length > 0
      )
    );
  return false;
};

const generateAoiName = (
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  index: number
): string => {
  const type = geometry.type === "Polygon" ? "Polygon" : "Multi-Polygon";
  return `AOI ${type} #${index}`;
};

const isRectangle = (
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): boolean =>
  geometry.type === "Polygon" && geometry.coordinates[0].length === 5;

/**
 * Deterministic geometry key for matching existing AOIs without relying on JSON.stringify.
 * It uses bbox + area rounded. Fast and robust for typical use-cases where IDs may be absent.
 */
const geometryKey = (
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): string => {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  const processCoords = (coords: number[][]) => {
    for (const [lng, lat] of coords) {
      if (lng < minX) minX = lng;
      if (lng > maxX) maxX = lng;
      if (lat < minY) minY = lat;
      if (lat > maxY) maxY = lat;
    }
  };
  if (geometry.type === "Polygon") {
    processCoords(geometry.coordinates[0]);
  } else {
    for (const poly of geometry.coordinates) {
      processCoords(poly[0]);
    }
  }
  const area = Math.round(calculateAreaFromGeometry(geometry));
  return `${geometry.type}|bbox:${minX.toFixed(4)},${minY.toFixed(
    4
  )},${maxX.toFixed(4)},${maxY.toFixed(4)}|area:${area}`;
};

/* ---------------------------
   UploadControl (Leaflet.Control)
   - no globals, no direct dependency on aois length; we accept a getAoisCount callback
   --------------------------- */

interface UploadControlOptions extends L.ControlOptions {
  onCreate: (
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
    area: number
  ) => void;
  autoAddEnabled: boolean;
  dispatch: import("redux").Dispatch;
  formatArea: (area: number) => string;
  formatCoordinates: (
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
  ) => string;
  generateAoiName: (
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
    index: number
  ) => string;
  isRectangle: (geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon) => boolean;
  calculateAreaFromGeometry: (
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
  ) => number;
  getAoisCount?: () => number;
}

class UploadControl extends L.Control {
  declare options: UploadControlOptions;
  private inputEl?: HTMLInputElement;
  private _map?: Map;

  constructor(options?: Partial<UploadControlOptions>) {
    super(options);
    L.setOptions(this, options || {});
  }

  onAdd(map: Map): HTMLElement {
    this._map = map;
    const container = L.DomUtil.create(
      "div",
      "leaflet-control leaflet-bar leaflet-control-upload"
    ) as HTMLElement;
    container.style.marginTop = "5px";

    const link = L.DomUtil.create("a", "", container) as HTMLAnchorElement;
    link.href = "#";
    link.title = "Upload AOI (KML/GeoJSON)";
    link.innerHTML = "📁";
    link.style.display = "block";
    link.style.width = "30px";
    link.style.height = "30px";
    link.style.lineHeight = "30px";
    link.style.textAlign = "center";
    link.style.backgroundColor = "#fff";
    link.style.border = "2px solid rgba(0,0,0,0.12)";
    link.style.fontSize = "14px";

    // prevent clicks to propagate to map
    L.DomEvent.disableClickPropagation(container);

    const input = L.DomUtil.create("input", "", container) as HTMLInputElement;
    input.type = "file";
    input.accept = ".kml,.geojson,.json";
    input.style.display = "none";
    this.inputEl = input;

    link.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      input.click();
    });

    input.addEventListener("change", this.handleUpload.bind(this));

    return container;
  }

  onRemove() {
    if (this.inputEl) {
      this.inputEl.removeEventListener("change", this.handleUpload.bind(this));
      this.inputEl = undefined;
    }
  }

  private handleUpload(e: Event): void {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev: ProgressEvent<FileReader>) => {
      const content = ev.target?.result;
      if (typeof content !== "string") {
        toast.error("Failed to read file");
        target.value = "";
        return;
      }

      try {
        let parsed: GeoJSON.FeatureCollection<GeoJSON.Geometry>;
        if (file.name.toLowerCase().endsWith(".kml")) {
          parsed = this.parseKML(content);
        } else {
          const json = JSON.parse(content);
          if (json.type === "FeatureCollection") parsed = json;
          else if (json.type === "Feature")
            parsed = { type: "FeatureCollection", features: [json] };
          else if (json.type === "Polygon" || json.type === "MultiPolygon") {
            parsed = {
              type: "FeatureCollection",
              features: [{ type: "Feature", geometry: json, properties: {} }],
            };
          } else {
            throw new Error("Invalid GeoJSON structure");
          }
        }

        const validFeatures = parsed.features.filter(
          (f): f is GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> =>
            !!f.geometry &&
            (f.geometry.type === "Polygon" ||
              f.geometry.type === "MultiPolygon")
        );

        if (!validFeatures.length) {
          toast.error("No valid polygons found in file");
          target.value = "";
          return;
        }

        let addedCount = 0;
        const startIndex = (this.options.getAoisCount?.() ?? 0) + 1;

        // Compute overall bounding box for all uploaded geometries
        let overallMinX = Infinity;
        let overallMinY = Infinity;
        let overallMaxX = -Infinity;
        let overallMaxY = -Infinity;

        const processGeomBbox = (
          geom: GeoJSON.Polygon | GeoJSON.MultiPolygon
        ) => {
          let minX = Infinity;
          let minY = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;
          const processCoords = (coords: number[][]) => {
            for (const [lng, lat] of coords) {
              if (lng < minX) minX = lng;
              if (lng > maxX) maxX = lng;
              if (lat < minY) minY = lat;
              if (lat > maxY) maxY = lat;
            }
          };
          if (geom.type === "Polygon") {
            processCoords(geom.coordinates[0]);
          } else {
            for (const poly of geom.coordinates) {
              processCoords(poly[0]);
            }
          }
          // Update overall bounds
          if (minX < overallMinX) overallMinX = minX;
          if (minY < overallMinY) overallMinY = minY;
          if (maxX > overallMaxX) overallMaxX = maxX;
          if (maxY > overallMaxY) overallMaxY = maxY;
        };

        validFeatures.forEach((feature, i) => {
          const geom = feature.geometry;
          processGeomBbox(geom);
          const area = this.options.calculateAreaFromGeometry(geom);

          // Notify parent to add AOI to the map
          this.options.onCreate(geom, area);

          if (this.options.autoAddEnabled) {
            const name =
              feature.properties?.name ||
              this.options.generateAoiName(geom, startIndex + i);
            const newAoiCartItem: AoiCartItem = {
              id: Date.now() + i, // temporary
              name,
              geometry: geom,
              area,
              coordinates: this.options.formatCoordinates(geom),
              type: this.options.isRectangle(geom) ? "Rectangle" : geom.type,
              is_active: true,
              monitoring_enabled: false,
              created_at: new Date(),
              addedToCartAt: new Date(),
              description: `Uploaded AOI (${this.options.formatArea(area)})`,
              tags: ["uploaded", file.name.split(".")[0]],
            };
            this.options.dispatch(addAoiToCart(newAoiCartItem));
            addedCount++;
          }
        });

        // Fly to the bounds of uploaded geometries
        if (addedCount > 0 && this._map && overallMinX !== Infinity) {
          const southWest = L.latLng(overallMinY, overallMinX);
          const northEast = L.latLng(overallMaxY, overallMaxX);
          const bounds = L.latLngBounds(southWest, northEast);
          this._map.flyToBounds(bounds, { padding: [20, 20], duration: 1 });
        }

        toast.success(
          this.options.autoAddEnabled
            ? `AOIs uploaded and added to cart (${addedCount})`
            : `AOIs uploaded (${validFeatures.length})`,
          { icon: "📁", duration: 3000 }
        );
        target.value = "";
      } catch (err) {
        console.error("Upload parse error:", err);
        toast.error("Failed to parse file");
        target.value = "";
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read file");
      target.value = "";
    };

    reader.readAsText(file);
  }

  private parseKML(
    xmlString: string
  ): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "text/xml");
    const features: GeoJSON.Feature<GeoJSON.Polygon>[] = [];

    // handle <Placemark> and also <Polygon> directly
    const placemarks = Array.from(doc.getElementsByTagName("Placemark"));
    placemarks.forEach((pm) => {
      const nameElement = pm.getElementsByTagName("name")[0];
      const name = nameElement?.textContent || "";

      // handle Polygon or MultiGeometry containing polygons
      const polygons = Array.from(pm.getElementsByTagName("Polygon"));
      polygons.forEach((polygon) => {
        const coordsElements = Array.from(
          polygon.getElementsByTagName("coordinates")
        );
        coordsElements.forEach((coordsEl) => {
          const coordsText = coordsEl.textContent;
          if (!coordsText) return;
          const coordPairs = coordsText
            .trim()
            .split(/\s+/)
            .map((s) => s.trim())
            .map((c) => c.split(","))
            .filter((parts) => parts.length >= 2)
            .map((parts) => [parseFloat(parts[0]), parseFloat(parts[1])]);

          if (coordPairs.length >= 3) {
            // ensure closed ring
            const first = coordPairs[0],
              last = coordPairs[coordPairs.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1])
              coordPairs.push(first);
            features.push({
              type: "Feature",
              geometry: { type: "Polygon", coordinates: [coordPairs] },
              properties: { name },
            });
          }
        });
      });
    });

    // fallback: if KML had standalone <Polygon> nodes (outside placemarks)
    const polygons = Array.from(doc.getElementsByTagName("Polygon"));
    polygons.forEach((polygon) => {
      const coordsEl = polygon.getElementsByTagName("coordinates")[0];
      const coordsText = coordsEl?.textContent;
      if (!coordsText) return;
      const coordPairs = coordsText
        .trim()
        .split(/\s+/)
        .map((s) => s.trim())
        .map((c) => c.split(","))
        .filter((parts) => parts.length >= 2)
        .map((parts) => [parseFloat(parts[0]), parseFloat(parts[1])]);

      if (coordPairs.length >= 3) {
        const first = coordPairs[0],
          last = coordPairs[coordPairs.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1])
          coordPairs.push(first);
        features.push({
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [coordPairs] },
          properties: {},
        });
      }
    });

    return { type: "FeatureCollection", features };
  }
}

/* ---------------------------
   useAoiLayer hook
   --------------------------- */

export const useAoiLayer = ({
  map,
  aois,
  onCreate,
  onEdit,
  onDelete,
  onSelect,
  previewAoiId,
  autoAddToCart = true,
}: UseAoiLayerProps) => {
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const tooltipRef = useRef<HTMLElement | null>(null);
  const tooltipRafRef = useRef<number | null>(null);
  const dispatch = useDispatch();

  const cartItems = useSelector((s: RootState) => s.aoiCart.items);
  const [autoAddEnabled, setAutoAddEnabled] = useState(!!autoAddToCart);

  /* ---------------------------
     Add featureGroup to map (mount/unmount)
     --------------------------- */
  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    map.addLayer(drawnItems);
    return () => {
      if (tooltipRafRef.current) {
        cancelAnimationFrame(tooltipRafRef.current);
        tooltipRafRef.current = null;
      }
      map.removeLayer(drawnItems);
    };
  }, [map]);

  /* ---------------------------
     Initialize Draw Control
     --------------------------- */
  useEffect(() => {
    if (drawControlRef.current) return;
    const drawControl = new L.Control.Draw({
      position: "topleft",
      draw: {
        polygon: {
          shapeOptions: { color: "blue", weight: 2, fillOpacity: 0.2 },
          allowIntersection: false,
          showArea: false,
        },
        rectangle: {
          shapeOptions: { color: "blue", weight: 2, fillOpacity: 0.2 },
        },
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },
      edit: { featureGroup: drawnItemsRef.current, remove: true },
    });
    map.addControl(drawControl);
    drawControlRef.current = drawControl;
    return () => {
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
        drawControlRef.current = null;
      }
    };
  }, [map]);

  /* ---------------------------
     Initialize Upload Control
     --------------------------- */
  useEffect(() => {
    const control = new UploadControl({
      position: "topleft",
      onCreate,
      autoAddEnabled,
      dispatch,
      formatArea,
      formatCoordinates,
      generateAoiName,
      isRectangle,
      calculateAreaFromGeometry,
      getAoisCount: () => aois.length,
    });
    control.addTo(map);
    return () => {
      map.removeControl(control);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    map,
    onCreate,
    dispatch,
    formatArea,
    formatCoordinates,
    autoAddEnabled,
    aois.length,
  ]);

  /* ---------------------------
     Drawing tooltip logic (rAF for smooth updates)
     --------------------------- */
  useEffect(() => {
    let drawing = false;
    let mousePos = { x: 0, y: 0 };

    function showTooltip(content: string) {
      if (!tooltipRef.current) tooltipRef.current = createTooltip();
      tooltipRef.current.innerHTML = content;
      tooltipRef.current.style.display = "block";
      // use rAF for position update
      if (tooltipRafRef.current) cancelAnimationFrame(tooltipRafRef.current);
      tooltipRafRef.current = requestAnimationFrame(() => {
        const { x, y } = mousePos;
        if (tooltipRef.current) {
          tooltipRef.current.style.left = x + 15 + "px";
          tooltipRef.current.style.top = y + 15 + "px";
        }
      });
    }
    function hideTooltip() {
      if (tooltipRafRef.current) {
        cancelAnimationFrame(tooltipRafRef.current);
        tooltipRafRef.current = null;
      }
      removeTooltip(tooltipRef.current);
      tooltipRef.current = null;
    }

    function onDrawStart() {
      drawing = true;
      // initial message
      showTooltip(`<div>Start drawing AOI...</div>
        <div style='color:${
          autoAddEnabled ? "#10b981" : "#9ca3af"
        }; font-size:10px'>
          ${
            autoAddEnabled
              ? "✓ Will auto-add to cart"
              : "Manual cart management"
          }
        </div>`);
    }

    const drawVertexHandler = (event: L.LeafletEvent) => {
      if (!drawing) return;
      const e = event as L.DrawEvents.DrawVertex;
      const latlngs: L.LatLng[] =
        e.layer && (e.layer as L.Polygon).getLatLngs
          ? ((e.layer as L.Polygon).getLatLngs()[0] as L.LatLng[])
          : [];

      let area = 0;
      if (latlngs.length > 2) area = getPolygonArea(latlngs);

      const coordinates = latlngs
        .map((ll) => `[${ll.lat.toFixed(4)}, ${ll.lng.toFixed(4)}]`)
        .slice(0, 3)
        .join(", ");

      const txt =
        latlngs.length > 2
          ? `<div><strong>Area:</strong> ${formatArea(area)}</div>
             <div><strong>Points:</strong> ${latlngs.length}</div>
             <div style='font-size:10px;color:#9ca3af;'>Coords: ${coordinates}${
              latlngs.length > 3 ? "..." : ""
            }</div>`
          : `<div><strong>Points:</strong> ${latlngs.length}</div>
             <div style='font-size:10px;color:#9ca3af;'>Coords: ${coordinates}</div>`;

      showTooltip(txt);
    };

    function onDrawStop() {
      drawing = false;
      hideTooltip();
    }

    function captureMouse(e: MouseEvent) {
      mousePos = { x: e.clientX, y: e.clientY };
    }

    map.on(L.Draw.Event.DRAWSTART, onDrawStart);
    map.on(L.Draw.Event.DRAWVERTEX, drawVertexHandler);
    map.on(L.Draw.Event.DRAWSTOP, onDrawStop);
    map.on(L.Draw.Event.CREATED, onDrawStop);
    document.addEventListener("mousemove", captureMouse);

    return () => {
      map.off(L.Draw.Event.DRAWSTART, onDrawStart);
      map.off(L.Draw.Event.DRAWVERTEX, drawVertexHandler);
      map.off(L.Draw.Event.DRAWSTOP, onDrawStop);
      map.off(L.Draw.Event.CREATED, onDrawStop);
      document.removeEventListener("mousemove", captureMouse);
      hideTooltip();
    };
  }, [map, autoAddEnabled]);

  /* ---------------------------
     Create / Edit / Delete handlers + cart integration
     --------------------------- */
  useEffect(() => {
    const drawnItems = drawnItemsRef.current;

    const handleCreated = (event: L.LeafletEvent) => {
      const e = event as L.DrawEvents.Created;
      if (!e.layer || !e.layerType) return;

      const layer = e.layer;
      drawnItems.addLayer(layer);

      if (e.layerType !== "polygon" && e.layerType !== "rectangle") return;
      if (!(layer instanceof L.Polygon)) return;

      const geoJson = layer.toGeoJSON().geometry as
        | GeoJSON.Polygon
        | GeoJSON.MultiPolygon;
      if (!isValidGeoJsonGeometry(geoJson)) return;

      const area = calculateAreaFromGeometry(geoJson);

      // notify parent
      onCreate(geoJson, area);

      // toggle cart
      if (autoAddEnabled) {
        const tmpId = Date.now();
        const newAoiCartItem: AoiCartItem = {
          id: tmpId,
          name: generateAoiName(geoJson, aois.length + 1),
          geometry: geoJson,
          area,
          coordinates: formatCoordinates(geoJson),
          type: isRectangle(geoJson) ? "Rectangle" : geoJson.type,
          is_active: true,
          monitoring_enabled: false,
          created_at: new Date(),
          addedToCartAt: new Date(),
          description: `Auto-generated AOI with area ${formatArea(area)}`,
          tags: ["auto-generated", e.layerType],
        };
        dispatch(addAoiToCart(newAoiCartItem));
        toast.success(
          `AOI created and added to cart! Area: ${formatArea(area)}`,
          {
            style: { background: "#1f2937", color: "#fff" },
            icon: "🗺️",
            duration: 3000,
          }
        );
      } else {
        toast.success(`AOI created! Area: ${formatArea(area)}`, {
          style: { background: "#1f2937", color: "#fff" },
          icon: "✅",
          duration: 2000,
        });
      }
    };

    const handleEdited = (event: L.LeafletEvent) => {
      const e = event as L.DrawEvents.Edited;
      e.layers.eachLayer((layer: L.Layer) => {
        if (!(layer instanceof L.Polygon)) return;
        const geoJson = layer.toGeoJSON().geometry as
          | GeoJSON.Polygon
          | GeoJSON.MultiPolygon;
        if (!isValidGeoJsonGeometry(geoJson)) return;

        const area = calculateAreaFromGeometry(geoJson);
        // find matching AOI by geometryKey
        const key = geometryKey(geoJson);
        const matched = aois.find((a) => geometryKey(a.geometry) === key);
        if (matched?.id) {
          onEdit(matched.id, geoJson, area);
          toast.success(`AOI updated! New area: ${formatArea(area)}`, {
            style: { background: "#1f2937", color: "#fff" },
            icon: "✏️",
            duration: 2000,
          });
        }
      });
    };

    const handleDeleted = (event: L.LeafletEvent) => {
      const e = event as L.DrawEvents.Deleted;
      e.layers.eachLayer((layer: L.Layer) => {
        if (!(layer instanceof L.Polygon)) return;
        const geoJson = layer.toGeoJSON().geometry as
          | GeoJSON.Polygon
          | GeoJSON.MultiPolygon;
        if (!isValidGeoJsonGeometry(geoJson)) return;
        const key = geometryKey(geoJson);
        const matched = aois.find((a) => geometryKey(a.geometry) === key);
        if (matched?.id) {
          const isInCart = cartItems.some((item) => item.id === matched.id);
          if (isInCart) dispatch(removeAoiFromCart(matched.id));
          onDelete(matched.id);
          toast.success(
            `AOI deleted${isInCart ? " and removed from cart" : ""}`,
            {
              style: { background: "#1f2937", color: "#fff" },
              icon: "🗑️",
              duration: 2000,
            }
          );
        }
      });
    };

    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.EDITED, handleEdited);
    map.on(L.Draw.Event.DELETED, handleDeleted);

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.EDITED, handleEdited);
      map.off(L.Draw.Event.DELETED, handleDeleted);
    };
  }, [
    map,
    aois,
    onCreate,
    onEdit,
    onDelete,
    dispatch,
    cartItems,
    autoAddEnabled,
  ]);

  /* ---------------------------
     Render AOIs to map with styles, popups and popup button handlers (no globals)
     --------------------------- */
  useEffect(() => {
    const fg = drawnItemsRef.current;
    fg.clearLayers();

    aois.forEach((aoi) => {
      if (!isValidGeoJsonGeometry(aoi.geometry)) {
        console.error("Invalid GeoJSON for AOI:", aoi);
        return;
      }
      const isInCart = cartItems.some((it) => it.id === aoi.id);
      const isPreview = aoi.id === previewAoiId;

      let color = "gray";
      let weight = 2;
      let dashArray: string | undefined = undefined;
      if (isPreview) {
        color = "red";
        weight = 3;
      } else if (isInCart) {
        color = "#10b981";
        weight = 3;
        dashArray = "10,5";
      } else if (aoi.is_active) {
        color = "limegreen";
      }

      const layer = L.geoJSON(aoi.geometry, {
        style: {
          color,
          weight,
          fillOpacity: aoi.monitoring_enabled ? 0.4 : 0.2,
          dashArray,
        },
      });

      // standard click toggles cart + selection
      if (aoi.id !== undefined) {
        layer.on("click", (evt) => {
          L.DomEvent.stopPropagation(evt);
          if (isInCart) {
            dispatch(removeAoiFromCart(aoi.id!));
            toast.success(`${aoi.name || `AOI #${aoi.id}`} removed from cart`, {
              style: { background: "#1f2937", color: "#fff" },
              icon: "➖",
            });
          } else {
            const area = calculateAreaFromGeometry(aoi.geometry);
            const cartItem: AoiCartItem = {
              id: aoi.id!,
              name: aoi.name || generateAoiName(aoi.geometry, aoi.id!),
              geometry: aoi.geometry,
              area,
              coordinates: formatCoordinates(aoi.geometry),
              type: isRectangle(aoi.geometry) ? "Rectangle" : aoi.geometry.type,
              is_active: aoi.is_active,
              monitoring_enabled: aoi.monitoring_enabled,
              created_at: aoi.created_at || new Date(),
              addedToCartAt: new Date(),
              description: aoi.description,
              tags: aoi.tags,
            };
            dispatch(addAoiToCart(cartItem));
            toast.success(`${cartItem.name} added to cart!`, {
              style: { background: "#1f2937", color: "#fff" },
              icon: "➕",
            });
          }
          onSelect(aoi.id!);
        });

        // Popup content with a button that we wire on popupopen.
        const area = calculateAreaFromGeometry(aoi.geometry);
        const coordinates = formatCoordinates(aoi.geometry);
        const popupHtml = `
          <div style="min-width:250px;font-family:system-ui;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
              <h4 style="margin:0;color:#1f2937;">${
                aoi.name || `AOI #${aoi.id}`
              }</h4>
              <span style="background:${
                isInCart ? "#10b981" : "#6b7280"
              };color:white;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;">
                ${isInCart ? "IN CART" : "NOT IN CART"}
              </span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
              <div><strong style="font-size:12px;color:#6b7280;">Status:</strong><div style="font-size:13px;color:${
                aoi.is_active ? "#10b981" : "#ef4444"
              }">${aoi.is_active ? "● Active" : "● Inactive"}</div></div>
              <div><strong style="font-size:12px;color:#6b7280;">Monitoring:</strong><div style="font-size:13px;color:${
                aoi.monitoring_enabled ? "#3b82f6" : "#6b7280"
              }">${
          aoi.monitoring_enabled ? "● Enabled" : "● Disabled"
        }</div></div>
            </div>
            <div style="margin-bottom:12px;"><strong style="font-size:12px;color:#6b7280;">Area:</strong><div style="font-size:14px;font-weight:600;color:#1f2937;">${formatArea(
              area
            )}</div></div>
            <details style="margin-bottom:12px;">
              <summary style="font-size:12px;color:#6b7280;cursor:pointer;"><strong>Coordinates</strong></summary>
              <div style="font-family:monospace;font-size:10px;background:#f3f4f6;padding:8px;border-radius:4px;margin-top:4px;max-height:60px;overflow-y:auto;word-break:break-all;">${coordinates}</div>
            </details>
            <button data-aoi-id="${
              aoi.id
            }" class="aoi-cart-toggle" style="background:${
          isInCart ? "#ef4444" : "#10b981"
        };color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;width:100%;font-weight:600;font-size:13px;">
              ${isInCart ? "Remove from Cart" : "Add to Cart"}
            </button>
          </div>
        `;

        layer.bindPopup(popupHtml);

        // Wire button when popup opens
        layer.on("popupopen", (evt) => {
          const popupNode = (
            evt.popup as L.Popup
          ).getElement() as HTMLElement | null;
          if (!popupNode) return;
          const btn =
            popupNode.querySelector<HTMLButtonElement>(".aoi-cart-toggle");
          if (!btn) return;
          const idAttr = btn.dataset.aoiId;
          if (!idAttr) return;
          const aoiId = Number(idAttr);

          const onClick = (ev: Event) => {
            ev.preventDefault();
            const present = cartItems.some((it) => it.id === aoiId);
            if (present) {
              dispatch(removeAoiFromCart(aoiId));
              toast.success("Removed from cart", { icon: "➖" });
            } else {
              const areaInner = calculateAreaFromGeometry(aoi.geometry);
              const cartItem: AoiCartItem = {
                id: aoiId,
                name: aoi.name || generateAoiName(aoi.geometry, aoiId),
                geometry: aoi.geometry,
                area: areaInner,
                coordinates: formatCoordinates(aoi.geometry),
                type: isRectangle(aoi.geometry)
                  ? "Rectangle"
                  : aoi.geometry.type,
                is_active: aoi.is_active,
                monitoring_enabled: aoi.monitoring_enabled,
                created_at: aoi.created_at || new Date(),
                addedToCartAt: new Date(),
                description: aoi.description,
                tags: aoi.tags,
              };
              dispatch(addAoiToCart(cartItem));
              toast.success("Added to cart!", { icon: "➕" });
            }
            // close popup after action
            (evt.popup as L.Popup).remove();
          };

          btn.addEventListener("click", onClick, { once: true });

          // remove handler when popup closes to avoid leaks
          layer.once("popupclose", () => {
            try {
              btn.removeEventListener("click", onClick);
            } catch {
              // Ignore errors when removing event listener
            }
          });
        });
      }

      fg.addLayer(layer);
    });
  }, [aois, cartItems, dispatch, onSelect, previewAoiId]);

  /* ---------------------------
     Exposed drawing functions + cart utilities
     --------------------------- */
  const startPolygon = useCallback(() => {
    if (!map) return;
    // Use DrawMap type to ensure compatibility with leaflet-draw
    const drawer = new L.Draw.Polygon(map as DrawMap, {
      shapeOptions: { color: "blue", weight: 2, fillOpacity: 0.2 },
      allowIntersection: false,
      showArea: false,
    });
    drawer.enable();
  }, [map]);

  const startRectangle = useCallback(() => {
    if (!map) return;
    // Use DrawMap type to ensure compatibility with leaflet-draw
    const drawer = new L.Draw.Rectangle(map as DrawMap, {
      shapeOptions: { color: "blue", weight: 2, fillOpacity: 0.2 },
    });
    drawer.enable();
  }, [map]);

  const toggleAutoAddToCart = useCallback(() => {
    setAutoAddEnabled((prev) => {
      const newValue = !prev;
      toast.success(`Auto-add to cart ${newValue ? "enabled" : "disabled"}`, {
        style: { background: "#1f2937", color: "#fff" },
        icon: newValue ? "🔄" : "⏸️",
      });
      return newValue;
    });
  }, []);

  const addAllToCart = useCallback(() => {
    let addedCount = 0;
    aois.forEach((aoi) => {
      if (aoi.id && !cartItems.some((item) => item.id === aoi.id)) {
        const area = calculateAreaFromGeometry(aoi.geometry);
        const cartItem: AoiCartItem = {
          id: aoi.id,
          name: aoi.name || generateAoiName(aoi.geometry, aoi.id),
          geometry: aoi.geometry,
          area,
          coordinates: formatCoordinates(aoi.geometry),
          type: isRectangle(aoi.geometry) ? "Rectangle" : aoi.geometry.type,
          is_active: aoi.is_active,
          monitoring_enabled: aoi.monitoring_enabled,
          created_at: aoi.created_at || new Date(),
          addedToCartAt: new Date(),
          description: aoi.description,
          tags: aoi.tags,
        };
        dispatch(addAoiToCart(cartItem));
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast.success(`Added ${addedCount} AOIs to cart`, {
        style: { background: "#1f2937", color: "#fff" },
        icon: "📦",
      });
    } else {
      toast("All AOIs are already in cart", { icon: "ℹ️" });
    }
  }, [aois, cartItems, dispatch]);

  const clearCartItems = useCallback(() => {
    const cartAoiIds = cartItems.map((item) => item.id);
    cartAoiIds.forEach((id) => {
      dispatch(removeAoiFromCart(id));
    });
    toast.success("Cart cleared", { icon: "🧹" });
  }, [cartItems, dispatch]);

  return {
    drawnItemsRef,
    startPolygon,
    startRectangle,
    autoAddToCart: autoAddEnabled,
    toggleAutoAddToCart,
    addAllToCart,
    clearCart: clearCartItems,
    cartItemCount: cartItems.length,
    cartItems,
    formatArea,
    formatCoordinates,
  };
};
