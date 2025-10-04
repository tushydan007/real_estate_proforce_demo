"use client";

import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import axios, { AxiosError } from "axios";
import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PaystackPop from "@paystack/inline-js";
import { AlertCircle, ArrowLeft, Lock } from "lucide-react";

// ========== Type Definitions ==========
interface PaystackTransaction {
  reference: string;
  status?: string;
  [key: string]: unknown;
}

interface PaystackError {
  message: string;
  [key: string]: unknown;
}

interface PaystackMetadata {
  order_id: string;
  total_cost: number;
  custom_fields?: Array<{
    display_name: string;
    variable_name: string;
    value: string;
  }>;
}

interface PaystackTransactionOptions {
  key: string;
  reference: string;
  email: string;
  amount: number;
  currency: string;
  metadata: PaystackMetadata;
  onSuccess: (transaction: PaystackTransaction) => void;
  onClose: () => void;
  onError?: (error: PaystackError) => void;
}

interface LocationState {
  aoiItems?: Array<{
    id: string;
    name: string;
    area: number;
    type: string;
  }>;
  durationType?: "days" | "months" | "years";
  durationValue?: number;
  totalCost?: number;
}

interface OrderPayload {
  items: Array<{
    id: string;
    name: string;
    area: number;
    type: string;
    monitoring_enabled: boolean;
    is_active: boolean;
  }>;
  email: string;
  duration: {
    type: string;
    value: number;
  };
  total_cost: number;
}

interface OrderResponse {
  order_id: string;
  success?: boolean;
}

// ========== Constants ==========
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "";
const PAYSTACK_CURRENCY = import.meta.env.VITE_PAYSTACK_CURRENCY || "USD";
const MIN_AMOUNT = 0.01;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ========== Utility Functions ==========
const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim());
};

const getAuthToken = (): string => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication token not found");
  }
  return token;
};

