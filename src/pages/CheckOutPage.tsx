"use client";

import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../redux/store";
import { clearCart } from "../redux/features/cart/CartSlice";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import axios from "axios";
import { useEffect } from "react";
import { usePaymentWebSocket } from "@/hooks/usePaymentWebSocket";

interface CheckoutPageProps {
  orderId: string; // comes from backend after checkout creation
}

const CheckoutPage = ({ orderId }: CheckoutPageProps) => {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const payment = useSelector((state: RootState) => state.payment);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // 🔌 WebSocket live updates
  usePaymentWebSocket(orderId);

  // 🚀 Auto-navigate based on payment status
  useEffect(() => {
    if (payment.status === "success") {
      navigate("/payment-success");
    } else if (payment.status === "failed") {
      navigate("/payment-failed");
    }
  }, [payment.status, navigate]);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const discount = subtotal * 0.05;
  const total = subtotal - discount;


  const handlePayment = async (method: "stripe" | "paystack") => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    try {
      // 🔹 Step 1: Create order in backend to get orderId
      const orderRes = await axios.post(
        "http://127.0.0.1:8000/orders/create/",
        {
          items: cartItems,
          email: "customer@example.com", // replace with logged in user
        }
      );

      const orderId = orderRes.data.order_id; // backend must return this

      // 🔹 Step 2: Start checkout session with Stripe or Paystack
      let res;
      if (method === "stripe") {
        res = await axios.post("http://127.0.0.1:8000/checkout/stripe/", {
          items: cartItems,
          orderId, // attach orderId so webhook knows which group to notify
        });
        window.location.href = res.data.url;
      } else {
        res = await axios.post("http://127.0.0.1:8000/checkout/paystack/", {
          items: cartItems,
          email: "customer@example.com",
          orderId, // attach orderId in metadata
        });
        window.location.href = res.data.data.authorization_url;
      }

      // 🔹 Step 3: Clear cart (optional, since order is created)
      dispatch(clearCart());
    } catch (err) {
      console.error(err);
      toast.error(
        `${method === "stripe" ? "Stripe" : "Paystack"} checkout failed!`
      );
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white px-4 md:px-8 py-10">
      <Toaster position="top-right" />
      <motion.h1
        className="text-3xl md:text-4xl font-bold mb-10 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        💳 Checkout
      </motion.h1>

      <div className="max-w-2xl mx-auto">
        <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-200">
            Order Summary
          </h2>

          <div className="space-y-3 text-gray-400">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-6 text-gray-400">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Discount (5%)</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg mt-6 border-t border-gray-700 pt-4 text-gray-200">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <Button
            onClick={() => handlePayment("stripe")}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
          >
            Pay with Stripe
          </Button>

          <Button
            onClick={() => handlePayment("paystack")}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 cursor-pointer"
          >
            Pay with Paystack
          </Button>

          <Button
            onClick={() => navigate("/cart")}
            className="w-full mt-4 bg-gray-700 hover:bg-gray-600 cursor-pointer"
          >
            Back to Cart
          </Button>

          {/* ✅ Live payment state */}
          {payment.status === "loading" && (
            <motion.p
              className="mt-6 text-yellow-400 text-center animate-pulse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              🔄 Processing payment...
            </motion.p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CheckoutPage;
