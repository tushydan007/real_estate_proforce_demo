"use client";

import { useEffect, useRef } from "react";
import { MapContainer, FeatureGroup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import "leaflet-draw";

import type { Aoi } from "../../src/lib/types";
import type { LeafletEvent } from "leaflet";

// Utility function to validate GeoJSON geometry
const isValidGeoJsonGeometry = (
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | undefined
): geometry is GeoJSON.Polygon | GeoJSON.MultiPolygon => {
  if (!geometry) return false;
  if (!geometry.type || !geometry.coordinates) return false;
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

type MapComponentProps = {
  aois: Aoi[];
  onCreate: (geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon) => void;
  onEdit: (
    id: number,
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
  ) => void;
  onDelete: (id: number) => void;
  onSelect: (id: number) => void;
  previewAoiId?: number;
};

const MapLogic = ({
  aois,
  onCreate,
  onEdit,
  onDelete,
  onSelect,
}: MapComponentProps) => {
  const map = useMap();
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());

  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    map.addLayer(drawnItems);

    // Basemap layers
    const osm = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
      }
    );

    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles © Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye",
      }
    );

    const dark = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors © <a href='https://carto.com/'>CARTO</a>",
        subdomains: "abcd",
        maxZoom: 20,
      }
    );

    const baseMaps: Record<string, L.TileLayer> = {
      OpenStreetMap: osm,
      Satellite: satellite,
      Dark: dark,
    };

    // Load saved basemap
    const savedBasemap = localStorage.getItem("basemap") || "OpenStreetMap";
    const activeLayer = baseMaps[savedBasemap] || osm;
    activeLayer.addTo(map);

    // Layer control
    const control = L.control
      .layers(baseMaps, undefined, { position: "topright" })
      .addTo(map);

    map.on("baselayerchange", (e: L.LayersControlEvent) => {
      localStorage.setItem("basemap", e.name);
    });

    // Leaflet.Draw control
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItemsRef.current,
      },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: "limegreen",
            weight: 2,
          },
        },
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
      },
    });
    map.addControl(drawControl);

    // Handle create
    map.on(L.Draw.Event.CREATED, (e: LeafletEvent) => {
      const event = e as L.DrawEvents.Created;
      const layer = event.layer;
      drawnItemsRef.current.addLayer(layer);

      const geoJson = layer.toGeoJSON().geometry as
        | GeoJSON.Polygon
        | GeoJSON.MultiPolygon;
      if (isValidGeoJsonGeometry(geoJson)) {
        onCreate(geoJson);
      } else {
        console.error("Invalid GeoJSON created:", geoJson);
      }
    });

    // Handle edit
    map.on(L.Draw.Event.EDITED, (e: LeafletEvent) => {
      const event = e as L.DrawEvents.Edited;
      event.layers.eachLayer((layer) => {
        const geoJson = (layer as L.Polygon).toGeoJSON().geometry as
          | GeoJSON.Polygon
          | GeoJSON.MultiPolygon;
        if (!isValidGeoJsonGeometry(geoJson)) {
          console.error("Invalid GeoJSON edited:", geoJson);
          return;
        }
        const matchedAoi = aois.find(
          (aoi) => JSON.stringify(aoi.geometry) === JSON.stringify(geoJson)
        );
        if (matchedAoi?.id) {
          onEdit(matchedAoi.id, geoJson);
        }
      });
    });

    // Handle delete
    map.on(L.Draw.Event.DELETED, (e: LeafletEvent) => {
      const event = e as L.DrawEvents.Deleted;
      event.layers.eachLayer((layer) => {
        const geoJson = (layer as L.Polygon).toGeoJSON().geometry as
          | GeoJSON.Polygon
          | GeoJSON.MultiPolygon;
        if (!isValidGeoJsonGeometry(geoJson)) {
          console.error("Invalid GeoJSON deleted:", geoJson);
          return;
        }
        const matchedAoi = aois.find(
          (aoi) => JSON.stringify(aoi.geometry) === JSON.stringify(geoJson)
        );
        if (matchedAoi?.id) {
          onDelete(matchedAoi.id);
        }
      });
    });

    return () => {
      map.removeLayer(drawnItems);
      map.removeControl(control);
      map.removeControl(drawControl);
    };
  }, [map, aois, onCreate, onEdit, onDelete]);

  // Show saved AOIs
  useEffect(() => {
    drawnItemsRef.current.clearLayers();

    aois.forEach((aoi) => {
      if (!isValidGeoJsonGeometry(aoi.geometry)) {
        console.error("Invalid GeoJSON for AOI:", aoi);
        return;
      }

      const feature: GeoJSON.Feature = {
        type: "Feature",
        geometry: aoi.geometry,
        properties: {},
      };

      try {
        const layer = L.geoJSON(feature, {
          style: {
            color: aoi.is_active ? "limegreen" : "gray",
            weight: 2,
            fillOpacity: aoi.monitoring_enabled ? 0.4 : 0.2,
          },
        });

        layer.on("click", () => {
          if (aoi.id) onSelect(aoi.id);
        });

        drawnItemsRef.current.addLayer(layer);
      } catch (error) {
        console.error("Error rendering GeoJSON for AOI:", aoi, error);
      }
    });
  }, [aois, onSelect]);

  return null;
};

const MapComponent = (props: MapComponentProps) => {
  const featureGroupRef = useRef<L.FeatureGroup>(null);

  return (
    <MapContainer
      center={[9.082, 8.6753]} // Nigeria default
      zoom={3}
      style={{ height: "100%", width: "100%" }}
    >
      <FeatureGroup ref={featureGroupRef} />
      <MapLogic {...props} />
    </MapContainer>
  );
};

export default MapComponent;
