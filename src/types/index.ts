// types/index.ts

export interface User {
  id: number;
  email: string;
  username: string;
  is_verified: boolean;
}

export interface Subscription {
  id: number;
  plan: string;
  is_trial: boolean;
  trial_end: string | null;
  active: boolean;
  start_date: string;
  end_date: string | null;
}

export interface Payment {
  id: number;
  user: number;
  provider: "stripe" | "paystack" | "paypal";
  provider_payment_id: string;
  amount: number;
  currency: string;
  success: boolean;
  created_at: string;
}

export interface PaymentInitResponse {
  authorization_url?: string; // Paystack
  approve_url?: string; // PayPal
  sessionId?: string; // Stripe
  checkout_url?: string; // Stripe
  reference?: string; // Paystack
}


export interface Plan {
  id: string;
  name: string;
  price_display: string;
  price_cents: number;
  features: string[];
};