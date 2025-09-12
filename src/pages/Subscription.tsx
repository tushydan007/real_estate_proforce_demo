import { useEffect, useState } from "react";
import PlanCard from "../components/PlanCard";
import type { Plan } from "../components/PlanCard";
import client from "../lib/client";
import { AnimatePresence, motion } from "framer-motion";

const defaultPlans: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    description: "Great for individuals just getting started.",
    price_display: "$999/month",
    price_cents: 99900,
    features: [
      "Access to core features",
      "Basic Analytics",
      "Email support",
      "1 GB storage",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Perfect for professionals who need more power.",
    price_display: "$2999/month",
    price_cents: 299900,
    features: [
      "Everything in Basic",
      "Priority support",
      "50 GB storage",
      "Advanced analytics",
    ],
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for large teams & businesses.",
    price_display: "Contact us",
    price_cents: 0,
    features: [
      "Unlimited storage",
      "Dedicated account manager",
      "24/7 support",
      "Custom integrations",
    ],
  },
];

export default function Subscription() {
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    client.get("/api/plans/").then((res) => setPlans(res.data));
  }, []);

  function formatCurrency(cents: number): string {
    return `$${(cents / 100).toFixed(0)}`;
  }

  const computedPlans = plans.map((plan) => {
    if (plan.price_cents === 0 || plan.price_display === "Contact us") {
      return {
        ...plan,
        yearly_price_display: "Contact us",
        yearly_price_cents: 0,
      };
    }
    const yearlyCents = Math.round(plan.price_cents * 12 * 0.8);
    return {
      ...plan,
      yearly_price_cents: yearlyCents,
      yearly_price_display: `${formatCurrency(yearlyCents / 100)}/year`,
    };
  });

  async function handleChoose(
    planId: string,
    provider: "stripe" | "paystack" | "paypal"
  ) {
    setLoadingProvider(provider);
    try {
      if (provider === "stripe") {
        const resp = await client.post("/api/payments/create_stripe_session/", {
          plan_id: planId,
          billing_cycle: billingCycle,
          success_url: window.location.origin + "/dashboard",
          cancel_url: window.location.href,
        });
        const { checkout_url } = resp.data;
        if (checkout_url) {
          window.location.href = checkout_url;
        }
      } else if (provider === "paystack") {
        const resp = await client.post(
          "/api/payments/create_paystack_transaction/",
          {
            plan_id: planId,
            billing_cycle: billingCycle,
            callback_url: window.location.origin + "/dashboard",
          }
        );
        const { authorization_url } = resp.data;
        if (authorization_url) {
          window.location.href = authorization_url;
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
          data.links?.find(
            (l: { rel: string; href: string }) => l.rel === "approve"
          )?.href;
        if (approve) {
          window.location.href = approve;
        }
      }
    } catch (e: unknown) {
      const errorMessage =
        e && typeof e === "object" && "message" in e
          ? String((e as Error).message)
          : "Unknown error";
      alert("Error initiating payment: " + errorMessage);
    } finally {
      setLoadingProvider(null);
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
            billingCycle === "monthly"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-black"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle("yearly")}
          className={`px-6 py-2 cursor-pointer rounded-r-lg ${
            billingCycle === "yearly"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-black"
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
            onChoose={(planId) => {
              setSelectedPlan(planId);
              setShowModal(true);
            }}
          />
        ))}
      </div>

      {/* Payment Provider Modal */}
      <AnimatePresence>
        {showModal && selectedPlan && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Overlay with blur */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            ></motion.div>

            {/* Modal Content */}
            <motion.div
              className="relative bg-black rounded-2xl shadow-2xl p-8 z-10 max-w-sm w-full border border-gray-700"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
            >
              <h3 className="text-xl font-bold text-gray-100 mb-4 text-center">
                Choose Payment Method
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleChoose(selectedPlan, "stripe")}
                  disabled={loadingProvider === "stripe"}
                  className={`w-full px-4 py-2 rounded-lg font-medium ${
                    loadingProvider === "stripe"
                      ? "bg-purple-400 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}
                >
                  {loadingProvider === "stripe"
                    ? "Processing Stripe…"
                    : "Pay with Stripe"}
                </button>

                <button
                  onClick={() => handleChoose(selectedPlan, "paystack")}
                  disabled={loadingProvider === "paystack"}
                  className={`w-full px-4 py-2 rounded-lg font-medium ${
                    loadingProvider === "paystack"
                      ? "bg-green-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {loadingProvider === "paystack"
                    ? "Processing Paystack…"
                    : "Pay with Paystack"}
                </button>

                <button
                  onClick={() => handleChoose(selectedPlan, "paypal")}
                  disabled={loadingProvider === "paypal"}
                  className={`w-full px-4 py-2 rounded-lg font-medium ${
                    loadingProvider === "paypal"
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {loadingProvider === "paypal"
                    ? "Processing PayPal…"
                    : "Pay with PayPal"}
                </button>
              </div>

              <button
                onClick={() => setShowModal(false)}
                disabled={!!loadingProvider}
                className="mt-6 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// import { useEffect, useState } from "react";
// import PlanCard from "../components/PlanCard";
// import type { Plan } from "../components/PlanCard";
// import client from "../lib/client";
// import { useNavigate } from "react-router-dom";

// // Only define monthly prices here
// const defaultPlans: Plan[] = [
//   {
//     id: "basic",
//     name: "Basic",
//     description: "Great for individuals just getting started.",
//     price_display: "$999/month",
//     price_cents: 99900,
//     features: [
//       "Access to core features",
//       "Basic Analytics",
//       "Email support",
//       "1 GB storage",
//     ],
//   },
//   {
//     id: "pro",
//     name: "Pro",
//     description: "Perfect for professionals who need more power.",
//     price_display: "$2999/month",
//     price_cents: 299900,
//     features: [
//       "Everything in Basic",
//       "Priority support",
//       "50 GB storage",
//       "Advanced analytics",
//     ],
//     highlight: true,
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
//   const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
//     "monthly"
//   );
//   const nav = useNavigate();

//   console.log(loadingPlan);
//   console.log(nav);

//   useEffect(() => {
//     client.get("/api/plans/").then((res) => setPlans(res.data));
//   }, []);

//   function formatCurrency(cents: number): string {
//     return `$${(cents / 100).toFixed(0)}`;
//   }

//   // Auto-derive yearly plans
//   const computedPlans = plans.map((plan) => {
//     if (plan.price_cents === 0 || plan.price_display === "Contact us") {
//       return {
//         ...plan,
//         yearly_price_display: "Contact us",
//         yearly_price_cents: 0,
//       };
//     }
//     const yearlyCents = Math.round(plan.price_cents * 12 * 0.8); // 20% discount
//     return {
//       ...plan,
//       yearly_price_cents: yearlyCents,
//       yearly_price_display: `${formatCurrency(yearlyCents / 100)}/year`,
//     };
//   });

//   async function handleChoose(planId: string) {
//     const provider = window.prompt(
//       "Enter provider to use (stripe/paystack/paypal) — try 'stripe'"
//     );
//     if (!provider) return;
//     setLoadingPlan(planId);
//     try {
//       if (provider === "stripe") {
//         const resp = await client.post("/api/payments/create_stripe_session/", {
//           plan_id: planId,
//           billing_cycle: billingCycle,
//           success_url: window.location.origin + "/dashboard",
//           cancel_url: window.location.href,
//         });
//         const data = resp.data;
//         if (data.checkout_url) {
//           window.location.href = data.checkout_url;
//         }
//       } else if (provider === "paystack") {
//         const resp = await client.post(
//           "/api/payments/create_paystack_transaction/",
//           {
//             plan_id: planId,
//             billing_cycle: billingCycle,
//             callback_url: window.location.href,
//           }
//         );
//         const data = resp.data;
//         if (data.authorization_url) {
//           window.location.href = data.authorization_url;
//         }
//       } else if (provider === "paypal") {
//         const resp = await client.post("/api/payments/create_paypal_order/", {
//           plan_id: planId,
//           billing_cycle: billingCycle,
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
//     <section className="py-16 bg-black min-h-screen px-4 md:px-6">
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

//       {/* Toggle */}
//       <div className="flex justify-center mb-10">
//         <button
//           onClick={() => setBillingCycle("monthly")}
//           className={`px-6 py-2 cursor-pointer rounded-l-lg ${
//             billingCycle === "monthly"
//               ? "bg-blue-600 text-white"
//               : "bg-gray-200 text-black"
//           }`}
//         >
//           Monthly
//         </button>
//         <button
//           onClick={() => setBillingCycle("yearly")}
//           className={`px-6 py-2 cursor-pointer rounded-r-lg ${
//             billingCycle === "yearly"
//               ? "bg-blue-600 text-white"
//               : "bg-gray-200 text-black"
//           }`}
//         >
//           Yearly
//         </button>
//       </div>

//       {/* Plan Cards */}
//       <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
//         {computedPlans.map((plan) => (
//           <PlanCard
//             key={plan.id}
//             plan={plan}
//             billingCycle={billingCycle}
//             onChoose={handleChoose}
//           />
//         ))}
//       </div>
//     </section>
//   );
// }
