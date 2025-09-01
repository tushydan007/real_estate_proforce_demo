import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L, { Marker } from "leaflet";

interface EnhancedMapControllerProps {
  center?: [number, number] | null;
  centerZoom?: number;
  searchLocation?: { lat: number; lng: number; name: string } | null;
  bounds?: [[number, number], [number, number]];
  animate?: boolean;
  debug?: boolean;
  showMarker?: boolean;
  markerIcon?: L.Icon | L.DivIcon; // custom marker
  searchZoom?: number; // default 18
  flyDuration?: number; // default 2
}

export const MapController = ({
  center,
  centerZoom,
  searchLocation,
  bounds,
  animate = true,
  debug = false,
  showMarker = false,
  markerIcon,
  searchZoom = 18,
  flyDuration = 2,
}: EnhancedMapControllerProps) => {
  const map = useMap();
  const prevLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const markerRef = useRef<Marker | null>(null);

  // 🔹 Handle searchLocation
  useEffect(() => {
    if (searchLocation) {
      const { lat, lng, name } = searchLocation;

      if (
        prevLocationRef.current?.lat === lat &&
        prevLocationRef.current?.lng === lng
      ) {
        return;
      }

      if (debug) console.log("Flying to searchLocation:", searchLocation);

      // Smooth animation
      map.flyTo([lat, lng], searchZoom, { animate, duration: flyDuration });

      map.once("moveend", () => {
        L.popup()
          .setLatLng([lat, lng])
          .setContent(`<b>${name}</b>`)
          .openOn(map);

        if (showMarker) {
          if (markerRef.current) map.removeLayer(markerRef.current);

          const marker = L.marker([lat, lng], {
            title: name,
            icon: markerIcon ?? undefined,
          }).addTo(map);

          marker.bindPopup(`<b>${name}</b>`);
          markerRef.current = marker;
        } else if (markerRef.current) {
          map.removeLayer(markerRef.current);
          markerRef.current = null;
        }
      });

      prevLocationRef.current = { lat, lng };
    }
  }, [
    searchLocation,
    map,
    animate,
    debug,
    showMarker,
    markerIcon,
    searchZoom,
    flyDuration,
  ]);

  // 🔹 Handle center updates
  useEffect(() => {
    if (center) {
      if (debug) console.log("Centering map:", center);

      map.flyTo(center, centerZoom ?? map.getZoom(), {
        animate,
        duration: 2,
      });
    }
  }, [center, centerZoom, map, animate, debug]);

  // 🔹 Handle bounds
  useEffect(() => {
    if (bounds) {
      if (debug) console.log("Fitting bounds:", bounds);

      map.fitBounds(bounds, { padding: [50, 50], animate });
    }
  }, [bounds, map, animate, debug]);

  return null;
};
