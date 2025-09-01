import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface MapControllerProps {
  center: [number, number] | null;
  searchLocation: { lat: number; lng: number; name: string } | null;
}

export const MapController: React.FC<MapControllerProps> = ({
  center,
  searchLocation,
}) => {
  const map = useMap();

  useEffect(() => {
    if (searchLocation) {
      map.flyTo([searchLocation.lat, searchLocation.lng], 18, {
        animate: true,
        duration: 2,
      });
    }
  }, [searchLocation, map]);

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  return null;
};
