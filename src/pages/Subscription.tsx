import { useEffect, useState } from "react";
import PlanCard from "../components/PlanCard";
import client from "../lib/client";
import { useNavigate } from "react-router-dom";
import type { Plan } from "@/types";

// For demo we can hardcode plans; in prod fetch from /api/plans/
const defaultPlans: Plan[] = [
  {
    id: "free",
    name: "Free Trial (7 days)",
    price_display: "$0 / 7 days",
    price_cents: 0,
    features: ["7-day trial", "Basic features"],
  },
  {
    id: "pro",
    name: "Pro",
    price_display: "$9.99 / month",
    price_cents: 999,
    features: ["Feature A", "Feature B"],
  },
  {
    id: "business",
    name: "Business",
    price_display: "$29.99 / month",
    price_cents: 2999,
    features: ["All Pro features", "Team seats"],
  },
];

export default function Subscription() {
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    // optionally fetch plans from backend:
    // client.get("/api/plans/").then(res => setPlans(res.data));
  }, []);

  async function handleChoose(planId: string) {
    // Navigate to a payment option selection or directly create session on Stripe.
    // For this client we will call the Stripe init endpoint, and if PayStack/PayPal, call their endpoints.
    // Let user pick provider in a simple modally shown selection. For brevity, we'll show provider choices.
    const provider = window.prompt(
      "Enter provider to use (stripe/paystack/paypal) — try 'stripe'"
    );
    if (!provider) return;
    setLoadingPlan(planId);
    try {
      if (provider === "stripe") {
        const resp = await client.post("/api/payments/create_stripe_session/", {
          plan_id: planId,
          success_url: window.location.origin + "/dashboard",
          cancel_url: window.location.href,
        });
        // resp should contain checkout_url or sessionId
        const data = resp.data;
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
        } else if (data.sessionId) {
          // Use stripe.js to redirect
          const stripeLib = await import("@stripe/stripe-js");
          const stripe = await stripeLib.loadStripe(
            import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
          );
          await stripe?.redirectToCheckout({ sessionId: data.sessionId });
        } else {
          alert("Unexpected response from server: " + JSON.stringify(data));
        }
      } else if (provider === "paystack") {
        const resp = await client.post(
          "/api/payments/create_paystack_transaction/",
          { plan_id: planId, callback_url: window.location.href }
        );
        const data = resp.data;
        if (data.authorization_url) {
          window.location.href = data.authorization_url;
        } else {
          alert("No authorization_url returned.");
        }
      } else if (provider === "paypal") {
        const resp = await client.post("/api/payments/create_paypal_order/", {
          plan_id: planId,
          return_url: window.location.origin + "/dashboard",
          cancel_url: window.location.href,
        });
        const data = resp.data;
        const approve =
          data?.approve_url ||
          data.links?.find(
            (l: { rel: string; href: string }) => l.rel === "approve"
          )?.href;
        if (approve) window.location.href = approve;
        else alert("No approve url");
      } else {
        alert("Unknown provider");
      }
    } catch (e: unknown) {
      const errorMessage =
        e && typeof e === "object" && "message" in e
          ? String((e as Error).message)
          : "Unknown error";

      alert("Error initiating payment: " + errorMessage);
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {plans.map((p) => (
        <PlanCard key={p.id} plan={p} onChoose={handleChoose} />
      ))}
    </div>
  );
}
