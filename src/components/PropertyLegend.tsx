import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const propertyTypes: [string, string][] = [
  ["bg-green-500", "Residential"],
  ["bg-orange-500", "Commercial"],
  ["bg-purple-500", "Industrial"],
  ["bg-red-500", "Mixed Use"],
  ["bg-lime-500", "Agricultural"],
];

export default function PropertyLegend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-10 left-4 z-[1000] flex items-end">
      {/* Desktop: always show legend */}
      <div className="hidden md:block">
        <Card className="w-48 transition-transform duration-300 ease-in-out hover:scale-105 cursor-pointer">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Home className="w-4 h-4" /> Property Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {propertyTypes.map(([color, label]) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 ${color} rounded`} />
                <span>{label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Mobile: toggleable legend */}
      <div className="md:hidden">
        <AnimatePresence initial={false}>
          {isOpen ? (
            <motion.div
              key="legend"
              initial={{ x: -200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -200, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Card className="w-40 sm:w-44 transition-transform duration-300 ease-in-out hover:scale-105 cursor-pointer">
                <CardHeader className="flex justify-between items-center">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Home className="w-4 h-4" /> Property Types
                  </CardTitle>
                  {/* Collapse button */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-black"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {propertyTypes.map(([color, label]) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 text-xs"
                    >
                      <div className={`w-4 h-4 ${color} rounded`} />
                      <span>{label}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.button
              key="show-legend"
              onClick={() => setIsOpen(true)}
              initial={{ x: -200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -200, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="
                bg-white shadow-lg rounded-full px-4 py-2
                text-xs font-medium text-gray-700
                hover:bg-gray-100 border
              "
            >
              Show Legend
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
