import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";

interface PropertiesCardProps {
  sampleGeoJSON: FeatureCollection<Geometry, GeoJsonProperties>;
}

export default function PropertiesCard({ sampleGeoJSON }: PropertiesCardProps) {
  const total = sampleGeoJSON.features.length;
  const [count, setCount] = useState(1);

  // Count-up effect on page load
  useEffect(() => {
    let current = 1;
    const interval = setInterval(() => {
      if (current < total) {
        current++;
        setCount(current);
      } else {
        clearInterval(interval);
      }
    }, 100); // speed of increment (ms)

    return () => clearInterval(interval);
  }, [total]);

  return (
    <Card className="absolute bottom-10 right-4 z-[1000] shadow-2xl rounded-2xl backdrop-blur-sm bg-white/80">
      <CardContent className="p-2 cursor-pointer">
        <div className="flex flex-col items-center justify-center space-y-1">
          {/* Heartbeat + Count-up */}
          <motion.p
            className="md:text-3xl text-xl font-extrabold text-[#345332] drop-shadow-sm"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {count}
          </motion.p>

          <p className="text-sm font-medium text-gray-700">
            Properties Available
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
