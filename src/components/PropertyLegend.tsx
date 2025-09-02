import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react";

const propertyTypes: [string, string][] = [
  ["bg-green-500", "Residential"],
  ["bg-orange-500", "Commercial"],
  ["bg-purple-500", "Industrial"],
  ["bg-red-500", "Mixed Use"],
  ["bg-lime-500", "Agricultural"],
];

export default function PropertyLegend() {
  return (
    <Card
      className="
        absolute bottom-10 left-4 z-[1000] md:w-48
        transition-transform duration-300 ease-in-out
        hover:scale-105 cursor-pointer
      "
    >
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
  );
}
