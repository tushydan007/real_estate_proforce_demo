import { useEffect, useState } from "react";
import client from "../lib/client";
import { Menu, LogOut } from "lucide-react";

type Subscription = {
  is_active: boolean;
  plan_name: string;
  end_date: string;
  is_trial: boolean;
  trial_end: string;
};

export default function Dashboard() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await client.get("/api/subscriptions/my/");
        setSubscription(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed z-20 inset-y-0 left-0 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out 
        ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <h1 className="text-lg font-bold text-gray-800">MyApp</h1>
          <button
            className="md:hidden p-2 rounded hover:bg-gray-100"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        <nav className="mt-6 space-y-2">
          <a
            href="/dashboard"
            className="block px-6 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition rounded"
          >
            Dashboard
          </a>
          <a
            href="/subscription"
            className="block px-6 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition rounded"
          >
            Subscription Plans
          </a>
          <a
            href="/settings"
            className="block px-6 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition rounded"
          >
            Settings
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        {/* Topbar */}
        <header className="flex items-center justify-between bg-white shadow px-4 py-3">
          <button
            className="md:hidden p-2 rounded hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>
          <button className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-5 shadow hover:shadow-md transition">
              <h3 className="text-sm font-medium text-gray-500">Active Plan</h3>
              <p className="mt-2 text-xl font-bold text-gray-800">
                {subscription?.is_active ? subscription.plan_name : "None"}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow hover:shadow-md transition">
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-2 text-xl font-bold text-gray-800">
                {subscription?.is_active ? "Active ✅" : "Inactive ❌"}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow hover:shadow-md transition">
              <h3 className="text-sm font-medium text-gray-500">Valid Until</h3>
              <p className="mt-2 text-xl font-bold text-gray-800">
                {subscription?.is_active
                  ? new Date(subscription.end_date).toLocaleDateString()
                  : "-"}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow hover:shadow-md transition">
              <h3 className="text-sm font-medium text-gray-500">Trial</h3>
              <p className="mt-2 text-xl font-bold text-gray-800">
                {subscription?.is_trial
                  ? `Ends ${new Date(
                      subscription.trial_end
                    ).toLocaleDateString()}`
                  : "No Trial"}
              </p>
            </div>
          </div>

          {/* Subscription details */}
          <div className="bg-white rounded-xl shadow p-6">
            {subscription && subscription.is_active ? (
              <>
                <h3 className="text-lg font-semibold text-gray-800">
                  Your Subscription
                </h3>
                <p className="mt-2 text-gray-600">
                  You are currently subscribed to the{" "}
                  <span className="font-medium text-blue-600">
                    {subscription.plan_name}
                  </span>{" "}
                  plan.
                </p>
                <p className="mt-1 text-gray-600">
                  Active until:{" "}
                  {new Date(subscription.end_date).toLocaleString()}
                </p>
                {subscription.is_trial && (
                  <p className="mt-1 text-sm text-green-700">
                    Free trial ends on{" "}
                    {new Date(subscription.trial_end).toLocaleString()}
                  </p>
                )}
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-800">
                  No Active Subscription
                </h3>
                <p className="mt-2 text-gray-600">
                  Your trial has ended or you don’t have an active subscription.
                </p>
                <a
                  href="/subscription"
                  className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                >
                  View Plans
                </a>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