const convertToKobo = (amount: number): number => {
  return Math.round(amount * 100);
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

// ========== Main Component ==========
const PayWithPaystackPage = () => {
  const cartItems = useSelector((state: RootState) => state.aoiCart.items);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    aoiItems,
    durationType = "months",
    durationValue = 1,
    totalCost = 0,
  } = (location.state as LocationState) || {};

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [localOrderId, setLocalOrderId] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false);

  // ========== Validation ==========
  useEffect(() => {
    if (!PAYSTACK_PUBLIC_KEY) {
      console.error("Paystack public key is not configured");
      setConfigError(true);
      showToast.error("Payment configuration error. Please contact support.");
    }
  }, []);

  useEffect(() => {
    if (!aoiItems || aoiItems.length === 0) {
      showToast.warning("No items found. Redirecting to checkout...");
      setTimeout(() => navigate("/checkout", { replace: true }), 2000);
      return;
    }

    if (totalCost < MIN_AMOUNT) {
      showToast.error("Invalid order amount. Redirecting to checkout...");
      setTimeout(() => navigate("/checkout", { replace: true }), 2000);
    }
  }, [aoiItems, totalCost, navigate]);

  // ========== Email Validation ==========
  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setEmail(value);

      if (value && !validateEmail(value)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    },
    []
  );

  // ========== Order Creation ==========
  const createOrder = useCallback(
    async (userEmail: string): Promise<string> => {
      try {
        const token = getAuthToken();
        const orderPayload: OrderPayload = {
          items: cartItems.map((item) => ({
            id: String(item.id),
            name: item.name,
            area: item.area,
            type: String(item.type),
            monitoring_enabled: true,
            is_active: true,
          })),
          email: userEmail,
          duration: { type: durationType, value: durationValue },
          total_cost: totalCost,
        };

        const response = await axios.post<OrderResponse>(
          `${API_BASE_URL}/orders/create/`,
          orderPayload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          }
        );

        if (!response.data?.order_id) {
          throw new Error("Invalid response from server");
        }

        return response.data.order_id;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<{ detail?: string }>;

          if (axiosError.response?.status === 401) {
            showToast.error("Session expired. Please log in again.");
            setTimeout(() => navigate("/login", { replace: true }), 2000);
            throw new Error("Authentication failed");
          }

          const errorMessage =
            axiosError.response?.data?.detail ||
            axiosError.message ||
            "Failed to create order";
          throw new Error(errorMessage);
        }

        throw error;
      }
    },
    [cartItems, durationType, durationValue, totalCost, navigate]
  );

  // ========== Payment Verification ==========
  const verifyPayment = useCallback(
    async (reference: string): Promise<boolean> => {
      try {
        const token = getAuthToken();
        const response = await axios.post(
          `${API_BASE_URL}/payments/verify/${reference}`,
          { email },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          }
        );

        return response.data?.status === "success";
      } catch (error) {
        console.error("Payment verification failed:", error);
        return false;
      }
    },
    [email]
  );

  // ========== Paystack Payment Handler ==========
  const handlePaystackPayment = async () => {
    if (!email.trim()) {
      showToast.warning("Please enter your email address.");
      return;
    }

    if (!validateEmail(email)) {
      showToast.error("Please enter a valid email address.");
      return;
    }

    if (!PAYSTACK_PUBLIC_KEY || configError) {
      showToast.error("Payment system not configured. Please contact support.");
      return;
    }

    setLoading(true);

    try {
      let currentOrderId = localOrderId;
      if (!currentOrderId) {
        currentOrderId = await createOrder(email.trim());
        setLocalOrderId(currentOrderId);
      }

      const paystack = new PaystackPop();
      const amount = convertToKobo(totalCost);

      const transactionOptions: PaystackTransactionOptions = {
        key: PAYSTACK_PUBLIC_KEY,
        reference: currentOrderId,
        email: email.trim(),
        amount,
        currency: PAYSTACK_CURRENCY,
        metadata: {
          order_id: currentOrderId,
          total_cost: totalCost,
          custom_fields: [
            {
              display_name: "Order ID",
              variable_name: "order_id",
              value: currentOrderId,
            },
            {
              display_name: "Duration",
              variable_name: "duration",
              value: `${durationValue} ${durationType}`,
            },
          ],
        },
        onSuccess: async (transaction: PaystackTransaction) => {
          console.log("Payment successful:", transaction.reference);

          showToast.success("Payment successful! Verifying...");

          const verified = await verifyPayment(transaction.reference);

          setTimeout(() => {
            navigate("/payment-success", {
              replace: true,
              state: {
                orderId: currentOrderId,
                reference: transaction.reference,
                verified,
                provider: "paystack",
                amount: totalCost,
                message: verified
                  ? "Your payment has been verified successfully."
                  : "Payment received. Verification in progress.",
              },
            });
          }, 1000);
        },
        onClose: () => {
          console.log("Payment cancelled by user");
          showToast.warning("Payment was cancelled.");
          setLoading(false);
        },
        onError: (error: PaystackError) => {
          console.error("Paystack error:", error);
          showToast.error(
            error.message || "Payment error occurred. Please try again."
          );
          setLoading(false);
        },
      };

      paystack.newTransaction(transactionOptions);
    } catch (err) {
      console.error("Payment initiation failed:", err);

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to initiate payment. Please try again.";

      showToast.error(errorMessage);
      setLoading(false);

      if (
        err instanceof Error &&
        err.message.includes("Authentication failed")
      ) {
        return;
      }
    }
  };

  // ========== Render ==========
  return (
    <div className="w-full min-h-screen bg-black text-white py-12 px-4 md:px-8">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      <motion.div
        className="max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {configError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-400 font-semibold">
                Payment Configuration Error
              </p>
              <p className="text-red-300 text-sm mt-1">
                The payment system is not properly configured. Please contact
                support.
              </p>
            </div>
          </motion.div>
        )}

        <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
          <CardHeader className="p-6 border-b border-zinc-800">
            <CardTitle className="text-xl font-semibold text-gray-200 text-center">
              Complete Your Payment
            </CardTitle>
            <p className="text-sm text-gray-400 text-center mt-2">
              Secure payment powered by Paystack
            </p>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Order Summary */}
            <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Items</span>
                <span className="text-gray-200">{cartItems.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Duration</span>
                <span className="text-gray-200">
                  {durationValue}{" "}
                  {durationValue === 1
                    ? durationType.replace(/s$/, "")
                    : durationType}
                </span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t border-zinc-700">
                <span className="text-gray-200">Total</span>
                <span className="text-green-400">
                  {PAYSTACK_CURRENCY} ${totalCost.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="your@email.com"
                className={`bg-zinc-800 border ${
                  emailError ? "border-red-500" : "border-zinc-600"
                } text-white focus:border-green-500 transition-colors`}
                required
                disabled={loading}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
              />
              {emailError && (
                <p id="email-error" className="text-red-400 text-sm mt-1">
                  {emailError}
                </p>
              )}
            </div>

            {/* Pay Button */}
            <Button
              onClick={handlePaystackPayment}
              disabled={loading || !email.trim() || !!emailError || configError}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-3 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              aria-label={`Pay ${totalCost.toFixed(2)} ${PAYSTACK_CURRENCY}`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                `Pay ${PAYSTACK_CURRENCY} $${totalCost.toFixed(2)}`
              )}
            </Button>

            {/* Back Button */}
            <Button
              onClick={() => navigate("/checkout")}
              variant="outline"
              className="w-full bg-zinc-800 border-zinc-600 hover:bg-zinc-700 text-gray-200 transition-colors"
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Checkout
            </Button>

            {/* Security Notice */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
              <Lock className="w-4 h-4" />
              <p>Your payment is secure and encrypted</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PayWithPaystackPage;

// "use client";

// import { useSelector } from "react-redux";
// import type { RootState } from "../../redux/store";
// import { useNavigate, useLocation } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { motion } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";
// import axios, { AxiosError } from "axios";
// import { useEffect, useState, useCallback } from "react";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import PaystackPop from "@paystack/inline-js";

// // ========== Type Definitions ==========
// interface PaystackTransaction {
//   reference: string;
//   status?: string;
//   [key: string]: unknown;
// }

// interface PaystackError {
//   message: string;
//   [key: string]: unknown;
// }

// interface PaystackMetadata {
//   order_id: string;
//   total_cost: number;
//   custom_fields?: Array<{
//     display_name: string;
//     variable_name: string;
//     value: string;
//   }>;
// }

// interface PaystackTransactionOptions {
//   key: string;
//   reference: string;
//   email: string;
//   amount: number;
//   currency: string;
//   metadata: PaystackMetadata;
//   onSuccess: (transaction: PaystackTransaction) => void;
//   onClose: () => void;
//   onError?: (error: PaystackError) => void;
// }

// interface LocationState {
//   aoiItems?: Array<{
//     id: string;
//     name: string;
//     area: number;
//     type: string;
//   }>;
//   durationType?: "days" | "months" | "years";
//   durationValue?: number;
//   totalCost?: number;
// }

// interface OrderPayload {
//   items: Array<{
//     id: string;
//     name: string;
//     area: number;
//     type: string;
//     monitoring_enabled: boolean;
//     is_active: boolean;
//   }>;
//   email: string;
//   duration: {
//     type: string;
//     value: number;
//   };
//   total_cost: number;
// }

// // ========== Constants ==========
// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
// const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "";
// const PAYSTACK_CURRENCY = import.meta.env.VITE_PAYSTACK_CURRENCY || "USD";
// const MIN_AMOUNT = 0.01;
// const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// // ========== Utility Functions ==========
// const validateEmail = (email: string): boolean => {
//   return EMAIL_REGEX.test(email.trim());
// };

// const getAuthToken = (): string => {
//   const token = localStorage.getItem("token");
//   if (!token) {
//     throw new Error("Authentication token not found");
//   }
//   return token;
// };

// const convertToKobo = (amount: number): number => {
//   // Paystack expects amount in smallest currency unit (kobo for NGN, cents for USD, etc.)
//   return Math.round(amount * 100);
// };

// // ========== Main Component ==========
// const PayWithPaystackPage = () => {
//   const cartItems = useSelector((state: RootState) => state.aoiCart.items);
//   const navigate = useNavigate();
//   const location = useLocation();
//   const {
//     aoiItems,
//     durationType = "months",
//     durationValue = 1,
//     totalCost = 0,
//   } = (location.state as LocationState) || {};

//   const [loading, setLoading] = useState(false);
//   const [email, setEmail] = useState("");
//   const [emailError, setEmailError] = useState("");
//   const [localOrderId, setLocalOrderId] = useState<string | null>(null);

//   // ========== Validation ==========
//   useEffect(() => {
//     if (!PAYSTACK_PUBLIC_KEY) {
//       console.error("Paystack public key is not configured");
//       toast.error("Payment configuration error. Please contact support.", {
//         style: { background: "#1f2937", color: "#fff" },
//         icon: "⚠️",
//       });
//     }
//   }, []);

//   useEffect(() => {
//     if (!aoiItems || aoiItems.length === 0) {
//       toast.error("No items found. Redirecting to checkout...", {
//         style: { background: "#1f2937", color: "#fff" },
//         icon: "⚠️",
//       });
//       navigate("/checkout", { replace: true });
//     }

//     if (totalCost < MIN_AMOUNT) {
//       toast.error("Invalid order amount. Redirecting to checkout...", {
//         style: { background: "#1f2937", color: "#fff" },
//         icon: "⚠️",
//       });
//       navigate("/checkout", { replace: true });
//     }
//   }, [aoiItems, totalCost, navigate]);

//   // ========== Email Validation ==========
//   const handleEmailChange = useCallback(
//     (e: React.ChangeEvent<HTMLInputElement>) => {
//       const value = e.target.value;
//       setEmail(value);

//       if (value && !validateEmail(value)) {
//         setEmailError("Please enter a valid email address");
//       } else {
//         setEmailError("");
//       }
//     },
//     []
//   );

//   // ========== Order Creation ==========
//   const createOrder = async (userEmail: string): Promise<string> => {
//     try {
//       const orderPayload: OrderPayload = {
//         items: cartItems.map((item) => ({
//           id: String(item.id),
//           name: item.name,
//           area: item.area,
//           type: String(item.type),
//           monitoring_enabled: true,
//           is_active: true,
//         })),
//         email: userEmail,
//         duration: { type: durationType, value: durationValue },
//         total_cost: totalCost,
//       };

//       const response = await axios.post(
//         `${API_BASE_URL}/orders/create/`,
//         orderPayload,
//         {
//           headers: {
//             Authorization: `Bearer ${getAuthToken()}`,
//             "Content-Type": "application/json",
//           },
//           timeout: 10000, // 10 second timeout
//         }
//       );

//       if (!response.data?.order_id) {
//         throw new Error("Invalid response from server");
//       }

//       return response.data.order_id;
//     } catch (error) {
//       if (axios.isAxiosError(error)) {
//         const axiosError = error as AxiosError<{ detail?: string }>;

//         if (axiosError.response?.status === 401) {
//           toast.error("Session expired. Please log in again.", {
//             style: { background: "#1f2937", color: "#fff" },
//             icon: "🔒",
//           });
//           navigate("/login", { replace: true });
//           throw new Error("Authentication failed");
//         }

//         const errorMessage =
//           axiosError.response?.data?.detail || axiosError.message;
//         throw new Error(errorMessage);
//       }

//       throw error;
//     }
//   };

//   // ========== Payment Verification (Optional) ==========
//   const verifyPayment = async (reference: string): Promise<boolean> => {
//     try {
//       const response = await axios.post(
//         `${API_BASE_URL}/payments/verify/${reference}`,
//         { email },
//         {
//           headers: {
//             Authorization: `Bearer ${getAuthToken()}`,
//             "Content-Type": "application/json",
//           },
//           timeout: 10000,
//         }
//       );

//       return response.data?.status === "success";
//     } catch (error) {
//       console.error("Payment verification failed:", error);
//       return false;
//     }
//   };

//   // ========== Paystack Payment Handler ==========
//   const handlePaystackPayment = async () => {
//     // Validation
//     if (!email.trim()) {
//       toast.error("Please enter your email address.", {
//         style: { background: "#1f2937", color: "#fff" },
//         icon: "⚠️",
//       });
//       return;
//     }

//     if (!validateEmail(email)) {
//       toast.error("Please enter a valid email address.", {
//         style: { background: "#1f2937", color: "#fff" },
//         icon: "⚠️",
//       });
//       return;
//     }

//     if (!PAYSTACK_PUBLIC_KEY) {
//       toast.error("Payment system not configured. Please contact support.", {
//         style: { background: "#1f2937", color: "#fff" },
//         icon: "⚠️",
//       });
//       return;
//     }

//     setLoading(true);

//     try {
//       // Create or retrieve order ID
//       let currentOrderId = localOrderId;
//       if (!currentOrderId) {
//         currentOrderId = await createOrder(email.trim());
//         setLocalOrderId(currentOrderId);
//       }

//       // Initialize Paystack
//       const paystack = new PaystackPop();
//       const amount = convertToKobo(totalCost);

//       const transactionOptions: PaystackTransactionOptions = {
//         key: PAYSTACK_PUBLIC_KEY,
//         reference: currentOrderId,
//         email: email.trim(),
//         amount,
//         currency: PAYSTACK_CURRENCY,
//         metadata: {
//           order_id: currentOrderId,
//           total_cost: totalCost,
//           custom_fields: [
//             {
//               display_name: "Order ID",
//               variable_name: "order_id",
//               value: currentOrderId,
//             },
//             {
//               display_name: "Duration",
//               variable_name: "duration",
//               value: `${durationValue} ${durationType}`,
//             },
//           ],
//         },
//         onSuccess: async (transaction: PaystackTransaction) => {
//           console.log("Payment successful:", transaction.reference);

//           toast.success("Payment successful! Verifying...", {
//             style: { background: "#1f2937", color: "#fff" },
//             icon: "✅",
//             duration: 2000,
//           });

//           // Optional: Verify payment on backend
//           const verified = await verifyPayment(transaction.reference);

//           if (verified) {
//             setTimeout(() => {
//               navigate(`/paystack/callback/${transaction.reference}`, {
//                 replace: true,
//                 state: { verified: true },
//               });
//             }, 1000);
//           } else {
//             // Still redirect but flag as unverified
//             navigate(`/paystack/callback/${transaction.reference}`, {
//               replace: true,
//               state: { verified: false },
//             });
//           }
//         },
//         onClose: () => {
//           console.log("Payment cancelled by user");
//           toast("Payment was cancelled.", {
//             style: { background: "#1f2937", color: "#fff" },
//             icon: "ℹ️",
//           });
//           setLoading(false);
//         },
//         onError: (error: PaystackError) => {
//           console.error("Paystack error:", error);
//           toast.error(
//             error.message || "Payment error occurred. Please try again.",
//             {
//               style: { background: "#1f2937", color: "#fff" },
//               icon: "❌",
//             }
//           );
//           setLoading(false);
//         },
//       };

//       paystack.newTransaction(transactionOptions);
//     } catch (err) {
//       console.error("Payment initiation failed:", err);

//       const errorMessage =
//         err instanceof Error
//           ? err.message
//           : "Failed to initiate payment. Please try again.";

//       toast.error(errorMessage, {
//         style: { background: "#1f2937", color: "#fff" },
//         icon: "❌",
//       });

//       setLoading(false);
//     }
//   };

//   // ========== Render ==========
//   return (
//     <div className="w-full min-h-screen bg-black text-white py-12 px-4 md:px-8">
//       <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

//       <motion.div
//         className="max-w-md mx-auto"
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.3 }}
//       >
//         <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
//           <CardHeader className="p-6 border-b border-zinc-800">
//             <CardTitle className="text-xl font-semibold text-gray-200 text-center">
//               Complete Your Payment
//             </CardTitle>
//             <p className="text-sm text-gray-400 text-center mt-2">
//               Secure payment powered by Paystack
//             </p>
//           </CardHeader>

