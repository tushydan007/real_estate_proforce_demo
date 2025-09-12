import { useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../redux/store";
import {
  setCart,
  removeItem as removeItemAction,
  updateQuantity,
} from "../redux/features/cart/CartSlice";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

const CartPage = () => {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Fetch cart from backend (and load into Redux)
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get("http://localhost:8000/api/cart/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        dispatch(setCart(res.data.cart));
      } catch (err) {
        console.error("Failed to fetch cart:", err);
      }
    };
    fetchCart();
  }, [dispatch]);

  // Remove item from backend + Redux + toast
  const handleRemove = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8000/api/cart/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const removedItem = cartItems.find((item) => item.id === id);
      dispatch(removeItemAction(id));

      if (removedItem) {
        toast.error(`${removedItem.name} removed from cart`, {
          style: { background: "#1f2937", color: "#fff" },
        });
      }
    } catch (err) {
      console.error("Failed to remove item:", err);
      toast.error("Failed to remove item");
    }
  };

  // Update quantity in backend + Redux
  const handleQuantityChange = async (id: number, quantity: number) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:8000/api/cart/${id}/`,
        { quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch(updateQuantity({ id, quantity }));
    } catch (err) {
      console.error("Failed to update quantity:", err);
      toast.error("Failed to update quantity");
    }
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const discount = subtotal * 0.05;
  const total = subtotal - discount;

  const handleCheckout = () => {
    navigate("/checkout");
  };

  return (
    <div className="w-full min-h-screen bg-black text-white px-4 md:px-8 py-10">
      <Toaster position="top-right" />

      <motion.h1
        className="text-3xl md:text-4xl font-bold mb-10 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        🛒 Your Shopping Cart
      </motion.h1>

      {cartItems.length === 0 ? (
        <motion.div
          className="text-center py-40 text-gray-400 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Your cart is empty
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence>
              {cartItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="flex items-center justify-between p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <CardContent className="flex items-center gap-5 p-0 w-full">
                      <img
                        src={item.image || "https://via.placeholder.com/80"}
                        alt={item.name}
                        className="w-24 h-24 rounded-xl object-cover bg-red-400"
                      />
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-gray-200">
                          {item.name}
                        </h2>
                        <p className="text-gray-400">
                          ${item.price.toFixed(2)} each
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleQuantityChange(
                                item.id,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                          >
                            -
                          </Button>
                          <span className="px-3 font-medium text-gray-200">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity + 1)
                            }
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between h-full">
                        <p className="text-xl font-bold text-gray-300">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 cursor-pointer"
                          onClick={() => handleRemove(item.id)}
                        >
                          <Trash2 className="w-6 h-6" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <motion.div>
            <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-6 text-gray-200">
                Order Summary
              </h2>
              <div className="flex justify-between text-gray-400 mb-2">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400 mb-2">
                <span>Discount</span>
                <span>5%</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-6 border-t border-gray-700 text-gray-200 pt-4">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                disabled={cartItems.length === 0}
              >
                Proceed to Checkout
              </Button>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
