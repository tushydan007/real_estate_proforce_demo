// New PayWithPayPalPage.tsx - Install: npm install @paypal/react-paypal-js
"use client";

import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { useEffect, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OnApproveData } from "@paypal/paypal-js";

const PayWithPayPalPage = () => {
  const cartItems = useSelector((state: RootState) => state.aoiCart.items);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    aoiItems,
    durationType = "months",
    durationValue = 1,
    totalCost = 0,
  } = location.state || {};
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [localOrderId, setLocalOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!aoiItems || aoiItems.length === 0) {
      toast.error("Invalid checkout data. Redirecting...", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "⚠️",
      });
      navigate("/checkout");
    }
  }, [aoiItems, navigate]);

  const createOrder = async () => {
    if (!email) {
      toast.error("Please enter your email address.", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "⚠️",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email address.", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "⚠️",
      });
      return;
    }

    setLoading(true);

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
            email,
            duration: { type: durationType, value: durationValue },
            total_cost: totalCost,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!orderRes.data.order_id) {
          throw new Error("Failed to create order");
        }
        currentOrderId = orderRes.data.order_id;
        setLocalOrderId(currentOrderId);
      }

      // Create PayPal order on backend (assume endpoint returns order ID)
      const paypalRes = await axios.post(
        "http://127.0.0.1:8000/create-paypal-order/",
        {
          amount: totalCost,
          currency: "USD",
          order_id: currentOrderId,
          email,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            "Content-Type": "application/json",
          },
        }
      );

      return paypalRes.data.id; // PayPal order ID
    } catch (err: unknown) {
      console.error("Order creation error:", err);
      let errorMessage = "Failed to create PayPal order.";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.error || err.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.error(errorMessage, {
        style: { background: "#1f2937", color: "#fff" },
        icon: "❌",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const onApprove = async (data: OnApproveData) => {
    setLoading(true);
    try {
      // Capture the order on backend
      const captureRes = await axios.post(
        "http://127.0.0.1:8000/capture-paypal-order/",
        {
          order_id: data.orderID,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (captureRes.data.success) {
        toast.success("Payment successful! Redirecting...", {
          style: { background: "#1f2937", color: "#fff" },
          icon: "✅",
        });
        navigate("/payment-success");
      } else {
        throw new Error("Failed to capture payment");
      }
    } catch (err: unknown) {
      console.error("Capture error:", err);
      let errorMessage = "Failed to process payment.";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.error || err.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.error(errorMessage, {
        style: { background: "#1f2937", color: "#fff" },
        icon: "❌",
      });
    } finally {
      setLoading(false);
    }
  };

  const onError = (err: unknown) => {
    console.error("PayPal error:", err);
    toast.error("Payment error occurred. Please try again.", {
      style: { background: "#1f2937", color: "#fff" },
      icon: "❌",
    });
  };

  return (
    <div className="w-full min-h-screen bg-black text-white py-12 px-4 md:px-8">
      <Toaster position="top-right" />
      <motion.div
        className="max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl">
          <CardHeader className="p-6">
            <CardTitle className="text-xl font-semibold text-gray-200 text-center">
              Pay with PayPal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-300 mb-2">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="bg-zinc-800 border-zinc-600 text-white"
                required
                disabled={loading}
              />
            </div>
            <PayPalScriptProvider
              options={{
                "client-id": "YOUR_PAYPAL_CLIENT_ID", // Replace with your PayPal client ID
                clientId: "YOUR_PAYPAL_CLIENT_ID", // Add this line for type safety
                currency: "USD",
                intent: "capture",
              }}
            >
              <PayPalButtons
                createOrder={createOrder}
                onApprove={onApprove}
                onError={onError}
                style={{
                  layout: "vertical",
                  color: "gold",
                  shape: "rect",
                  label: "paypal",
                }}
              />
            </PayPalScriptProvider>
            <Button
              onClick={() => navigate("/checkout")}
              variant="outline"
              className="w-full bg-zinc-800 border-zinc-600 hover:bg-zinc-700 text-gray-200"
              disabled={loading}
            >
              Back to Checkout
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PayWithPayPalPage;
