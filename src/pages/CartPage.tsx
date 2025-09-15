import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCallback } from "react";
import {
  Trash2,
  MapPin,
  Eye,
  EyeOff,
  Square,
  Copy,
  Download,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../redux/store";
import {
  setCart,
  removeAoiFromCart,
  clearAoiCart,
  formatArea,
  formatCoordinates,
  type AoiCartItem,
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
  const [durationType, setDurationType] = useState<"days" | "months" | "years">(
    "months"
  );
  const [durationValue, setDurationValue] = useState<number>(1);
  const [totalCost, setTotalCost] = useState<number>(0);

  // Pricing assumptions: $0.01 per km² per day (base rate)
  // Adjust multipliers: 1 month ≈ 30 days, 1 year ≈ 365 days
  const BASE_RATE_PER_KM2_PER_DAY = 0.01;

  const calculateTotalCost = useCallback(() => {
    let days = 0;
    switch (durationType) {
      case "days":
        days = durationValue;
        break;
      case "months":
        days = durationValue * 30; // Approximate
        break;
      case "years":
        days = durationValue * 365; // Approximate
        break;
    }
    const cost = totalArea * BASE_RATE_PER_KM2_PER_DAY * days;
    setTotalCost(cost);
  }, [totalArea, durationType, durationValue]);

  useEffect(() => {
    calculateTotalCost();
  }, [totalArea, durationType, durationValue, calculateTotalCost]);

  const handleCopyCoordinates = async (coords: string | null | undefined) => {
    if (!coords) return;
    try {
      await navigator.clipboard.writeText(coords);
      toast.success("Coordinates copied to clipboard", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "📋",
      });
    } catch (err) {
      console.error("Failed to copy coordinates:", err);
      toast.error("Failed to copy coordinates");
    }
  };

  // Fetch AOI cart from backend and ensure all are active and monitoring enabled
  useEffect(() => {
    const fetchAoiCart = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get("http://localhost:8000/api/aoi-cart/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Ensure all items are active and monitoring enabled
        const updatedItems = await Promise.all(
          res.data.cart.map(async (item: AoiCartItem) => {
            if (!item.is_active || !item.monitoring_enabled) {
              const updates: Partial<AoiCartItem> = {
                is_active: true,
                monitoring_enabled: true,
              };

              await axios.patch(
                `http://localhost:8000/api/aoi-cart/${item.id}/`,
                updates,
                { headers: { Authorization: `Bearer ${token}` } }
              );

              return { ...item, ...updates };
            }
            return item;
          })
        );

        dispatch(setCart(updatedItems));
      } catch (err) {
        console.error("Failed to fetch or update AOI cart:", err);
        toast.error("Failed to fetch cart");
      }
    };
    fetchAoiCart();
  }, [dispatch]);

  // Remove AOI from backend + Redux + toast
  const handleRemoveAoi = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8000/api/aoi-cart/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const removedItem = cartItems.find((item) => item.id === id);
      dispatch(removeAoiFromCart(id));

      if (removedItem) {
        toast.error(`${removedItem.name} removed from cart`, {
          style: { background: "#1f2937", color: "#fff" },
          icon: "🗑️",
        });
      }
    } catch (err) {
      console.error("Failed to remove AOI:", err);
      toast.error("Failed to remove AOI from cart");
    }
  };

  // Clear entire cart
  const handleClearCart = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete("http://localhost:8000/api/aoi-cart/clear/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      dispatch(clearAoiCart());
      toast.success("Cart cleared", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "🧹",
      });
    } catch (err) {
      console.error("Failed to clear cart:", err);
      toast.error("Failed to clear cart");
    }
  };

  // Export cart data
  const handleExportCart = () => {
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

  // Toggle expanded view for coordinates
  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Navigate to map view for specific AOI
  const handleViewOnMap = (aoiId: number) => {
    navigate(`/map?highlightAoi=${aoiId}`);
  };

  const handleProceedToAnalysis = () => {
    if (cartItems.length === 0) {
      toast.error("No AOIs in cart to analyze");
      return;
    }
    navigate("/checkout", {
      state: {
        aoiItems: cartItems,
        totalArea: totalArea,
        durationType,
        durationValue,
        totalCost,
      },
    });
  };

  // Get AOI type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Rectangle":
        return <Square className="w-4 h-4" />;
      case "Polygon":
        return <MapPin className="w-4 h-4" />;
      case "MultiPolygon":
        return <MapPin className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white px-4 md:px-8 py-10">
      <Toaster position="top-right" />

      <motion.div
        className="flex items-center justify-between mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl md:text-2xl font-bold text-gray-300 mx-auto">
          🗺️ AOI Cart - ({totalCount} items)
        </h1>

        {cartItems.length > 0 && (
          <div className="flex gap-3">
            <Button
              onClick={handleExportCart}
              variant="outline"
              className="bg-zinc-800 border-zinc-600 hover:bg-zinc-700 cursor-pointer hover:text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={handleClearCart}
              variant="outline"
              className="bg-red-900 border-red-600 hover:bg-red-800 text-gray-200 cursor-pointer hover:text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
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
        >
          <MapPin className="w-24 h-24 mx-auto text-gray-500 mb-6" />
          <p className="text-gray-400 text-lg mb-4">Your AOI cart is empty</p>
          <p className="text-gray-200 text-sm mb-8">
            Start drawing AOIs on the map to add them to your cart
          </p>
          <Button
            onClick={() => navigate("/map-page")}
            className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
          >
            Go to Map
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
          {/* AOI Items */}
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
                      {/* Header */}
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
                            className="text-blue-400 hover:text-blue-300 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAoi(item.id)}
                            className="text-red-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
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
                      </div>

                      {/* Description and Tags */}
                      {item.description && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-300">
                            {item.description}
                          </p>
                        </div>
                      )}

                      {item.tags && item.tags.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-400 mb-1">Tags</p>
                          <div className="flex flex-wrap gap-2">
                            {item.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="bg-indigo-900 text-indigo-200 text-xs px-2 py-1 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Coordinates */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">Coordinates</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(item.id)}
                            className="text-gray-400 hover:text-gray-300 cursor-pointer"
                          >
                            {expandedItems.has(item.id) ? (
                              <EyeOff className="w-4 h-4 mr-1" />
                            ) : (
                              <Eye className="w-4 h-4 mr-1" />
                            )}
                            {expandedItems.has(item.id) ? "Hide" : "Show"}
                          </Button>
                        </div>
                        <AnimatePresence>
                          {expandedItems.has(item.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-2 bg-zinc-800 rounded-lg p-3"
                            >
                              <p className="text-sm text-gray-300 font-mono">
                                {formatCoordinates(item.geometry)}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleCopyCoordinates(
                                    formatCoordinates(item.geometry)
                                  )
                                }
                                className="mt-2 text-blue-400 hover:text-blue-300 cursor-pointer"
                              >
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl sticky top-10">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-200 mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between text-gray-300">
                    <span>Total AOIs</span>
                    <span>{totalCount}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Total Area</span>
                    <span>{formatArea(totalArea)}</span>
                  </div>

                  {/* Duration Selection */}
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm">Monitoring Duration</p>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={durationValue}
                        onChange={(e) =>
                          setDurationValue(parseInt(e.target.value) || 1)
                        }
                        className="bg-zinc-800 border-zinc-700 text-gray-200 w-20"
                      />
                      <Select
                        value={durationType}
                        onValueChange={(value: "days" | "months" | "years") =>
                          setDurationType(value)
                        }
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 text-gray-200">
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                          <SelectItem value="years">Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-between text-gray-300">
                    <span>Estimated Cost</span>
                    <span className="font-semibold text-green-400">
                      ${totalCost.toFixed(2)} USD
                    </span>
                  </div>

                  <Button
                    onClick={handleProceedToAnalysis}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 cursor-pointer mt-6"
                  >
                    Proceed to Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AoiCartPage;

// import { useEffect, useState } from "react";
// import axios from "axios";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import {
//   Trash2,
//   MapPin,
//   Eye,
//   EyeOff,
//   Activity,
//   Square,
//   Copy,
//   Download,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useSelector, useDispatch } from "react-redux";
// import type { RootState, AppDispatch } from "../redux/store";
// import {
//   setCart,
//   removeAoiFromCart,
//   clearAoiCart,
//   toggleMonitoring,
//   toggleActive,
//   formatArea,
//   formatCoordinates,
//   type AoiCartItem,
// } from "../redux/features/cart/AoiCartSlice";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";

// const AoiCartPage = () => {
//   const cartItems = useSelector((state: RootState) => state.aoiCart.items);
//   const totalArea = useSelector((state: RootState) => state.aoiCart.totalArea);
//   const totalCount = useSelector(
//     (state: RootState) => state.aoiCart.totalCount
//   );
//   const dispatch = useDispatch<AppDispatch>();
//   const navigate = useNavigate();
//   const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

//   const handleCopyCoordinates = async (coords: string | null | undefined) => {
//     if (!coords) return;
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

//   // Fetch AOI cart from backend
//   useEffect(() => {
//     const fetchAoiCart = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         if (!token) return;

//         const res = await axios.get("http://localhost:8000/api/aoi-cart/", {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         dispatch(setCart(res.data.cart));
//       } catch (err) {
//         console.error("Failed to fetch AOI cart:", err);
//       }
//     };
//     fetchAoiCart();
//   }, [dispatch]);

//   // Remove AOI from backend + Redux + toast
//   const handleRemoveAoi = async (id: number) => {
//     try {
//       const token = localStorage.getItem("token");
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

//   // Toggle monitoring status
//   const handleToggleMonitoring = async (id: number) => {
//     try {
//       const token = localStorage.getItem("token");
//       const item = cartItems.find((item) => item.id === id);
//       if (!item) return;

//       await axios.patch(
//         `http://localhost:8000/api/aoi-cart/${id}/`,
//         { monitoring_enabled: !item.monitoring_enabled },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       dispatch(toggleMonitoring(id));
//       toast.success(
//         `Monitoring ${!item.monitoring_enabled ? "enabled" : "disabled"} for ${
//           item.name
//         }`,
//         { style: { background: "#1f2937", color: "#fff" } }
//       );
//     } catch (err) {
//       console.error("Failed to toggle monitoring:", err);
//       toast.error("Failed to update monitoring status");
//     }
//   };

//   // Toggle active status
//   const handleToggleActive = async (id: number) => {
//     try {
//       const token = localStorage.getItem("token");
//       const item = cartItems.find((item) => item.id === id);
//       if (!item) return;

//       await axios.patch(
//         `http://localhost:8000/api/aoi-cart/${id}/`,
//         { is_active: !item.is_active },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       dispatch(toggleActive(id));
//       toast.success(
//         `${item.name} ${!item.is_active ? "activated" : "deactivated"}`,
//         { style: { background: "#1f2937", color: "#fff" } }
//       );
//     } catch (err) {
//       console.error("Failed to toggle active status:", err);
//       toast.error("Failed to update active status");
//     }
//   };

//   // Clear entire cart
//   const handleClearCart = async () => {
//     try {
//       const token = localStorage.getItem("token");
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
//     const exportData = {
//       totalItems: totalCount,
//       totalArea: formatArea(totalArea),
//       exportedAt: new Date().toISOString(),
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
//     const newExpanded = new Set(expandedItems);
//     if (newExpanded.has(id)) {
//       newExpanded.delete(id);
//     } else {
//       newExpanded.add(id);
//     }
//     setExpandedItems(newExpanded);
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
//     navigate("/checkout", {
//       state: {
//         aoiItems: cartItems,
//         totalArea: totalArea,
//       },
//     });
//   };

//   // Get AOI type icon
//   const getTypeIcon = (type: string) => {
//     switch (type) {
//       case "Rectangle":
//         return <Square className="w-4 h-4" />;
//       case "Polygon":
//         return <MapPin className="w-4 h-4" />;
//       case "MultiPolygon":
//         return <MapPin className="w-4 h-4" />;
//       default:
//         return <MapPin className="w-4 h-4" />;
//     }
//   };

//   // Get status color
//   const getStatusColor = (item: AoiCartItem) => {
//     if (item.is_active && item.monitoring_enabled) return "text-green-400";
//     if (item.is_active) return "text-yellow-400";
//     return "text-gray-400";
//   };

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
//               className="bg-zinc-800 border-zinc-600 hover:bg-zinc-700 cursor-pointer hover:text-white"
//             >
//               <Download className="w-4 h-4 mr-2" />
//               Export
//             </Button>
//             <Button
//               onClick={handleClearCart}
//               variant="outline"
//               className="bg-red-900 border-red-600 hover:bg-red-800 text-gray-200 cursor-pointer hover:text-white"
//             >
//               <Trash2 className="w-4 h-4 mr-2" />
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
//           <MapPin className="w-24 h-24 mx-auto text-gray-500 mb-6" />
//           <p className="text-gray-400 text-lg mb-4">Your AOI cart is empty</p>
//           <p className="text-gray-200 text-sm mb-8">
//             Start drawing AOIs on the map to add them to your cart
//           </p>
//           <Button
//             onClick={() => navigate("/map-page")}
//             className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
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
//                             className="text-blue-400 hover:text-blue-300 cursor-pointer"
//                           >
//                             <Eye className="w-4 h-4" />
//                           </Button>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => handleRemoveAoi(item.id)}
//                             className="text-red-500 hover:text-red-400 cursor-pointer"
//                           >
//                             <Trash2 className="w-4 h-4" />
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
//                           <p
//                             className={`font-semibold ${getStatusColor(item)}`}
//                           >
//                             {item.is_active ? "Active" : "Inactive"}
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
//                         >
//                           <span>Coordinates</span>
//                           {expandedItems.has(item.id) ? (
//                             <EyeOff className="w-3 h-3" />
//                           ) : (
//                             <Eye className="w-3 h-3" />
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
//                             className="absolute top-2 right-2 text-gray-400 hover:text-white cursor-pointer"
//                             title="Copy coordinates"
//                           >
//                             <Copy className="w-4 h-4" />
//                           </button>
//                         </div>
//                       </div>

//                       {/* Action Buttons */}
//                       <div className="flex gap-2">
//                         <Button
//                           onClick={() => handleToggleActive(item.id)}
//                           variant="outline"
//                           size="sm"
//                           className={`${
//                             item.is_active
//                               ? "bg-green-900 border-green-600 text-green-300"
//                               : "bg-zinc-800 border-zinc-600"
//                           }`}
//                         >
//                           <Activity className="w-3 h-3 mr-1" />
//                           {item.is_active ? "Active" : "Activate"}
//                         </Button>

//                         <Button
//                           onClick={() => handleToggleMonitoring(item.id)}
//                           variant="outline"
//                           size="sm"
//                           className={`${
//                             item.monitoring_enabled
//                               ? "bg-blue-900 border-blue-600 text-blue-300"
//                               : "bg-zinc-800 border-zinc-600"
//                           }`}
//                         >
//                           <Eye className="w-3 h-3 mr-1" />
//                           {item.monitoring_enabled
//                             ? "Monitoring"
//                             : "Enable Monitor"}
//                         </Button>
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
//                   <span>Active AOIs</span>
//                   <span className="font-semibold text-green-300">
//                     {cartItems.filter((item) => item.is_active).length}
//                   </span>
//                 </div>

//                 <div className="flex justify-between text-gray-400">
//                   <span>Monitored AOIs</span>
//                   <span className="font-semibold text-yellow-300">
//                     {cartItems.filter((item) => item.monitoring_enabled).length}
//                   </span>
//                 </div>
//               </div>

//               <div className="border-t border-gray-700 pt-4 mb-6">
//                 <div className="flex justify-between font-bold text-lg text-gray-200">
//                   <span>Ready for Analysis</span>
//                   <span className="text-indigo-300">
//                     {
//                       cartItems.filter(
//                         (item) => item.is_active && item.monitoring_enabled
//                       ).length
//                     }{" "}
//                     AOIs
//                   </span>
//                 </div>
//               </div>

//               <Button
//                 onClick={handleProceedToAnalysis}
//                 className="w-full bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
//                 disabled={cartItems.length === 0}
//               >
//                 Proceed to Checkout
//               </Button>

//               <Button
//                 onClick={() => navigate("/map")}
//                 variant="outline"
//                 className="w-full mt-3 bg-zinc-800 border-zinc-600 hover:bg-zinc-700 text-gray-200 cursor-pointer hover:text-white"
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
