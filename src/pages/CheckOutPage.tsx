// Updated CheckoutPage.tsx - Add PayPal option
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
// import axios from "axios";
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
  const [localOrderId] = useState(initialOrderId);

  const {
    durationType = "months",
    durationValue = 1,
    totalCost = 0,
  } = location.state || {};

  usePaymentWebSocket(localOrderId || "");

  useEffect(() => {
    if (payment.status === "success") {
      dispatch(clearAoiCart());
      navigate("/payment-success");
    } else if (payment.status === "failed") {
      navigate("/payment-failed");
    }
  }, [payment.status, navigate, dispatch]);

  const handleStripePayment = () => {
    if (cartItems.length === 0) {
      toast.error("Your AOI cart is empty!", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "⚠️",
      });
      return;
    }

    if (durationValue < 1) {
      toast.error("Invalid duration selected!", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "⚠️",
      });
      return;
    }

    navigate("/pay-with-stripe", {
      state: {
        aoiItems: cartItems,
        totalArea,
        durationType,
        durationValue,
        totalCost,
      },
    });
  };

  const handlePaystackPayment = () => {
    if (cartItems.length === 0) {
      toast.error("Your AOI cart is empty!", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "⚠️",
      });
      return;
    }

    if (durationValue < 1) {
      toast.error("Invalid duration selected!", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "⚠️",
      });
      return;
    }

    navigate("/pay-with-paystack", {
      state: {
        aoiItems: cartItems,
        totalArea,
        durationType,
        durationValue,
        totalCost,
      },
    });
  };

  const handlePayPalPayment = () => {
    if (cartItems.length === 0) {
      toast.error("Your AOI cart is empty!", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "⚠️",
      });
      return;
    }

    if (durationValue < 1) {
      toast.error("Invalid duration selected!", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "⚠️",
      });
      return;
    }

    navigate("/pay-with-paypal", {
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
        return (
          <Square className="w-4 h-4 text-indigo-400" aria-hidden="true" />
        );
      case "Polygon":
      case "MultiPolygon":
        return (
          <MapPin className="w-4 h-4 text-indigo-400" aria-hidden="true" />
        );
      default:
        return (
          <MapPin className="w-4 h-4 text-indigo-400" aria-hidden="true" />
        );
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="w-full min-h-screen bg-black text-white flex items-center justify-center px-4">
        <Toaster position="top-right" />
        <motion.div
          className="text-center max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <MapPin
            className="w-24 h-24 mx-auto text-gray-500 mb-6"
            aria-hidden="true"
          />
          <h2 className="text-2xl font-bold text-gray-200 mb-4">
            Your AOI Cart is Empty
          </h2>
          <p className="text-gray-400 mb-8">
            Add areas of interest from the map to proceed to checkout.
          </p>
          <Button
            onClick={() => navigate("/map-page")}
            className="bg-indigo-600 hover:bg-indigo-700 transition-colors duration-300"
            aria-label="Navigate to map page"
          >
            Go to Map
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-black text-white py-12 px-4 md:px-8">
      <Toaster position="top-right" />
      <motion.div
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-300">
          🛒 Secure Checkout
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl lg:col-span-2">
            <CardHeader className="p-6">
              <CardTitle className="text-xl font-semibold text-gray-200">
                Order Summary ({totalCount} AOIs)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 pb-4 border-b border-zinc-800 last:border-b-0 last:pb-0"
                >
                  {getTypeIcon(item.type)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-200">{item.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Area: {formatArea(item.area)} • Type: {item.type}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-green-900/50 text-green-400">
                        <Activity
                          className="w-3 h-3 inline mr-1"
                          aria-hidden="true"
                        />
                        Active & Monitored
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/map?highlightAoi=${item.id}`)}
                        className="text-blue-400 hover:text-blue-300"
                        aria-label={`View ${item.name} on map`}
                      >
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-300 mt-2">
                        {item.description}
                      </p>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-zinc-700 rounded-full px-2 py-1 text-gray-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <Separator className="bg-zinc-800" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Monitoring Duration</span>
                  <span className="font-semibold text-blue-300">
                    {durationValue}{" "}
                    {durationValue === 1
                      ? durationType.replace(/s$/, "")
                      : durationType}
                  </span>
                </div>
                <Separator className="bg-zinc-800 my-2" />
                <div className="flex justify-between font-bold text-lg text-gray-200">
                  <span>Total</span>
                  <span className="text-indigo-300">
                    ${Number(totalCost.toFixed(2)).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-4">
                Total Area: {(totalArea / 1000000).toFixed(3)} km² • Active
                AOIs: {totalCount} • Monitored AOIs: {totalCount}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl sticky top-24 h-auto">
            <CardHeader className="p-6">
              <CardTitle className="text-xl font-semibold text-gray-200">
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <p className="text-gray-400">
                Choose your preferred payment method to complete the purchase
                securely.
              </p>
              <div className="space-y-4">
                <div className="border-t border-zinc-700 pt-4">
                  <Button
                    onClick={handleStripePayment}
                    className="w-full cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg"
                    disabled={
                      payment.status === "loading" ||
                      cartItems.length === 0 ||
                      durationValue < 1
                    }
                    aria-label="Pay with Stripe"
                  >
                    Pay with Stripe
                  </Button>
                </div>
                <Separator className="bg-zinc-700" />
                <div>
                  <Button
                    onClick={handlePaystackPayment}
                    className="w-full cursor-pointer bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-3 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg"
                    disabled={
                      payment.status === "loading" ||
                      cartItems.length === 0 ||
                      durationValue < 1
                    }
                    aria-label="Pay with Paystack"
                  >
                    Pay with Paystack
                  </Button>
                </div>
                <Separator className="bg-zinc-700" />
                <div>
                  <Button
                    onClick={handlePayPalPayment}
                    className="w-full cursor-pointer bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-3 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg"
                    disabled={
                      payment.status === "loading" ||
                      cartItems.length === 0 ||
                      durationValue < 1
                    }
                    aria-label="Pay with PayPal"
                  >
                    Pay with PayPal
                  </Button>
                </div>
              </div>
              <Button
                onClick={() => navigate("/cart")}
                variant="outline"
                className="w-full cursor-pointer bg-zinc-800 border-zinc-600 hover:bg-zinc-700 text-gray-200"
                aria-label="Back to cart"
              >
                Back to Cart
              </Button>
              {payment.status === "loading" && (
                <motion.p
                  className="text-yellow-300 text-center animate-pulse flex items-center justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="animate-spin">🔄</span> Processing payment...
                </motion.p>
              )}
              <div className="text-xs text-gray-400 mt-4 text-center">
                All transactions are secure and encrypted. By proceeding, you
                agree to our terms.
              </div>
              <div className="text-xs text-gray-400 mt-2 text-center">
                Based on $150.00 per km² per day
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutPage;
