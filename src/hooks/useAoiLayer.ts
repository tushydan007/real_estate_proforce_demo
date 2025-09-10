// THIS IS A VALID CODE FOR FALLBACK
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

  return drawnItemsRef;
};

// LEAFLET-EDITABLE-MAP-DRAWING
// import L from "leaflet";
// import "leaflet-editable";
// import { Layer, Polygon } from "leaflet";
// import type { Aoi } from "../../src/lib/types";
// import type { Map as LeafletMap, LeafletEvent } from "leaflet";
// import { useEffect, useRef, useCallback } from "react";

// // Extend the Map interface to include editable methods
// declare module "leaflet" {
//   interface Map {
//     editTools: L.Editable;
//   }
// }

// // Props for the hook
// interface UseAoiLayerProps {
//   map: LeafletMap;
//   aois: Aoi[];
//   onCreate: (geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon) => void;
//   onEdit: (
//     id: number,
//     geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
//   ) => void;
//   onDelete: (id: number) => void;
//   onSelect: (id: number) => void;
//   previewAoiId?: number;
// }

// // Custom event interfaces for better type safety
// interface EditableCreatedEvent extends LeafletEvent {
//   layer: L.Polygon;
// }

// interface EditableEditedEvent extends LeafletEvent {
//   layer: L.Polygon;
// }

// // GeoJSON validation with improved type safety
// const isValidGeoJsonGeometry = (
//   geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | undefined
// ): geometry is GeoJSON.Polygon | GeoJSON.MultiPolygon => {
//   if (!geometry) return false;
//   if (!geometry.type || !geometry.coordinates) return false;

//   if (geometry.type === "Polygon") {
//     return (
//       Array.isArray(geometry.coordinates) &&
//       geometry.coordinates.length > 0 &&
//       geometry.coordinates.every(
//         (ring) => Array.isArray(ring) && ring.length >= 4
//       )
//     );
//   }

//   if (geometry.type === "MultiPolygon") {
//     return (
//       Array.isArray(geometry.coordinates) &&
//       geometry.coordinates.every(
//         (polygon) =>
//           Array.isArray(polygon) &&
//           polygon.length > 0 &&
//           polygon.every((ring) => Array.isArray(ring) && ring.length >= 4)
//       )
//     );
//   }

//   return false;
// };

// // Helper function to find AOI by geometry
// const findAoiByGeometry = (
//   aois: Aoi[],
//   geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
// ): Aoi | undefined => {
//   return aois.find(
//     (aoi) => JSON.stringify(aoi.geometry) === JSON.stringify(geometry)
//   );
// };

// // Hook implementation
// export const useAoiLayer = ({
//   map,
//   aois,
//   onCreate,
//   onEdit,
//   onDelete,
//   onSelect,
//   previewAoiId,
// }: UseAoiLayerProps) => {
//   const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
//   const activeLayersRef = useRef<Map<number, L.GeoJSON>>(
//     new Map<number, L.GeoJSON>()
//   );
//   const isDrawingRef = useRef<boolean>(false);

//   // Initialize editable functionality
//   useEffect(() => {
//     // Enable editable on the map
//     if (!map.editTools) {
//       map.options = { ...map.options, editable: true };
//       // Reinitialize the map with editable options if needed
//     }

//     const drawnItems = drawnItemsRef.current;
//     map.addLayer(drawnItems);

//     return () => {
//       map.removeLayer(drawnItems);
//     };
//   }, [map]);

//   // Handle layer creation
//   const handleLayerCreated = useCallback(
//     (event: LeafletEvent) => {
//       const e = event as EditableCreatedEvent;
//       const layer = e.layer;

//       if (!(layer instanceof L.Polygon)) return;

//       const geoJson = layer.toGeoJSON().geometry as
//         | GeoJSON.Polygon
//         | GeoJSON.MultiPolygon;

//       if (isValidGeoJsonGeometry(geoJson)) {
//         onCreate(geoJson);
//         console.log("Created AOI:", geoJson);
//       }

//       isDrawingRef.current = false;
//     },
//     [onCreate]
//   );

//   // Handle layer editing
//   const handleLayerEdited = useCallback(
//     (event: LeafletEvent) => {
//       const e = event as EditableEditedEvent;
//       const layer = e.layer;

//       if (!(layer instanceof L.Polygon)) return;

//       const geoJson = layer.toGeoJSON().geometry as
//         | GeoJSON.Polygon
//         | GeoJSON.MultiPolygon;

//       if (!isValidGeoJsonGeometry(geoJson)) return;

