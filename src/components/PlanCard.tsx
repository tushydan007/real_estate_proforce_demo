import { motion } from "framer-motion";

export type Plan = {
  id: string;
  name: string;
  description?: string;
  price_display: string; // monthly string like "$9/month"
  price_cents: number;   // monthly price in cents
  features: string[];
  highlight?: boolean;
};

export default function PlanCard({
  plan,
  onChoose,
  billingCycle,
}: {
  plan: Plan;
  onChoose: (id: string, billingCycle: "monthly" | "yearly") => void;
  billingCycle: "monthly" | "yearly";
}) {
  // Convert cents → dollars
  const monthlyPrice = plan.price_cents / 100;

  // Yearly prices
  const yearlyOriginal = monthlyPrice * 12;
  const yearlyDiscounted = yearlyOriginal * 0.8;

  const priceDisplay =
    billingCycle === "monthly"
      ? plan.price_display
      : plan.price_cents === 0
      ? "Contact us"
      : `$${yearlyDiscounted.toFixed(0)}/yr`;

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className={`relative border border-gray-700 rounded-2xl p-6 bg-[#0C111C] shadow-sm hover:shadow-xl cursor-pointer`}
    >
      {/* Highlighted Plan */}
      {plan.highlight && (
        <span className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full shadow">
          Best Value
        </span>
      )}

      {/* Yearly Discount Badge */}
      {billingCycle === "yearly" && plan.price_cents > 0 && (
        <span className="absolute top-3 left-3 bg-green-600 text-white text-xs font-medium px-3 py-1 rounded-full shadow">
          Save 20%
        </span>
      )}

      <h3 className="text-2xl font-semibold text-gray-200 mt-3">{plan.name}</h3>
      {plan.description && (
        <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
      )}

      {/* Price Display */}
      <div className="text-4xl font-bold my-6 text-gray-200">
        {billingCycle === "yearly" && plan.price_cents > 0 ? (
          <div className="flex flex-col items-start">
            <span>
              <span className="line-through text-gray-400 text-2xl mr-2">
                ${yearlyOriginal.toFixed(0)}/yr
              </span>
              <span>{priceDisplay}</span>
            </span>
          </div>
        ) : (
          priceDisplay
        )}
      </div>

      {/* Features */}
      <ul className="mb-6 space-y-2">
        {plan.features.map((f, i) => (
          <li key={i} className="text-sm text-gray-200 flex items-center">
            <span className="mr-2 text-blue-500">✔</span> {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onChoose(plan.id, billingCycle)}
        className="w-full bg-white text-black hover:bg-white/80 cursor-pointer font-semibold py-3 px-4 rounded-xl transition-colors duration-200"
      >
        Choose Plan
      </button>
    </motion.div>
  );
}





// import { motion } from "framer-motion";

// export type Plan = {
//   id: string;
//   name: string;
//   description?: string;
//   price_display: string;
//   price_cents: number;
//   features: string[];
//   highlight?: boolean; // e.g. for "Best Value"
// };

// export default function PlanCard({
//   plan,
//   onChoose,
// }: {
//   plan: Plan;
//   onChoose: (id: string) => void;
// }) {
//   return (
//     <motion.div
//       whileHover={{ scale: 1.05, y: -5 }}
//       transition={{ type: "spring", stiffness: 200, damping: 15 }}
//       className={`relative border border-gray-700 rounded-2xl p-6 bg-[#0C111C] shadow-sm hover:shadow-xl cursor-pointer`}
//     >
//       {plan.highlight && (
//         <span className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full shadow">
//           Best Value
//         </span>
//       )}

//       <h3 className="text-2xl font-semibold text-gray-200">{plan.name}</h3>
//       {plan.description && (
//         <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
//       )}

//       <div className="text-4xl font-bold my-6 text-gray-200">
//         {plan.price_display}
//       </div>

//       <ul className="mb-6 space-y-2">
//         {plan.features.map((f, i) => (
//           <li key={i} className="text-sm text-gray-200 flex items-center">
//             <span className="mr-2 text-blue-500">✔</span> {f}
//           </li>
//         ))}
//       </ul>

//       <button
//         onClick={() => onChoose(plan.id)}
//         className="w-full bg-white text-black hover:bg-white/80 cursor-pointer font-semibold py-3 px-4 rounded-xl transition-colors duration-200"
//       >
//         Choose Plan
//       </button>
//     </motion.div>
//   );
// }
