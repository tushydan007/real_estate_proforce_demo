import { useEffect, useState } from "react";
import PlanCard from "../components/PlanCard";
import type { Plan } from "../components/PlanCard";
import client from "../lib/client";
import { useNavigate } from "react-router-dom";

// Only define monthly prices here
const defaultPlans: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    description: "Great for individuals just getting started.",
    price_display: "$999/month",
    price_cents: 99900,
    features: ["Access to core features", "Basic Analytics", "Email support", "1 GB storage"],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Perfect for professionals who need more power.",
    price_display: "$2999/month",
    price_cents: 299900,
    features: ["Everything in Basic", "Priority support", "50 GB storage", "Advanced analytics"],
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for large teams & businesses.",
    price_display: "Contact us",
    price_cents: 0,
    features: ["Unlimited storage", "Dedicated account manager", "24/7 support", "Custom integrations"],
  },
];

export default function Subscription() {
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const nav = useNavigate();

  useEffect(() => {
    client.get("/api/plans/").then((res) => setPlans(res.data));
  }, []);

  function formatCurrency(cents: number): string {
    return `$${(cents / 100).toFixed(0)}`;
  }

  // Auto-derive yearly plans
  const computedPlans = plans.map((plan) => {
    if (plan.price_cents === 0 || plan.price_display === "Contact us") {
      return {
        ...plan,
        yearly_price_display: "Contact us",
        yearly_price_cents: 0,
      };
    }
    const yearlyCents = Math.round(plan.price_cents * 12 * 0.8); // 20% discount
    return {
      ...plan,
      yearly_price_cents: yearlyCents,
      yearly_price_display: `${formatCurrency(yearlyCents / 100)}/year`,
    };
  });

  async function handleChoose(planId: string) {
    const provider = window.prompt(
      "Enter provider to use (stripe/paystack/paypal) — try 'stripe'"
    );
    if (!provider) return;
    setLoadingPlan(planId);
    try {
      if (provider === "stripe") {
        const resp = await client.post("/api/payments/create_stripe_session/", {
          plan_id: planId,
          billing_cycle: billingCycle,
          success_url: window.location.origin + "/dashboard",
          cancel_url: window.location.href,
        });
        const data = resp.data;
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
        }
      } else if (provider === "paystack") {
        const resp = await client.post("/api/payments/create_paystack_transaction/", {
          plan_id: planId,
          billing_cycle: billingCycle,
          callback_url: window.location.href,
        });
        const data = resp.data;
        if (data.authorization_url) {
          window.location.href = data.authorization_url;
        }
      } else if (provider === "paypal") {
        const resp = await client.post("/api/payments/create_paypal_order/", {
          plan_id: planId,
          billing_cycle: billingCycle,
          return_url: window.location.origin + "/dashboard",
          cancel_url: window.location.href,
        });
        const data = resp.data;
        const approve =
          data?.approve_url ||
          data.links?.find((l: { rel: string; href: string }) => l.rel === "approve")?.href;
        if (approve) window.location.href = approve;
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
    <section className="py-16 bg-black min-h-screen px-4 md:px-6">
      {/* Section Heading */}
      <div className="max-w-3xl mx-auto text-center mb-12 md:pt-16">
        <h2 className="text-4xl font-bold text-gray-200">
          Choose the Right Plan for You
        </h2>
        <p className="mt-4 text-lg text-gray-200">
          Our subscription options are designed to fit your needs, whether
          you’re just starting out, scaling your business, or running a large
          enterprise. Select a plan that matches your goals and unlock the tools
          you need to succeed.
        </p>
      </div>

      {/* Toggle */}
      <div className="flex justify-center mb-10">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`px-6 py-2 cursor-pointer rounded-l-lg ${
            billingCycle === "monthly" ? "bg-blue-600 text-white" : "bg-gray-200 text-black"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle("yearly")}
          className={`px-6 py-2 cursor-pointer rounded-r-lg ${
            billingCycle === "yearly" ? "bg-blue-600 text-white" : "bg-gray-200 text-black"
          }`}
        >
          Yearly
        </button>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {computedPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billingCycle={billingCycle}
            onChoose={handleChoose}
          />
        ))}
      </div>
    </section>
  );
}




// import { useEffect, useState } from "react";
// import PlanCard from "../components/PlanCard";
// import client from "../lib/client";
// import { useNavigate } from "react-router-dom";
// import type { Plan } from "@/types";

// // For demo we can hardcode plans; in prod fetch from /api/plans/
// const defaultPlans: Plan[] = [
//   {
//     id: "basic",
//     name: "Basic",
//     description: "Great for individuals just getting started.",
//     price_display: "$9/month",
//     price_cents: 900,
//     features: ["Access to core features", "Basic Analytics", "Email support", "1 GB storage"],
//   },
//   {
//     id: "pro",
//     name: "Pro",
//     description: "Perfect for professionals who need more power.",
//     price_display: "$29/month",
//     price_cents: 2900,
//     features: [
//       "Everything in Basic",
//       "Priority support",
//       "50 GB storage",
//       "Advanced analytics",
//     ],
//   },
//   {
//     id: "enterprise",
//     name: "Enterprise",
//     description: "Custom solutions for large teams & businesses.",
//     price_display: "Contact us",
//     price_cents: 0,
//     features: [
//       "Unlimited storage",
//       "Dedicated account manager",
//       "24/7 support",
//       "Custom integrations",
//     ],
//   },
// ];

// export default function Subscription() {
//   const [plans, setPlans] = useState<Plan[]>(defaultPlans);
//   const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
//   const nav = useNavigate();

//   console.log(nav);
//   console.log(loadingPlan);

//   useEffect(() => {
//     // optionally fetch plans from backend:
//     client.get("/api/plans/").then((res) => setPlans(res.data));
//   }, []);

//   async function handleChoose(planId: string) {
//     // Navigate to a payment option selection or directly create session on Stripe.
//     // For this client we will call the Stripe init endpoint, and if PayStack/PayPal, call their endpoints.
//     // Let user pick provider in a simple modally shown selection. For brevity, we'll show provider choices.
//     const provider = window.prompt(
//       "Enter provider to use (stripe/paystack/paypal) — try 'stripe'"
//     );
//     if (!provider) return;
//     setLoadingPlan(planId);
//     try {
//       if (provider === "stripe") {
//         const resp = await client.post("/api/payments/create_stripe_session/", {
//           plan_id: planId,
//           success_url: window.location.origin + "/dashboard",
//           cancel_url: window.location.href,
//         });
//         // resp should contain checkout_url or sessionId
//         const data = resp.data;
//         if (data.checkout_url) {
//           window.location.href = data.checkout_url;
//         } else if (data.sessionId) {
//           // Use stripe.js to redirect
//           const stripeLib = await import("@stripe/stripe-js");
//           const stripe = await stripeLib.loadStripe(
//             import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
//           );
//           await stripe?.redirectToCheckout({ sessionId: data.sessionId });
//         } else {
//           alert("Unexpected response from server: " + JSON.stringify(data));
//         }
//       } else if (provider === "paystack") {
//         const resp = await client.post(
//           "/api/payments/create_paystack_transaction/",
//           { plan_id: planId, callback_url: window.location.href }
//         );
//         const data = resp.data;
//         if (data.authorization_url) {
//           window.location.href = data.authorization_url;
//         } else {
//           alert("No authorization_url returned.");
//         }
//       } else if (provider === "paypal") {
//         const resp = await client.post("/api/payments/create_paypal_order/", {
//           plan_id: planId,
//           return_url: window.location.origin + "/dashboard",
//           cancel_url: window.location.href,
//         });
//         const data = resp.data;
//         const approve =
//           data?.approve_url ||
//           data.links?.find(
//             (l: { rel: string; href: string }) => l.rel === "approve"
//           )?.href;
//         if (approve) window.location.href = approve;
//         else alert("No approve url");
//       } else {
//         alert("Unknown provider");
//       }
//     } catch (e: unknown) {
//       const errorMessage =
//         e && typeof e === "object" && "message" in e
//           ? String((e as Error).message)
//           : "Unknown error";

//       alert("Error initiating payment: " + errorMessage);
//     } finally {
//       setLoadingPlan(null);
//     }
//   }

//   return (
//     <section className="py-16 bg-black min-h-screen">
//       {/* Section Heading */}
//       <div className="max-w-3xl mx-auto text-center mb-12 md:pt-16">
//         <h2 className="text-4xl font-bold text-gray-200">
//           Choose the Right Plan for You
//         </h2>
//         <p className="mt-4 text-lg text-gray-200">
//           Our subscription options are designed to fit your needs, whether
//           you’re just starting out, scaling your business, or running a large
//           enterprise. Select a plan that matches your goals and unlock the tools
//           you need to succeed.
//         </p>
//       </div>

//       {/* Plan Cards */}
//       <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
//         {plans.map((plan) => (
//           <PlanCard key={plan.id} plan={plan} onChoose={handleChoose} />
//         ))}
//       </div>
//     </section>
//   );
// }
