"use client";

import { useRef } from "react";
import { MapContainer, FeatureGroup } from "react-leaflet";
import L from "leaflet";
import { MapLogic } from "../components/map/MapLogic";
import type { MapComponentProps } from "../../src/lib/types";

const MapComponent = (props: MapComponentProps) => {
  const featureGroupRef = useRef<L.FeatureGroup>(null);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[9.082, 8.6753]}
        zoom={3}
        style={{ height: "100%", width: "100%" }}
      >
        <FeatureGroup ref={featureGroupRef} />
        <MapLogic {...props} />
      </MapContainer>
    </div>
  );
};

export default MapComponent;





// EXAMPLE USAGE - Map Component with AOI Cart Integration
// import { useEffect, useRef, useState } from "react";
// import L from "leaflet";
// import { useAoiLayer, type Aoi } from "../hooks/useAoiLayer"; // Your enhanced hook
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import {
//   MapPin,
//   Square,
//   ShoppingCart,
//   Settings,
//   Plus,
//   Trash2,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useSelector } from "react-redux";
// import type { RootState } from "../redux/store";
// import axios from "axios";
// import toast from "react-hot-toast";

// const MapComponent = () => {
//   const mapRef = useRef<L.Map | null>(null);
//   const mapContainerRef = useRef<HTMLDivElement>(null);
//   const navigate = useNavigate();

//   // Local state for AOIs
//   const [aois, setAois] = useState<Aoi[]>([]);
//   const [selectedAoiId, setSelectedAoiId] = useState<number | undefined>();
//   const [previewAoiId, setPreviewAoiId] = useState<number | undefined>();
//   const [isLoading, setIsLoading] = useState(false);

//   // Get cart state from Redux
//   const cartItems = useSelector((state: RootState) => state.aoiCart.items);
//   const cartTotalArea = useSelector(
//     (state: RootState) => state.aoiCart.totalArea
//   );
//   const cartCount = useSelector((state: RootState) => state.aoiCart.totalCount);

//   // Initialize map
//   useEffect(() => {
//     if (!mapContainerRef.current || mapRef.current) return;

//     // Create map centered on Lagos, Nigeria (since user is from Lagos)
//     const map = L.map(mapContainerRef.current).setView([6.5244, 3.3792], 10);

//     // Add tile layer
//     L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//       attribution: "© OpenStreetMap contributors",
//     }).addTo(map);

//     mapRef.current = map;

//     return () => {
//       if (mapRef.current) {
//         mapRef.current.remove();
//         mapRef.current = null;
//       }
//     };
//   }, []);

//   // Load AOIs from backend on component mount
//   useEffect(() => {
//     const fetchAois = async () => {
//       setIsLoading(true);
//       try {
//         const token = localStorage.getItem("token");
//         const response = await axios.get("http://localhost:8000/api/aois/", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setAois(response.data);
//       } catch (error) {
//         console.error("Failed to fetch AOIs:", error);
//         toast.error("Failed to load AOIs");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchAois();
//   }, []);

//   // AOI management functions
//   const handleCreateAoi = async (
//     geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
//     area: number
//   ) => {
//     try {
//       const token = localStorage.getItem("token");
//       const response = await axios.post(
//         "http://localhost:8000/api/aois/",
//         {
//           geometry,
//           area,
//           name: `AOI ${geometry.type} #${aois.length + 1}`,
//           is_active: true,
//           monitoring_enabled: false,
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       const newAoi: Aoi = response.data;
//       setAois((prev) => [...prev, newAoi]);
//     } catch (error) {
//       console.error("Failed to create AOI:", error);
//       toast.error("Failed to save AOI");
//     }
//   };

//   const handleEditAoi = async (
//     id: number,
//     geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
//     area: number
//   ) => {
//     try {
//       const token = localStorage.getItem("token");
//       await axios.patch(
//         `http://localhost:8000/api/aois/${id}/`,
//         { geometry, area },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       setAois((prev) =>
//         prev.map((aoi) => (aoi.id === id ? { ...aoi, geometry, area } : aoi))
//       );
//     } catch (error) {
//       console.error("Failed to edit AOI:", error);
//       toast.error("Failed to update AOI");
//     }
//   };

//   const handleDeleteAoi = async (id: number) => {
//     try {
//       const token = localStorage.getItem("token");
//       await axios.delete(`http://localhost:8000/api/aois/${id}/`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       setAois((prev) => prev.filter((aoi) => aoi.id !== id));
//       if (selectedAoiId === id) setSelectedAoiId(undefined);
//       if (previewAoiId === id) setPreviewAoiId(undefined);
//     } catch (error) {
//       console.error("Failed to delete AOI:", error);
//       toast.error("Failed to delete AOI");
//     }
//   };

//   const handleSelectAoi = (id: number) => {
//     setSelectedAoiId(id);
//     setPreviewAoiId(id);
//   };

//   // Use the enhanced AOI layer hook
//   const aoiLayer = useAoiLayer({
//     map: mapRef.current!,
//     aois,
//     onCreate: handleCreateAoi,
//     onEdit: handleEditAoi,
//     onDelete: handleDeleteAoi,
//     onSelect: handleSelectAoi,
//     previewAoiId,
//     autoAddToCart: true, // Enable auto-add to cart
//   });

//   // Get selected AOI details
//   const selectedAoi = aois.find((aoi) => aoi.id === selectedAoiId);
//   const isSelectedInCart = selectedAoi?.id
//     ? cartItems.some((item) => item.id === selectedAoi.id)
//     : false;

//   return (
//     <div className="w-full h-screen bg-black text-white relative">
//       {/* Map Container */}
//       <div ref={mapContainerRef} className="w-full h-full" />

//       {/* Loading Overlay */}
//       {isLoading && (
//         <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="text-white text-lg">Loading AOIs...</div>
//         </div>
//       )}

//       {/* Drawing Controls - Top Left */}
//       <Card className="absolute top-4 left-4 bg-zinc-900 border-zinc-700 z-40">
//         <CardContent className="p-4">
//           <h3 className="text-sm font-semibold mb-3 text-gray-200">
//             Drawing Tools
//           </h3>
//           <div className="flex flex-col gap-2">
//             <Button
//               onClick={aoiLayer.startPolygon}
//               variant="outline"
//               size="sm"
//               className="bg-zinc-800 border-zinc-600 hover:bg-zinc-700 justify-start"
//             >
//               <MapPin className="w-4 h-4 mr-2" />
//               Draw Polygon
//             </Button>
//             <Button
//               onClick={aoiLayer.startRectangle}
//               variant="outline"
//               size="sm"
//               className="bg-zinc-800 border-zinc-600 hover:bg-zinc-700 justify-start"
//             >
//               <Square className="w-4 h-4 mr-2" />
//               Draw Rectangle
//             </Button>
//           </div>

//           <div className="mt-4 pt-3 border-t border-zinc-700">
//             <div className="flex items-center justify-between mb-2">
//               <span className="text-xs text-gray-400">Auto-add to cart</span>
//               <Button
//                 onClick={aoiLayer.toggleAutoAddToCart}
//                 variant="ghost"
//                 size="sm"
//                 className={`p-1 ${
//                   aoiLayer.autoAddToCart
//                     ? "text-green-400 hover:text-green-300"
//                     : "text-gray-400 hover:text-gray-300"
//                 }`}
//               >
//                 <Settings className="w-3 h-3" />
//               </Button>
//             </div>
//             <div className="text-xs text-gray-500">
//               {aoiLayer.autoAddToCart ? "✅ Enabled" : "❌ Disabled"}
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Cart Summary - Top Right */}
//       <Card className="absolute top-4 right-4 bg-zinc-900 border-zinc-700 z-40">
//         <CardContent className="p-4">
//           <div className="flex items-center gap-3 mb-3">
//             <ShoppingCart className="w-5 h-5 text-blue-400" />
//             <h3 className="text-sm font-semibold text-gray-200">AOI Cart</h3>
//           </div>

