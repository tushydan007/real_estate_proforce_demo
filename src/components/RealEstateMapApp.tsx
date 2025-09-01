import { useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet";
import L, { Layer } from "leaflet";
import type { PathOptions } from "leaflet";
import type { LeafletMouseEvent } from "leaflet";
import ReactDOM from "react-dom/client";
import { sampleGeoJSON } from "../sampleData";
import { MapSearchControl } from "../components/MapSearchControl";
import { LayerControl } from "../components/LayerControl";
import { MapController } from "../components/MapController";
import { PropertyPopup } from "../components/PropertyPopup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react";
import type { PropertyFeature, PropertyFeatureCollection } from "../../types";
import "leaflet/dist/leaflet.css";

/* ---------------- Fix leaflet default marker icons ---------------- */
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

/* ---------------- Map Layers ---------------- */
const mapLayers = [
  {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "© Esri",
  },
  {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
  },
  {
    name: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "© OpenTopoMap",
  },
];

/* ---------------- Main Map ---------------- */
const RealEstateMapApp = () => {
  const [currentLayer, setCurrentLayer] = useState(0);
  const [searchLocation, setSearchLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(null);

  const mapRef = useRef<L.Map | null>(null);
  const proforceCityCenter: [number, number] = [6.98647, 3.65586];

  const handleLocationFound = (
    lat: number,
    lng: number,
    displayName: string
  ) => {
    setSearchLocation({ lat, lng, name: displayName });

    // Highlight search result with a circle
    if (mapRef.current) {
      L.circle([lat, lng], {
        radius: 40,
        color: "red",
        fillColor: "#f03",
        fillOpacity: 0.5,
      }).addTo(mapRef.current);
    }
  };

  // Style features
  const getFeatureStyle = (feature?: PropertyFeature): PathOptions => {
    // Fallback style if feature is undefined or properties are missing
    const defaultStyle: PathOptions = {
      color: "#3B82F6",
      weight: 2,
      opacity: 0.6,
      fillColor: "#3B82F6",
      fillOpacity: 0.3,
    };

    // Return default style if feature is undefined or lacks properties
    if (!feature || !feature.properties) {
      return defaultStyle;
    }

    const { unitType, condition } =
      feature.properties as PropertyFeature["properties"];
    let color = "#3B82F6";

    switch (unitType?.toLowerCase()) {
      case "Residential":
        color = "#10B981";
        break;
      case "Commercial":
        color = "#F59E0B";
        break;
      case "Industrial":
        color = "#8B5CF6";
        break;
      case "Mixed Use":
        color = "#EF4444";
        break;
      case "Agricultural":
        color = "#84CC16";
        break;
      default:
        color = "#3B82F6"; // Fallback color for unknown unitType
    }

    return {
      color,
      weight: 2,
      opacity: condition?.toLowerCase() === "available" ? 1 : 0.6,
      fillColor: color,
      fillOpacity: condition?.toLowerCase() === "available" ? 0.3 : 0.1,
    };
  };

  // Attach events
  const onEachFeature = (feature: PropertyFeature, layer: Layer) => {
    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        const target = e.target as L.Path;
        target.setStyle({
          weight: 3,
          opacity: 1,
          fillOpacity: 0.5,
        });
      },
      mouseout: () => {
        (layer as L.Path).setStyle(getFeatureStyle(feature));
      },
      click: (e: LeafletMouseEvent) => {
        const popupId = `popup-${feature.properties.fid}`;
        L.popup({ maxWidth: 400, className: "property-popup" })
          .setLatLng(e.latlng)
          .setContent(`<div id="${popupId}"></div>`)
          .openOn(e.target._map);
        

        setTimeout(() => {
          const popupElement = document.getElementById(popupId);
          if (popupElement) {
            const root = ReactDOM.createRoot(popupElement);
            root.render(<PropertyPopup feature={feature} />);
          }
        }, 50);
      },
    });
  };

  return (
    <div className="relative w-full h-screen">
      <MapContainer
        center={proforceCityCenter}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
        zoomControl={true}
        maxZoom={18}
      >
        <TileLayer
          url={mapLayers[currentLayer].url}
          attribution={mapLayers[currentLayer].attribution}
          maxZoom={18}
        />
        <GeoJSON
          data={sampleGeoJSON as PropertyFeatureCollection}
          style={getFeatureStyle}
          onEachFeature={onEachFeature}
        />
        {searchLocation && (
          <Marker position={[searchLocation.lat, searchLocation.lng]}>
            <Popup>
              <div className="text-center">
                <p className="font-medium">{searchLocation.name}</p>
              </div>
            </Popup>
          </Marker>
        )}
        <MapController
          center={proforceCityCenter}
          searchLocation={searchLocation}
          debug={true}
          animate={true}
          centerZoom={14}
          showMarker={true}
          //   bounds={[
          //     [6.97647, 3.64586],
          //     [6.99647, 3.66586],
          //   ]}
        />
      </MapContainer>

      {/* Search */}
      <MapSearchControl onLocationFound={handleLocationFound} />

      {/* Layers */}
      <LayerControl
        mapLayers={mapLayers}
        currentLayer={currentLayer}
        onLayerChange={setCurrentLayer}
      />

      {/* Legend */}
      <Card className="absolute bottom-10 left-4 z-[1000] w-48">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Home className="w-4 h-4" /> Property Types
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            ["bg-green-500", "Residential"],
            ["bg-orange-500", "Commercial"],
            ["bg-purple-500", "Industrial"],
            ["bg-red-500", "Mixed Use"],
            ["bg-lime-500", "Agricultural"],
          ].map(([color, label]) => (
            <div key={label} className="flex items-center gap-2 text-xs">
              <div className={`w-4 h-4 ${color} rounded`} />
              <span>{label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Property Count */}
      <Card className="absolute bottom-10 right-4 z-[1000]">
        <CardContent className="p-2 cursor-pointer">
          <div className="text-center">
            <p className="text-lg font-bold text-blue-600">
              {sampleGeoJSON.features.length}
            </p>
            <p className="text-sm text-gray-600">Properties Available</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealEstateMapApp;