//           <CardContent className="p-6 space-y-6">
//             {/* Order Summary */}
//             <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-400">Items</span>
//                 <span className="text-gray-200">{cartItems.length}</span>
//               </div>
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-400">Duration</span>
//                 <span className="text-gray-200">
//                   {durationValue}{" "}
//                   {durationValue === 1
//                     ? durationType.replace(/s$/, "")
//                     : durationType}
//                 </span>
//               </div>
//               <div className="flex justify-between text-lg font-semibold pt-2 border-t border-zinc-700">
//                 <span className="text-gray-200">Total</span>
//                 <span className="text-green-400">
//                   ${totalCost.toFixed(2)} {PAYSTACK_CURRENCY}
//                 </span>
//               </div>
//             </div>

//             {/* Email Input */}
//             <div className="space-y-2">
//               <Label htmlFor="email" className="text-gray-300">
//                 Email Address *
//               </Label>
//               <Input
//                 id="email"
//                 type="email"
//                 value={email}
//                 onChange={handleEmailChange}
//                 placeholder="your@email.com"
//                 className={`bg-zinc-800 border ${
//                   emailError ? "border-red-500" : "border-zinc-600"
//                 } text-white focus:border-green-500 transition-colors`}
//                 required
//                 disabled={loading}
//                 aria-invalid={!!emailError}
//                 aria-describedby={emailError ? "email-error" : undefined}
//               />
//               {emailError && (
//                 <p id="email-error" className="text-red-400 text-sm mt-1">
//                   {emailError}
//                 </p>
//               )}
//             </div>

