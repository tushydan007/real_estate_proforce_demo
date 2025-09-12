import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { clearAoiCart } from "@/redux/features/cart/AoiCartSlice";
import { resetPayment } from "../../redux/features/payment/PaymentSlice";

const PaymentSuccessPage = () => {
  const payment = useSelector((state: RootState) => state.payment);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // ✅ Clear cart + reset payment state on mount
  useEffect(() => {
    dispatch(clearAoiCart());
    dispatch(resetPayment());
  }, [dispatch]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <motion.h1
          className="text-4xl md:text-5xl font-bold text-green-400 mb-6"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
        >
          🎉 Payment Successful!
        </motion.h1>
        <p className="text-lg md:text-xl text-gray-300 mb-10">
          {payment.message || "Your order has been placed successfully."}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => navigate("/")}
          >
            Go to Home
          </Button>
          <Button
            className="bg-gray-700 hover:bg-gray-600"
            onClick={() => navigate("/orders")}
          >
            View Orders
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccessPage;

// import { useEffect, useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";

// const PaymentSuccessPage = () => {
//   const [loading, setLoading] = useState(true);
//   const [message, setMessage] = useState("Processing payment...");
//   const navigate = useNavigate();

//   useEffect(() => {
//     const clearCart = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         await axios.post(
//           "http://localhost:8000/api/cart/clear/",
//           {},
//           { headers: { Authorization: `Bearer ${token}` } }
//         );

//         setMessage("🎉 Payment successful! Your cart has been cleared.");
//         setLoading(false);

//         // Redirect to homepage after 5 seconds
//         setTimeout(() => {
//           navigate("/");
//         }, 5000);
//       } catch (err) {
//         console.error(err);
//         setMessage(
//           "⚠️ Payment successful, but failed to clear the cart. Please refresh."
//         );
//         setLoading(false);
//       }
//     };

//     clearCart();
//   }, [navigate]);

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
//       <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center">
//         Payment Status
//       </h1>
//       <p className="text-lg md:text-xl text-center">{message}</p>

//       {loading ? (
//         <p className="mt-4 text-gray-400">Please wait...</p>
//       ) : (
//         <Button
//           className="mt-6 bg-indigo-600 hover:bg-indigo-700"
//           onClick={() => navigate("/")}
//         >
//           Back to Home
//         </Button>
//       )}
//     </div>
//   );
// };

// export default PaymentSuccessPage;
