import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web
import cartReducer from "./features/cart/CartSlice";
import paymentReducer from "./features/payment/PaymentSlice";
import aoiCartReducer from "./features/cart/AoiCartSlice";
import authReducer from "./features/auth/authSlice";
import { combineReducers } from "@reduxjs/toolkit";

// Persist configuration
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["aoiCart", "auth"], // Only persist the aoiCart and auth reducers
};


// Create a persisted reducer
const rootReducer = combineReducers({
  cart: cartReducer,
  payment: paymentReducer,
  aoiCart: aoiCartReducer,
  auth: authReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE", "persist/PURGE"],
        // Ignore Date objects in aoiCart for serialization
        ignoredPaths: ["aoiCart.items.created_at", "aoiCart.items.addedToCartAt"],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;