//             {/* Pay Button */}
//             <Button
//               onClick={handlePaystackPayment}
//               disabled={
//                 loading || !email.trim() || !!emailError || !PAYSTACK_PUBLIC_KEY
//               }
//               className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-3 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
//               aria-label={`Pay ${totalCost.toFixed(2)} ${PAYSTACK_CURRENCY}`}
//             >
//               {loading ? (
//                 <span className="flex items-center justify-center">
//                   <svg
//                     className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                   >
//                     <circle
//                       className="opacity-25"
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                     ></circle>
//                     <path
//                       className="opacity-75"
//                       fill="currentColor"
//                       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                     ></path>
//                   </svg>
//                   Processing...
//                 </span>
//               ) : (
//                 `Pay ${totalCost.toFixed(2)} ${PAYSTACK_CURRENCY}`
//               )}
//             </Button>

//             {/* Back Button */}
//             {/* <Button
//               onClick={() => navigate("/checkout")}
//               variant="outline"
//               className="w-full bg-zinc-800 border-zinc-600 hover:bg-zinc-700 text-gray-200 transition-colors"
//               disabled={loading}
//             >
//               Back to Checkout
//             </Button> */}

//             {/* Security Notice */}
//             <p className="text-xs text-gray-500 text-center mt-4">
//               🔒 Your payment is secure and encrypted
//             </p>
//           </CardContent>
//         </Card>
//       </motion.div>
//     </div>
//   );
// };

// export default PayWithPaystackPage;
