// src/components/map/DrawControl.tsx
"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import L, { FeatureGroup, Layer } from "leaflet";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import { useMap } from "react-leaflet";
import type { Aoi } from "@/lib/types";

export type DrawControlHandle = {
  startPolygon: () => void;
  startRectangle: () => void;
};

interface DrawControlProps {
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

/* Geometry type guard */
const isValidGeoJsonGeometry = (
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | undefined
): geometry is GeoJSON.Polygon | GeoJSON.MultiPolygon => {
  if (!geometry) return false;
  if (geometry.type === "Polygon") {
    return (
      Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0
    );
  }
  if (geometry.type === "MultiPolygon") {
    return (
      Array.isArray(geometry.coordinates) &&
      geometry.coordinates.every(
        (poly) => Array.isArray(poly) && poly.length > 0
      )
    );
  }
  return false;
};

const defaultShapeOptions: L.PathOptions = {
  color: "blue",
  weight: 2,
  fillOpacity: 0.2,
};

const DrawControl = forwardRef<DrawControlHandle, DrawControlProps>(
  ({ aois, onCreate, onEdit, onDelete, onSelect, previewAoiId }, ref) => {
    const map = useMap();

    const drawnItemsRef = useRef<FeatureGroup | null>(null);
    const drawControlRef = useRef<L.Control.Draw | null>(null);
    const polygonDrawRef = useRef<L.Draw.Polygon | null>(null);
    const rectangleDrawRef = useRef<L.Draw.Rectangle | null>(null);

    // 1) create/destroy FeatureGroup
    useEffect(() => {
      const fg = new L.FeatureGroup();
      drawnItemsRef.current = fg;
      map.addLayer(fg);

      return () => {
        map.removeLayer(fg);
      };
    }, [map]);

    // 2) initialize draw control + handlers
    useEffect(() => {
      if (drawControlRef.current) return;

      drawControlRef.current = new L.Control.Draw({
        position: "topleft",
        draw: {
          polygon: {
            shapeOptions: defaultShapeOptions,
            allowIntersection: false,
            showArea: true,
          },
          rectangle: { shapeOptions: defaultShapeOptions },
          polyline: false,
          circle: false,
          circlemarker: false,
          marker: false,
        },
        edit: {
          featureGroup: drawnItemsRef.current as FeatureGroup,
          remove: true,
        },
      });

      map.addControl(drawControlRef.current);

      polygonDrawRef.current = new L.Draw.Polygon(map as unknown as L.DrawMap, {
        shapeOptions: defaultShapeOptions,
        allowIntersection: false,
        showArea: true,
      });

      rectangleDrawRef.current = new L.Draw.Rectangle(
        map as unknown as L.DrawMap,
        {
          shapeOptions: defaultShapeOptions,
        }
      );

      return () => {
        if (drawControlRef.current) {
          map.removeControl(drawControlRef.current);
          drawControlRef.current = null;
        }
      };
    }, [map]);

    // 3) created / edited / deleted handlers
    useEffect(() => {
      if (!map) return;

      const handleCreated = (evt: L.DrawEvents.Created) => {
        const layer = evt.layer;
        drawnItemsRef.current?.addLayer(layer);

        if (evt.layerType === "polygon" || evt.layerType === "rectangle") {
          const geoJson = (layer as L.Polygon | L.Rectangle).toGeoJSON()
            .geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon | undefined;

          if (isValidGeoJsonGeometry(geoJson)) {
            onCreate(geoJson);
          }
        }
      };

      const handleEdited = (evt: L.DrawEvents.Edited) => {
        evt.layers.eachLayer((layer: Layer) => {
          if ("toGeoJSON" in layer) {
            const feature = (
              layer as L.Layer & {
                toGeoJSON: () => GeoJSON.Feature;
              }
            ).toGeoJSON();
            const props = feature.properties ?? {};
            const idFromProps =
              (props as { id?: number; aoiId?: number })?.id ??
              (props as { id?: number; aoiId?: number })?.aoiId;

            const geometry = feature.geometry as
              | GeoJSON.Polygon
              | GeoJSON.MultiPolygon
              | undefined;

            if (idFromProps != null && isValidGeoJsonGeometry(geometry)) {
              onEdit(Number(idFromProps), geometry);
              return;
            }

            if (geometry && isValidGeoJsonGeometry(geometry)) {
              const matched = aois.find(
                (a) => JSON.stringify(a.geometry) === JSON.stringify(geometry)
              );
              if (matched?.id) onEdit(matched.id, geometry);
            }
          }
        });
      };

      const handleDeleted = (evt: L.DrawEvents.Deleted) => {
        evt.layers.eachLayer((layer: Layer) => {
          if ("toGeoJSON" in layer) {
            const feature = (
              layer as L.Layer & {
                toGeoJSON: () => GeoJSON.Feature;
              }
            ).toGeoJSON();
            const props = feature.properties ?? {};
            const idFromProps =
              (props as { id?: number; aoiId?: number })?.id ??
              (props as { id?: number; aoiId?: number })?.aoiId;

            if (idFromProps != null) {
              onDelete(Number(idFromProps));
              return;
            }

            const geometry = feature.geometry as
              | GeoJSON.Polygon
              | GeoJSON.MultiPolygon
              | undefined;
            if (geometry && isValidGeoJsonGeometry(geometry)) {
              const matched = aois.find(
                (a) => JSON.stringify(a.geometry) === JSON.stringify(geometry)
              );
              if (matched?.id) onDelete(matched.id);
            }
          }
        });
      };

      map.on(
        L.Draw.Event.CREATED,
        handleCreated as (e: L.LeafletEvent) => void
      );
      map.on(L.Draw.Event.EDITED, handleEdited as (e: L.LeafletEvent) => void);
      map.on(
        L.Draw.Event.DELETED,
        handleDeleted as (e: L.LeafletEvent) => void
      );

      return () => {
        map.on(
          L.Draw.Event.CREATED,
          handleCreated as (e: L.LeafletEvent) => void
        );
        map.on(
          L.Draw.Event.EDITED,
          handleEdited as (e: L.LeafletEvent) => void
        );
        map.on(
          L.Draw.Event.DELETED,
          handleDeleted as (e: L.LeafletEvent) => void
        );
      };
    }, [map, aois, onCreate, onEdit, onDelete]);

    // 4) render AOIs into the drawnItems FeatureGroup
    useEffect(() => {
      const group = drawnItemsRef.current;
      if (!group) return;

      group.clearLayers();

      aois.forEach((aoi) => {
        if (!aoi.geometry) return;

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
          onEachFeature: (feature, lyr) => {
            if (!feature.properties) feature.properties = {};
            feature.properties.id = aoi.id;
            lyr.on("click", () => {
              if (aoi.id) onSelect(aoi.id);
            });
          },
        });

        group.addLayer(layer);
      });
    }, [aois, previewAoiId, onSelect]);

    // 5) expose startPolygon/startRectangle to parent via ref
    useImperativeHandle(ref, () => ({
      startPolygon: () => {
        rectangleDrawRef.current?.disable();
        polygonDrawRef.current?.enable();
      },
      startRectangle: () => {
        polygonDrawRef.current?.disable();
        rectangleDrawRef.current?.enable();
      },
    }));

    return null;
  }
);

export default DrawControl;
