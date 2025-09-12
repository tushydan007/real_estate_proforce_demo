// WORKING CODE
import L from "leaflet";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import type { Map } from "leaflet";
import type { Aoi } from "../../src/lib/types";
import { useEffect, useRef } from "react";

interface UseAoiLayerProps {
  map: Map;
  aois: Aoi[];
  onCreate: (geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon) => void;
  onEdit: (
    id: number,
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
  ) => void;
  onDelete: (id: number) => void;
  onSelect: (id: number) => void;
  previewAoiId?: number;
}

// Simple tooltip creation/removal helpers
const createTooltip = () => {
  const tooltip = document.createElement("div");
  tooltip.style.position = "fixed";
  tooltip.style.pointerEvents = "none";
  tooltip.style.background = "rgba(0,0,0,0.8)";
  tooltip.style.color = "#fff";
  tooltip.style.padding = "4px 8px";
  tooltip.style.borderRadius = "4px";
  tooltip.style.fontSize = "12px";
  tooltip.style.zIndex = "9999";
  tooltip.style.transition = "opacity 0.1s";
  tooltip.style.opacity = "0.9";
  document.body.appendChild(tooltip);
  return tooltip;
};
const removeTooltip = (tooltip: HTMLElement | null) => {
  if (tooltip && tooltip.parentNode) {
    tooltip.parentNode.removeChild(tooltip);
  }
};

const formatArea = (area: number): string => {
  if (area > 1000000) return `${(area / 1000000).toFixed(2)} km²`;
  if (area > 10000) return `${(area / 10000).toFixed(2)} ha`;
  return `${area.toFixed(2)} m²`;
};

type GeometryUtilType = {
  geodesicArea: (latlngs: L.LatLng[]) => number;
};

