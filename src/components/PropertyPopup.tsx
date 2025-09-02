import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Ruler, Calendar, Home, MapPin } from "lucide-react";
import type { PropertyFeature } from "../../types";

interface PropertyPopupProps {
  feature: PropertyFeature;
}

export const PropertyPopup = ({ feature }: PropertyPopupProps) => {
  const { properties } = feature;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "under construction":
        return "bg-yellow-100 text-yellow-800";
      case "planned":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "residential":
        return <Home className="w-4 h-4" />;
      case "commercial":
        return <DollarSign className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-lg w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg text-gray-900">{properties.unit}</h3>
        <Badge className={getStatusColor(properties.condition)}>
          {properties.condition}
        </Badge>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          {getTypeIcon(properties.unitType)}
          <span className="font-medium">{properties.unitType}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="font-bold text-green-600 text-lg">
            {properties.price.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Ruler className="w-4 h-4 text-blue-600" />
          <span>{properties.area.toFixed(2)} m²</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>
            Added: {new Date(properties.lastUpdated).toLocaleDateString()}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">{properties.contact}</p>
      <div className="flex items-center justify-between flex-col space-y-6">
        <span className="text-xs text-gray-500 font-semibold">
          ID: {properties.id}
        </span>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 cursor-pointer">
          Contact: {properties.contact}
        </Button>
      </div>
    </div>
  );
};