//           <div className="space-y-2 text-sm">
//             <div className="flex justify-between">
//               <span className="text-gray-400">Items:</span>
//               <span className="text-white font-medium">{cartCount}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-gray-400">Total Area:</span>
//               <span className="text-blue-300 font-medium">
//                 {aoiLayer.formatArea(cartTotalArea)}
//               </span>
//             </div>
//           </div>

//           <div className="flex gap-2 mt-4">
//             <Button
//               onClick={() => navigate("/cart")}
//               size="sm"
//               className="bg-blue-600 hover:bg-blue-700 flex-1"
//               disabled={cartCount === 0}
//             >
//               View Cart
//             </Button>
//             {cartCount > 0 && (
//               <Button
//                 onClick={aoiLayer.clearCart}
//                 variant="outline"
//                 size="sm"
//                 className="bg-red-900 border-red-600 hover:bg-red-800 text-red-300"
//               >
//                 <Trash2 className="w-3 h-3" />
//               </Button>
//             )}
//           </div>

//           {aois.length > 0 && (
//             <Button
//               onClick={aoiLayer.addAllToCart}
//               variant="outline"
//               size="sm"
//               className="w-full mt-2 bg-zinc-800 border-zinc-600 hover:bg-zinc-700"
//             >
//               <Plus className="w-3 h-3 mr-1" />
//               Add All to Cart
//             </Button>
//           )}
//         </CardContent>
//       </Card>

