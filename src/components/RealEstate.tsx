import React, { useState, useRef, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import {
  Search,
  Layers,
  MapPin,
  Home,
  DollarSign,
  Ruler,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import L, { Layer } from "leaflet";
import type { LeafletMouseEvent } from "leaflet";
import type {
  Feature,
  FeatureCollection,
  Geometry,
  GeoJsonProperties,
} from "geojson";
import type { PathOptions, StyleFunction } from "leaflet";
import ReactDOM from "react-dom/client";
import "leaflet/dist/leaflet.css";

/* ----------------------------- Types ----------------------------- */

// interface PropertyFeatureProperties {
//   id: string;
//   title: string;
//   price: string;
//   size: string;
//   type: string;
//   status: string;
//   description: string;
//   contact: string;
//   dateAdded: string;
// }

interface PropertyFeatureProperties {
  fid: number;
  id: string;
  unit: string;
  parentCompany: string;
  unitType: string;
  unitUse: string;
  area: number;
  noOfBuildings: number;
  condition: string;
  unitManager: string;
  address: string;
  lastUpdated: string;
  price: number;
  contact: string;
}

type PropertyFeature = Feature<Geometry, PropertyFeatureProperties>;

type PropertyFeatureCollection = FeatureCollection<
  Geometry,
  PropertyFeatureProperties
>;

/* ----------------- Fix leaflet default marker icons ---------------- */
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

/* ---------------------- Sample GeoJSON data ---------------------- */
const sampleGeoJSON: PropertyFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        fid: 1,
        id: "001",
        unit: "Galaxies",
        parentCompany: "Proforce Ltd",
        unitType: "Commercial",
        unitUse: "Official",
        area: 170703.40461901575,
        noOfBuildings: 5,
        condition: "Under Construction",
        unitManager: "Engr. Tope Robert",
        address: "Wing D",
        lastUpdated: "26/08/2025",
        price: 40000000,
        contact: "+234 809 456 7890",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [3.3488, 7.1475],
            [3.3495, 7.1475],
            [3.3495, 7.147],
            [3.3488, 7.147],
            [3.3488, 7.1475],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        fid: 2,
        id: "002",
        unit: "Intelligence",
        parentCompany: "Proforce Ltd",
        unitType: "Commercial",
        unitUse: "Official",
        area: 58439.510457662283,
        noOfBuildings: 4,
        condition: "Planned",
        unitManager: "",
        address: "Wing J",
        lastUpdated: "26/08/2025",
        price: 35000000,
        contact: "+234 805 987 6543",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [3.351, 7.1485],
            [3.352, 7.1485],
            [3.352, 7.1475],
            [3.351, 7.1475],
            [3.351, 7.1485],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        fid: 3,
        id: "003",
        unit: "Galaxies Ground Station",
        parentCompany: "Profroce Galaxies",
        unitType: "Facility",
        unitUse: "Official",
        area: 67345.258203497157,
        noOfBuildings: 1,
        condition: "Completed",
        unitManager: "Engr. Tope Robert",
        address: "Wing J",
        lastUpdated: "26/08/2025",
        price: 50000000,
        contact: "+234 803 123 4567",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [3.3455, 7.1495],
            [3.3465, 7.1495],
            [3.3465, 7.1485],
            [3.3455, 7.1485],
            [3.3455, 7.1495],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        fid: 4,
        id: "004",
        unit: "Military Base",
        parentCompany: "Nigerian Army",
        unitType: "Office Block",
        unitUse: "Official",
        area: 223474.46749162266,
        noOfBuildings: 10,
        condition: "Planned",
        unitManager: "",
        address: "Wing D",
        lastUpdated: "26/08/2025",
        price: 60000000,
        contact: "+234 812 345 6789",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [3.353, 7.145],
            [3.355, 7.145],
            [3.355, 7.143],
            [3.353, 7.143],
            [3.353, 7.145],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        fid: 5,
        id: "005",
        unit: "Air Systems",
        parentCompany: "Profroce Ltd",
        unitType: "Commercial",
        unitUse: "Official",
        area: 87686.890013787895,
        noOfBuildings: 4,
        condition: "Planned",
        unitManager: "Mr. Abdul Malik",
        address: "Wing E",
        lastUpdated: "26/08/2025",
        price: 40000000,
        contact: "+234 816 234 5678",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [3.3475, 7.152],
            [3.3482, 7.152],
            [3.3482, 7.1515],
            [3.3475, 7.1515],
            [3.3475, 7.152],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        fid: 6,
        id: "006",
        unit: "WMO Vests & Helmets",
        parentCompany: "Proforce Limited",
        unitType: "Commercial",
        unitUse: "Official",
        area: 61520.714777981862,
        noOfBuildings: 3,
        condition: "Planned",
        unitManager: "Mr. John Doe",
        address: "Wing E",
        lastUpdated: "26/08/2025",
        price: 25000000,
        contact: "+234 818 765 4321",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [3.35, 7.1505],
            [3.3508, 7.1505],
            [3.3508, 7.1498],
            [3.35, 7.1498],
            [3.35, 7.1505],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        fid: 7,
        id: "007",
        unit: "Vaults & Gardens",
        parentCompany: "O'la Kleen Holdings",
        unitType: "Commercial",
        unitUse: "Official",
        area: 269151.69612896885,
        noOfBuildings: 5,
        condition: "Under Construction",
        unitManager: "",
        address: "Wing C & D",
        lastUpdated: "26/08/2025",
        price: 75000000,
        contact: "+234 803 123 4567",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [3.346, 7.146],
            [3.3475, 7.146],
            [3.3475, 7.1445],
            [3.346, 7.1445],
            [3.346, 7.146],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        fid: 8,
        id: "008",
        unit: "MRO",
        parentCompany: "Proforce Ltd",
        unitType: "Commercial",
        unitUse: "After Sales Servvice",
        area: 187447.12870307046,
        noOfBuildings: 6,
        condition: "Completed",
        unitManager: "Mr. James Smith",
        address: "Wing G",
        lastUpdated: "26/08/2025",
        price: 40000000,
        contact: "+234 905 678 1234",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [3.352, 7.151],
            [3.3535, 7.151],
            [3.3535, 7.1495],
            [3.352, 7.1495],
            [3.352, 7.151],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        fid: 9,
        id: "009",
        unit: "Land Systems",
        parentCompany: "Proforce Ltd",
        unitType: "Commercial",
        unitUse: "Official",
        area: 592417.17618602328,
        noOfBuildings: 8,
        condition: "Under Construction",
        unitManager: "Mr. John Mason",
        address: "Wing B",
        lastUpdated: "26/08/2025",
        price: 80000000,
        contact: "+234 907 543 2109",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [3.344, 7.148],
            [3.345, 7.148],
            [3.345, 7.1472],
            [3.344, 7.1472],
            [3.344, 7.148],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        fid: 10,
        id: "010",
        unit: "Admin 2",
        parentCompany: "O'la Kleen Holdings",
        unitType: "Administrative",
        unitUse: "Official",
        area: 143480.50914202258,
        noOfBuildings: 8,
        condition: "Under Construction",
        unitManager: "Mr. Alex Johnson",
        address: "Wing A",
        lastUpdated: "27/08/2025",
        price: 50000000,
        contact: "+234 913 876 5432",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [3.3555, 7.1465],
            [3.358, 7.1465],
            [3.358, 7.144],
            [3.3555, 7.144],
            [3.3555, 7.1465],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        fid: 11,
        id: "011",
        unit: "Admin 1",
        parentCompany: "O'la Kleen",
        unitType: "Administrative",
        unitUse: "Official",
        area: 153402.38078648224,
        noOfBuildings: 6,
        condition: "Completed",
        unitManager: "Mr. Abdul Fatai Sanusi",
        address: "Wing A",
        lastUpdated: "27/08/2025",
        price: 50000000,
        contact: "+234 915 432 1098",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [3.3485, 7.1525],
            [3.3495, 7.1525],
            [3.3495, 7.1516],
            [3.3485, 7.1516],
            [3.3485, 7.1525],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        fid: 12,
        id: "012",
        unit: "Car Park",
        parentCompany: "Proforce City",
        unitType: "Admin",
        unitUse: "Admin",
        area: 107255.14631315973,
        noOfBuildings: 7,
        condition: "Under Construction",
        unitManager: "Admin",
        address: "Wing A",
        lastUpdated: "27/08/2025",
        price: 30000000,
        contact: "+234 805 321 4567",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [3.3465, 7.1435],
            [3.3473, 7.1435],
            [3.3473, 7.1428],
            [3.3465, 7.1428],
            [3.3465, 7.1435],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        fid: 13,
        id: "013",
        unit: "Check Point",
        parentCompany: "Proforce City",
        unitType: "Security",
        unitUse: "Admin",
        area: 62631.263273547869,
        noOfBuildings: 0,
        condition: "Completed",
        unitManager: "Mr. Samson",
        address: "Wing A",
        lastUpdated: "27/08/2025",
        price: 0,
        contact: "+234 803 567 8901",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [3.3515, 7.1535],
            [3.3528, 7.1535],
            [3.3528, 7.1522],
            [3.3515, 7.1522],
            [3.3515, 7.1535],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        fid: 14,
        id: "014",
        unit: "Officers Residence",
        parentCompany: "Proforce Ltd",
        unitType: "Residential",
        unitUse: "Residential",
        area: 335927.98754937761,
        noOfBuildings: 20,
        condition: "Planned",
        unitManager: "N/A",
        address: "Wing P",
        lastUpdated: "27/08/2025",
        price: 60000000,
        contact: "+234 809 789 0123",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [3.3425, 7.15],
            [3.3435, 7.15],
            [3.3435, 7.1492],
            [3.3425, 7.1492],
            [3.3425, 7.15],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        fid: 15,
        id: "015",
        unit: "Managers Residence",
        parentCompany: "Proforce Ltd",
        unitType: "Residential",
        unitUse: "Residential",
        area: 323009.76909431268,
        noOfBuildings: 8,
        condition: "Under Construction",
        unitManager: "Mr. Cornelius",
        address: "Wing V",
        lastUpdated: "27/08/2025",
        price: 70000000,
        contact: "+234 812 654 3210",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [3.349, 7.1445],
            [3.3505, 7.1445],
            [3.3505, 7.143],
            [3.349, 7.143],
            [3.349, 7.1445],
          ],
        ],
      },
    },
  ],
};

