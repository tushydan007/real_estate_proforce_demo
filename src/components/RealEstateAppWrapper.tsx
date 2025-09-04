import { useState, useEffect, useRef } from "react";
import Globe from "react-globe.gl";
import type { GlobeMethods } from "react-globe.gl";
import RealEstateMapApp from "./RealEstateMapApp";

const RealEstateAppWrapper = () => {
  const [showMap, setShowMap] = useState(false); // map becomes visible
  const [hideGlobe, setHideGlobe] = useState(false); // globe fades out
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

      // Start showing map in background at 5s
      setTimeout(() => {
        setShowMap(true);
      }, 5000);

      // Fade out globe after 6s
      setTimeout(() => {
        setHideGlobe(true);
      }, 6000);
    }
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-black overflow-hidden">
      {/* Map */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          showMap ? "opacity-100" : "opacity-0"
        }`}
      >
        <RealEstateMapApp />
      </div>

      {/* Globe */}
      <div
        className={`absolute inset-0 transition-opacity duration-1500 ${
          hideGlobe ? "opacity-0" : "opacity-100"
        }`}
      >
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
    </div>
  );
};

export default RealEstateAppWrapper;
