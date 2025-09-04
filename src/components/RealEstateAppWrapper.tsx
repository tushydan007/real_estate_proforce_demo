import { useState, useEffect, useRef } from "react";
import Globe from "react-globe.gl";
import type { GlobeMethods } from "react-globe.gl";
import RealEstateMapApp from "./RealEstateMapApp";

/* ---------------- Wrapper with 3D Globe Intro ---------------- */
const RealEstateAppWrapper = () => {
  const [showMap, setShowMap] = useState(false);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);

  const targetLocation = { lat: 6.98647, lng: 3.65586 };

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.8;

      // Animate to Lagos after 3s
      setTimeout(() => {
        globeRef.current?.pointOfView(
          { lat: targetLocation.lat, lng: targetLocation.lng, altitude: 1.5 },
          3000
        );
      }, 3000);

      // Show map after 6s
      setTimeout(() => {
        setShowMap(true);
      }, 6000);
    }
  }, []);

  if (showMap) return <RealEstateMapApp />;

  return (
    <div className="w-full h-screen bg-black">
      <Globe
        ref={globeRef}
        width={window.innerWidth}
        height={window.innerHeight}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
      />
      <div className="absolute top-4 left-4 text-white text-lg font-bold">
        🌍 Loading Map...
      </div>
    </div>
  );
};

export default RealEstateAppWrapper;
