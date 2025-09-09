"use client";

import { useRef } from "react";
import { MapContainer, FeatureGroup } from "react-leaflet";
import L from "leaflet";
import { MapLogic } from "../components/map/MapLogic";
import type { MapComponentProps } from "../../src/lib/types";

const MapComponent = (props: MapComponentProps) => {
  const featureGroupRef = useRef<L.FeatureGroup>(null);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[9.082, 8.6753]}
        zoom={3}
        style={{ height: "100%", width: "100%" }}
      >
        <FeatureGroup ref={featureGroupRef} />
        <MapLogic {...props} />
      </MapContainer>
    </div>
  );
};

export default MapComponent;
