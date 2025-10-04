"use client";

import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import axios, { AxiosError } from "axios";
import { useEffect, useState, useCallback, useMemo } from "react";
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
import {
  CreditCard,
  Calendar,
  Lock,
  Mail,
  Shield,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

// ========== Type Definitions ==========
interface CartItem {
  id: string;
  name: string;
  area: number;
  type: string;
  monitoring_enabled?: boolean;
  is_active?: boolean;
}

interface LocationState {
  aoiItems?: CartItem[];
  durationType?: string;
  durationValue?: number;
  totalCost?: number;
}

interface PaymentIntentResponse {
  client_secret: string;
}

interface OrderResponse {
  order_id: string;
  success?: boolean;
}

interface ConfirmPaymentResponse {
  success: boolean;
  message?: string;
}

// ========== Constants ==========
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const STRIPE_PUBLISHABLE_KEY =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  "pk_test_YOUR_PUBLISHABLE_KEY_HERE";

// Validate environment variables
const isStripeConfigured = STRIPE_PUBLISHABLE_KEY.startsWith("pk_");

if (!isStripeConfigured) {
  console.error("Invalid Stripe publishable key");
}

// Stripe promise - initialized once
const stripePromise = isStripeConfigured
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;

// ========== Stripe Configuration ==========
const appearance = {
  theme: "night" as const,
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

// ========== Utility Functions ==========
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const createAxiosConfig = (token?: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

const handleApiError = (error: unknown, defaultMessage: string): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      error?: string;
      message?: string;
      detail?: string;
    }>;

    if (axiosError.response?.status === 400) {
      return (
        axiosError.response.data?.error ||
        axiosError.response.data?.detail ||
        "Invalid request. Please check your details."
      );
    }
    if (axiosError.response?.status === 401) {
      return "Authentication failed. Please log in again.";
    }
    if (axiosError.response?.status === 403) {
      return "You don't have permission to perform this action.";
    }
    if (axiosError.response?.status === 404) {
      return "Resource not found. Please try again.";
    }
    if (axiosError.response?.status === 429) {
      return "Too many requests. Please wait a moment and try again.";
    }
    if (axiosError.response?.status === 500) {
      return "Server error. Please try again later.";
    }

    return (
      axiosError.response?.data?.error ||
      axiosError.response?.data?.detail ||
      axiosError.message ||
      defaultMessage
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return defaultMessage;
};

const showToast = {
  error: (message: string) => {
    toast.error(message, {
      style: { background: "#1f2937", color: "#fff" },
      duration: 4000,
    });
  },
  success: (message: string) => {
    toast.success(message, {
      style: { background: "#1f2937", color: "#fff" },
      duration: 3000,
    });
  },
  warning: (message: string) => {
    toast(message, {
      style: { background: "#1f2937", color: "#fff" },
      icon: "⚠️",
      duration: 4000,
    });
  },
};

// ========== Main Payment Form Component ==========
const StripePaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    aoiItems = [],
    durationType = "months",
    durationValue = 1,
    totalCost = 0,
  } = (location.state as LocationState) || {};

  const cartItems = useSelector((state: RootState) => state.aoiCart.items);
  const { token, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [localOrderId, setLocalOrderId] = useState<string | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(
    null
  );
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Validation
  const isFormValid = useMemo(() => {
    return email && cardholderName && validateEmail(email) && !loading;
  }, [email, cardholderName, loading]);

  // Early redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) {
      showToast.error("Please log in to continue.");
      setTimeout(() => navigate("/login", { replace: true }), 1000);
    }
  }, [isAuthenticated, token, navigate]);

  // ========== API Functions ==========
  const createOrder = useCallback(
    async (emailAddress: string): Promise<string> => {
      try {
        if (!token) {
          throw new Error("Please log in to continue");
        }

        const response = await axios.post<OrderResponse>(
          `${API_BASE_URL}/orders/create/`,
          {
            items: cartItems.map((item) => ({
              id: item.id,
              name: item.name,
              area: item.area,
              type: item.type,
              monitoring_enabled: true,
              is_active: true,
            })),
            email: emailAddress,
            duration: { type: durationType, value: durationValue },
            total_cost: totalCost,
          },
          {
            ...createAxiosConfig(token),
            timeout: 15000,
          }
        );

        if (!response.data?.order_id) {
          throw new Error("Invalid order response from server");
        }

        return response.data.order_id;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          showToast.error("Session expired. Please log in again.");
          localStorage.removeItem("authToken");
          setTimeout(() => navigate("/login", { replace: true }), 1000);
        }
        throw new Error(handleApiError(error, "Failed to create order"));
      }
    },
    [cartItems, durationType, durationValue, totalCost, token, navigate]
  );

  const createPaymentIntent = useCallback(
    async (orderId: string, emailAddress: string): Promise<string> => {
      try {
        if (!token) {
          throw new Error("Authentication required");
        }

        const response = await axios.post<PaymentIntentResponse>(
          `${API_BASE_URL}/create-payment-intent/`,
          {
            amount: Math.round(totalCost * 100),
            currency: "usd",
            order_id: orderId,
            email: emailAddress,
          },
          {
            ...createAxiosConfig(token),
            timeout: 15000,
          }
        );

        if (!response.data?.client_secret) {
          throw new Error("Invalid payment intent response from server");
        }

        return response.data.client_secret;
      } catch (error) {
        throw new Error(
          handleApiError(error, "Failed to create payment intent")
        );
      }
    },
    [totalCost, token]
  );

  const confirmPayment = useCallback(
    async (orderId: string, paymentIntentId: string): Promise<boolean> => {
      try {
        if (!token) {
          throw new Error("Authentication required");
        }

        const response = await axios.post<ConfirmPaymentResponse>(
          `${API_BASE_URL}/confirm-payment/`,
          {
            order_id: orderId,
            payment_intent: paymentIntentId,
          },
          {
            ...createAxiosConfig(token),
            timeout: 15000,
          }
        );
        navigate("/payment-success");

        return response.data?.success === true;
      } catch (error) {
        console.error("Payment confirmation error:", error);
        return false;
      }
    },
    [token, navigate]
  );

  // ========== Handle Apple Pay / Payment Request Button ==========
  useEffect(() => {
    if (!aoiItems || aoiItems.length === 0) {
      showToast.warning("Invalid checkout data. Redirecting...");
      setTimeout(() => navigate("/checkout"), 2000);
      return;
    }

    if (!stripe || !elements) return;

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

    pr.canMakePayment()
      .then((result) => {
        if (result?.applePay) {
          setPaymentRequest(pr);
        }
      })
      .catch((err) => {
        console.error("Payment Request error:", err);
      });

    pr.on("paymentmethod", async (ev) => {
      if (isProcessingPayment) {
        ev.complete("fail");
        return;
      }

      setIsProcessingPayment(true);
      setLoading(true);
      setError(null);

      try {
        const emailAddress =
          ev.paymentMethod.billing_details.email || "applepay@example.com";

        let currentOrderId = localOrderId;
        if (!currentOrderId) {
          currentOrderId = await createOrder(emailAddress);
          setLocalOrderId(currentOrderId);
        }

        const clientSecret = await createPaymentIntent(
          currentOrderId,
          emailAddress
        );

        const confirmResult = await stripe.confirmCardPayment(clientSecret, {
          payment_method: ev.paymentMethod.id,
        });

        if (confirmResult.error) {
          throw new Error(confirmResult.error.message || "Payment failed");
        }

        if (confirmResult.paymentIntent?.status !== "succeeded") {
          throw new Error("Payment was not successful");
        }

        const confirmed = await confirmPayment(
          currentOrderId,
          confirmResult.paymentIntent.id
        );

        ev.complete("success");
        showToast.success("Payment successful! Redirecting...");

        setTimeout(() => {
          navigate("/payment-success", {
            replace: true,
            state: {
              orderId: currentOrderId,
              reference: confirmResult.paymentIntent.id,
              verified: confirmed,
              provider: "stripe",
              paymentMethod: "apple_pay",
              amount: totalCost,
              message: confirmed
                ? "Your payment has been verified successfully."
                : "Payment received. Verification in progress.",
            },
          });
        }, 1500);
      } catch (err) {
        ev.complete("fail");
        console.error("Apple Pay error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Apple Pay payment failed";
        setError(errorMessage);
        showToast.error(errorMessage);
      } finally {
        setLoading(false);
        setIsProcessingPayment(false);
      }
    });

    return () => {
      pr.off("paymentmethod");
    };
  }, [
    stripe,
    elements,
    totalCost,
    cartItems,
    localOrderId,
    navigate,
    aoiItems,
    createOrder,
    createPaymentIntent,
    confirmPayment,
    isProcessingPayment,
  ]);

  // ========== Handle Card Payment Submit ==========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      showToast.error("Payment system not ready. Please refresh the page.");
      return;
    }

    if (!email || !cardholderName) {
      setError("Please complete all required fields.");
      showToast.warning("Please complete all required fields.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      showToast.warning("Please enter a valid email address.");
      return;
    }

    if (isProcessingPayment) {
      showToast.warning("Payment is already being processed.");
      return;
    }

    setIsProcessingPayment(true);
    setLoading(true);
    setError(null);

    try {
      let currentOrderId = localOrderId;
      if (!currentOrderId) {
        currentOrderId = await createOrder(email);
        setLocalOrderId(currentOrderId);
      }

      const clientSecret = await createPaymentIntent(currentOrderId, email);

      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) {
        throw new Error("Card information is incomplete");
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            email,
            name: cardholderName,
          },
        },
      });

      if (result.error) {
        throw new Error(result.error.message || "Payment failed");
      }

      if (result.paymentIntent?.status !== "succeeded") {
        throw new Error("Payment was not successful. Please try again.");
      }

      const confirmed = await confirmPayment(
        currentOrderId,
        result.paymentIntent.id
      );

      showToast.success("Payment successful! Redirecting...");

      setTimeout(() => {
        navigate("/payment-success", {
          replace: true,
          state: {
            orderId: currentOrderId,
            reference: result.paymentIntent.id,
            verified: confirmed,
            provider: "stripe",
            paymentMethod: "card",
            amount: totalCost,
            message: confirmed
              ? "Your payment has been verified successfully."
              : "Payment received. Verification in progress.",
          },
        });
      }, 1500);
    } catch (err) {
      console.error("Payment error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
      setIsProcessingPayment(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {paymentRequest && (
        <div className="pb-4 border-b border-zinc-700">
          <PaymentRequestButtonElement
            options={{
              paymentRequest,
              style: {
                paymentRequestButton: {
                  theme: "dark",
                  height: "48px",
                  type: "default",
                },
              },
            }}
          />
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-zinc-900 text-gray-400">
                Or pay with card
              </span>
            </div>
          </div>
        </div>
      )}

      <div>
        <Label
          htmlFor="email"
          className="text-gray-300 mb-2 flex items-center gap-2"
        >
          <Mail className="w-4 h-4" />
          Email Address <span className="text-red-400">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error && validateEmail(e.target.value)) {
              setError(null);
            }
          }}
          placeholder="your@email.com"
          className="bg-zinc-800 border-zinc-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          required
          disabled={loading}
          autoComplete="email"
        />
      </div>

      <div>
        <Label
          htmlFor="cardholder"
          className="text-gray-300 mb-2 flex items-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          Cardholder Name <span className="text-red-400">*</span>
        </Label>
        <Input
          id="cardholder"
          type="text"
          value={cardholderName}
          onChange={(e) => {
            setCardholderName(e.target.value);
            if (error) setError(null);
          }}
          placeholder="John Doe"
          className="bg-zinc-800 border-zinc-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          required
          disabled={loading}
          autoComplete="cc-name"
        />
      </div>

      <div>
        <Label className="text-gray-300 mb-2 flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Card Number <span className="text-red-400">*</span>
        </Label>
        <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <CardNumberElement
            options={{
              ...stripeElementOptions,
              disabled: loading,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-300 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Expiry Date <span className="text-red-400">*</span>
          </Label>
          <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <CardExpiryElement
              options={{
                ...stripeElementOptions,
                disabled: loading,
              }}
            />
          </div>
        </div>
        <div>
          <Label className="text-gray-300 mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            CVC <span className="text-red-400">*</span>
          </Label>
          <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <CardCvcElement
              options={{
                ...stripeElementOptions,
                disabled: loading,
              }}
            />
          </div>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/20 border border-red-800 rounded-lg p-3"
        >
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}

      <Button
        type="submit"
        disabled={!stripe || !isFormValid || isProcessingPayment}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed h-12 text-base font-semibold transition-all"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing Payment...
          </span>
        ) : (
          `Pay ${totalCost.toFixed(2)}`
        )}
      </Button>

      {/* <Button
        type="button"
        onClick={() => navigate("/checkout")}
        variant="outline"
        className="w-full bg-zinc-800 border-zinc-600 hover:bg-zinc-700 text-gray-200"
        disabled={loading}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Checkout
      </Button> */}

      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <Shield className="w-4 h-4" />
        <p>
          Your payment is secured by Stripe. We never store your card details.
        </p>
      </div>
    </form>
  );
};