//       const matchedAoi = findAoiByGeometry(aois, geoJson);
//       if (matchedAoi?.id !== undefined) {
//         onEdit(matchedAoi.id, geoJson);
//         console.log("Edited AOI:", matchedAoi.id, geoJson);
//       }
//     },
//     [aois, onEdit]
//   );

//   // Event handlers setup
//   useEffect(() => {
//     map.on("editable:created", handleLayerCreated);
//     map.on("editable:edited", handleLayerEdited);

//     return () => {
//       map.off("editable:created", handleLayerCreated);
//       map.off("editable:edited", handleLayerEdited);
//     };
//   }, [map, handleLayerCreated, handleLayerEdited]);

//   // Render AOIs on the map
//   useEffect(() => {
//     // Clear existing layers
//     drawnItemsRef.current.clearLayers();
//     activeLayersRef.current.clear();

//     aois.forEach((aoi) => {
//       if (!isValidGeoJsonGeometry(aoi.geometry)) {
//         console.error("Invalid GeoJSON for AOI:", aoi);
//         return;
//       }

//       const layer = L.geoJSON(aoi.geometry, {
//         style: {
//           color:
//             aoi.id === previewAoiId
//               ? "red"
//               : aoi.is_active
//               ? "limegreen"
//               : "gray",
//           weight: 2,
//           fillOpacity: aoi.monitoring_enabled ? 0.4 : 0.2,
//         },
//         onEachFeature: (_, layer) => {
//           if (aoi.id !== undefined) {
//             // Enable editing for this layer
//             if (layer instanceof L.Polygon) {
//               layer.enableEdit();
//             }

//             // Add click handler for selection
//             layer.on("click", (e) => {
//               L.DomEvent.stopPropagation(e);
//               onSelect(aoi.id!);
//             });

//             // Add context menu for deletion
//             layer.on("contextmenu", (e) => {
//               L.DomEvent.stopPropagation(e);
//               if (confirm(`Delete AOI ${aoi.id}?`)) {
//                 onDelete(aoi.id!);
//               }
//             });
//           }
//         },
//       });

//       if (aoi.id !== undefined) {
//         activeLayersRef.current.set(aoi.id, layer);
//       }

//       drawnItemsRef.current.addLayer(layer);
//     });
//   }, [aois, onSelect, onDelete, previewAoiId]);

//   // Drawing controls
//   const startPolygonDrawing = useCallback(() => {
//     if (isDrawingRef.current) return;
//     isDrawingRef.current = true;

//     try {
//       const polygon = map.editTools.startPolygon();
//       polygon.options.color = "blue";
//       polygon.options.weight = 2;
//       polygon.options.fillOpacity = 0.2;
//     } catch (error) {
//       console.error("Error starting polygon drawing:", error);
//       isDrawingRef.current = false;
//     }
//   }, [map]);

//   const startRectangleDrawing = useCallback(() => {
//     if (isDrawingRef.current) return;
//     isDrawingRef.current = true;

//     try {
//       const rectangle = map.editTools.startRectangle();
//       rectangle.options.color = "blue";
//       rectangle.options.weight = 2;
//       rectangle.options.fillOpacity = 0.2;
//     } catch (error) {
//       console.error("Error starting rectangle drawing:", error);
//       isDrawingRef.current = false;
//     }
//   }, [map]);

//   const stopDrawing = useCallback(() => {
//     try {
//       map.editTools.stopDrawing();
//       isDrawingRef.current = false;
//     } catch (error) {
//       console.error("Error stopping drawing:", error);
//     }
//   }, [map]);

//   const enableEditMode = useCallback((aoiId: number) => {
//     const layer = activeLayersRef.current.get(aoiId);
//     if (layer) {
//       layer.eachLayer((l: Layer) => {
//         if (l instanceof L.Polygon) {
//           l.enableEdit();
//         }
//       });
//     }
//   }, []);

//   const disableEditMode = useCallback((aoiId: number) => {
//     const layer = activeLayersRef.current.get(aoiId);
//     if (layer) {
//       layer.eachLayer((l: Layer) => {
//         if (l instanceof L.Polygon) {
//           l.disableEdit();
//         }
//       });
//     }
//   }, []);

//   const removeAoi = useCallback(
//     (aoiId: number) => {
//       const layer = activeLayersRef.current.get(aoiId);
//       if (layer) {
//         drawnItemsRef.current.removeLayer(layer);
//         activeLayersRef.current.delete(aoiId);
//         onDelete(aoiId);
//       }
//     },
//     [onDelete]
//   );

//   return {
//     drawnItems: drawnItemsRef,
//     startPolygonDrawing,
//     startRectangleDrawing,
//     stopDrawing,
//     enableEditMode,
//     disableEditMode,
//     removeAoi,
//     isDrawing: () => isDrawingRef.current,
//   };
// };
