import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../redux/store";
import {
  setCart,
  formatArea,
  type AoiCartItem,
} from "../redux/features/cart/AoiCartSlice";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Loader2, ArrowLeft, Eye } from "lucide-react";

const MapHighlightPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const cartItems = useSelector((state: RootState) => state.aoiCart.items);
  const [searchParams] = useSearchParams();
  const highlightAoiId = searchParams.get("highlightAoi");
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const geoRefs = useRef<Record<string, L.GeoJSON>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch AOI cart if not already loaded
  useEffect(() => {
    const fetchAoiCart = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication required. Please log in.");
          setIsLoading(false);
          return;
        }

        const res = await axios.get<{ cart: AoiCartItem[] }>(
          "http://localhost:8000/api/aoi-cart/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        dispatch(setCart(res.data.cart));
      } catch (err) {
        console.error("Failed to fetch AOI cart:", err);
        toast.error("Failed to load AOIs. Please try again.");
        setError("Failed to load map data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (cartItems.length === 0) {
      fetchAoiCart();
    } else {
      setIsLoading(false);
    }
  }, [dispatch, cartItems.length]);

  // Fit bounds after loading
  useEffect(() => {
    if (isLoading || !mapRef.current) return;

    const validRefs = Object.values(geoRefs.current).filter(Boolean);
    if (validRefs.length === 0) return;

    if (highlightAoiId && geoRefs.current[highlightAoiId]) {
      const layer = geoRefs.current[highlightAoiId];
      mapRef.current.fitBounds(layer.getBounds(), {
        padding: [50, 50],
        maxZoom: 15,
      });
    } else {
      const group = L.featureGroup(validRefs);
      mapRef.current.fitBounds(group.getBounds(), {
        padding: [50, 50],
        maxZoom: 10,
      });
    }
  }, [isLoading, highlightAoiId]);

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
        <p className="text-lg font-semibold">Loading map and AOIs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white">
        <p className="text-lg font-semibold text-red-400 mb-4">{error}</p>
        <Button
          onClick={() => navigate("/cart")}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cart
        </Button>
      </div>
    );
  }

  const highlightedItem = cartItems.find(
    (item) => item.id.toString() === highlightAoiId
  );

  return (
    <motion.div
      className="w-full h-screen bg-black relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <MapContainer
        ref={mapRef}
        center={[0, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={20}
        />
        {cartItems.map((item) => {
          const isHighlight = item.id.toString() === highlightAoiId;
          const style: L.PathOptions = isHighlight
            ? {
                color: "#ffcc00",
                weight: 5,
                fillColor: "#ffcc00",
                fillOpacity: 0.4,
                dashArray: "5, 5",
              }
            : {
                color: "#00ffcc",
                weight: 3,
                fillColor: "#00ffcc",
                fillOpacity: 0.2,
              };

          return (
            <GeoJSON
              key={item.id}
              data={item.geometry}
              pathOptions={style}
              ref={(el) => {
                if (el) {
                  geoRefs.current[item.id.toString()] = el;
                } else {
                  delete geoRefs.current[item.id.toString()];
                }
              }}
              onEachFeature={(_, layer) => {
                const popupContent = `
                  <div class="p-3 bg-zinc-900 text-white rounded-lg shadow-lg">
                    <h3 class="font-bold text-lg mb-2">${item.name}</h3>
                    <p class="text-sm">Area: ${formatArea(item.area)}</p>
                    <p class="text-sm">Type: ${item.type}</p>
                    ${
                      item.description
                        ? `<p class="text-sm mt-2">Description: ${item.description}</p>`
                        : ""
                    }
                  </div>
                `;
                layer.bindPopup(popupContent);
                if (isHighlight) {
                  setTimeout(() => layer.openPopup(), 300);
                }
              }}
            />
          );
        })}
      </MapContainer>

      {/* Overlay UI */}
      <div className="absolute top-4 left-32 z-[1000] flex items-center gap-4">
        <Button
          onClick={() => navigate("/cart")}
          className="bg-zinc-800 hover:bg-zinc-700 text-white border hover:text-gray-300 border-zinc-600 shadow-lg cursor-pointer"
          variant="outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cart
        </Button>
      </div>

      {highlightedItem && (
        <motion.div
          className="absolute top-4 right-4 z-[1000] bg-zinc-900 p-6 rounded-2xl border border-zinc-800 text-white shadow-2xl max-w-sm"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl font-bold mb-4 text-gray-200 flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-400" />
            Highlighted AOI
          </h2>
          <div className="space-y-3">
            <p className="text-sm">
              <span className="font-semibold text-gray-400">Name:</span>{" "}
              {highlightedItem.name}
            </p>
            <p className="text-sm">
              <span className="font-semibold text-gray-400">Area:</span>{" "}
              {formatArea(highlightedItem.area)}
            </p>
            <p className="text-sm">
              <span className="font-semibold text-gray-400">Type:</span>{" "}
              {highlightedItem.type}
            </p>
            {highlightedItem.description && (
              <p className="text-sm">
                <span className="font-semibold text-gray-400">
                  Description:
                </span>{" "}
                {highlightedItem.description}
              </p>
            )}
            <p className="text-sm">
              <span className="font-semibold text-gray-400">Added:</span>{" "}
              {new Date(highlightedItem.addedToCartAt).toLocaleDateString()}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MapHighlightPage;