// ========== Main Page Component ==========
const PayWithStripePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useSelector(
    (state: RootState) => state.auth
  );

  // Early auth check and redirect
  useEffect(() => {
    if (authLoading) return; // Wait for auth init

    if (!isAuthenticated) {
      showToast.error("Please log in to continue.");
      setTimeout(() => navigate("/login", { replace: true }), 1000);
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (!isStripeConfigured) {
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
              <CardTitle className="text-2xl font-bold text-red-400 text-center">
                Configuration Error
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-400 font-semibold mb-2">
                    Stripe is not properly configured
                  </p>
                  <p className="text-red-300 text-sm">
                    The payment system is not set up correctly. Please contact
                    support or try another payment method.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/checkout")}
                className="w-full mt-6 bg-zinc-800 hover:bg-zinc-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Checkout
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white py-12 px-4 md:px-8 flex items-center justify-center">
        <Toaster position="top-right" />
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading authentication...</p>
        </div>
      </div>
    );
  }

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
            <Elements stripe={stripePromise} options={{ appearance }}>
              <StripePaymentForm />
            </Elements>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PayWithStripePage;

// "use client";

// import { useSelector } from "react-redux";
// import type { RootState } from "@/redux/store";
// import { useNavigate, useLocation } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { motion } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";
// import axios, { AxiosError } from "axios";
// import { useEffect, useState, useCallback, useMemo } from "react";
// import { loadStripe, type PaymentRequest } from "@stripe/stripe-js";
// import {
//   Elements,
//   CardNumberElement,
//   CardExpiryElement,
//   CardCvcElement,
//   useStripe,
//   useElements,
//   PaymentRequestButtonElement,
// } from "@stripe/react-stripe-js";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   CreditCard,
//   Calendar,
//   Lock,
//   Mail,
//   Shield,
//   ArrowLeft,
//   AlertCircle,
// } from "lucide-react";

// // ========== Type Definitions ==========
// interface CartItem {
//   id: string;
//   name: string;
//   area: number;
//   type: string;
//   monitoring_enabled?: boolean;
//   is_active?: boolean;
// }

// interface LocationState {
//   aoiItems?: CartItem[];
//   durationType?: string;
//   durationValue?: number;
//   totalCost?: number;
// }

// interface PaymentIntentResponse {
//   client_secret: string;
// }

// interface OrderResponse {
//   order_id: string;
//   success?: boolean;
// }

// interface ConfirmPaymentResponse {
//   success: boolean;
//   message?: string;
// }

// // ========== Constants ==========
// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
// const STRIPE_PUBLISHABLE_KEY =
//   import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
//   "pk_test_YOUR_PUBLISHABLE_KEY_HERE";

// // Validate environment variables
// const isStripeConfigured = STRIPE_PUBLISHABLE_KEY.startsWith("pk_");

// if (!isStripeConfigured) {
//   console.error("Invalid Stripe publishable key");
// }

// // Stripe promise - initialized once
// const stripePromise = isStripeConfigured
//   ? loadStripe(STRIPE_PUBLISHABLE_KEY)
//   : null;

// // ========== Stripe Configuration ==========
// const appearance = {
//   theme: "night" as const,
//   variables: {
//     colorPrimary: "#6366f1",
//     colorTextSecondary: "#1f2937",
//     colorText: "#f9fafb",
//     colorTextPlaceholder: "#9ca3af",
//     colorBackground: "#111827",
//     spacingUnit: "2px",
//     borderRadius: "8px",
//     fontFamily:
//       'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
//     fontSizeBase: "16px",
//   },
//   rules: {
//     ".Input": {
//       border: "1px solid #374151",
//       padding: "12px",
//       backgroundColor: "#1f2937",
//       color: "#f9fafb",
//     },
//     ".Input--invalid": {
//       boxShadow: "0 1px 3px 0 #fc8181",
//       borderColor: "#fc8181",
//     },
//     ".Input--focus": {
//       boxShadow: "0 0 0 2px #6366f1",
//       borderColor: "#6366f1",
//     },
//     ".Label": {
//       color: "#f9fafb",
//       fontSize: "14px",
//       marginBottom: "4px",
//     },
//   },
// };

// const stripeElementOptions = {
//   style: {
//     base: {
//       color: "#f9fafb",
//       fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
//       fontSmoothing: "antialiased",
//       fontSize: "16px",
//       "::placeholder": {
//         color: "#9ca3af",
//       },
//     },
//     invalid: {
//       color: "#fc8181",
//       iconColor: "#fc8181",
//     },
//   },
// };

// // ========== Utility Functions ==========
// const getAuthToken = (): string => {
//   return localStorage.getItem("token") || "";
// };

// const validateEmail = (email: string): boolean => {
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   return emailRegex.test(email);
// };

// const createAxiosConfig = (token?: string) => ({
//   headers: {
//     Authorization: `Bearer ${token || getAuthToken()}`,
//     "Content-Type": "application/json",
//   },
// });

// const handleApiError = (error: unknown, defaultMessage: string): string => {
//   if (axios.isAxiosError(error)) {
//     const axiosError = error as AxiosError<{
//       error?: string;
//       message?: string;
//       detail?: string;
//     }>;

//     if (axiosError.response?.status === 400) {
//       return (
//         axiosError.response.data?.error ||
//         axiosError.response.data?.detail ||
//         "Invalid request. Please check your details."
//       );
//     }
//     if (axiosError.response?.status === 401) {
//       return "Authentication failed. Please log in again.";
//     }
//     if (axiosError.response?.status === 403) {
//       return "You don't have permission to perform this action.";
//     }
//     if (axiosError.response?.status === 404) {
//       return "Resource not found. Please try again.";
//     }
//     if (axiosError.response?.status === 429) {
//       return "Too many requests. Please wait a moment and try again.";
//     }
//     if (axiosError.response?.status === 500) {
//       return "Server error. Please try again later.";
//     }

//     return (
//       axiosError.response?.data?.error ||
//       axiosError.response?.data?.detail ||
//       axiosError.message ||
//       defaultMessage
//     );
//   }

//   if (error instanceof Error) {
//     return error.message;
//   }

//   return defaultMessage;
// };

// const showToast = {
//   error: (message: string) => {
//     toast.error(message, {
//       style: { background: "#1f2937", color: "#fff" },
//       duration: 4000,
//     });
//   },
//   success: (message: string) => {
//     toast.success(message, {
//       style: { background: "#1f2937", color: "#fff" },
//       duration: 3000,
//     });
//   },
//   warning: (message: string) => {
//     toast(message, {
//       style: { background: "#1f2937", color: "#fff" },
//       icon: "⚠️",
//       duration: 4000,
//     });
//   },
// };

// // ========== Main Payment Form Component ==========
// const StripePaymentForm = () => {
//   const stripe = useStripe();
//   const elements = useElements();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const {
//     aoiItems = [],
//     durationType = "months",
//     durationValue = 1,
//     totalCost = 0,
//   } = (location.state as LocationState) || {};

//   const cartItems = useSelector((state: RootState) => state.aoiCart.items);

//   // State management
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [email, setEmail] = useState("");
//   const [cardholderName, setCardholderName] = useState("");
//   const [localOrderId, setLocalOrderId] = useState<string | null>(null);
//   const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(
//     null
//   );
//   const [isProcessingPayment, setIsProcessingPayment] = useState(false);

//   // Validation
//   const isFormValid = useMemo(() => {
//     return email && cardholderName && validateEmail(email) && !loading;
//   }, [email, cardholderName, loading]);

//   // ========== API Functions ==========
//   const createOrder = useCallback(
//     async (emailAddress: string): Promise<string> => {
//       try {
//         const token = getAuthToken();
//         if (!token) {
//           throw new Error("Please log in to continue");
//         }

//         const response = await axios.post<OrderResponse>(
//           `${API_BASE_URL}/orders/create/`,
//           {
//             items: cartItems.map((item) => ({
//               id: item.id,
//               name: item.name,
//               area: item.area,
//               type: item.type,
//               monitoring_enabled: true,
//               is_active: true,
//             })),
//             email: emailAddress,
//             duration: { type: durationType, value: durationValue },
//             total_cost: totalCost,
//           },
//           {
//             ...createAxiosConfig(token),
//             timeout: 15000,
//           }
//         );

//         if (!response.data?.order_id) {
//           throw new Error("Invalid order response from server");
//         }

//         return response.data.order_id;
//       } catch (error) {
//         if (axios.isAxiosError(error) && error.response?.status === 401) {
//           showToast.error("Session expired. Please log in again.");
//           setTimeout(() => navigate("/login", { replace: true }), 2000);
//         }
//         throw new Error(handleApiError(error, "Failed to create order"));
//       }
//     },
//     [cartItems, durationType, durationValue, totalCost, navigate]
//   );

//   const createPaymentIntent = useCallback(
//     async (orderId: string, emailAddress: string): Promise<string> => {
//       try {
//         const response = await axios.post<PaymentIntentResponse>(
//           `${API_BASE_URL}/create-payment-intent/`,
//           {
//             amount: Math.round(totalCost * 100),
//             currency: "usd",
//             order_id: orderId,
//             email: emailAddress,
//           },
//           {
//             ...createAxiosConfig(),
//             timeout: 15000,
//           }
//         );

//         if (!response.data?.client_secret) {
//           throw new Error("Invalid payment intent response from server");
//         }

//         return response.data.client_secret;
//       } catch (error) {
//         throw new Error(
//           handleApiError(error, "Failed to create payment intent")
//         );
//       }
//     },
//     [totalCost]
//   );

//   const confirmPayment = useCallback(
//     async (orderId: string, paymentIntentId: string): Promise<boolean> => {
//       try {
//         const response = await axios.post<ConfirmPaymentResponse>(
//           `${API_BASE_URL}/confirm-payment/`,
//           {
//             order_id: orderId,
//             payment_intent: paymentIntentId,
//           },
//           {
//             ...createAxiosConfig(),
//             timeout: 15000,
//           }
//         );
//         navigate("/payment-success");

//         return response.data?.success === true;
//       } catch (error) {
//         console.error("Payment confirmation error:", error);
//         return false;
//       }
//     },
//     [navigate]
//   );

//   // ========== Handle Apple Pay / Payment Request Button ==========
//   useEffect(() => {
//     if (!aoiItems || aoiItems.length === 0) {
//       showToast.warning("Invalid checkout data. Redirecting...");
//       setTimeout(() => navigate("/checkout"), 2000);
//       return;
//     }

//     if (!stripe || !elements) return;

//     const pr = stripe.paymentRequest({
//       country: "US",
//       currency: "usd",
//       total: {
//         label: "AOI Monitoring Service",
//         amount: Math.round(totalCost * 100),
//       },
//       requestPayerName: true,
//       requestPayerEmail: true,
//     });

//     pr.canMakePayment()
//       .then((result) => {
//         if (result?.applePay) {
//           setPaymentRequest(pr);
//         }
//       })
//       .catch((err) => {
//         console.error("Payment Request error:", err);
//       });

//     pr.on("paymentmethod", async (ev) => {
//       if (isProcessingPayment) {
//         ev.complete("fail");
//         return;
//       }

//       setIsProcessingPayment(true);
//       setLoading(true);
//       setError(null);

//       try {
//         const emailAddress =
//           ev.paymentMethod.billing_details.email || "applepay@example.com";

//         let currentOrderId = localOrderId;
//         if (!currentOrderId) {
//           currentOrderId = await createOrder(emailAddress);
//           setLocalOrderId(currentOrderId);
//         }

//         const clientSecret = await createPaymentIntent(
//           currentOrderId,
//           emailAddress
//         );

//         const confirmResult = await stripe.confirmCardPayment(clientSecret, {
//           payment_method: ev.paymentMethod.id,
//         });

//         if (confirmResult.error) {
//           throw new Error(confirmResult.error.message || "Payment failed");
//         }

//         if (confirmResult.paymentIntent?.status !== "succeeded") {
//           throw new Error("Payment was not successful");
//         }

//         const confirmed = await confirmPayment(
//           currentOrderId,
//           confirmResult.paymentIntent.id
//         );

//         ev.complete("success");
//         showToast.success("Payment successful! Redirecting...");

//         setTimeout(() => {
//           navigate("/payment-success", {
//             replace: true,
//             state: {
//               orderId: currentOrderId,
//               reference: confirmResult.paymentIntent.id,
//               verified: confirmed,
//               provider: "stripe",
//               paymentMethod: "apple_pay",
//               amount: totalCost,
//               message: confirmed
//                 ? "Your payment has been verified successfully."
//                 : "Payment received. Verification in progress.",
//             },
//           });
//         }, 1500);
//       } catch (err) {
//         ev.complete("fail");
//         console.error("Apple Pay error:", err);
//         const errorMessage =
//           err instanceof Error ? err.message : "Apple Pay payment failed";
//         setError(errorMessage);
//         showToast.error(errorMessage);
//       } finally {
//         setLoading(false);
//         setIsProcessingPayment(false);
//       }
//     });

//     return () => {
//       pr.off("paymentmethod");
//     };
//   }, [
//     stripe,
//     elements,
//     totalCost,
//     cartItems,
//     localOrderId,
//     navigate,
//     aoiItems,
//     createOrder,
//     createPaymentIntent,
//     confirmPayment,
//     isProcessingPayment,
//   ]);

//   // ========== Handle Card Payment Submit ==========
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!stripe || !elements) {
//       showToast.error("Payment system not ready. Please refresh the page.");
//       return;
//     }

//     if (!email || !cardholderName) {
//       setError("Please complete all required fields.");
//       showToast.warning("Please complete all required fields.");
//       return;
//     }

//     if (!validateEmail(email)) {
//       setError("Please enter a valid email address.");
//       showToast.warning("Please enter a valid email address.");
//       return;
//     }

//     if (isProcessingPayment) {
//       showToast.warning("Payment is already being processed.");
//       return;
//     }

//     setIsProcessingPayment(true);
//     setLoading(true);
//     setError(null);

//     try {
//       let currentOrderId = localOrderId;
//       if (!currentOrderId) {
//         currentOrderId = await createOrder(email);
//         setLocalOrderId(currentOrderId);
//       }

//       const clientSecret = await createPaymentIntent(currentOrderId, email);

//       const cardNumberElement = elements.getElement(CardNumberElement);
//       if (!cardNumberElement) {
//         throw new Error("Card information is incomplete");
//       }

//       const result = await stripe.confirmCardPayment(clientSecret, {
//         payment_method: {
//           card: cardNumberElement,
//           billing_details: {
//             email,
//             name: cardholderName,
//           },
//         },
//       });

//       if (result.error) {
//         throw new Error(result.error.message || "Payment failed");
//       }

//       if (result.paymentIntent?.status !== "succeeded") {
//         throw new Error("Payment was not successful. Please try again.");
//       }

//       const confirmed = await confirmPayment(
//         currentOrderId,
//         result.paymentIntent.id
//       );

//       showToast.success("Payment successful! Redirecting...");

//       setTimeout(() => {
//         navigate("/payment-success", {
//           replace: true,
//           state: {
//             orderId: currentOrderId,
//             reference: result.paymentIntent.id,
//             verified: confirmed,
//             provider: "stripe",
//             paymentMethod: "card",
//             amount: totalCost,
//             message: confirmed
//               ? "Your payment has been verified successfully."
//               : "Payment received. Verification in progress.",
//           },
//         });
//       }, 1500);
//     } catch (err) {
//       console.error("Payment error:", err);
//       const errorMessage =
//         err instanceof Error
//           ? err.message
//           : "An unexpected error occurred. Please try again.";
//       setError(errorMessage);
//       showToast.error(errorMessage);
//     } finally {
//       setLoading(false);
//       setIsProcessingPayment(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-5">
//       {paymentRequest && (
//         <div className="pb-4 border-b border-zinc-700">
//           <PaymentRequestButtonElement
//             options={{
//               paymentRequest,
//               style: {
//                 paymentRequestButton: {
//                   theme: "dark",
//                   height: "48px",
//                   type: "default",
//                 },
//               },
//             }}
//           />
//           <div className="relative my-4">
//             <div className="absolute inset-0 flex items-center">
//               <div className="w-full border-t border-zinc-700" />
//             </div>
//             <div className="relative flex justify-center text-sm">
//               <span className="px-2 bg-zinc-900 text-gray-400">
//                 Or pay with card
//               </span>
//             </div>
//           </div>
//         </div>
//       )}

//       <div>
//         <Label
//           htmlFor="email"
//           className="text-gray-300 mb-2 flex items-center gap-2"
//         >
//           <Mail className="w-4 h-4" />
//           Email Address <span className="text-red-400">*</span>
//         </Label>
//         <Input
//           id="email"
//           type="email"
//           value={email}
//           onChange={(e) => {
//             setEmail(e.target.value);
//             if (error && validateEmail(e.target.value)) {
//               setError(null);
//             }
//           }}
//           placeholder="your@email.com"
//           className="bg-zinc-800 border-zinc-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
//           required
//           disabled={loading}
//           autoComplete="email"
//         />
//       </div>

//       <div>
//         <Label
//           htmlFor="cardholder"
//           className="text-gray-300 mb-2 flex items-center gap-2"
//         >
//           <CreditCard className="w-4 h-4" />
//           Cardholder Name <span className="text-red-400">*</span>
//         </Label>
//         <Input
//           id="cardholder"
//           type="text"
//           value={cardholderName}
//           onChange={(e) => {
//             setCardholderName(e.target.value);
//             if (error) setError(null);
//           }}
//           placeholder="John Doe"
//           className="bg-zinc-800 border-zinc-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
//           required
//           disabled={loading}
//           autoComplete="cc-name"
//         />
//       </div>

//       <div>
//         <Label className="text-gray-300 mb-2 flex items-center gap-2">
//           <CreditCard className="w-4 h-4" />
//           Card Number <span className="text-red-400">*</span>
//         </Label>
//         <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
//           <CardNumberElement
//             options={{
//               ...stripeElementOptions,
//               disabled: loading,
//             }}
//           />
//         </div>
//       </div>

//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <Label className="text-gray-300 mb-2 flex items-center gap-2">
//             <Calendar className="w-4 h-4" />
//             Expiry Date <span className="text-red-400">*</span>
//           </Label>
//           <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
//             <CardExpiryElement
//               options={{
//                 ...stripeElementOptions,
//                 disabled: loading,
//               }}
//             />
//           </div>
//         </div>
//         <div>
//           <Label className="text-gray-300 mb-2 flex items-center gap-2">
//             <Lock className="w-4 h-4" />
//             CVC <span className="text-red-400">*</span>
//           </Label>
//           <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
//             <CardCvcElement
//               options={{
//                 ...stripeElementOptions,
//                 disabled: loading,
//               }}
//             />
//           </div>
//         </div>
//       </div>

//       {error && (
//         <motion.div
//           initial={{ opacity: 0, y: -10 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="bg-red-900/20 border border-red-800 rounded-lg p-3"
//         >
//           <p className="text-red-400 text-sm">{error}</p>
//         </motion.div>
//       )}

//       <Button
//         type="submit"
//         disabled={!stripe || !isFormValid || isProcessingPayment}
//         className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed h-12 text-base font-semibold transition-all"
//       >
//         {loading ? (
//           <span className="flex items-center gap-2">
//             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//             Processing Payment...
//           </span>
//         ) : (
//           `Pay ${totalCost.toFixed(2)}`
//         )}
//       </Button>

//       <Button
//         type="button"
//         onClick={() => navigate("/checkout")}
//         variant="outline"
//         className="w-full bg-zinc-800 border-zinc-600 hover:bg-zinc-700 text-gray-200"
//         disabled={loading}
//       >
//         <ArrowLeft className="w-4 h-4 mr-2" />
//         Back to Checkout
//       </Button>

//       <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
//         <Shield className="w-4 h-4" />
//         <p>
//           Your payment is secured by Stripe. We never store your card details.
//         </p>
//       </div>
//     </form>
//   );
// };

// // ========== Main Page Component ==========
// const PayWithStripePage = () => {
//   // const location = useLocation();
//   const navigate = useNavigate();
//   // const { totalCost = 0 } = (location.state as LocationState) || {};

//   if (!isStripeConfigured) {
//     return (
//       <div className="w-full min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white py-12 px-4 md:px-8">
//         <Toaster position="top-right" />
//         <motion.div
//           className="max-w-lg mx-auto"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.4 }}
//         >
//           <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
//             <CardHeader className="p-6 border-b border-zinc-800">
//               <CardTitle className="text-2xl font-bold text-red-400 text-center">
//                 Configuration Error
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="p-6">
//               <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-start gap-3">
//                 <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
//                 <div>
//                   <p className="text-red-400 font-semibold mb-2">
//                     Stripe is not properly configured
//                   </p>
//                   <p className="text-red-300 text-sm">
//                     The payment system is not set up correctly. Please contact
//                     support or try another payment method.
//                   </p>
//                 </div>
//               </div>
//               <Button
//                 onClick={() => navigate("/checkout")}
//                 className="w-full mt-6 bg-zinc-800 hover:bg-zinc-700"
//               >
//                 <ArrowLeft className="w-4 h-4 mr-2" />
//                 Back to Checkout
//               </Button>
//             </CardContent>
//           </Card>
//         </motion.div>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white py-12 px-4 md:px-8">
//       <Toaster position="top-right" />
//       <motion.div
//         className="max-w-lg mx-auto"
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.4 }}
//       >
//         <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
//           <CardHeader className="p-6 border-b border-zinc-800">
//             <CardTitle className="text-2xl font-bold text-gray-100 text-center">
//               Secure Payment
//             </CardTitle>
//             <p className="text-sm text-gray-400 text-center mt-2">
//               Complete your order securely with Stripe
//             </p>
//           </CardHeader>
//           <CardContent className="p-6">
//             <Elements stripe={stripePromise} options={{ appearance }}>
//               <StripePaymentForm />
//             </Elements>
//           </CardContent>
//         </Card>
//       </motion.div>
//     </div>
//   );
// };

// export default PayWithStripePage;
