// import React, { useState, useRef, useEffect } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   GeoJSON,
//   Marker,
//   Popup,
//   useMap,
// } from "react-leaflet";
// import {
//   Search,
//   Layers,
//   MapPin,
//   Home,
//   DollarSign,
//   Ruler,
//   Calendar,
// } from "lucide-react";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import L, { Layer } from "leaflet";
// import type { LeafletMouseEvent } from "leaflet";
// import type {
//   Feature,
//   FeatureCollection,
//   Geometry,
//   GeoJsonProperties,
// } from "geojson";
// import type { PathOptions, StyleFunction } from "leaflet";
// import ReactDOM from "react-dom/client";
// import "leaflet/dist/leaflet.css";

// /* ----------------------------- Types ----------------------------- */

// // interface PropertyFeatureProperties {
// //   id: string;
// //   title: string;
// //   price: string;
// //   size: string;
// //   type: string;
// //   status: string;
// //   description: string;
// //   contact: string;
// //   dateAdded: string;
// // }

// interface PropertyFeatureProperties {
//   fid: number;
//   id: string;
//   unit: string;
//   parentCompany: string;
//   unitType: string;
//   unitUse: string;
//   area: number;
//   noOfBuildings: number;
//   condition: string;
//   unitManager: string;
//   address: string;
//   lastUpdated: string;
//   price: number;
//   contact: string;
// }

// type PropertyFeature = Feature<Geometry, PropertyFeatureProperties>;

// type PropertyFeatureCollection = FeatureCollection<
//   Geometry,
//   PropertyFeatureProperties
// >;

// /* ----------------- Fix leaflet default marker icons ---------------- */
// delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;

// L.Icon.Default.mergeOptions({
//   iconRetinaUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
//   iconUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
//   shadowUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
// });

// /* ---------------------- Sample GeoJSON data ---------------------- */


// /* ---------------------- Map Layers ---------------------- */
// const mapLayers = [
//   {
//     name: "OpenStreetMap",
//     url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
//     attribution: "© OpenStreetMap contributors",
//   },
//   {
//     name: "Satellite",
//     url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
//     attribution: "© Esri",
//   },
//   {
//     name: "Terrain",
//     url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
//     attribution: "© OpenTopoMap",
//   },
// ];

// /* ---------------- Search Component ---------------- */
// const MapSearchControl: React.FC<{
//   onLocationFound: (lat: number, lng: number, displayName: string) => void;
// }> = ({ onLocationFound }) => {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [isSearching, setIsSearching] = useState(false);

//   const handleSearch = async () => {
//     if (!searchQuery.trim()) return;

//     setIsSearching(true);
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
//           searchQuery + ", Ogun State, Nigeria"
//         )}&limit=1`
//       );
//       const data: Array<{
//         lat: string;
//         lon: string;
//         display_name: string;
//       }> = await response.json();

