"use client";

import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../redux/store";
import { clearAoiCart, formatArea } from "../redux/features/cart/AoiCartSlice";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Square, Activity, Eye } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import axios from "axios";
import { useEffect, useState } from "react";
import { usePaymentWebSocket } from "@/hooks/usePaymentWebSocket";

interface CheckoutPageProps {
  orderId?: string; // Optional, as it might be created dynamically
}

const CheckoutPage = ({ orderId: initialOrderId }: CheckoutPageProps) => {
  const cartItems = useSelector((state: RootState) => state.aoiCart.items);
  const totalArea = useSelector((state: RootState) => state.aoiCart.totalArea);
  const totalCount = useSelector(
    (state: RootState) => state.aoiCart.totalCount
  );
  const payment = useSelector((state: RootState) => state.payment);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [localOrderId, setLocalOrderId] = useState(initialOrderId);

  // 🔌 WebSocket live updates (use localOrderId if set)
  usePaymentWebSocket(localOrderId || "");

  // 🚀 Auto-navigate based on payment status
  useEffect(() => {
    if (payment.status === "success") {
      dispatch(clearAoiCart());
      navigate("/payment-success");
    } else if (payment.status === "failed") {
      navigate("/payment-failed");
    }
  }, [payment.status, navigate, dispatch]);

  // Mock pricing logic (adjust as per business rules)
  const calculatePricing = () => {
    const baseRate = 0.01; // $0.01 per m²
    const subtotal = totalArea * baseRate;
    const discountRate = 0.05; // 5%
    const discount = subtotal * discountRate;
    const total = subtotal - discount;
    return { subtotal, discount, total };
  };

  const { subtotal, discount, total } = calculatePricing();

  const handlePayment = async (method: "stripe" | "paystack") => {
    if (cartItems.length === 0) {
      toast.error("Your AOI cart is empty!", {
        style: { background: "#1f2937", color: "#fff" },
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Step 1: Create order if not already created
      let currentOrderId = localOrderId;
      if (!currentOrderId) {
        const orderRes = await axios.post(
          "http://127.0.0.1:8000/orders/create/",
          {
            items: cartItems.map((item) => ({
              id: item.id,
              name: item.name,
              area: item.area,
              type: item.type,
              monitoring_enabled: item.monitoring_enabled,
              is_active: item.is_active,
            })),
            email: "customer@example.com", // TODO: Replace with authenticated user email
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }
        );
        currentOrderId = orderRes.data.order_id;
        setLocalOrderId(currentOrderId);
      }

      // Step 2: Initiate payment session
      let res;
      if (method === "stripe") {
        res = await axios.post(
          "http://127.0.0.1:8000/checkout/stripe/",
          { items: cartItems, orderId: currentOrderId },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }
        );
        window.location.href = res.data.url;
      } else {
        res = await axios.post(
          "http://127.0.0.1:8000/checkout/paystack/",
          {
            items: cartItems,
            email: "customer@example.com",
            orderId: currentOrderId,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }
        );
        window.location.href = res.data.data.authorization_url;
      }
    } catch (err) {
      console.error("Payment initiation failed:", err);
      toast.error(`Failed to initiate ${method} payment. Please try again.`, {
        style: { background: "#1f2937", color: "#fff" },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Get AOI type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Rectangle":
        return <Square className="w-4 h-4 text-indigo-400" />;
      case "Polygon":
        return <MapPin className="w-4 h-4 text-indigo-400" />;
      case "MultiPolygon":
        return <MapPin className="w-4 h-4 text-indigo-400" />;
      default:
        return <MapPin className="w-4 h-4 text-indigo-400" />;
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-black to-gray-900 text-white flex items-center justify-center px-4">
        <Toaster position="top-right" />
        <motion.div
          className="text-center max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <MapPin className="w-16 h-16 mx-auto text-gray-500 mb-6" />
          <h2 className="text-2xl font-bold text-gray-200 mb-4">
            Your AOI Cart is Empty
          </h2>
          <p className="text-gray-400 mb-8">
            Add areas of interest from the map to proceed to checkout.
          </p>
          <Button
            onClick={() => navigate("/map")}
            className="bg-indigo-600 hover:bg-indigo-500 transition-colors duration-300"
          >
            Go to Map
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-black to-gray-900 text-white py-12 px-4 md:px-8">
      <Toaster position="top-right" />
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-center mb-12 text-gray-100">
          Secure Checkout
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Order Summary - Left */}
          <Card className="bg-gray-800/50 backdrop-blur-md border border-gray-700 shadow-xl rounded-xl overflow-hidden lg:col-span-3">
            <CardHeader className="bg-gray-900/50 p-6">
              <CardTitle className="text-xl font-semibold text-gray-100">
                Order Summary ({totalCount} AOIs)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 pb-4 border-b border-gray-700 last:border-b-0 last:pb-0"
                >
                  {getTypeIcon(item.type)}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-100">{item.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Area: {formatArea(item.area)} • Type: {item.type}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          item.is_active
                            ? "bg-green-900/50 text-green-300"
                            : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        <Activity className="w-3 h-3 inline mr-1" />
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          item.monitoring_enabled
                            ? "bg-blue-900/50 text-blue-300"
                            : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        <Eye className="w-3 h-3 inline mr-1" />
                        {item.monitoring_enabled
                          ? "Monitoring"
                          : "Not Monitoring"}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-400 mt-2">
                        {item.description}
                      </p>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <Separator className="bg-gray-700" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Discount (5%)</span>
                  <span className="text-green-400">
                    -${discount.toFixed(2)}
                  </span>
                </div>
                <Separator className="bg-gray-700 my-2" />
                <div className="flex justify-between font-bold text-gray-100">
                  <span>Total</span>
                  <span className="text-indigo-400">${total.toFixed(2)}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-4">
                Total Area: {formatArea(totalArea)} • Active AOIs:{" "}
                {cartItems.filter((item) => item.is_active).length} • Monitored
                AOIs:{" "}
                {cartItems.filter((item) => item.monitoring_enabled).length}
              </div>
            </CardContent>
          </Card>

          {/* Payment Options - Right */}
          <Card className="bg-gray-800/50 backdrop-blur-md border border-gray-700 shadow-xl rounded-xl overflow-hidden lg:h-[50%] lg:col-span-2">
            <CardHeader className="bg-gray-900/50 p-6">
              <CardTitle className="text-xl font-semibold text-gray-100">
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <p className="text-gray-400">
                Choose your preferred payment method to complete the purchase
                securely.
              </p>
              <Button
                onClick={() => handlePayment("stripe")}
                className="cursor-pointer w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-6 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing || payment.status === "loading"}
              >
                {isProcessing ? "Processing..." : "Pay with Stripe"}
              </Button>
              <Button
                onClick={() => handlePayment("paystack")}
                className="cursor-pointer w-full bg-green-600 hover:bg-green-500 text-white font-medium py-6 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing || payment.status === "loading"}
              >
                {isProcessing ? "Processing..." : "Pay with Paystack"}
              </Button>
              <Button
                onClick={() => navigate("/aoi-cart")}
                variant="outline"
                className="w-full border-gray-600 text-gray-600 cursor-pointer hover:bg-gray-700 hover:text-white transition-colors duration-300"
              >
                Back to Cart
              </Button>
              {payment.status === "loading" && (
                <motion.p
                  className="text-yellow-400 text-center animate-pulse flex items-center justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span className="animate-spin">🔄</span> Processing payment...
                </motion.p>
              )}
              <div className="text-xs text-gray-500 mt-4 text-center">
                All transactions are secure and encrypted. By proceeding, you
                agree to our terms.
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutPage;

// "use client";

// import { useSelector, useDispatch } from "react-redux";
// import type { RootState, AppDispatch } from "../redux/store";
// import { clearCart } from "../redux/features/cart/CartSlice";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import toast, { Toaster } from "react-hot-toast";
// import { motion } from "framer-motion";
// import axios from "axios";
// import { useEffect } from "react";
// import { usePaymentWebSocket } from "@/hooks/usePaymentWebSocket";

// interface CheckoutPageProps {
//   orderId: string; // comes from backend after checkout creation
// }

// const CheckoutPage = ({ orderId }: CheckoutPageProps) => {
//   const cartItems = useSelector((state: RootState) => state.cart.items);
//   const payment = useSelector((state: RootState) => state.payment);
//   const dispatch = useDispatch<AppDispatch>();
//   const navigate = useNavigate();

//   // 🔌 WebSocket live updates
//   usePaymentWebSocket(orderId);

//   // 🚀 Auto-navigate based on payment status
//   useEffect(() => {
//     if (payment.status === "success") {
//       navigate("/payment-success");
//     } else if (payment.status === "failed") {
//       navigate("/payment-failed");
//     }
//   }, [payment.status, navigate]);

//   const subtotal = cartItems.reduce(
//     (acc, item) => acc + item.price * item.quantity,
//     0
//   );
//   const discount = subtotal * 0.05;
//   const total = subtotal - discount;

//   const handlePayment = async (method: "stripe" | "paystack") => {
//     if (cartItems.length === 0) {
//       toast.error("Your cart is empty!");
//       return;
//     }

//     try {
//       // 🔹 Step 1: Create order in backend to get orderId
//       const orderRes = await axios.post(
//         "http://127.0.0.1:8000/orders/create/",
//         {
//           items: cartItems,
//           email: "customer@example.com", // replace with logged in user
//         }
//       );

//       const orderId = orderRes.data.order_id; // backend must return this

//       // 🔹 Step 2: Start checkout session with Stripe or Paystack
//       let res;
//       if (method === "stripe") {
//         res = await axios.post("http://127.0.0.1:8000/checkout/stripe/", {
//           items: cartItems,
//           orderId, // attach orderId so webhook knows which group to notify
//         });
//         window.location.href = res.data.url;
//       } else {
//         res = await axios.post("http://127.0.0.1:8000/checkout/paystack/", {
//           items: cartItems,
//           email: "customer@example.com",
//           orderId, // attach orderId in metadata
//         });
//         window.location.href = res.data.data.authorization_url;
//       }

//       // 🔹 Step 3: Clear cart (optional, since order is created)
//       dispatch(clearCart());
//     } catch (err) {
//       console.error(err);
//       toast.error(
//         `${method === "stripe" ? "Stripe" : "Paystack"} checkout failed!`
//       );
//     }
//   };

//   return (
//     <div className="w-full min-h-screen bg-black text-white px-4 md:px-8 py-10">
//       <Toaster position="top-right" />
//       <motion.h1
//         className="text-3xl md:text-4xl font-bold mb-10 text-center"
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//       >
//         💳 Checkout
//       </motion.h1>

//       <div className="max-w-2xl mx-auto">
//         <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
//           <h2 className="text-xl font-semibold mb-6 text-gray-200">
//             Order Summary
//           </h2>

//           <div className="space-y-3 text-gray-400">
//             {cartItems.map((item) => (
//               <div key={item.id} className="flex justify-between">
//                 <span>
//                   {item.name} × {item.quantity}
//                 </span>
//                 <span>${(item.price * item.quantity).toFixed(2)}</span>
//               </div>
//             ))}
//           </div>

//           <div className="flex justify-between mt-6 text-gray-400">
//             <span>Subtotal</span>
//             <span>${subtotal.toFixed(2)}</span>
//           </div>
//           <div className="flex justify-between text-gray-400">
//             <span>Discount (5%)</span>
//             <span>-${discount.toFixed(2)}</span>
//           </div>
//           <div className="flex justify-between font-bold text-lg mt-6 border-t border-gray-700 pt-4 text-gray-200">
//             <span>Total</span>
//             <span>${total.toFixed(2)}</span>
//           </div>

//           <Button
//             onClick={() => handlePayment("stripe")}
//             className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
//           >
//             Pay with Stripe
//           </Button>

//           <Button
//             onClick={() => handlePayment("paystack")}
//             className="w-full mt-4 bg-green-600 hover:bg-green-700 cursor-pointer"
//           >
//             Pay with Paystack
//           </Button>

//           <Button
//             onClick={() => navigate("/cart")}
//             className="w-full mt-4 bg-gray-700 hover:bg-gray-600 cursor-pointer"
//           >
//             Back to Cart
//           </Button>

//           {/* ✅ Live payment state */}
//           {payment.status === "loading" && (
//             <motion.p
//               className="mt-6 text-yellow-400 text-center animate-pulse"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//             >
//               🔄 Processing payment...
//             </motion.p>
//           )}
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default CheckoutPage;
