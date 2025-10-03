import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Trash2,
  MapPin,
  Eye,
  EyeOff,
  Square,
  Copy,
  Download,
  Calendar,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../redux/store";
import {
  removeAoiFromCart,
  clearAoiCart,
  formatArea,
  formatCoordinates,
} from "../redux/features/cart/AoiCartSlice";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const AoiCartPage = () => {
  const cartItems = useSelector((state: RootState) => state.aoiCart.items);
  const totalArea = useSelector((state: RootState) => state.aoiCart.totalArea);
  const totalCount = useSelector(
    (state: RootState) => state.aoiCart.totalCount
  );
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [durationType, setDurationType] = useState<"months" | "years">(
    "months"
  );
  const [durationValue, setDurationValue] = useState<number>(1);

  // Pricing assumptions: $150 per km² per day (base rate)
  const BASE_RATE_PER_KM2_PER_DAY = 150;

  // Memoized total cost calculation
  const totalCost = useMemo(() => {
    const days =
      durationType === "months" ? durationValue * 30 : durationValue * 365;
    return (totalArea / 1000000) * BASE_RATE_PER_KM2_PER_DAY * days;
  }, [totalArea, durationType, durationValue]);

  // Function to calculate individual item cost
  const calculateItemCost = (itemArea: number) => {
    const days =
      durationType === "months" ? durationValue * 30 : durationValue * 365;
    return (itemArea / 1000000) * BASE_RATE_PER_KM2_PER_DAY * days;
  };

  const handleCopyCoordinates = async (coords: string | null | undefined) => {
    if (!coords) {
      toast.error("No coordinates to copy", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "⚠️",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(coords);
      toast.success("Coordinates copied to clipboard", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "📋",
      });
    } catch (err) {
      console.error("Failed to copy coordinates:", err);
      toast.error("Failed to copy coordinates", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "❌",
      });
    }
  };

  const handleRemoveAoi = (id: number) => {
    const removedItem = cartItems.find((item) => item.id === id);
    dispatch(removeAoiFromCart(id));
    if (removedItem) {
      toast.success(`${removedItem.name} removed from cart`, {
        style: { background: "#1f2937", color: "#fff" },
        icon: "🗑️",
      });
    }
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) {
      toast("Cart is already empty", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "ℹ️",
      });
      return;
    }
    dispatch(clearAoiCart());
    toast.success("Cart cleared", {
      style: { background: "#1f2937", color: "#fff" },
      icon: "🧹",
    });
  };

  const handleExportCart = () => {
    if (cartItems.length === 0) {
      toast.error("No items to export", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "⚠️",
      });
      return;
    }

    const exportData = {
      totalItems: totalCount,
      totalArea: formatArea(totalArea),
      exportedAt: new Date().toISOString(),
      duration: { type: durationType, value: durationValue },
      totalCost: totalCost.toFixed(2),
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        geometry: item.geometry,
        area: formatArea(item.area),
        coordinates: item.coordinates,
        type: item.type,
        is_active: item.is_active,
        monitoring_enabled: item.monitoring_enabled,
        created_at: item.created_at,
        addedToCartAt: item.addedToCartAt,
        description: item.description,
        tags: item.tags,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aoi-cart-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Cart data exported", {
      style: { background: "#1f2937", color: "#fff" },
      icon: "📄",
    });
  };

  const toggleExpanded = (id: number) => {
    setExpandedItems((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  };

  const handleViewOnMap = (aoiId: number) => {
    navigate(`/map?highlightAoi=${aoiId}`);
  };

  const handleProceedToAnalysis = () => {
    if (cartItems.length === 0) {
      toast.error("No AOIs in cart to analyze", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "⚠️",
      });
      return;
    }
    if (durationValue < 1) {
      toast.error("Please select a valid duration", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "⚠️",
      });
      return;
    }
    navigate("/checkout", {
      state: {
        aoiItems: cartItems,
        totalArea,
        durationType,
        durationValue,
        totalCost,
      },
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Rectangle":
        return <Square className="w-4 h-4" aria-hidden="true" />;
      case "Polygon":
      case "MultiPolygon":
        return <MapPin className="w-4 h-4" aria-hidden="true" />;
      default:
        return <MapPin className="w-4 h-4" aria-hidden="true" />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white px-4 md:px-8 py-10">
      <Toaster position="top-right" />
      <motion.div
        className="flex items-center justify-between mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-xl md:text-2xl font-bold text-gray-300 mx-auto">
          🗺️ AOI Cart - ({totalCount} items)
        </h1>
        {cartItems.length > 0 && (
          <div className="flex gap-3">
            <Button
              onClick={handleExportCart}
              variant="outline"
              className="bg-zinc-800 border-zinc-600 hover:bg-zinc-700"
              aria-label="Export cart data"
            >
              <Download className="w-4 h-4 mr-2" aria-hidden="true" />
              Export
            </Button>
            <Button
              onClick={handleClearCart}
              variant="outline"
              className="bg-red-900 border-red-600 hover:bg-red-800 text-gray-200"
              aria-label="Clear all items from cart"
            >
              <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
              Clear All
            </Button>
          </div>
        )}
      </motion.div>

      {cartItems.length === 0 ? (
        <motion.div
          className="text-center py-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <MapPin
            className="w-24 h-24 mx-auto text-gray-500 mb-6"
            aria-hidden="true"
          />
          <p className="text-gray-400 text-lg mb-4">Your AOI cart is empty</p>
          <p className="text-gray-200 text-sm mb-8">
            Start drawing AOIs on the map to add them to your cart
          </p>
          <Button
            onClick={() => navigate("/map-page")}
            className="bg-indigo-600 hover:bg-indigo-700"
            aria-label="Navigate to map page"
          >
            Go to Map
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence>
              {cartItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 text-gray-200">
                          {getTypeIcon(item.type)}
                          <div>
                            <h2 className="text-lg font-semibold text-gray-200">
                              {item.name}
                            </h2>
                            <p className="text-sm text-gray-400">
                              Added{" "}
                              {new Date(
                                item.addedToCartAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewOnMap(item.id)}
                            className="text-blue-400 hover:text-blue-300"
                            aria-label={`View ${item.name} on map`}
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAoi(item.id)}
                            className="text-red-500 hover:text-red-400"
                            aria-label={`Remove ${item.name} from cart`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="bg-zinc-800 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Area</p>
                          <p className="font-semibold text-blue-300">
                            {formatArea(item.area)}
                          </p>
                        </div>
                        <div className="bg-zinc-800 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Type</p>
                          <p className="font-semibold text-purple-300">
                            {item.type}
                          </p>
                        </div>
                        <div className="bg-zinc-800 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Status</p>
                          <p className="font-semibold text-green-400">
                            Active & Monitored
                          </p>
                        </div>
                        <div className="bg-zinc-800 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                            <DollarSign
                              className="w-3 h-3"
                              aria-hidden="true"
                            />
                            Cost
                          </p>
                          <p className="font-semibold text-yellow-300">
                            $
                            {Number(
                              calculateItemCost(item.area).toFixed(2)
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {item.description && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-300">
                            {item.description}
                          </p>
                        </div>
                      )}
                      {item.tags && item.tags.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {item.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs bg-zinc-700 rounded-full text-gray-300"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="mb-4">
                        <button
                          onClick={() => toggleExpanded(item.id)}
                          className="text-sm text-gray-400 hover:text-gray-300 mb-2 flex items-center gap-2"
                          aria-expanded={expandedItems.has(item.id)}
                          aria-label={`Toggle coordinates for ${item.name}`}
                        >
                          <span>Coordinates</span>
                          {expandedItems.has(item.id) ? (
                            <EyeOff className="w-3 h-3" aria-hidden="true" />
                          ) : (
                            <Eye className="w-3 h-3" aria-hidden="true" />
                          )}
                        </button>
                        <div
                          className={`relative text-xs font-mono bg-zinc-800 rounded p-3 text-gray-200 overflow-x-auto ${
                            expandedItems.has(item.id) ? "max-h-32" : "max-h-16"
                          } transition-all duration-200`}
                        >
                          <div
                            className={
                              expandedItems.has(item.id) ? "" : "truncate"
                            }
                          >
                            {item.coordinates ||
                              formatCoordinates(item.geometry)}
                          </div>
                          <button
                            onClick={() =>
                              handleCopyCoordinates(
                                item.coordinates ||
                                  formatCoordinates(item.geometry)
                              )
                            }
                            className="absolute top-2 right-2 text-gray-400 hover:text-white"
                            title="Copy coordinates"
                            aria-label="Copy coordinates to clipboard"
                          >
                            <Copy className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-6 text-gray-200">
                Cart Summary
              </h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-400">
                  <span>Total AOIs</span>
                  <span className="font-semibold text-white">{totalCount}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Total Area</span>
                  <span className="font-semibold text-blue-300">
                    {(totalArea / 1000000).toFixed(3)} km²
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Active & Monitored AOIs</span>
                  <span className="font-semibold text-green-300">
                    {cartItems.length}
                  </span>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-2 text-gray-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  Monitoring Duration
                </h3>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={durationValue}
                    onChange={(e) =>
                      setDurationValue(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="bg-zinc-800 border-zinc-600 text-white"
                    aria-label="Monitoring duration value"
                  />
                  <Select
                    value={durationType}
                    onValueChange={(value: "months" | "years") =>
                      setDurationType(value)
                    }
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white w-32">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-600 text-white">
                      <SelectItem value="months">Months</SelectItem>
                      <SelectItem value="years">Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-4 mb-6">
                <div className="flex justify-between font-bold text-lg text-gray-200">
                  <span>Total Cost:</span>
                  <span className="text-indigo-300">
                    ${Number(totalCost.toFixed(2)).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Based on ${BASE_RATE_PER_KM2_PER_DAY.toFixed(2)} per km² per
                  day
                </p>
              </div>
              <Button
                onClick={handleProceedToAnalysis}
                className="bg-gradient-to-r cursor-pointer from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg w-full"
                disabled={cartItems.length === 0 || durationValue < 1}
                aria-label="Proceed to checkout"
              >
                Proceed to Checkout
              </Button>
              <Button
                onClick={() => navigate("/map-page")}
                variant="outline"
                className="w-full mt-3 bg-zinc-800 border-zinc-600 hover:bg-zinc-700 text-gray-200"
                aria-label="Back to map"
              >
                Back to Map
              </Button>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AoiCartPage;

// STARTING POINT FOR TODAY
// import { useState, useMemo } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import {
//   Trash2,
//   MapPin,
//   Eye,
//   EyeOff,
//   Square,
//   Copy,
//   Download,
//   Calendar,
//   DollarSign,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useSelector, useDispatch } from "react-redux";
// import type { RootState, AppDispatch } from "../redux/store";
// import {
//   removeAoiFromCart,
//   clearAoiCart,
//   formatArea,
//   formatCoordinates,
// } from "../redux/features/cart/AoiCartSlice";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";

// const AoiCartPage = () => {
//   const cartItems = useSelector((state: RootState) => state.aoiCart.items);
//   const totalArea = useSelector((state: RootState) => state.aoiCart.totalArea);
//   const totalCount = useSelector(
//     (state: RootState) => state.aoiCart.totalCount
//   );
//   const dispatch = useDispatch<AppDispatch>();
//   const navigate = useNavigate();
//   const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
//   const [durationType, setDurationType] = useState<"months" | "years">(
//     "months"
//   );
//   const [durationValue, setDurationValue] = useState<number>(1);

//   // Pricing assumptions: $0.01 per km² per day (base rate)
//   const BASE_RATE_PER_KM2_PER_DAY = 0.01;

//   // Memoized total cost calculation
//   const totalCost = useMemo(() => {
//     const days =
//       durationType === "months" ? durationValue * 30 : durationValue * 365;
//     return totalArea * BASE_RATE_PER_KM2_PER_DAY * days;
//   }, [totalArea, durationType, durationValue]);

//   // Function to calculate individual item cost
//   const calculateItemCost = (itemArea: number) => {
//     const days =
//       durationType === "months" ? durationValue * 30 : durationValue * 365;
//     return itemArea * BASE_RATE_PER_KM2_PER_DAY * days;
//   };

//   const handleCopyCoordinates = async (coords: string | null | undefined) => {
//     if (!coords) {
//       toast.error("No coordinates to copy", {
//         style: { background: "#1f2937", color: "#fff" },
//         icon: "⚠️",
//       });
//       return;
//     }
//     try {
//       await navigator.clipboard.writeText(coords);
//       toast.success("Coordinates copied to clipboard", {
//         style: { background: "#1f2937", color: "#fff" },
//         icon: "📋",
//       });
//     } catch (err) {
//       console.error("Failed to copy coordinates:", err);
//       toast.error("Failed to copy coordinates", {
//         style: { background: "#1f2937", color: "#fff" },
//         icon: "❌",
//       });
//     }
//   };

//   const handleRemoveAoi = (id: number) => {
//     const removedItem = cartItems.find((item) => item.id === id);
//     dispatch(removeAoiFromCart(id));
//     if (removedItem) {
//       toast.success(`${removedItem.name} removed from cart`, {
//         style: { background: "#1f2937", color: "#fff" },
//         icon: "🗑️",
//       });
//     }
//   };

//   const handleClearCart = () => {
//     if (cartItems.length === 0) {
//       toast("Cart is already empty", {
//         style: { background: "#1f2937", color: "#fff" },
//         icon: "ℹ️",
//       });
//       return;
//     }
//     dispatch(clearAoiCart());
//     toast.success("Cart cleared", {
//       style: { background: "#1f2937", color: "#fff" },
//       icon: "🧹",
//     });
//   };

//   const handleExportCart = () => {
//     if (cartItems.length === 0) {
//       toast.error("No items to export", {
//         style: { background: "#1f2937", color: "#fff" },
//         icon: "⚠️",
//       });
//       return;
//     }

//     const exportData = {
//       totalItems: totalCount,
//       totalArea: formatArea(totalArea),
//       exportedAt: new Date().toISOString(),
//       duration: { type: durationType, value: durationValue },
//       totalCost: totalCost.toFixed(2),
//       items: cartItems.map((item) => ({
//         id: item.id,
//         name: item.name,
//         geometry: item.geometry,
//         area: formatArea(item.area),
//         coordinates: item.coordinates,
//         type: item.type,
//         is_active: item.is_active,
//         monitoring_enabled: item.monitoring_enabled,
//         created_at: item.created_at,
//         addedToCartAt: item.addedToCartAt,
//         description: item.description,
//         tags: item.tags,
//       })),
//     };

//     const blob = new Blob([JSON.stringify(exportData, null, 2)], {
//       type: "application/json",
//     });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `aoi-cart-${new Date().toISOString().split("T")[0]}.json`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);

//     toast.success("Cart data exported", {
//       style: { background: "#1f2937", color: "#fff" },
//       icon: "📄",
//     });
//   };

//   const toggleExpanded = (id: number) => {
//     setExpandedItems((prev) => {
//       const newExpanded = new Set(prev);
//       if (newExpanded.has(id)) {
//         newExpanded.delete(id);
//       } else {
//         newExpanded.add(id);
//       }
//       return newExpanded;
//     });
//   };

//   const handleViewOnMap = (aoiId: number) => {
//     navigate(`/map?highlightAoi=${aoiId}`);
//   };

//   const handleProceedToAnalysis = () => {
//     if (cartItems.length === 0) {
//       toast.error("No AOIs in cart to analyze", {
//         style: { background: "#1f2937", color: "#fff" },
//         icon: "⚠️",
//       });
//       return;
//     }
//     if (durationValue < 1) {
//       toast.error("Please select a valid duration", {
//         style: { background: "#1f2937", color: "#fff" },
//         icon: "⚠️",
//       });
//       return;
//     }
//     navigate("/checkout", {
//       state: {
//         aoiItems: cartItems,
//         totalArea,
//         durationType,
//         durationValue,
//         totalCost,
//       },
//     });
//   };

//   const getTypeIcon = (type: string) => {
//     switch (type) {
//       case "Rectangle":
//         return <Square className="w-4 h-4" aria-hidden="true" />;
//       case "Polygon":
//       case "MultiPolygon":
//         return <MapPin className="w-4 h-4" aria-hidden="true" />;
//       default:
//         return <MapPin className="w-4 h-4" aria-hidden="true" />;
//     }
//   };

//   return (
//     <div className="w-full min-h-screen bg-black text-white px-4 md:px-8 py-10">
//       <Toaster position="top-right" />
//       <motion.div
//         className="flex items-center justify-between mb-10"
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.3 }}
//       >
//         <h1 className="text-xl md:text-2xl font-bold text-gray-300 mx-auto">
//           🗺️ AOI Cart - ({totalCount} items)
//         </h1>
//         {cartItems.length > 0 && (
//           <div className="flex gap-3">
//             <Button
//               onClick={handleExportCart}
//               variant="outline"
//               className="bg-zinc-800 border-zinc-600 hover:bg-zinc-700"
//               aria-label="Export cart data"
//             >
//               <Download className="w-4 h-4 mr-2" aria-hidden="true" />
//               Export
//             </Button>
//             <Button
//               onClick={handleClearCart}
//               variant="outline"
//               className="bg-red-900 border-red-600 hover:bg-red-800 text-gray-200"
//               aria-label="Clear all items from cart"
//             >
//               <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
//               Clear All
//             </Button>
//           </div>
//         )}
//       </motion.div>

//       {cartItems.length === 0 ? (
//         <motion.div
//           className="text-center py-40"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.3 }}
//         >
//           <MapPin
//             className="w-24 h-24 mx-auto text-gray-500 mb-6"
//             aria-hidden="true"
//           />
//           <p className="text-gray-400 text-lg mb-4">Your AOI cart is empty</p>
//           <p className="text-gray-200 text-sm mb-8">
//             Start drawing AOIs on the map to add them to your cart
//           </p>
//           <Button
//             onClick={() => navigate("/map-page")}
//             className="bg-indigo-600 hover:bg-indigo-700"
//             aria-label="Navigate to map page"
//           >
//             Go to Map
//           </Button>
//         </motion.div>
//       ) : (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
//           <div className="lg:col-span-2 space-y-6">
//             <AnimatePresence>
//               {cartItems.map((item) => (
//                 <motion.div
//                   key={item.id}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, x: -50 }}
//                   transition={{ duration: 0.3 }}
//                 >
//                   <Card className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
//                     <CardContent className="p-0">
//                       <div className="flex items-center justify-between mb-4">
//                         <div className="flex items-center gap-3 text-gray-200">
//                           {getTypeIcon(item.type)}
//                           <div>
//                             <h2 className="text-lg font-semibold text-gray-200">
//                               {item.name}
//                             </h2>
//                             <p className="text-sm text-gray-400">
//                               Added{" "}
//                               {new Date(
//                                 item.addedToCartAt
//                               ).toLocaleDateString()}
//                             </p>
//                           </div>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => handleViewOnMap(item.id)}
//                             className="text-blue-400 hover:text-blue-300"
//                             aria-label={`View ${item.name} on map`}
//                           >
//                             <Eye className="w-4 h-4" aria-hidden="true" />
//                           </Button>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => handleRemoveAoi(item.id)}
//                             className="text-red-500 hover:text-red-400"
//                             aria-label={`Remove ${item.name} from cart`}
//                           >
//                             <Trash2 className="w-4 h-4" aria-hidden="true" />
//                           </Button>
//                         </div>
//                       </div>
//                       <div className="grid grid-cols-4 gap-4 mb-4">
//                         <div className="bg-zinc-800 rounded-lg p-3">
//                           <p className="text-xs text-gray-400 mb-1">Area</p>
//                           <p className="font-semibold text-blue-300">
//                             {formatArea(item.area)}
//                           </p>
//                         </div>
//                         <div className="bg-zinc-800 rounded-lg p-3">
//                           <p className="text-xs text-gray-400 mb-1">Type</p>
//                           <p className="font-semibold text-purple-300">
//                             {item.type}
//                           </p>
//                         </div>
//                         <div className="bg-zinc-800 rounded-lg p-3">
//                           <p className="text-xs text-gray-400 mb-1">Status</p>
//                           <p className="font-semibold text-green-400">
//                             Active & Monitored
//                           </p>
//                         </div>
//                         <div className="bg-zinc-800 rounded-lg p-3">
//                           <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
//                             <DollarSign
//                               className="w-3 h-3"
//                               aria-hidden="true"
//                             />
//                             Cost
//                           </p>
//                           <p className="font-semibold text-yellow-300">
//                             $
//                             {Number(
//                               calculateItemCost(item.area).toFixed(2)
//                             ).toLocaleString()}
//                           </p>
//                         </div>
//                       </div>
//                       {item.description && (
//                         <div className="mb-4">
//                           <p className="text-sm text-gray-300">
//                             {item.description}
//                           </p>
//                         </div>
//                       )}
//                       {item.tags && item.tags.length > 0 && (
//                         <div className="mb-4">
//                           <div className="flex flex-wrap gap-2">
//                             {item.tags.map((tag, idx) => (
//                               <span
//                                 key={idx}
//                                 className="px-2 py-1 text-xs bg-zinc-700 rounded-full text-gray-300"
//                               >
//                                 #{tag}
//                               </span>
//                             ))}
//                           </div>
//                         </div>
//                       )}
//                       <div className="mb-4">
//                         <button
//                           onClick={() => toggleExpanded(item.id)}
//                           className="text-sm text-gray-400 hover:text-gray-300 mb-2 flex items-center gap-2"
//                           aria-expanded={expandedItems.has(item.id)}
//                           aria-label={`Toggle coordinates for ${item.name}`}
//                         >
//                           <span>Coordinates</span>
//                           {expandedItems.has(item.id) ? (
//                             <EyeOff className="w-3 h-3" aria-hidden="true" />
//                           ) : (
//                             <Eye className="w-3 h-3" aria-hidden="true" />
//                           )}
//                         </button>
//                         <div
//                           className={`relative text-xs font-mono bg-zinc-800 rounded p-3 text-gray-200 overflow-x-auto ${
//                             expandedItems.has(item.id) ? "max-h-32" : "max-h-16"
//                           } transition-all duration-200`}
//                         >
//                           <div
//                             className={
//                               expandedItems.has(item.id) ? "" : "truncate"
//                             }
//                           >
//                             {item.coordinates ||
//                               formatCoordinates(item.geometry)}
//                           </div>
//                           <button
//                             onClick={() =>
//                               handleCopyCoordinates(
//                                 item.coordinates ||
//                                   formatCoordinates(item.geometry)
//                               )
//                             }
//                             className="absolute top-2 right-2 text-gray-400 hover:text-white"
//                             title="Copy coordinates"
//                             aria-label="Copy coordinates to clipboard"
//                           >
//                             <Copy className="w-4 h-4" aria-hidden="true" />
//                           </button>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </motion.div>
//               ))}
//             </AnimatePresence>
//           </div>
//           <motion.div
//             initial={{ opacity: 0, x: 20 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.3 }}
//           >
//             <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-24">
//               <h2 className="text-xl font-semibold mb-6 text-gray-200">
//                 Cart Summary
//               </h2>
//               <div className="space-y-4 mb-6">
//                 <div className="flex justify-between text-gray-400">
//                   <span>Total AOIs</span>
//                   <span className="font-semibold text-white">{totalCount}</span>
//                 </div>
//                 <div className="flex justify-between text-gray-400">
//                   <span>Total Area</span>
//                   <span className="font-semibold text-blue-300">
//                     {(totalArea / 1000000).toFixed(2)} km²
//                   </span>
//                 </div>
//                 <div className="flex justify-between text-gray-400">
//                   <span>Active & Monitored AOIs</span>
//                   <span className="font-semibold text-green-300">
//                     {cartItems.length}
//                   </span>
//                 </div>
//               </div>
//               <div className="mb-6">
//                 <h3 className="text-sm font-semibold mb-2 text-gray-200 flex items-center gap-2">
//                   <Calendar className="w-4 h-4" aria-hidden="true" />
//                   Monitoring Duration
//                 </h3>
//                 <div className="flex gap-2">
//                   <Input
//                     type="number"
//                     min={1}
//                     value={durationValue}
//                     onChange={(e) =>
//                       setDurationValue(Math.max(1, Number(e.target.value) || 1))
//                     }
//                     className="bg-zinc-800 border-zinc-600 text-white"
//                     aria-label="Monitoring duration value"
//                   />
//                   <Select
//                     value={durationType}
//                     onValueChange={(value: "months" | "years") =>
//                       setDurationType(value)
//                     }
//                   >
//                     <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white w-32">
//                       <SelectValue placeholder="Select type" />
//                     </SelectTrigger>
//                     <SelectContent className="bg-zinc-800 border-zinc-600 text-white">
//                       <SelectItem value="months">Months</SelectItem>
//                       <SelectItem value="years">Years</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//               <div className="border-t border-gray-700 pt-4 mb-6">
//                 <div className="flex justify-between font-bold text-lg text-gray-200">
//                   <span>Total Cost:</span>
//                   <span className="text-indigo-300">
//                     ${Number(totalCost.toFixed(2)).toLocaleString()}
//                   </span>
//                 </div>
//                 <p className="text-xs text-gray-400 mt-2">
//                   Based on ${BASE_RATE_PER_KM2_PER_DAY.toFixed(2)} per km² per
//                   day
//                 </p>
//               </div>
//               <Button
//                 onClick={handleProceedToAnalysis}
//                 className="bg-gradient-to-r cursor-pointer from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg w-full"
//                 disabled={cartItems.length === 0 || durationValue < 1}
//                 aria-label="Proceed to checkout"
//               >
//                 Proceed to Checkout
//               </Button>
//               <Button
//                 onClick={() => navigate("/map-page")}
//                 variant="outline"
//                 className="w-full mt-3 bg-zinc-800 border-zinc-600 hover:bg-zinc-700 text-gray-200"
//                 aria-label="Back to map"
//               >
//                 Back to Map
//               </Button>
//             </Card>
//           </motion.div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AoiCartPage;

// Functionality to make the cart page protected and fetch AOI cart from backend

// import { useEffect, useState, useMemo } from "react";
// import axios from "axios";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import {
//   Trash2,
//   MapPin,
//   Eye,
//   EyeOff,
//   Square,
//   Copy,
//   Download,
//   Calendar,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useSelector, useDispatch } from "react-redux";
// import type { RootState, AppDispatch } from "../redux/store";
// import {
//   setCart,
//   removeAoiFromCart,
//   clearAoiCart,
//   formatArea,
//   formatCoordinates,
//   type AoiCartItem,
// } from "../redux/features/cart/AoiCartSlice";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";

// const AoiCartPage = () => {
//   const cartItems = useSelector((state: RootState) => state.aoiCart.items);
//   const totalArea = useSelector((state: RootState) => state.aoiCart.totalArea);
//   const totalCount = useSelector(
//     (state: RootState) => state.aoiCart.totalCount
//   );
//   const dispatch = useDispatch<AppDispatch>();
//   const navigate = useNavigate();
//   const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
//   const [durationType, setDurationType] = useState<"months" | "years">(
//     "months"
//   );
//   const [durationValue, setDurationValue] = useState<number>(1);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   // Pricing assumptions: $0.01 per km² per day (base rate)
//   // Adjust multipliers: 1 month ≈ 30 days, 1 year ≈ 365 days
//   const BASE_RATE_PER_KM2_PER_DAY = 0.01;

//   // Memoized total cost calculation to avoid unnecessary re-renders
//   const totalCost = useMemo(() => {
//     let days = 0;
//     switch (durationType) {
//       case "months":
//         days = durationValue * 30; // Approximate
//         break;
//       case "years":
//         days = durationValue * 365; // Approximate
//         break;
//     }
//     return totalArea * BASE_RATE_PER_KM2_PER_DAY * days;
//   }, [totalArea, durationType, durationValue]);

//   const handleCopyCoordinates = async (coords: string | null | undefined) => {
//     if (!coords) {
//       toast.error("No coordinates to copy");
//       return;
//     }
//     try {
//       await navigator.clipboard.writeText(coords);
//       toast.success("Coordinates copied to clipboard", {
//         style: { background: "#1f2937", color: "#fff" },
//         icon: "📋",
//       });
//     } catch (err) {
//       console.error("Failed to copy coordinates:", err);
//       toast.error("Failed to copy coordinates");
//     }
//   };

//   // Fetch AOI cart from backend and ensure all are active and monitoring enabled
//   useEffect(() => {
//     const fetchAoiCart = async () => {
//       setIsLoading(true);
//       setError(null);
//       try {
//         const token = localStorage.getItem("token");
//         if (!token) {
//           throw new Error("No authentication token found");
//         }

//         const res = await axios.get<AoiCartItem[]>(
//           "http://localhost:8000/api/aoi-cart/",
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );

//         // Ensure all items are active and monitoring enabled
//         const updatedItems = await Promise.all(
//           res.data.map(async (item: AoiCartItem) => {
//             if (!item.is_active || !item.monitoring_enabled) {
//               const updates: Partial<AoiCartItem> = {
//                 is_active: true,
//                 monitoring_enabled: true,
//               };

//               await axios.patch(
//                 `http://localhost:8000/api/aoi-cart/${item.id}/`,
//                 updates,
//                 { headers: { Authorization: `Bearer ${token}` } }
//               );

//               return { ...item, ...updates };
//             }
//             return item;
//           })
//         );

//         dispatch(setCart(updatedItems));
//       } catch (err) {
//         console.error("Failed to fetch or update AOI cart:", err);
//         const errorMessage =
//           err instanceof Error ? err.message : "Failed to fetch cart";
//         setError(errorMessage);
//         toast.error(errorMessage);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchAoiCart();
//   }, [dispatch]);

//   // Remove AOI from backend + Redux + toast
//   const handleRemoveAoi = async (id: number) => {
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         toast.error("Authentication required");
//         return;
//       }

//       await axios.delete(`http://localhost:8000/api/aoi-cart/${id}/`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const removedItem = cartItems.find((item) => item.id === id);
//       dispatch(removeAoiFromCart(id));

//       if (removedItem) {
//         toast.error(`${removedItem.name} removed from cart`, {
//           style: { background: "#1f2937", color: "#fff" },
//           icon: "🗑️",
//         });
//       }
//     } catch (err) {
//       console.error("Failed to remove AOI:", err);
//       toast.error("Failed to remove AOI from cart");
//     }
//   };

//   // Clear entire cart
//   const handleClearCart = async () => {
//     if (cartItems.length === 0) {
//       toast("Cart is already empty", {
//         style: { background: "#1f2937", color: "#fff" },
//         icon: "ℹ️",
//       });
//       return;
//     }

//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         toast.error("Authentication required");
//         return;
//       }

//       await axios.delete("http://localhost:8000/api/aoi-cart/clear/", {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       dispatch(clearAoiCart());
//       toast.success("Cart cleared", {
//         style: { background: "#1f2937", color: "#fff" },
//         icon: "🧹",
//       });
//     } catch (err) {
//       console.error("Failed to clear cart:", err);
//       toast.error("Failed to clear cart");
//     }
//   };

//   // Export cart data
//   const handleExportCart = () => {
//     if (cartItems.length === 0) {
//       toast.error("No items to export");
//       return;
//     }

//     const exportData = {
//       totalItems: totalCount,
//       totalArea: formatArea(totalArea),
//       exportedAt: new Date().toISOString(),
//       duration: { type: durationType, value: durationValue },
//       totalCost: totalCost.toFixed(2),
//       items: cartItems.map((item) => ({
//         id: item.id,
//         name: item.name,
//         geometry: item.geometry,
//         area: formatArea(item.area),
//         coordinates: item.coordinates,
//         type: item.type,
//         is_active: item.is_active,
//         monitoring_enabled: item.monitoring_enabled,
//         created_at: item.created_at,
//         addedToCartAt: item.addedToCartAt,
//         description: item.description,
//         tags: item.tags,
//       })),
//     };

//     const blob = new Blob([JSON.stringify(exportData, null, 2)], {
//       type: "application/json",
//     });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `aoi-cart-${new Date().toISOString().split("T")[0]}.json`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);

//     toast.success("Cart data exported", {
//       style: { background: "#1f2937", color: "#fff" },
//       icon: "📄",
//     });
//   };

//   // Toggle expanded view for coordinates
//   const toggleExpanded = (id: number) => {
//     setExpandedItems((prev) => {
//       const newExpanded = new Set(prev);
//       if (newExpanded.has(id)) {
//         newExpanded.delete(id);
//       } else {
//         newExpanded.add(id);
//       }
//       return newExpanded;
//     });
//   };

//   // Navigate to map view for specific AOI
//   const handleViewOnMap = (aoiId: number) => {
//     navigate(`/map?highlightAoi=${aoiId}`);
//   };

//   const handleProceedToAnalysis = () => {
//     if (cartItems.length === 0) {
//       toast.error("No AOIs in cart to analyze");
//       return;
//     }
//     if (durationValue < 1) {
//       toast.error("Please select a valid duration");
//       return;
//     }
//     navigate("/checkout", {
//       state: {
//         aoiItems: cartItems,
//         totalArea: totalArea,
//         durationType,
//         durationValue,
//         totalCost,
//       },
//     });
//   };

//   // Get AOI type icon
//   const getTypeIcon = (type: string) => {
//     switch (type) {
//       case "Rectangle":
//         return <Square className="w-4 h-4" aria-hidden="true" />;
//       case "Polygon":
//       case "MultiPolygon":
//         return <MapPin className="w-4 h-4" aria-hidden="true" />;
//       default:
//         return <MapPin className="w-4 h-4" aria-hidden="true" />;
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="w-full min-h-screen bg-black text-white px-4 md:px-8 py-10 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
//           <p className="text-gray-400">Loading cart...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="w-full min-h-screen bg-black text-white px-4 md:px-8 py-10 flex items-center justify-center">
//         <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full">
//           <div className="text-center">
//             <p className="text-red-400 mb-4">{error}</p>
//             <Button
//               onClick={() => window.location.reload()}
//               className="bg-indigo-600 hover:bg-indigo-700"
//             >
//               Retry
//             </Button>
//           </div>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full min-h-screen bg-black text-white px-4 md:px-8 py-10">
//       <Toaster position="top-right" />

//       <motion.div
//         className="flex items-center justify-between mb-10"
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//       >
//         <h1 className="text-xl md:text-2xl font-bold text-gray-300 mx-auto">
//           🗺️ AOI Cart - ({totalCount} items)
//         </h1>

//         {cartItems.length > 0 && (
//           <div className="flex gap-3">
//             <Button
//               onClick={handleExportCart}
//               variant="outline"
//               className="bg-zinc-800 border-zinc-600 hover:bg-zinc-700"
//               aria-label="Export cart data"
//             >
//               <Download className="w-4 h-4 mr-2" aria-hidden="true" />
//               Export
//             </Button>
//             <Button
//               onClick={handleClearCart}
//               variant="outline"
//               className="bg-red-900 border-red-600 hover:bg-red-800 text-gray-200"
//               aria-label="Clear all items from cart"
//             >
//               <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
//               Clear All
//             </Button>
//           </div>
//         )}
//       </motion.div>

//       {cartItems.length === 0 ? (
//         <motion.div
//           className="text-center py-40"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//         >
//           <MapPin
//             className="w-24 h-24 mx-auto text-gray-500 mb-6"
//             aria-hidden="true"
//           />
//           <p className="text-gray-400 text-lg mb-4">Your AOI cart is empty</p>
//           <p className="text-gray-200 text-sm mb-8">
//             Start drawing AOIs on the map to add them to your cart
//           </p>
//           <Button
//             onClick={() => navigate("/map")}
//             className="bg-indigo-600 hover:bg-indigo-700"
//             aria-label="Navigate to map page"
//           >
//             Go to Map
//           </Button>
//         </motion.div>
//       ) : (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
//           {/* AOI Items */}
//           <div className="lg:col-span-2 space-y-6">
//             <AnimatePresence>
//               {cartItems.map((item) => (
//                 <motion.div
//                   key={item.id}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, x: -50 }}
//                   transition={{ duration: 0.3 }}
//                 >
//                   <Card className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
//                     <CardContent className="p-0">
//                       {/* Header */}
//                       <div className="flex items-center justify-between mb-4">
//                         <div className="flex items-center gap-3 text-gray-200">
//                           {getTypeIcon(item.type)}
//                           <div>
//                             <h2 className="text-lg font-semibold text-gray-200">
//                               {item.name}
//                             </h2>
//                             <p className="text-sm text-gray-400">
//                               Added{" "}
//                               {new Date(
//                                 item.addedToCartAt
//                               ).toLocaleDateString()}
//                             </p>
//                           </div>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => handleViewOnMap(item.id)}
//                             className="text-blue-400 hover:text-blue-300"
//                             aria-label={`View ${item.name} on map`}
//                           >
//                             <Eye className="w-4 h-4" aria-hidden="true" />
//                           </Button>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => handleRemoveAoi(item.id)}
//                             className="text-red-500 hover:text-red-400"
//                             aria-label={`Remove ${item.name} from cart`}
//                           >
//                             <Trash2 className="w-4 h-4" aria-hidden="true" />
//                           </Button>
//                         </div>
//                       </div>

//                       {/* Stats */}
//                       <div className="grid grid-cols-3 gap-4 mb-4">
//                         <div className="bg-zinc-800 rounded-lg p-3">
//                           <p className="text-xs text-gray-400 mb-1">Area</p>
//                           <p className="font-semibold text-blue-300">
//                             {formatArea(item.area)}
//                           </p>
//                         </div>
//                         <div className="bg-zinc-800 rounded-lg p-3">
//                           <p className="text-xs text-gray-400 mb-1">Type</p>
//                           <p className="font-semibold text-purple-300">
//                             {item.type}
//                           </p>
//                         </div>
//                         <div className="bg-zinc-800 rounded-lg p-3">
//                           <p className="text-xs text-gray-400 mb-1">Status</p>
//                           <p className="font-semibold text-green-400">
//                             Active & Monitored
//                           </p>
//                         </div>
//                       </div>

//                       {/* Description and Tags */}
//                       {item.description && (
//                         <div className="mb-4">
//                           <p className="text-sm text-gray-300">
//                             {item.description}
//                           </p>
//                         </div>
//                       )}

//                       {item.tags && item.tags.length > 0 && (
//                         <div className="mb-4">
//                           <div className="flex flex-wrap gap-2">
//                             {item.tags.map((tag, idx) => (
//                               <span
//                                 key={idx}
//                                 className="px-2 py-1 text-xs bg-zinc-700 rounded-full text-gray-300"
//                               >
//                                 #{tag}
//                               </span>
//                             ))}
//                           </div>
//                         </div>
//                       )}

//                       {/* Coordinates */}
//                       <div className="mb-4">
//                         <button
//                           onClick={() => toggleExpanded(item.id)}
//                           className="text-sm text-gray-400 hover:text-gray-300 mb-2 flex items-center gap-2"
//                           aria-expanded={expandedItems.has(item.id)}
//                           aria-label={`Toggle coordinates for ${item.name}`}
//                         >
//                           <span>Coordinates</span>
//                           {expandedItems.has(item.id) ? (
//                             <EyeOff className="w-3 h-3" aria-hidden="true" />
//                           ) : (
//                             <Eye className="w-3 h-3" aria-hidden="true" />
//                           )}
//                         </button>
//                         <div
//                           className={`relative text-xs font-mono bg-zinc-800 rounded p-3 text-gray-200 overflow-x-auto ${
//                             expandedItems.has(item.id) ? "max-h-32" : "max-h-16"
//                           } transition-all duration-200`}
//                         >
//                           <div
//                             className={
//                               expandedItems.has(item.id) ? "" : "truncate"
//                             }
//                           >
//                             {item.coordinates ||
//                               formatCoordinates(item.geometry)}
//                           </div>

//                           {/* Copy icon button on the right */}
//                           <button
//                             onClick={() =>
//                               handleCopyCoordinates(
//                                 item.coordinates ||
//                                   formatCoordinates(item.geometry)
//                               )
//                             }
//                             className="absolute top-2 right-2 text-gray-400 hover:text-white"
//                             title="Copy coordinates"
//                             aria-label="Copy coordinates to clipboard"
//                           >
//                             <Copy className="w-4 h-4" aria-hidden="true" />
//                           </button>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </motion.div>
//               ))}
//             </AnimatePresence>
//           </div>

//           {/* Summary */}
//           <motion.div
//             initial={{ opacity: 0, x: 20 }}
//             animate={{ opacity: 1, x: 0 }}
//           >
//             <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-24">
//               <h2 className="text-xl font-semibold mb-6 text-gray-200">
//                 Cart Summary
//               </h2>

//               <div className="space-y-4 mb-6">
//                 <div className="flex justify-between text-gray-400">
//                   <span>Total AOIs</span>
//                   <span className="font-semibold text-white">{totalCount}</span>
//                 </div>

//                 <div className="flex justify-between text-gray-400">
//                   <span>Total Area</span>
//                   <span className="font-semibold text-blue-300">
//                     {formatArea(totalArea)}
//                   </span>
//                 </div>

//                 <div className="flex justify-between text-gray-400">
//                   <span>Active & Monitored AOIs</span>
//                   <span className="font-semibold text-green-300">
//                     {cartItems.length}
//                   </span>
//                 </div>
//               </div>

//               {/* Monitoring Duration Selection */}
//               <div className="mb-6">
//                 <h3 className="text-sm font-semibold mb-2 text-gray-200 flex items-center gap-2">
//                   <Calendar className="w-4 h-4" aria-hidden="true" />
//                   Monitoring Duration
//                 </h3>
//                 <div className="flex gap-2">
//                   <Input
//                     type="number"
//                     min={1}
//                     value={durationValue}
//                     onChange={(e) =>
//                       setDurationValue(Math.max(1, Number(e.target.value) || 1))
//                     }
//                     className="bg-zinc-800 border-zinc-600 text-white"
//                     aria-label="Duration value"
//                   />
//                   <Select
//                     value={durationType}
//                     onValueChange={(value: "months" | "years") =>
//                       setDurationType(value)
//                     }
//                   >
//                     <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white w-32">
//                       <SelectValue placeholder="Select type" />
//                     </SelectTrigger>
//                     <SelectContent className="bg-zinc-800 border-zinc-600 text-white">
//                       <SelectItem value="months">Months</SelectItem>
//                       <SelectItem value="years">Years</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>

//               <div className="border-t border-gray-700 pt-4 mb-6">
//                 <div className="flex justify-between font-bold text-lg text-gray-200">
//                   <span>Total Cost:</span>
//                   <span className="text-indigo-300">
//                     ${Number(totalCost.toFixed(2)).toLocaleString()}
//                   </span>
//                 </div>
//                 <p className="text-xs text-gray-400 mt-2">
//                   Based on ${BASE_RATE_PER_KM2_PER_DAY.toFixed(2)} per km² per
//                   day
//                 </p>
//               </div>

//               <Button
//                 onClick={handleProceedToAnalysis}
//                 className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg w-full"
//                 disabled={cartItems.length === 0 || durationValue < 1}
//                 aria-label="Proceed to checkout"
//               >
//                 Proceed to Checkout
//               </Button>

//               <Button
//                 onClick={() => navigate("/map")}
//                 variant="outline"
//                 className="w-full mt-3 bg-zinc-800 border-zinc-600 hover:bg-zinc-700 text-gray-200"
//                 aria-label="Back to map"
//               >
//                 Back to Map
//               </Button>
//             </Card>
//           </motion.div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AoiCartPage;
