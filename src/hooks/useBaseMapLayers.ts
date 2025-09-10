import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Map } from "leaflet";

export const useBaseMapLayers = (map: Map) => {
  const activeLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!map) return;

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

    const baseMaps: Record<string, L.TileLayer> = {
      OpenStreetMap: osm,
      Satellite: satellite,
    };

    activeLayerRef.current = baseMaps.OpenStreetMap;
    activeLayerRef.current.addTo(map);

    const control = L.control
      .layers(baseMaps, undefined, { position: "topright" })
      .addTo(map);

    map.on("baselayerchange", (e: L.LayersControlEvent) => {
      const newLayer = baseMaps[e.name];
      if (newLayer && activeLayerRef.current !== newLayer) {
        if (activeLayerRef.current) map.removeLayer(activeLayerRef.current);
        newLayer.addTo(map);
        activeLayerRef.current = newLayer;
      }
    });

    return () => {
      map.removeControl(control);
      if (activeLayerRef.current) map.removeLayer(activeLayerRef.current);
    };
  }, [map]);
};
