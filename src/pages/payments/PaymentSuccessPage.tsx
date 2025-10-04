"use client";

import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { clearAoiCart } from "@/redux/features/cart/AoiCartSlice";
import { resetPayment } from "@/redux/features/payment/PaymentSlice";
import { Toaster } from "react-hot-toast";
import {
  CheckCircle2,
  Home,
  Package,
  Copy,
  Check,
  AlertCircle,
  Download,
  Mail,
} from "lucide-react";

interface LocationState {
  orderId?: string;
  reference?: string;
  verified?: boolean;
  provider?: "stripe" | "paystack";
  paymentMethod?: string;
  amount?: number;
  message?: string;
}

const PaymentSuccessPage = () => {
  const payment = useSelector((state: RootState) => state.payment);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    orderId,
    reference,
    verified = true,
    provider,
    paymentMethod,
    amount,
    message,
  } = (location.state as LocationState) || {};

  const [copied, setCopied] = useState(false);
  const [cartCleared, setCartCleared] = useState(false);

  // Clear cart only after confirming payment success
  useEffect(() => {
    if (!cartCleared) {
      dispatch(clearAoiCart());
      setCartCleared(true);
    }

    // Reset payment state
    return () => {
      dispatch(resetPayment());
    };
  }, [dispatch, cartCleared]);

  // Copy order ID to clipboard
  const copyOrderId = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl" />
                <CheckCircle2 className="w-20 h-20 text-green-400 relative" />
              </div>
            </motion.div>

            {/* Success Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-green-400 mb-3">
                Payment Successful!
              </h1>
              <p className="text-lg text-gray-300">
                {message ||
                  payment.message ||
                  "Your order has been placed successfully."}
              </p>
            </motion.div>

            {/* Verification Status */}
            {!verified && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-6 bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-yellow-400 font-semibold">
                    Verification in Progress
                  </p>
                  <p className="text-yellow-300 text-sm mt-1">
                    Your payment is being verified. You'll receive a
                    confirmation email shortly.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Order Details */}
            {(orderId || reference || amount) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-8 bg-zinc-800 rounded-lg p-6 space-y-4"
              >
                <h2 className="text-lg font-semibold text-gray-200 mb-4">
                  Order Details
                </h2>

                {orderId && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Order ID</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-200 font-mono text-sm">
                        {orderId.substring(0, 20)}...
                      </span>
                      <button
                        onClick={copyOrderId}
                        className="p-1.5 hover:bg-zinc-700 rounded transition-colors"
                        title="Copy Order ID"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {reference && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Payment Reference</span>
                    <span className="text-gray-200 font-mono text-sm">
                      {reference.substring(0, 20)}...
                    </span>
                  </div>
                )}

                {amount && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Amount Paid</span>
                    <span className="text-green-400 font-semibold">
                      ${amount.toFixed(2)}
                    </span>
                  </div>
                )}

                {provider && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Payment Provider</span>
                    <span className="text-gray-200 capitalize">
                      {provider}
                      {paymentMethod && ` (${paymentMethod.replace("_", " ")})`}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className="text-green-400 font-semibold">
                    {verified ? "Verified" : "Pending Verification"}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={() => navigate("/")}
                  className="bg-gradient-to-r cursor-pointer from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12 text-base font-semibold"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Home
                </Button>
                <Button
                  onClick={() => navigate("/orders")}
                  variant="outline"
                  className="bg-zinc-800 cursor-pointer border-zinc-600 hover:bg-zinc-700 text-gray-200 h-12 text-base font-semibold"
                >
                  <Package className="w-4 h-4 mr-2" />
                  View Orders
                </Button>
              </div>

              {orderId && (
                <Button
                  onClick={() => navigate(`/orders/${orderId}`)}
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-gray-200 hover:bg-zinc-800 cursor-pointer"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
              )}
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 space-y-3"
            >
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Mail className="w-4 h-4" />
                <p>
                  A confirmation email has been sent to your registered email
                  address.
                </p>
              </div>

              <div className="text-center text-xs text-gray-600">
                <p>
                  Need help? Contact support at{" "}
                  <a
                    href="mailto:support@proforcegalaxies.com"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    support@proforcegalaxies.com
                  </a>
                </p>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      <Toaster position="top-right" />
    </div>
  );
};

export default PaymentSuccessPage;