//       {/* AOI Details Panel - Bottom Left */}
//       {selectedAoi && (
//         <Card className="absolute bottom-4 left-4 bg-zinc-900 border-zinc-700 z-40 max-w-sm">
//           <CardContent className="p-4">
//             <div className="flex items-center justify-between mb-3">
//               <h3 className="text-sm font-semibold text-gray-200">
//                 {selectedAoi.name || `AOI #${selectedAoi.id}`}
//               </h3>
//               <div className="flex items-center gap-2">
//                 <span
//                   className={`px-2 py-1 text-xs rounded-full ${
//                     isSelectedInCart
//                       ? "bg-green-900 text-green-300 border border-green-600"
//                       : "bg-gray-700 text-gray-300"
//                   }`}
//                 >
//                   {isSelectedInCart ? "In Cart" : "Not in Cart"}
//                 </span>
//                 <Button
//                   onClick={() => setSelectedAoiId(undefined)}
//                   variant="ghost"
//                   size="sm"
//                   className="p-1 text-gray-400 hover:text-gray-300"
//                 >
//                   ✕
//                 </Button>
//               </div>
//             </div>

//             <div className="space-y-2 text-sm">
//               <div className="flex justify-between">
//                 <span className="text-gray-400">Status:</span>
//                 <span
//                   className={`font-medium ${
//                     selectedAoi.is_active ? "text-green-400" : "text-red-400"
//                   }`}
//                 >
//                   {selectedAoi.is_active ? "Active" : "Inactive"}
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-400">Monitoring:</span>
//                 <span
//                   className={`font-medium ${
//                     selectedAoi.monitoring_enabled
//                       ? "text-blue-400"
//                       : "text-gray-400"
//                   }`}
//                 >
//                   {selectedAoi.monitoring_enabled ? "Enabled" : "Disabled"}
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-400">Area:</span>
//                 <span className="text-white font-medium">
//                   {aoiLayer.formatArea(
//                     selectedAoi.geometry
//                       ? // Calculate area from geometry
//                         selectedAoi.geometry.type === "Polygon"
//                         ? selectedAoi.geometry.coordinates[0].length * 1000 // Simplified
//                         : 1000
//                       : 1000
//                   )}
//                 </span>
//               </div>
//               {selectedAoi.created_at && (
//                 <div className="flex justify-between">
//                   <span className="text-gray-400">Created:</span>
//                   <span className="text-gray-300 text-xs">
//                     {new Date(selectedAoi.created_at).toLocaleDateString()}
//                   </span>
//                 </div>
//               )}
//             </div>

//             {selectedAoi.description && (
//               <div className="mt-3 pt-2 border-t border-zinc-700">
//                 <p className="text-xs text-gray-300">
//                   {selectedAoi.description}
//                 </p>
//               </div>
//             )}

//             {selectedAoi.tags && selectedAoi.tags.length > 0 && (
//               <div className="mt-3">
//                 <div className="flex flex-wrap gap-1">
//                   {selectedAoi.tags.map((tag, idx) => (
//                     <span
//                       key={idx}
//                       className="px-2 py-1 text-xs bg-zinc-700 rounded-full text-gray-300"
//                     >
//                       #{tag}
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       )}

//       {/* Stats Panel - Bottom Right */}
//       <Card className="absolute bottom-4 right-4 bg-zinc-900 border-zinc-700 z-40">
//         <CardContent className="p-4">
//           <h3 className="text-sm font-semibold mb-3 text-gray-200">
//             Statistics
//           </h3>
//           <div className="space-y-2 text-sm">
//             <div className="flex justify-between">
//               <span className="text-gray-400">Total AOIs:</span>
//               <span className="text-white font-medium">{aois.length}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-gray-400">Active AOIs:</span>
//               <span className="text-green-400 font-medium">
//                 {aois.filter((aoi) => aoi.is_active).length}
//               </span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-gray-400">Monitored:</span>
//               <span className="text-blue-400 font-medium">
//                 {aois.filter((aoi) => aoi.monitoring_enabled).length}
//               </span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-gray-400">In Cart:</span>
//               <span className="text-purple-400 font-medium">{cartCount}</span>
//             </div>
//           </div>

//           {aois.length > 0 && (
//             <div className="mt-3 pt-2 border-t border-zinc-700">
//               <Button
//                 onClick={() =>
//                   navigate("/analysis", {
//                     state: { aoiData: aois, cartItems },
//                   })
//                 }
//                 size="sm"
//                 className="w-full bg-indigo-600 hover:bg-indigo-700"
//                 disabled={cartCount === 0}
//               >
//                 Start Analysis
//               </Button>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default MapComponent;
