import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch } from "@/redux/store";
import { setPaymentStatus } from "../redux/features/payment/PaymentSlice";

export const usePaymentWebSocket = (orderId: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!orderId) return;

    // 🔹 Use ws:// or wss:// depending on environment
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(
      `${protocol}://localhost:8000/ws/payment/${orderId}/`
    );

    ws.onopen = () => {
      console.log(`🔌 Connected to WebSocket for order ${orderId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📩 Payment update received:", data);

        if (data.status === "success") {
          dispatch(
            setPaymentStatus({
              status: "success",
              message: "✅ Payment successful!",
            })
          );
          navigate("/payment-success");
        } else if (data.status === "failed") {
          dispatch(
            setPaymentStatus({
              status: "failed",
              message: "❌ Payment failed!",
            })
          );
          navigate("/payment-failed");
        } else {
          dispatch(
            setPaymentStatus({
              status: "loading",
              message: "⏳ Processing payment...",
            })
          );
        }
      } catch (err) {
        console.error("❌ Error parsing WebSocket message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("⚠️ WebSocket error:", err);
    };

    ws.onclose = () => {
      console.log(`🔌 WebSocket disconnected for order ${orderId}`);
    };

    return () => {
      ws.close();
    };
  }, [orderId, dispatch, navigate]);
};
