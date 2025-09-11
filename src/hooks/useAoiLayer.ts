
// WORKING CODE
import L from "leaflet";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import type { Map } from "leaflet";
import type { Aoi } from "../../src/lib/types";
import { useEffect, useRef } from "react";

// Props for the hook
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

// GeoJSON validation
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

// Hook
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
            allowIntersection: false, // Prevent self-intersecting polygons
            showArea: true, // Display area of the polygon
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

  // Handle CREATE, EDIT, DELETE events
  useEffect(() => {
    const drawnItems = drawnItemsRef.current;

    const handleCreated = (event: L.LeafletEvent) => {
      const e = event as L.DrawEvents.Created;
      if (!e.layer || !e.layerType) return;

      const layer = e.layer;
      drawnItems.addLayer(layer);

      // Only polygons or rectangles
      if (e.layerType !== "polygon" && e.layerType !== "rectangle") return;

      if (layer instanceof L.Polygon) {
        const geoJson = layer.toGeoJSON().geometry as
          | GeoJSON.Polygon
          | GeoJSON.MultiPolygon;
        if (isValidGeoJsonGeometry(geoJson)) {
          onCreate(geoJson);
          console.log("Created AOI:", geoJson); // Debug log
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
          console.log("Edited AOI:", matchedAoi.id, geoJson); // Debug log
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
          console.log("Deleted AOI:", matchedAoi.id); // Debug log
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

  // Render AOIs
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
      showArea: true,
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
