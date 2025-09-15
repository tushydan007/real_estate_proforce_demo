"use client";

import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../redux/store";
import { clearAoiCart, formatArea } from "../redux/features/cart/AoiCartSlice";
import { useNavigate, useLocation } from "react-router-dom";
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
  orderId?: string;
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
  const location = useLocation();
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [isProcessingPaystack, setIsProcessingPaystack] = useState(false);
  const [localOrderId, setLocalOrderId] = useState(initialOrderId);

  const { durationType = "months", durationValue = 1 } = location.state || {};

  usePaymentWebSocket(localOrderId || "");

  useEffect(() => {
    if (payment.status === "success") {
      dispatch(clearAoiCart());
      navigate("/payment-success");
    } else if (payment.status === "failed") {
      navigate("/payment-failed");
    }
  }, [payment.status, navigate, dispatch]);

  const BASE_RATE_PER_KM2_PER_DAY = 0.01;

  const calculatePricing = () => {
    let days = 0;
    switch (durationType) {
      case "days":
        days = durationValue;
        break;
      case "months":
        days = durationValue * 30;
        break;
      case "years":
        days = durationValue * 365;
        break;
    }
    const subtotal = totalArea * BASE_RATE_PER_KM2_PER_DAY * days;
    const discountRate = 0.05;
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

    // Set the appropriate loading state
    if (method === "stripe") {
      setIsProcessingStripe(true);
    } else {
      setIsProcessingPaystack(true);
    }

    try {
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
              monitoring_enabled: true,
              is_active: true,
            })),
            email: "customer@example.com",
            duration: { type: durationType, value: durationValue },
            total_cost: total,
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

      let res;
      if (method === "stripe") {
        res = await axios.post(
          "http://127.0.0.1:8000/checkout/stripe/",
          { items: cartItems, orderId: currentOrderId, totalCost: total },
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
            totalCost: total,
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
      console.error(`Payment initiation failed for ${method}:`, err);
      toast.error(`Failed to initiate ${method} payment. Please try again.`, {
        style: { background: "#1f2937", color: "#fff" },
      });
    } finally {
      // Reset the appropriate loading state
      if (method === "stripe") {
        setIsProcessingStripe(false);
      } else {
        setIsProcessingPaystack(false);
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Rectangle":
        return <Square className="w-4 h-4 text-indigo-400" />;
      case "Polygon":
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
                      <span className="text-xs px-2 py-1 rounded-full bg-green-900/50 text-green-300">
                        <Activity className="w-3 h-3 inline mr-1" />
                        Active
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-900/50 text-blue-300">
                        <Eye className="w-3 h-3 inline mr-1" />
                        Monitoring
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
                  <span>${Number(subtotal.toFixed(2)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Discount (5%)</span>
                  <span className="text-green-400">
                    -${Number(discount.toFixed(2)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Monitoring Duration</span>
                  <span className="text-blue-400">
                    {durationValue} {durationType}
                  </span>
                </div>
                <Separator className="bg-gray-700 my-2" />
                <div className="flex justify-between font-bold text-gray-100">
                  <span>Total</span>
                  <span className="text-indigo-400">
                    ${Number(total.toFixed(2)).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-4">
                Total Area: {formatArea(totalArea)} • Active AOIs: {totalCount}{" "}
                • Monitored AOIs: {totalCount}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 backdrop-blur-md border border-gray-700 shadow-xl rounded-xl overflow-hidden lg:h-[540px] lg:col-span-2">
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
                disabled={isProcessingStripe || payment.status === "loading"}
              >
                {isProcessingStripe ? "Processing..." : "Pay with Stripe"}
              </Button>
              <Button
                onClick={() => handlePayment("paystack")}
                className="cursor-pointer w-full bg-green-600 hover:bg-green-500 text-white font-medium py-6 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessingPaystack || payment.status === "loading"}
              >
                {isProcessingPaystack ? "Processing..." : "Pay with Paystack"}
              </Button>
              <Button
                onClick={() => navigate("/cart")}
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
              <div className="text-xs text-gray-500 mt-2 text-center">
                Based on ${BASE_RATE_PER_KM2_PER_DAY.toFixed(2)} per km² per day
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutPage;