//       if (data.length > 0) {
//         const result = data[0];
//         onLocationFound(
//           parseFloat(result.lat),
//           parseFloat(result.lon),
//           result.display_name
//         );
//       } else {
//         alert("Location not found. Please try again.");
//       }
//     } catch (error) {
//       console.error("Search error:", error);
//       alert("Search failed. Please try again.");
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   return (
//     <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
//       <Input
//         type="text"
//         placeholder="Search for a location..."
//         value={searchQuery}
//         onChange={(e) => setSearchQuery(e.target.value)}
//         onKeyDown={(e) => e.key === "Enter" && handleSearch()}
//         className="w-64 bg-white shadow-lg"
//       />
//       <Button
//         onClick={handleSearch}
//         disabled={isSearching}
//         className="shadow-lg"
//       >
//         <Search className="w-4 h-4" />
//       </Button>
//     </div>
//   );
// };

// /* ---------------- Map Controller ---------------- */
// const MapController: React.FC<{
//   center: [number, number] | null;
//   searchLocation: { lat: number; lng: number; name: string } | null;
// }> = ({ center, searchLocation }) => {
//   const map = useMap();

//   useEffect(() => {
//     if (searchLocation) {
//       map.flyTo([searchLocation.lat, searchLocation.lng], 18, {
//         animate: true,
//         duration: 2,
//       });
//     }
//   }, [searchLocation, map]);

//   useEffect(() => {
//     if (center) {
//       map.setView(center, map.getZoom());
//     }
//   }, [center, map]);

//   return null;
// };

// /* ---------------- Layer Control ---------------- */
// const LayerControl: React.FC<{
//   currentLayer: number;
//   onLayerChange: (index: number) => void;
// }> = ({ currentLayer, onLayerChange }) => {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <div className="absolute top-4 right-4 z-[1000]">
//       <Button
//         onClick={() => setIsOpen(!isOpen)}
//         className="shadow-lg bg-white text-black hover:bg-gray-100"
//       >
//         <Layers className="w-4 h-4" />
//       </Button>

//       {isOpen && (
//         <Card className="absolute top-12 right-0 w-48 shadow-lg">
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm">Map Layers</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-1">
//             {mapLayers.map((layer, index) => (
//               <Button
//                 key={layer.name}
//                 variant={currentLayer === index ? "default" : "outline"}
//                 size="sm"
//                 onClick={() => {
//                   onLayerChange(index);
//                   setIsOpen(false);
//                 }}
//                 className="w-full justify-start"
//               >
//                 {layer.name}
//               </Button>
//             ))}
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// };

// /* ---------------- Property Popup ---------------- */
// const PropertyPopup: React.FC<{ feature: PropertyFeature }> = ({ feature }) => {
//   const { properties } = feature;

//   const getStatusColor = (status: string) => {
//     switch (status.toLowerCase()) {
//       case "available":
//         return "bg-green-100 text-green-800";
//       case "reserved":
//         return "bg-yellow-100 text-yellow-800";
//       case "sold":
//         return "bg-red-100 text-red-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   const getTypeIcon = (type: string) => {
//     switch (type.toLowerCase()) {
//       case "residential":
//         return <Home className="w-4 h-4" />;
//       case "commercial":
//         return <DollarSign className="w-4 h-4" />;
//       case "industrial":
//         return <Ruler className="w-4 h-4" />;
//       default:
//         return <MapPin className="w-4 h-4" />;
//     }
//   };

//   return (
//     <div className="bg-white p-4 rounded-md shadow-lg w-64">
//       <div className="flex items-center justify-between mb-3">
//         <h3 className="font-bold text-lg text-gray-900">{properties.unit}</h3>
//         <Badge className={getStatusColor(properties.condition)}>
//           {properties.condition}
//         </Badge>
//       </div>

//       <div className="space-y-2 mb-4">
//         <div className="flex items-center gap-2 text-sm">
//           {getTypeIcon(properties.unitType)}
//           <span className="font-medium">{properties.unitType}</span>
//         </div>

//         <div className="flex items-center gap-2 text-sm">
//           <DollarSign className="w-4 h-4 text-green-600" />
//           <span className="font-bold text-green-600 text-lg">
//             {properties.price}
//           </span>
//         </div>

//         <div className="flex items-center gap-2 text-sm">
//           <Ruler className="w-4 h-4 text-blue-600" />
//           <span>{properties.area}</span>
//         </div>

//         <div className="flex items-center gap-2 text-sm">
//           <Calendar className="w-4 h-4 text-gray-500" />
//           <span>
//             Added: {new Date(properties.lastUpdated).toLocaleDateString()}
//           </span>
//         </div>
//       </div>

//       <p className="text-sm text-gray-600 mb-3">{properties.contact}</p>

//       <div className="flex items-center justify-between flex-col space-y-6">
//         <span className="text-xs text-gray-500 font-semibold">
//           ID: {properties.id}
//         </span>
//         <Button
//           size="sm"
//           className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
//         >
//           Contact: {properties.contact}
//         </Button>
//       </div>
//     </div>
//   );
// };

// /* ---------------- Main Map ---------------- */
// const RealEstateMapApp = () => {
//   const [currentLayer, setCurrentLayer] = useState(0);
//   const [searchLocation, setSearchLocation] = useState<{
//     lat: number;
//     lng: number;
//     name: string;
//   } | null>(null);
//   const mapRef = useRef<L.Map | null>(null);

//   const proforceCityCenter: [number, number] = [3.65586, 6.98647];

//   const handleLocationFound = (
//     lat: number,
//     lng: number,
//     displayName: string
//   ) => {
//     setSearchLocation({ lat, lng, name: displayName });
//   };

//   const getFeatureStyle: StyleFunction<Feature<Geometry, GeoJsonProperties>> = (
//     feature
//   ) => {
//     if (!feature) return {} as PathOptions;

//     // Safely cast to your property type
//     const typedFeature = feature as unknown as PropertyFeature;
//     const { unitType, condition } = typedFeature.properties;

//     let color = "#3B82F6";

//     switch (unitType.toLowerCase()) {
//       case "residential":
//         color = "#10B981";
//         break;
//       case "commercial":
//         color = "#F59E0B";
//         break;
//       case "industrial":
//         color = "#8B5CF6";
//         break;
//       case "mixed use":
//         color = "#EF4444";
//         break;
//       case "agricultural":
//         color = "#84CC16";
//         break;
//     }

//     return {
//       color,
//       weight: 2,
//       opacity: condition === "Available" ? 1 : 0.6,
//       fillColor: color,
//       fillOpacity: condition === "Available" ? 0.3 : 0.1,
//     } as PathOptions;
//   };

//   const onEachFeature = (feature: PropertyFeature, layer: Layer) => {
//     layer.on({
//       mouseover: (e: LeafletMouseEvent) => {
//         const target = e.target as L.Path;
//         target.setStyle({
//           weight: 3,
//           opacity: 1,
//           fillOpacity: 0.5,
//         });
//       },
//       mouseout: () => {
//         (layer as L.Path).setStyle(getFeatureStyle(feature));
//       },
//       click: (e: LeafletMouseEvent) => {
//         const popup = L.popup({
//           maxWidth: 400,
//           className: "property-popup",
//         })
//           .setLatLng(e.latlng)
//           .setContent(`<div id="popup-${feature.properties.id}"></div>`)
//           .openOn(e.target._map);

//         setTimeout(() => {
//           const popupElement = document.getElementById(
//             `popup-${feature.properties.id}`
//           );
//           if (popupElement) {
//             const root = ReactDOM.createRoot(popupElement);
//             root.render(<PropertyPopup feature={feature} />);
//           }
//         }, 50);
//         console.log(popup);
//       },
//     });
//   };

//   return (
//     <div className="relative w-full h-screen">
//       <MapContainer
//         center={proforceCityCenter}
//         zoom={15}
//         style={{ height: "100%", width: "100%" }}
//         ref={mapRef}
//         zoomControl={true}
//         maxZoom={18}
//       >
//         <TileLayer
//           url={mapLayers[currentLayer].url}
//           attribution={mapLayers[currentLayer].attribution}
//           maxZoom={18}
//         />

//         <GeoJSON
//           data={sampleGeoJSON}
//           style={getFeatureStyle}
//           onEachFeature={onEachFeature}
//         />

//         {searchLocation && (
//           <Marker position={[searchLocation.lat, searchLocation.lng]}>
//             <Popup>
//               <div className="text-center">
//                 <MapPin className="w-6 h-6 mx-auto mb-2 text-red-500" />
//                 <p className="font-medium">{searchLocation.name}</p>
//               </div>
//             </Popup>
//           </Marker>
//         )}

//         <MapController
//           center={proforceCityCenter}
//           searchLocation={searchLocation}
//         />
//       </MapContainer>

//       <MapSearchControl onLocationFound={handleLocationFound} />
//       <LayerControl
//         currentLayer={currentLayer}
//         onLayerChange={setCurrentLayer}
//       />

//       {/* Legend */}
//       <Card className="absolute bottom-4 left-4 z-[1000] w-48">
//         <CardHeader className="pb-2">
//           <CardTitle className="text-sm flex items-center gap-2">
//             <Home className="w-4 h-4" />
//             Property Types
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-2">
//           {[
//             ["bg-green-500", "Residential"],
//             ["bg-orange-500", "Commercial"],
//             ["bg-purple-500", "Industrial"],
//             ["bg-red-500", "Mixed Use"],
//             ["bg-lime-500", "Agricultural"],
//           ].map(([color, label]) => (
//             <div key={label} className="flex items-center gap-2 text-xs">
//               <div className={`w-4 h-4 ${color} rounded`} />
//               <span>{label}</span>
//             </div>
//           ))}
//         </CardContent>
//       </Card>

//       {/* Property Count */}
//       <Card className="absolute bottom-4 right-4 z-[1000]">
//         <CardContent className="p-2">
//           <div className="text-center">
//             <p className="text-2xl font-bold text-blue-600">
//               {sampleGeoJSON.features.length}
//             </p>
//             <p className="text-sm text-gray-600">Properties Available</p>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default RealEstateMapApp;
