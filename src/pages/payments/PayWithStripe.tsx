// Enhanced PayWithStripePage.tsx - Proper Stripe Checkout Form
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
import { loadStripe, type PaymentRequest } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
  PaymentRequestButtonElement,
} from "@stripe/react-stripe-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Calendar, Lock, Mail } from "lucide-react";

// Extend the Window interface to include ApplePaySession
declare global {
  interface Window {
    ApplePaySession?: unknown;
  }
}

const stripePromise = loadStripe("pk_test_YOUR_PUBLISHABLE_KEY_HERE");

import type { Appearance } from "@stripe/stripe-js";

const appearance: Appearance = {
  theme: "night",
  variables: {
    colorPrimary: "#6366f1",
    colorTextSecondary: "#1f2937",
    colorText: "#f9fafb",
    colorTextPlaceholder: "#9ca3af",
    colorBackground: "#111827",
    spacingUnit: "2px",
    borderRadius: "8px",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSizeBase: "16px",
  },
  rules: {
    ".Input": {
      border: "1px solid #374151",
      padding: "12px",
      backgroundColor: "#1f2937",
      color: "#f9fafb",
    },
    ".Input--invalid": {
      boxShadow: "0 1px 3px 0 #fc8181",
      borderColor: "#fc8181",
    },
    ".Input--focus": {
      boxShadow: "0 0 0 2px #6366f1",
      borderColor: "#6366f1",
    },
    ".Label": {
      color: "#f9fafb",
      fontSize: "14px",
      marginBottom: "4px",
    },
  },
};

const StripePaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    aoiItems,
    durationType = "months",
    durationValue = 1,
    totalCost = 0,
  } = location.state || {};
  const cartItems = useSelector((state: RootState) => state.aoiCart.items);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [localOrderId, setLocalOrderId] = useState<string | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(
    null
  );

  useEffect(() => {
    if (!aoiItems || aoiItems.length === 0) {
      toast.error("Invalid checkout data. Redirecting...", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "⚠️",
      });
      navigate("/checkout");
    }

    if (stripe && elements && window.ApplePaySession) {
      const pr = stripe.paymentRequest({
        country: "US",
        currency: "usd",
        total: {
          label: "AOI Monitoring Service",
          amount: Math.round(totalCost * 100),
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      pr.canMakePayment().then((result) => {
        if (result && result.applePay) {
          setPaymentRequest(pr);
        }
      });

      pr.on("paymentmethod", async (ev) => {
        setLoading(true);
        setError(null);

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
                email:
                  ev.paymentMethod.billing_details.email ||
                  "applepay@example.com",
                duration: { type: durationType, value: durationValue },
                total_cost: totalCost,
              },
              {
                headers: {
                  Authorization: `Bearer ${
                    localStorage.getItem("token") || ""
                  }`,
                  "Content-Type": "application/json",
                },
              }
            );
            currentOrderId = orderRes.data.order_id;
            setLocalOrderId(currentOrderId);
          }

          const {
            data: { client_secret },
          } = await axios.post(
            "http://127.0.0.1:8000/create-payment-intent/",
            {
              amount: Math.round(totalCost * 100),
              currency: "usd",
              order_id: currentOrderId,
              email: ev.paymentMethod.billing_details.email,
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                "Content-Type": "application/json",
              },
            }
          );

          const confirmResult = await stripe.confirmCardPayment(client_secret, {
            payment_method: ev.paymentMethod.id,
          });

          if (confirmResult.error) {
            ev.complete("fail");
            throw new Error(confirmResult.error.message || "Payment failed");
          } else {
            await axios.post(
              "http://127.0.0.1:8000/confirm-payment/",
              {
                order_id: currentOrderId,
                payment_intent: confirmResult.paymentIntent?.id,
              },
              {
                headers: {
                  Authorization: `Bearer ${
                    localStorage.getItem("token") || ""
                  }`,
                  "Content-Type": "application/json",
                },
              }
            );
            ev.complete("success");
            toast.success("Payment successful! Redirecting...");
            navigate("/payment-success");
          }
        } catch (err: unknown) {
          ev.complete("fail");
          console.error("Apple Pay error:", err);
          let errorMessage = "Apple Pay payment failed.";
          if (err instanceof Error) {
            errorMessage = err.message;
          }
          setError(errorMessage);
          toast.error(errorMessage, {
            style: { background: "#1f2937", color: "#fff" },
            icon: "❌",
          });
        } finally {
          setLoading(false);
        }
      });
    }
  }, [
    stripe,
    elements,
    totalCost,
    durationType,
    durationValue,
    cartItems,
    localOrderId,
    navigate,
    aoiItems,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !email || !cardholderName) {
      setError("Please complete all fields.");
      toast.error("Please complete all fields.", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "⚠️",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      toast.error("Invalid email address.", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "⚠️",
      });
      return;
    }

    setLoading(true);
    setError(null);

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

      const {
        data: { client_secret },
      } = await axios.post(
        "http://127.0.0.1:8000/create-payment-intent/",
        {
          amount: Math.round(totalCost * 100),
          currency: "usd",
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

      if (!client_secret) {
        throw new Error("Failed to create payment intent");
      }

      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) {
        throw new Error("Card element not found");
      }

      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            email,
            name: cardholderName,
          },
        },
      });

      if (result.error) {
        const errorMessage = result.error.message || "Payment failed";
        setError(errorMessage);
        toast.error(errorMessage, {
          style: { background: "#1f2937", color: "#fff" },
          icon: "❌",
        });
      } else if (result.paymentIntent?.status === "succeeded") {
        const confirmRes = await axios.post(
          "http://127.0.0.1:8000/confirm-payment/",
          {
            order_id: currentOrderId,
            payment_intent: result.paymentIntent.id,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (confirmRes.data.success) {
          toast.success("Payment successful! Redirecting...", {
            style: { background: "#1f2937", color: "#fff" },
            icon: "✅",
          });
          navigate("/payment-success");
        } else {
          throw new Error("Failed to confirm payment on server");
        }
      } else {
        throw new Error("Payment status unclear");
      }
    } catch (err: unknown) {
      console.error("Payment error:", err);
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 400) {
          errorMessage =
            err.response.data.error ||
            "Invalid request. Please check your details.";
        } else if (err.response?.status === 401) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (err.response?.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else {
          errorMessage = err.message || errorMessage;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast.error(errorMessage, {
        style: { background: "#1f2937", color: "#fff" },
        icon: "❌",
      });
    } finally {
      setLoading(false);
    }
  };

  const stripeElementOptions = {
    style: {
      base: {
        color: "#f9fafb",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#9ca3af",
        },
      },
      invalid: {
        color: "#fc8181",
        iconColor: "#fc8181",
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Apple Pay Button */}
      {paymentRequest && (
        <div className="pb-4 border-b border-zinc-700">
          <PaymentRequestButtonElement options={{ paymentRequest }} />
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-zinc-900 text-gray-400">
                Or pay with card
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Email Field */}
      <div>
        <Label
          htmlFor="email"
          className="text-gray-300 mb-2 flex items-center gap-2"
        >
          <Mail className="w-4 h-4" />
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="bg-zinc-800 border-zinc-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          required
        />
      </div>

      {/* Cardholder Name */}
      <div>
        <Label
          htmlFor="cardholder"
          className="text-gray-300 mb-2 flex items-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          Cardholder Name
        </Label>
        <Input
          id="cardholder"
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="John Doe"
          className="bg-zinc-800 border-zinc-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          required
        />
      </div>

      {/* Card Number */}
      <div>
        <Label className="text-gray-300 mb-2 flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Card Number
        </Label>
        <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <CardNumberElement options={stripeElementOptions} />
        </div>
      </div>

      {/* Expiry and CVC in a Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-300 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Expiry Date
          </Label>
          <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <CardExpiryElement options={stripeElementOptions} />
          </div>
        </div>
        <div>
          <Label className="text-gray-300 mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            CVC
          </Label>
          <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <CardCvcElement options={stripeElementOptions} />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || loading || !email || !cardholderName}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed h-12 text-base font-semibold"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Processing...
          </span>
        ) : (
          `Pay $${totalCost.toFixed(2)}`
        )}
      </Button>

      <Button
        type="button"
        onClick={() => navigate("/checkout")}
        variant="outline"
        className="w-full bg-zinc-800 border-zinc-600 hover:bg-zinc-700 text-gray-200 cursor-pointer"
        disabled={loading}
      >
        Back to Checkout
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Your payment is secured by Stripe. We never store your card details.
      </p>
    </form>
  );
};

const PayWithStripePage = () => {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white py-12 px-4 md:px-8">
      <Toaster position="top-right" />
      <motion.div
        className="max-w-lg mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
          <CardHeader className="p-6 border-b border-zinc-800">
            <CardTitle className="text-2xl font-bold text-gray-100 text-center">
              Secure Payment
            </CardTitle>
            <p className="text-sm text-gray-400 text-center mt-2">
              Complete your order securely with Stripe
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <Elements
              stripe={stripePromise}
              options={{
                appearance,
                clientSecret: undefined,
              }}
            >
              <StripePaymentForm />
            </Elements>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PayWithStripePage;
