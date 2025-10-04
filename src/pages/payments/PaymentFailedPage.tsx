"use client";

import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { resetPayment } from "@/redux/features/payment/PaymentSlice";
import {
  XCircle,
  RefreshCw,
  ShoppingCart,
  Home,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";

interface LocationState {
  orderId?: string;
  reference?: string;
  provider?: "stripe" | "paystack";
  errorCode?: string;
  errorMessage?: string;
  amount?: number;
}

const PaymentFailedPage = () => {
  const payment = useSelector((state: RootState) => state.payment);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  const { orderId, reference, provider, errorCode, errorMessage, amount } =
    (location.state as LocationState) || {};

  useEffect(() => {
    dispatch(resetPayment());
  }, [dispatch]);

  // Determine error category for better user guidance
  const getErrorCategory = () => {
    const message = (errorMessage || payment.message || "").toLowerCase();

    if (message.includes("card") || message.includes("declined")) {
      return {
        icon: <XCircle className="w-20 h-20 text-red-400" />,
        title: "Card Declined",
        suggestion:
          "Your card was declined. Please check your card details or try a different payment method.",
      };
    }

    if (message.includes("insufficient") || message.includes("balance")) {
      return {
        icon: <AlertTriangle className="w-20 h-20 text-orange-400" />,
        title: "Insufficient Funds",
        suggestion:
          "Your card has insufficient funds. Please use a different card or payment method.",
      };
    }

    if (message.includes("expired")) {
      return {
        icon: <XCircle className="w-20 h-20 text-red-400" />,
        title: "Card Expired",
        suggestion:
          "Your card has expired. Please update your card details and try again.",
      };
    }

    if (message.includes("network") || message.includes("timeout")) {
      return {
        icon: <AlertTriangle className="w-20 h-20 text-orange-400" />,
        title: "Connection Issue",
        suggestion:
          "There was a problem connecting to the payment service. Please check your internet connection and try again.",
      };
    }

    return {
      icon: <XCircle className="w-20 h-20 text-red-400" />,
      title: "Payment Failed",
      suggestion:
        "Something went wrong with your payment. Please try again or contact support if the problem persists.",
    };
  };

  const errorCategory = getErrorCategory();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black text-white px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
          <CardContent className="p-8 md:p-12">
            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
                <div className="relative">{errorCategory.icon}</div>
              </div>
            </motion.div>

            {/* Error Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-red-400 mb-3">
                {errorCategory.title}
              </h1>
              <p className="text-lg text-gray-300">
                {errorCategory.suggestion}
              </p>
            </motion.div>

            {/* Error Details */}
            {(orderId || reference || errorCode || errorMessage) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8 bg-red-900/10 border border-red-800/50 rounded-lg p-6 space-y-3"
              >
                <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Error Details
                </h2>

                {errorMessage && (
                  <div>
                    <span className="text-gray-400 text-sm">Error Message</span>
                    <p className="text-red-300 mt-1">{errorMessage}</p>
                  </div>
                )}

                {errorCode && (
                  <div>
                    <span className="text-gray-400 text-sm">Error Code</span>
                    <p className="text-gray-200 font-mono text-sm mt-1">
                      {errorCode}
                    </p>
                  </div>
                )}

                {orderId && (
                  <div>
                    <span className="text-gray-400 text-sm">Order ID</span>
                    <p className="text-gray-200 font-mono text-sm mt-1">
                      {orderId}
                    </p>
                  </div>
                )}

                {reference && (
                  <div>
                    <span className="text-gray-400 text-sm">Reference</span>
                    <p className="text-gray-200 font-mono text-sm mt-1">
                      {reference}
                    </p>
                  </div>
                )}

                {provider && (
                  <div>
                    <span className="text-gray-400 text-sm">
                      Payment Provider
                    </span>
                    <p className="text-gray-200 capitalize mt-1">{provider}</p>
                  </div>
                )}

                {amount && (
                  <div>
                    <span className="text-gray-400 text-sm">
                      Attempted Amount
                    </span>
                    <p className="text-gray-200 font-semibold mt-1">
                      ${amount.toFixed(2)}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Help Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8 bg-zinc-800 rounded-lg p-6"
            >
              <h3 className="text-md font-semibold text-gray-200 mb-3">
                What can you do?
              </h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>
                    Verify your card details are correct and up to date
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Check if your card has sufficient funds</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Try a different payment method</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Contact your bank if the problem persists</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Reach out to our support team for assistance</span>
                </li>
              </ul>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={() => navigate("/checkout")}
                  className="bg-gradient-to-r cursor-pointer from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 h-12 text-base font-semibold"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Payment
                </Button>
                <Button
                  onClick={() => navigate("/cart")}
                  variant="outline"
                  className="bg-zinc-800 border-zinc-600 hover:bg-zinc-700 text-gray-200 h-12 text-base font-semibold"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Back to Cart
                </Button>
              </div>

              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                className="w-full text-gray-400 hover:text-gray-200 hover:bg-zinc-800 cursor-pointer"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </motion.div>

            {/* Support Notice */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 text-center text-sm text-gray-500"
            >
              <p>
                Need help? Contact our support team at{" "}
                <a
                  href="mailto:support@proforcegalaxies.com"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  support@proforcegalaxies.com
                </a>
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentFailedPage;
