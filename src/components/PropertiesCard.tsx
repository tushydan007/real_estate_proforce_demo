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
    <Card className="absolute bottom-10 right-4 z-[1000] shadow-2xl rounded-2xl backdrop-blur-sm bg-white/80 w-32 md:w-40">
      <CardContent className="px-2 cursor-pointer">
        <div className="flex flex-col items-center justify-center">
          {/* Heartbeat + Count-up */}
          <motion.p
            className="md:text-2xl lg:text-3xl text-lg font-extrabold font-[kavoon] drop-shadow-sm bg-gradient-to-r from-[#3B82F6] to-[#9333EA] text-transparent bg-clip-text md:mb-3 mb-2"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {count}
          </motion.p>

          <p className="text-xs md:text-sm text-center font-medium font-[kavoon] bg-gradient-to-r from-[#3B82F6] to-[#9333EA] text-transparent bg-clip-text">
            Properties Available
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