const getPolygonArea = (latlngs: L.LatLng[]): number => {
  // Use Leaflet's built-in geometry util if available
  // fallback to basic Shoelace formula for small polygons
  const geometryUtil = (L as unknown as { GeometryUtil?: GeometryUtilType })
    .GeometryUtil;
  if (geometryUtil && typeof geometryUtil.geodesicArea === "function") {
    return geometryUtil.geodesicArea(latlngs);
  }
  // Shoelace formula for planar polygons
  let area = 0;
  for (let i = 0; i < latlngs.length; i++) {
    const j = (i + 1) % latlngs.length;
    area += latlngs[i].lng * latlngs[j].lat;
    area -= latlngs[j].lng * latlngs[i].lat;
  }
  return Math.abs(area / 2);
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

export const useAoiLayer = ({
  map,
  aois,
  onCreate,
  onEdit,
  onDelete,
  onSelect,
  previewAoiId,
}: UseAoiLayerProps) => {
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const tooltipRef = useRef<HTMLElement | null>(null);

  // Add feature group to map
  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    map.addLayer(drawnItems);
    return () => {
      map.removeLayer(drawnItems);
    };
  }, [map]);

  // Initialize draw control
  useEffect(() => {
    if (!drawControlRef.current) {
      const drawControl = new L.Control.Draw({
        position: "topleft",
        draw: {
          polygon: {
            shapeOptions: {
              color: "blue",
              weight: 2,
              fillOpacity: 0.2,
            },
            allowIntersection: false,
            showArea: false, // We'll handle area display ourselves
          },
          rectangle: {
            shapeOptions: {
              color: "blue",
              weight: 2,
              fillOpacity: 0.2,
            },
          },
          polyline: false,
          circle: false,
          circlemarker: false,
          marker: false,
        },
        edit: {
          featureGroup: drawnItemsRef.current,
          remove: true,
        },
      });
      map.addControl(drawControl);
      drawControlRef.current = drawControl;
    }

    return () => {
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
        drawControlRef.current = null;
      }
    };
  }, [map]);

  // Tooltip logic for drawing
  useEffect(() => {
    let drawing = false;
    let mouseMoveHandler: (ev: MouseEvent) => void = () => {};

    function showTooltip(text: string, event: MouseEvent) {
      if (!tooltipRef.current) {
        tooltipRef.current = createTooltip();
      }
      tooltipRef.current.textContent = text;
      tooltipRef.current.style.left = event.clientX + 15 + "px";
      tooltipRef.current.style.top = event.clientY + 15 + "px";
      tooltipRef.current.style.display = "block";
    }

    function hideTooltip() {
      removeTooltip(tooltipRef.current);
      tooltipRef.current = null;
    }

    // When user starts drawing
    function onDrawStart() {
      drawing = true;
      mouseMoveHandler = (ev: MouseEvent) => {
        if (!drawing) return;
        showTooltip("Start drawing...", ev);
      };
      document.addEventListener("mousemove", mouseMoveHandler);
    }

    // When user adds a vertex or moves mouse after first vertex
    const drawVertexHandler = (event: L.LeafletEvent) => {
      if (!drawing) return;
      const e = event as L.DrawEvents.DrawVertex; // Type assertion
      const latlngs: L.LatLng[] =
        e.layer && (e.layer as L.Polygon).getLatLngs
          ? ((e.layer as L.Polygon).getLatLngs()[0] as L.LatLng[])
          : [];
      let area = 0;
      if (latlngs && latlngs.length > 2) {
        area = getPolygonArea(latlngs);
      }
      if (latlngs.length > 0) {
        const txt =
          latlngs.length > 2
            ? `Area: ${formatArea(area)} | Points: ${latlngs.length}`
            : `Points: ${latlngs.length}`;
        document.addEventListener(
          "mousemove",
          function handler(ev: MouseEvent) {
            showTooltip(txt, ev);
            document.removeEventListener("mousemove", handler);
          }
        );
      }
    };

    // When drawing ends
    function onDrawStop() {
      drawing = false;
      hideTooltip();
      document.removeEventListener("mousemove", mouseMoveHandler);
    }

    map.on(L.Draw.Event.DRAWSTART, onDrawStart);
    map.on(L.Draw.Event.DRAWVERTEX, drawVertexHandler);
    map.on(L.Draw.Event.DRAWSTOP, onDrawStop);
    map.on(L.Draw.Event.CREATED, onDrawStop);

    return () => {
      map.off(L.Draw.Event.DRAWSTART, onDrawStart);
      map.off(L.Draw.Event.DRAWVERTEX, drawVertexHandler);
      map.off(L.Draw.Event.DRAWSTOP, onDrawStop);
      map.off(L.Draw.Event.CREATED, onDrawStop);
      hideTooltip();
      document.removeEventListener("mousemove", mouseMoveHandler);
    };
  }, [map]);

  // Handle CREATE, EDIT, DELETE events (unchanged)
  useEffect(() => {
    const drawnItems = drawnItemsRef.current;

    const handleCreated = (event: L.LeafletEvent) => {
      const e = event as L.DrawEvents.Created;
      if (!e.layer || !e.layerType) return;

      const layer = e.layer;
      drawnItems.addLayer(layer);

      if (e.layerType !== "polygon" && e.layerType !== "rectangle") return;

      if (layer instanceof L.Polygon) {
        const geoJson = layer.toGeoJSON().geometry as
          | GeoJSON.Polygon
          | GeoJSON.MultiPolygon;
        if (isValidGeoJsonGeometry(geoJson)) {
          onCreate(geoJson);
          console.log("Created AOI:", geoJson);
        }
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

        const matchedAoi = aois.find(
          (aoi) => JSON.stringify(aoi.geometry) === JSON.stringify(geoJson)
        );
        if (matchedAoi?.id) {
          onEdit(matchedAoi.id, geoJson);
          console.log("Edited AOI:", matchedAoi.id, geoJson);
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

        const matchedAoi = aois.find(
          (aoi) => JSON.stringify(aoi.geometry) === JSON.stringify(geoJson)
        );
        if (matchedAoi?.id) {
          onDelete(matchedAoi.id);
          console.log("Deleted AOI:", matchedAoi.id);
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
  }, [map, aois, onCreate, onEdit, onDelete]);

  // Render AOIs (unchanged)
  useEffect(() => {
    drawnItemsRef.current.clearLayers();

    aois.forEach((aoi) => {
      if (!isValidGeoJsonGeometry(aoi.geometry)) {
        console.error("Invalid GeoJSON for AOI:", aoi);
        return;
      }

      const layer = L.geoJSON(aoi.geometry, {
        style: {
          color:
            aoi.id === previewAoiId
              ? "red"
              : aoi.is_active
              ? "limegreen"
              : "gray",
          weight: 2,
          fillOpacity: aoi.monitoring_enabled ? 0.4 : 0.2,
        },
      });
      if (aoi.id !== undefined) {
        layer.on("click", () => onSelect(aoi.id!));
      }

      drawnItemsRef.current.addLayer(layer);
    });
  }, [aois, onSelect, previewAoiId]);

  const startPolygon = () => {
    if (!map) return;
    const drawer = new L.Draw.Polygon(map as unknown as L.DrawMap, {
      shapeOptions: {
        color: "blue",
        weight: 2,
        fillOpacity: 0.2,
      },
      allowIntersection: false,
      showArea: false,
    });
    drawer.enable();
  };

  const startRectangle = () => {
    if (!map) return;
    const drawer = new L.Draw.Rectangle(map as unknown as L.DrawMap, {
      shapeOptions: {
        color: "blue",
        weight: 2,
        fillOpacity: 0.2,
      },
    });
    drawer.enable();
  };

  return {
    drawnItemsRef,
    startPolygon,
    startRectangle,
  };
};