/* ---------------------- Map Layers ---------------------- */
const mapLayers = [
  {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
  },
  {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "© Esri",
  },
  {
    name: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "© OpenTopoMap",
  },
];

/* ---------------- Search Component ---------------- */
const MapSearchControl: React.FC<{
  onLocationFound: (lat: number, lng: number, displayName: string) => void;
}> = ({ onLocationFound }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ", Ogun State, Nigeria"
        )}&limit=1`
      );
      const data: Array<{
        lat: string;
        lon: string;
        display_name: string;
      }> = await response.json();

      if (data.length > 0) {
        const result = data[0];
        onLocationFound(
          parseFloat(result.lat),
          parseFloat(result.lon),
          result.display_name
        );
      } else {
        alert("Location not found. Please try again.");
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
      <Input
        type="text"
        placeholder="Search for a location..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        className="w-64 bg-white shadow-lg"
      />
      <Button
        onClick={handleSearch}
        disabled={isSearching}
        className="shadow-lg"
      >
        <Search className="w-4 h-4" />
      </Button>
    </div>
  );
};

/* ---------------- Map Controller ---------------- */
const MapController: React.FC<{
  center: [number, number] | null;
  searchLocation: { lat: number; lng: number; name: string } | null;
}> = ({ center, searchLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (searchLocation) {
      map.flyTo([searchLocation.lat, searchLocation.lng], 18, {
        animate: true,
        duration: 2,
      });
    }
  }, [searchLocation, map]);

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  return null;
};

/* ---------------- Layer Control ---------------- */
const LayerControl: React.FC<{
  currentLayer: number;
  onLayerChange: (index: number) => void;
}> = ({ currentLayer, onLayerChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="shadow-lg bg-white text-black hover:bg-gray-100"
      >
        <Layers className="w-4 h-4" />
      </Button>

      {isOpen && (
        <Card className="absolute top-12 right-0 w-48 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Map Layers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {mapLayers.map((layer, index) => (
              <Button
                key={layer.name}
                variant={currentLayer === index ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  onLayerChange(index);
                  setIsOpen(false);
                }}
                className="w-full justify-start"
              >
                {layer.name}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/* ---------------- Property Popup ---------------- */
const PropertyPopup: React.FC<{ feature: PropertyFeature }> = ({ feature }) => {
  const { properties } = feature;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-800";
      case "reserved":
        return "bg-yellow-100 text-yellow-800";
      case "sold":
        return "bg-red-100 text-red-800";
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
      case "industrial":
        return <Ruler className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-lg w-64">
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
            {properties.price}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Ruler className="w-4 h-4 text-blue-600" />
          <span>{properties.area}</span>
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
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
        >
          Contact: {properties.contact}
        </Button>
      </div>
    </div>
  );
};

/* ---------------- Main Map ---------------- */
const RealEstateMapApp = () => {
  const [currentLayer, setCurrentLayer] = useState(0);
  const [searchLocation, setSearchLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const proforceCityCenter: [number, number] = [3.65586, 6.98647];

  const handleLocationFound = (
    lat: number,
    lng: number,
    displayName: string
  ) => {
    setSearchLocation({ lat, lng, name: displayName });
  };

  const getFeatureStyle: StyleFunction<Feature<Geometry, GeoJsonProperties>> = (
    feature
  ) => {
    if (!feature) return {} as PathOptions;

    // Safely cast to your property type
    const typedFeature = feature as unknown as PropertyFeature;
    const { unitType, condition } = typedFeature.properties;

    let color = "#3B82F6";

    switch (unitType.toLowerCase()) {
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
    }

    return {
      color,
      weight: 2,
      opacity: condition === "Available" ? 1 : 0.6,
      fillColor: color,
      fillOpacity: condition === "Available" ? 0.3 : 0.1,
    } as PathOptions;
  };

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
        const popup = L.popup({
          maxWidth: 400,
          className: "property-popup",
        })
          .setLatLng(e.latlng)
          .setContent(`<div id="popup-${feature.properties.id}"></div>`)
          .openOn(e.target._map);

        setTimeout(() => {
          const popupElement = document.getElementById(
            `popup-${feature.properties.id}`
          );
          if (popupElement) {
            const root = ReactDOM.createRoot(popupElement);
            root.render(<PropertyPopup feature={feature} />);
          }
        }, 50);
        console.log(popup);
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
          data={sampleGeoJSON}
          style={getFeatureStyle}
          onEachFeature={onEachFeature}
        />

        {searchLocation && (
          <Marker position={[searchLocation.lat, searchLocation.lng]}>
            <Popup>
              <div className="text-center">
                <MapPin className="w-6 h-6 mx-auto mb-2 text-red-500" />
                <p className="font-medium">{searchLocation.name}</p>
              </div>
            </Popup>
          </Marker>
        )}

        <MapController
          center={proforceCityCenter}
          searchLocation={searchLocation}
        />
      </MapContainer>

      <MapSearchControl onLocationFound={handleLocationFound} />
      <LayerControl
        currentLayer={currentLayer}
        onLayerChange={setCurrentLayer}
      />

      {/* Legend */}
      <Card className="absolute bottom-4 left-4 z-[1000] w-48">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Home className="w-4 h-4" />
            Property Types
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
      <Card className="absolute bottom-4 right-4 z-[1000]">
        <CardContent className="p-2">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
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
