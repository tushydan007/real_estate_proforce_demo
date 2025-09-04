import { motion } from "framer-motion";

export type Plan = {
  id: string;
  name: string;
  description?: string;
  price_display: string;
  price_cents: number;
  features: string[];
  highlight?: boolean; // e.g. for "Best Value"
};

export default function PlanCard({
  plan,
  onChoose,
}: {
  plan: Plan;
  onChoose: (id: string) => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className={`relative border rounded-2xl p-6 bg-white shadow-sm hover:shadow-xl cursor-pointer`}
    >
      {plan.highlight && (
        <span className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full shadow">
          Best Value
        </span>
      )}

      <h3 className="text-2xl font-semibold text-gray-800">{plan.name}</h3>
      {plan.description && (
        <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
      )}

      <div className="text-4xl font-bold my-6 text-gray-900">
        {plan.price_display}
      </div>

      <ul className="mb-6 space-y-2">
        {plan.features.map((f, i) => (
          <li key={i} className="text-sm text-gray-600 flex items-center">
            <span className="mr-2 text-blue-500">✔</span> {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onChoose(plan.id)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200"
      >
        Choose Plan
      </button>
    </motion.div>
  );
}
