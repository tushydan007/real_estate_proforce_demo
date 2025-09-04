// lib/hooks.ts
import { useState, useEffect } from "react";
import { api } from "./api";
import type { User } from "@/types";

// ---------- AUTH HOOKS ----------
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Restore user session on mount (optional: call backend /me endpoint)
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      fetchCurrentUser();
    }
  }, []);

  async function fetchCurrentUser() {
    try {
      const res = await api.get<User>("/auth/user/");
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch current user:", err);
      setUser(null);
    }
  }

  async function register(data: {
    email: string;
    username: string;
    password1: string;
    password2: string;
  }) {
    setLoading(true);
    try {
      const res = await api.post("/auth/registration/", data);
      // Some backends auto-login on registration; if not, call login next
      return res.data;
    } finally {
      setLoading(false);
    }
  }

  async function login(data: { email: string; password: string }) {
    setLoading(true);
    try {
      const res = await api.post<{
        access: string;
        refresh: string;
        user: User;
      }>("/auth/login/", data);

      // Store tokens
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);

      setUser(res.data.user);
      return res.data;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    try {
      await api.post("/auth/logout/");
    } catch (err) {
      console.warn("Logout request failed, clearing tokens anyway");
    } finally {
      // Always clear tokens & user
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
      setLoading(false);
    }
  }

  async function resendVerification(email: string) {
    return api.post("/auth/registration/resend-email/", { email });
  }

  async function verifyEmail(key: string) {
    return api.post("/auth/registration/verify-email/", { key });
  }

  async function requestPasswordReset(email: string) {
    return api.post("/auth/password/reset/", { email });
  }

  async function confirmPasswordReset(data: {
    uid: string;
    token: string;
    new_password1: string;
    new_password2: string;
  }) {
    return api.post("/auth/password/reset/confirm/", data);
  }

  return {
    user,
    loading,
    register,
    login,
    logout,
    resendVerification,
    verifyEmail,
    requestPasswordReset,
    confirmPasswordReset,
    fetchCurrentUser,
  };
}

// // lib/hooks.ts
// import { useState } from "react";
// import { api } from "./api";
// import type { User, Subscription, PaymentInitResponse } from "@/types";

// // ---------- AUTH HOOKS ----------
// export function useAuth() {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(false);

//   async function register(data: {
//     email: string;
//     username: string;
//     password1: string;
//     password2: string;
//   }) {
//     setLoading(true);
//     try {
//       const res = await api.post("/auth/registration/", data);
//       setUser(res.data);
//       return res.data;
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function login(data: { email: string; password: string }) {
//     setLoading(true);
//     try {
//       const res = await api.post("/auth/login/", data);
//       setUser(res.data.user);
//       return res.data;
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function logout() {
//     setLoading(true);
//     try {
//       await api.post("/auth/logout/");
//       setUser(null);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function resendVerification(email: string) {
//     return api.post("/auth/registration/resend-email/", { email });
//   }

//   async function verifyEmail(key: string) {
//     return api.post("/auth/registration/verify-email/", { key });
//   }

//   async function requestPasswordReset(email: string) {
//     return api.post("/auth/password/reset/", { email });
//   }

//   async function confirmPasswordReset(data: {
//     uid: string;
//     token: string;
//     new_password1: string;
//     new_password2: string;
//   }) {
//     return api.post("/auth/password/reset/confirm/", data);
//   }

//   return {
//     user,
//     loading,
//     register,
//     login,
//     logout,
//     resendVerification,
//     verifyEmail,
//     requestPasswordReset,
//     confirmPasswordReset,
//   };
// }

// // ---------- SUBSCRIPTIONS HOOK ----------
// export function useSubscriptions() {
//   const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
//   const [loading, setLoading] = useState(false);

//   async function fetchSubscriptions() {
//     setLoading(true);
//     try {
//       const res = await api.get("/subscriptions/");
//       setSubscriptions(res.data);
//       return res.data;
//     } finally {
//       setLoading(false);
//     }
//   }

//   return {
//     subscriptions,
//     loading,
//     fetchSubscriptions,
//   };
// }

// // ---------- PAYMENTS HOOK ----------
// export function usePayments() {
//   async function createStripeSession(
//     planId: string,
//     successUrl: string,
//     cancelUrl: string
//   ) {
//     const res = await api.post<PaymentInitResponse>(
//       "/payments/create_stripe_session/",
//       {
//         plan_id: planId,
//         success_url: successUrl,
//         cancel_url: cancelUrl,
//       }
//     );
//     return res.data;
//   }

//   async function createPaystackTransaction(
//     planId: string,
//     callbackUrl: string
//   ) {
//     const res = await api.post<PaymentInitResponse>(
//       "/payments/create_paystack_transaction/",
//       {
//         plan_id: planId,
//         callback_url: callbackUrl,
//       }
//     );
//     return res.data;
//   }

//   async function createPaypalOrder(
//     planId: string,
//     returnUrl: string,
//     cancelUrl: string
//   ) {
//     const res = await api.post<PaymentInitResponse>(
//       "/payments/create_paypal_order/",
//       {
//         plan_id: planId,
//         return_url: returnUrl,
//         cancel_url: cancelUrl,
//       }
//     );
//     return res.data;
//   }

//   return {
//     createStripeSession,
//     createPaystackTransaction,
//     createPaypalOrder,
//   };
// }
