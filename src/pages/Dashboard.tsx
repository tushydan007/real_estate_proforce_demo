import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../lib/client";
import { Menu, LogOut, MapPin, Users, Calendar, BarChart3, AlertCircle } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import type { Feature } from "geojson";

type AOI = {
  id: string;
  name: string;
  geojson: Feature;
  created_at: string;
  status: "active" | "inactive";
  center_lat: number;
  center_lng: number;
  area_sqkm?: number;
};

export default function Dashboard() {
  const [aois, setAois] = useState<AOI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const res = await client.get("/api/aois/my/");
        setAois(res.data);
      } catch (e) {
        console.error(e);
        setError("Failed to load your AOIs. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeAois = aois.filter((aoi) => aoi.status === "active");
  const inactiveAois = aois.filter((aoi) => aoi.status === "inactive");
  const totalAois = aois.length;

  const pieData = [
    { name: "Active AOIs", value: activeAois.length },
    { name: "Inactive AOIs", value: inactiveAois.length },
  ];

  const COLORS = ["#10B981", "#EF4444"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-300 bg-gray-900">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  const handleViewAoi = (id: string) => {
    navigate(`/map/${id}`);
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <aside
        className={`fixed z-20 inset-y-0 left-0 w-64 bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
          <h1 className="text-lg font-bold text-white">MyApp</h1>
          <button
            className="md:hidden p-2 rounded hover:bg-gray-700 text-white"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        <nav className="mt-6 space-y-2">
          <a
            href="/dashboard"
            className="block px-6 py-2 text-gray-300 hover:bg-gray-700 hover:text-blue-400 transition rounded"
          >
            <MapPin className="w-4 h-4 inline mr-2" />
            Dashboard
          </a>
          <a
            href="/aois"
            className="block px-6 py-2 text-gray-300 hover:bg-gray-700 hover:text-blue-400 transition rounded"
          >
            <Users className="w-4 h-4 inline mr-2" />
            My AOIs
          </a>
          <a
            href="/settings"
            className="block px-6 py-2 text-gray-300 hover:bg-gray-700 hover:text-blue-400 transition rounded"
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Settings
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        {/* Topbar */}
        <header className="flex items-center justify-between bg-gray-800 shadow px-4 py-3 border-b border-gray-700">
          <button
            className="md:hidden p-2 rounded hover:bg-gray-700 text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-white">Dashboard</h2>
          <button
            className="flex items-center space-x-1 px-3 py-1.5 bg-red-900/20 text-red-300 rounded-lg hover:bg-red-900/30 transition border border-red-500/30"
            onClick={() => navigate("/logout")}
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 text-white">
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 inline mr-2 text-red-400" />
              <span className="text-red-300">{error}</span>
            </div>
          )}

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition border border-gray-700">
              <div className="flex items-center">
                <MapPin className="w-6 h-6 text-blue-400 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Total AOIs</h3>
                  <p className="mt-1 text-2xl font-bold text-white">{totalAois}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition border border-gray-700">
              <div className="flex items-center">
                <BarChart3 className="w-6 h-6 text-green-400 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Active</h3>
                  <p className="mt-1 text-2xl font-bold text-white">{activeAois.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition border border-gray-700">
              <div className="flex items-center">
                <AlertCircle className="w-6 h-6 text-red-400 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Inactive</h3>
                  <p className="mt-1 text-2xl font-bold text-white">{inactiveAois.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition border border-gray-700">
              <div className="flex items-center">
                <Calendar className="w-6 h-6 text-yellow-400 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Recent</h3>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {aois.slice(0, 1).length > 0
                      ? new Date(aois[0].created_at).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AOI Status Chart */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
              AOI Status Overview
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent as number) * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} AOIs`, "Count"]}
                  labelFormatter={(name) => `${name}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Recent AOIs List */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Recent AOIs</h3>
            {totalAois === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No AOIs yet. Draw your first Area of Interest and complete checkout to get started!</p>
                <a
                  href="/draw-aoi"
                  className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Draw AOI
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aois.slice(0, 6).map((aoi) => (
                  <div
                    key={aoi.id}
                    className="bg-gray-700 rounded-lg p-4 shadow-md hover:shadow-lg transition border border-gray-600"
                  >
                    <h4 className="font-medium text-white mb-2 truncate">{aoi.name}</h4>
                    <p className="text-sm text-gray-400 mb-2">
                      Created: {new Date(aoi.created_at).toLocaleDateString()}
                    </p>
                    {aoi.area_sqkm && (
                      <p className="text-sm text-gray-400 mb-3">
                        Area: {aoi.area_sqkm.toFixed(2)} sq km
                      </p>
                    )}
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                        aoi.status === "active"
                          ? "bg-green-600 text-green-100"
                          : "bg-red-600 text-red-100"
                      }`}
                    >
                      {aoi.status.toUpperCase()}
                    </span>
                    <button
                      onClick={() => handleViewAoi(aoi.id)}
                      className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                    >
                      View on Map
                    </button>
                  </div>
                ))}
              </div>
            )}
            {totalAois > 6 && (
              <div className="text-center mt-4">
                <a
                  href="/aois"
                  className="text-blue-400 hover:text-blue-300 transition"
                >
                  View All AOIs ({totalAois})
                </a>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};








// import { useEffect, useState } from "react";
// import client from "../lib/client";
// import { Menu, LogOut } from "lucide-react";

// type Subscription = {
//   is_active: boolean;
//   plan_name: string;
//   end_date: string;
//   is_trial: boolean;
//   trial_end: string;
// };

// export default function Dashboard() {
//   const [subscription, setSubscription] = useState<Subscription | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   useEffect(() => {
//     async function load() {
//       try {
//         const res = await client.get("/api/subscriptions/my/");
//         setSubscription(res.data);
//       } catch (e) {
//         console.error(e);
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();
//   }, []);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen text-gray-600">
//         Loading dashboard...
//       </div>
//     );
//   }

//   return (
//     <div className="flex h-screen bg-gray-100">
//       {/* Sidebar */}
//       <aside
//         className={`fixed z-20 inset-y-0 left-0 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out 
//         ${
//           sidebarOpen ? "translate-x-0" : "-translate-x-full"
//         } md:translate-x-0`}
//       >
//         <div className="flex items-center justify-between px-4 py-4 border-b">
//           <h1 className="text-lg font-bold text-gray-800">MyApp</h1>
//           <button
//             className="md:hidden p-2 rounded hover:bg-gray-100"
//             onClick={() => setSidebarOpen(false)}
//           >
//             ✕
//           </button>
//         </div>
//         <nav className="mt-6 space-y-2">
//           <a
//             href="/dashboard"
//             className="block px-6 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition rounded"
//           >
//             Dashboard
//           </a>
//           <a
//             href="/subscription"
//             className="block px-6 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition rounded"
//           >
//             Subscription Plans
//           </a>
//           <a
//             href="/settings"
//             className="block px-6 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition rounded"
//           >
//             Settings
//           </a>
//         </nav>
//       </aside>

//       {/* Main content */}
//       <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
//         {/* Topbar */}
//         <header className="flex items-center justify-between bg-white shadow px-4 py-3">
//           <button
//             className="md:hidden p-2 rounded hover:bg-gray-100"
//             onClick={() => setSidebarOpen(true)}
//           >
//             <Menu className="w-5 h-5" />
//           </button>
//           <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>
//           <button className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
//             <LogOut className="w-4 h-4" />
//             <span>Logout</span>
//           </button>
//         </header>

//         {/* Page content */}
//         <main className="flex-1 overflow-y-auto p-6 space-y-6">
//           {/* Stats cards */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//             <div className="bg-white rounded-xl p-5 shadow hover:shadow-md transition">
//               <h3 className="text-sm font-medium text-gray-500">Active Plan</h3>
//               <p className="mt-2 text-xl font-bold text-gray-800">
//                 {subscription?.is_active ? subscription.plan_name : "None"}
//               </p>
//             </div>
//             <div className="bg-white rounded-xl p-5 shadow hover:shadow-md transition">
//               <h3 className="text-sm font-medium text-gray-500">Status</h3>
//               <p className="mt-2 text-xl font-bold text-gray-800">
//                 {subscription?.is_active ? "Active ✅" : "Inactive ❌"}
//               </p>
//             </div>
//             <div className="bg-white rounded-xl p-5 shadow hover:shadow-md transition">
//               <h3 className="text-sm font-medium text-gray-500">Valid Until</h3>
//               <p className="mt-2 text-xl font-bold text-gray-800">
//                 {subscription?.is_active
//                   ? new Date(subscription.end_date).toLocaleDateString()
//                   : "-"}
//               </p>
//             </div>
//             <div className="bg-white rounded-xl p-5 shadow hover:shadow-md transition">
//               <h3 className="text-sm font-medium text-gray-500">Trial</h3>
//               <p className="mt-2 text-xl font-bold text-gray-800">
//                 {subscription?.is_trial
//                   ? `Ends ${new Date(
//                       subscription.trial_end
//                     ).toLocaleDateString()}`
//                   : "No Trial"}
//               </p>
//             </div>
//           </div>

//           {/* Subscription details */}
//           <div className="bg-white rounded-xl shadow p-6">
//             {subscription && subscription.is_active ? (
//               <>
//                 <h3 className="text-lg font-semibold text-gray-800">
//                   Your Subscription
//                 </h3>
//                 <p className="mt-2 text-gray-600">
//                   You are currently subscribed to the{" "}
//                   <span className="font-medium text-blue-600">
//                     {subscription.plan_name}
//                   </span>{" "}
//                   plan.
//                 </p>
//                 <p className="mt-1 text-gray-600">
//                   Active until:{" "}
//                   {new Date(subscription.end_date).toLocaleString()}
//                 </p>
//                 {subscription.is_trial && (
//                   <p className="mt-1 text-sm text-green-700">
//                     Free trial ends on{" "}
//                     {new Date(subscription.trial_end).toLocaleString()}
//                   </p>
//                 )}
//               </>
//             ) : (
//               <>
//                 <h3 className="text-lg font-semibold text-gray-800">
//                   No Active Subscription
//                 </h3>
//                 <p className="mt-2 text-gray-600">
//                   Your trial has ended or you don’t have an active subscription.
//                 </p>
//                 <a
//                   href="/subscription"
//                   className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
//                 >
//                   View Plans
//                 </a>
//               </>
//             )}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }
