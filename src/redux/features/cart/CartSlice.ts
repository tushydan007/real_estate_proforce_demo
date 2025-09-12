import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [
    {
      id: 1,
      name: "Wireless Headphones",
      price: 120,
      quantity: 1,
      image: "https://via.placeholder.com/150?text=Headphones",
    },
    {
      id: 2,
      name: "Mechanical Keyboard",
      price: 85,
      quantity: 2,
      image: "https://via.placeholder.com/150?text=Keyboard",
    },
    {
      id: 3,
      name: "Gaming Mouse",
      price: 45,
      quantity: 1,
      image: "https://via.placeholder.com/150?text=Mouse",
    },
    {
      id: 4,
      name: "4K Monitor",
      price: 300,
      quantity: 1,
      image: "https://via.placeholder.com/150?text=Monitor",
    },
  ],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCart(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
    },
    addItem(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find(
        (item) => item.id === action.payload.id
      );
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
    },
    removeItem(state, action: PayloadAction<number>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    updateQuantity(
      state,
      action: PayloadAction<{ id: number; quantity: number }>
    ) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) item.quantity = action.payload.quantity;
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { setCart, addItem, removeItem, updateQuantity, clearCart } =
  cartSlice.actions;

export default cartSlice.reducer;
