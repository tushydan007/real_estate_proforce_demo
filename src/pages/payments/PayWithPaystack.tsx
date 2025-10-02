// src/pages/PayWithPaystackPage.tsx
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PaystackPop from "@paystack/inline-js";

const PayWithPaystackPage = () => {
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
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ""; // Replace with your actual public key

  useEffect(() => {
    if (!aoiItems || aoiItems.length === 0) {
      navigate("/checkout");
    }
  }, [aoiItems, navigate]);

  const handlePaystackPayment = async () => {
    if (!email) {
      toast.error("Please enter your email address.", {
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
        currentOrderId = orderRes.data.order_id;
        setLocalOrderId(currentOrderId);
      }

      // Use Paystack Inline Popup for embedded form
      const paystack = new PaystackPop();
      interface PaystackTransaction {
        reference: string;
        [key: string]: unknown;
      }

      interface PaystackError {
        message: string;
        [key: string]: unknown;
      }

      interface PaystackMetadata {
        order_id: string;
        total_cost: number;
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
        onError: (error: PaystackError) => void;
      }

      paystack.newTransaction({
        key: publicKey,
        reference: currentOrderId as string, // Use order ID as transaction reference for easy backend matching
        email,
        amount: totalCost * 100, // In cents for USD (adjust for NGN kobo if needed)
        currency: "USD", // Adjust if using NGN
        metadata: {
          order_id: currentOrderId as string,
          total_cost: totalCost,
        },
        onSuccess: (transaction: PaystackTransaction) => {
          //   console.log("Payment successful:", transaction);
          alert(`Successful! Ref: ${transaction.reference}`);
          // Optional: Verify on backend here (POST to /verify/${reference})
          // await axios.post(`/verify/${transaction.reference}`, { email });
          toast.success("Payment successful! Redirecting...", {
            style: { background: "#1f2937", color: "#fff" },
            icon: "✅",
          });
          navigate(`/paystack/callback/${transaction.reference}`); // Or your success route
        },
        onClose: (): void => {
          console.log("Payment cancelled");
          toast("Payment was cancelled.", {
            style: { background: "#1f2937", color: "#fff" },
            icon: "❌",
          });
        },
        onError: (error: PaystackError): void => {
          console.error("Paystack error:", error);
          toast.error("Payment error occurred. Please try again.", {
            style: { background: "#1f2937", color: "#fff" },
            icon: "❌",
          });
        },
      } as PaystackTransactionOptions);
    } catch (err) {
      console.error("Payment initiation failed:", err);
      toast.error("Failed to initiate payment. Please try again.", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "❌",
      });
    } finally {
      setLoading(false);
    }
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
              Pay with Paystack
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
              />
            </div>
            <Button
              onClick={handlePaystackPayment}
              disabled={loading || !email}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-3 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              {loading ? "Processing..." : `Pay $${totalCost.toFixed(2)}`}
            </Button>
            <Button
              onClick={() => navigate("/checkout")}
              variant="outline"
              className="w-full bg-zinc-800 border-zinc-600 hover:bg-zinc-700 text-gray-200"
            >
              Back to Checkout
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PayWithPaystackPage;

// // src/pages/PayWithPaystackPage.tsx
// "use client";

// import { useSelector } from "react-redux";
// import type { RootState } from "../../redux/store";
// import { useNavigate, useLocation } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { motion } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";
// import axios from "axios";
// import { useEffect, useState } from "react";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";

// const PayWithPaystackPage = () => {
//   const cartItems = useSelector((state: RootState) => state.aoiCart.items);
//   const navigate = useNavigate();
//   const location = useLocation();
//   const {
//     aoiItems,
//     durationType = "months",
//     durationValue = 1,
//     totalCost = 0,
//   } = location.state || {};
//   const [loading, setLoading] = useState(false);
//   const [email, setEmail] = useState("");
//   const [localOrderId, setLocalOrderId] = useState<string | null>(null);

//   useEffect(() => {
//     if (!aoiItems || aoiItems.length === 0) {
//       navigate("/checkout");
//     }
//   }, [aoiItems, navigate]);

//   const handlePaystackPayment = async () => {
//     if (!email) {
//       toast.error("Please enter your email address.", {
//         style: { background: "#1f2937", color: "#fff" },
//         icon: "⚠️",
//       });
//       return;
//     }

//     setLoading(true);

//     try {
//       let currentOrderId = localOrderId;
//       if (!currentOrderId) {
//         const orderRes = await axios.post(
//           "http://127.0.0.1:8000/orders/create/",
//           {
//             items: cartItems.map((item) => ({
//               id: item.id,
//               name: item.name,
//               area: item.area,
//               type: item.type,
//               monitoring_enabled: true,
//               is_active: true,
//             })),
//             email,
//             duration: { type: durationType, value: durationValue },
//             total_cost: totalCost,
//           },
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//               "Content-Type": "application/json",
//             },
//           }
//         );
//         currentOrderId = orderRes.data.order_id;
//         setLocalOrderId(currentOrderId);
//       }

//       const res = await axios.post(
//         "http://127.0.0.1:8000/checkout/paystack/",
//         {
//           items: cartItems,
//           email,
//           orderId: currentOrderId,
//           totalCost: totalCost,
//           callback_url: `${window.location.origin}/paystack/callback/`,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       // Redirect to Paystack hosted payment page
//       window.location.href = res.data.data.authorization_url;
//     } catch (err) {
//       console.error("Paystack initiation failed:", err);
//       toast.error("Failed to initiate Paystack payment. Please try again.", {
//         style: { background: "#1f2937", color: "#fff" },
//         icon: "❌",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="w-full min-h-screen bg-black text-white py-12 px-4 md:px-8">
//       <Toaster position="top-right" />
//       <motion.div
//         className="max-w-md mx-auto"
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.3 }}
//       >
//         <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl">
//           <CardHeader className="p-6">
//             <CardTitle className="text-xl font-semibold text-gray-200 text-center">
//               Pay with Paystack
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="p-6 space-y-4">
//             <div>
//               <Label htmlFor="email" className="text-gray-300 mb-2">
//                 Email Address
//               </Label>
//               <Input
//                 id="email"
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 placeholder="your@email.com"
//                 className="bg-zinc-800 border-zinc-600 text-white"
//                 required
//               />
//             </div>
//             <Button
//               onClick={handlePaystackPayment}
//               disabled={loading || !email}
//               className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-3 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg"
//             >
//               {loading ? "Processing..." : `Pay $${totalCost.toFixed(2)}`}
//             </Button>
//             <Button
//               onClick={() => navigate("/checkout")}
//               variant="outline"
//               className="w-full bg-zinc-800 border-zinc-600 hover:bg-zinc-700 text-gray-200"
//             >
//               Back to Checkout
//             </Button>
//           </CardContent>
//         </Card>
//       </motion.div>
//     </div>
//   );
// };

// export default PayWithPaystackPage;
