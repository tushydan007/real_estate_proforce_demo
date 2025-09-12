import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { resetPayment } from "../../redux/features/payment/PaymentSlice";

const PaymentFailedPage = () => {
  const payment = useSelector((state: RootState) => state.payment);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
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
          className="text-4xl md:text-5xl font-bold text-red-500 mb-6"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
        >
          ⚠️ Payment Failed
        </motion.h1>
        <p className="text-lg md:text-xl text-gray-300 mb-10">
          {payment.message || "Something went wrong. Please try again."}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={() => navigate("/checkout")}
          >
            Retry Payment
          </Button>
          <Button
            className="bg-gray-700 hover:bg-gray-600"
            onClick={() => navigate("/cart")}
          >
            Back to Cart
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentFailedPage;

// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { CheckCircle2 } from "lucide-react";

// const PaymentSuccessPage = () => {
//   const navigate = useNavigate();
//   const [message, setMessage] = useState(
//     "🎉 Payment successful! Thank you for your purchase."
//   );

//   // Example: dynamically update the message after 5s
//   useEffect(() => {
//     const msgTimer = setTimeout(() => {
//       setMessage(
//         "✅ Your order is being processed. You’ll receive an email shortly."
//       );
//     }, 5000);

//     const redirectTimer = setTimeout(() => {
//       navigate("/orders");
//     }, 15000);

//     return () => {
//       clearTimeout(msgTimer);
//       clearTimeout(redirectTimer);
//     };
//   }, [navigate]);

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4 transition-colors duration-500">
//       <CheckCircle2 className="text-green-500 w-16 h-16 mb-4 animate-bounce" />
//       <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center animate-pulse">
//         Payment Successful
//       </h1>
//       <p className="text-lg md:text-xl text-center">{message}</p>

//       <div className="mt-6 flex flex-col md:flex-row gap-4">
//         <Button
//           className="bg-green-600 hover:bg-green-700 w-full md:w-auto transition-all duration-300"
//           onClick={() => navigate("/orders")}
//         >
//           View Orders
//         </Button>
//         <Button
//           className="bg-gray-600 hover:bg-gray-700 w-full md:w-auto transition-all duration-300"
//           onClick={() => navigate("/")}
//         >
//           Back to Home
//         </Button>
//       </div>

//       <p className="mt-4 text-gray-400 text-sm text-center animate-fadeIn">
//         You will be redirected to your orders automatically in 15 seconds.
//       </p>
//     </div>
//   );
// };

// export default PaymentSuccessPage;
