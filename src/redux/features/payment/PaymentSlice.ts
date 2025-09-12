import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface PaymentState {
  status: "idle" | "loading" | "success" | "failed";
  message: string | null;
}

const initialState: PaymentState = {
  status: "idle",
  message: null,
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    setPaymentStatus: (
      state,
      action: PayloadAction<{
        status: PaymentState["status"];
        message?: string;
      }>
    ) => {
      state.status = action.payload.status;
      state.message = action.payload.message ?? null;
    },
    resetPayment: (state) => {
      state.status = "idle";
      state.message = null;
    },
  },
});

export const { setPaymentStatus, resetPayment } = paymentSlice.actions;
export default paymentSlice.reducer;
