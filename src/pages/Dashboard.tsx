import { useEffect, useState } from "react";
import client from "../lib/client";

export default function Dashboard() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await client.get("/api/subscriptions/my/"); // you may have different endpoint
        setSubscription(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!subscription || !subscription.is_active) {
    return (
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold">No active subscription</h2>
        <p>
          Your trial ended or you don't have an active subscription. Visit{" "}
          <a href="/subscription" className="text-blue-600">
            Plans
          </a>{" "}
          to subscribe.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold">Welcome back</h2>
      <p>Subscription: {subscription.plan_name}</p>
      <p>Active until: {new Date(subscription.end_date).toLocaleString()}</p>
      {subscription.is_trial && (
        <p className="text-sm text-green-700">
          You are on a free trial ending{" "}
          {new Date(subscription.trial_end).toLocaleString()}
        </p>
      )}
    </div>
  );
}
