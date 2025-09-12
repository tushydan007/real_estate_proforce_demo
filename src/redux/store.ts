import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./features/cart/CartSlice";
import paymentReducer from "./features/payment/PaymentSlice";
import aoiCartReducer from "./features/cart/AoiCartSlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    payment: paymentReducer,
    aoiCart: aoiCartReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
