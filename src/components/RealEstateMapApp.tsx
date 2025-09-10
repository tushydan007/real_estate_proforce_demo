import { useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet";
import L, { Layer } from "leaflet";
import ReactDOM from "react-dom/client";
import type { PathOptions } from "leaflet";
import type { LeafletMouseEvent } from "leaflet";
import { sampleGeoJSON } from "../sampleData";
import { MapSearchControl } from "../components/MapSearchControl";
import { LayerControl } from "../components/LayerControl";
import { MapController } from "../components/MapController";
import { PropertyPopup } from "../components/properties/PropertyPopup";
import type { PropertyFeature, PropertyFeatureCollection } from "../../types";
import "leaflet/dist/leaflet.css";
import PropertiesCard from "./properties/PropertiesCard";
import PropertyLegend from "./properties/PropertyLegend";

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

/* ---------------- Real Estate Map ---------------- */
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
    const defaultStyle: PathOptions = {
      color: "#3B82F6",
      weight: 2,
      opacity: 0.6,
      fillColor: "#3B82F6",
      fillOpacity: 0.3,
    };

    if (!feature || !feature.properties) return defaultStyle;

    const { unitType, condition } = feature.properties;
    let color = "#3B82F6";

    switch (unitType?.toLowerCase()) {
      case "residential":
        color = "#10B981";
        break;
      case "commercial":
        color = "#F59E0B";
        break;
      case "industrial":
        color = "#8B5CF6";
        break;
      case "mixed use":
        color = "#EF4444";
        break;
      case "agricultural":
        color = "#84CC16";
        break;
      case "facility":
        color = "#06B6D4";
        break;
      case "office block":
        color = "#DC2626";
        break;
      case "administrative":
        color = "#7C3AED";
        break;
      case "admin":
        color = "#059669";
        break;
      case "security":
        color = "#B91C1C";
        break;
      default:
        color = "#3B82F6";
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
        target.setStyle({ weight: 3, opacity: 1, fillOpacity: 0.5 });
      },
      mouseout: () => {
        (layer as L.Path).setStyle(getFeatureStyle(feature));
      },
      click: (e: LeafletMouseEvent) => {
        const popupId = `popup-${feature.properties.fid}`;
        L.popup({ className: "custom-popup" })
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
      <PropertyLegend />

      {/* Property Count */}
      <PropertiesCard sampleGeoJSON={sampleGeoJSON} />
    </div>
  );
};

export default RealEstateMapApp;
