export type Plan = {
  id: string;
  name: string;
  price_display: string;
  price_cents: number;
  features: string[];
};

export default function PlanCard({
  plan,
  onChoose,
}: {
  plan: Plan;
  onChoose: (id: string) => void;
}) {
  return (
    <div className="border rounded p-6 bg-white">
      <h3 className="text-xl font-semibold">{plan.name}</h3>
      <div className="text-3xl my-4">{plan.price_display}</div>
      <ul className="mb-4 space-y-1">
        {plan.features.map((f, i) => (
          <li key={i} className="text-sm">
            • {f}
          </li>
        ))}
      </ul>
      <button onClick={() => onChoose(plan.id)} className="btn-primary w-full">
        Choose plan
      </button>
    </div>
  );
}
