import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  MapPin,
  Users,
  Calendar,
  BarChart3,
  AlertCircle,
  TrendingUp,
  Activity,
  Zap,
  RefreshCw,
  Search,
  Eye,
  MoreVertical,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import type { Feature } from "geojson";
import LoadingSpinner from "@/components/LoadingSpinner";

// Mock client for demo purposes
const client = {
  get: async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (Math.random() > 0.9) throw new Error("Network error");

    const mockData = Array.from({ length: 12 }, (_, i) => ({
      id: `aoi-${i + 1}`,
      name: `Area of Interest ${i + 1}`,
      geojson: {} as Feature,
      created_at: new Date(
        2024,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28)
      ).toISOString(),
      status: Math.random() > 0.3 ? "active" : "inactive",
      center_lat: 40.7128 + (Math.random() - 0.5) * 0.1,
      center_lng: -74.006 + (Math.random() - 0.5) * 0.1,
      area_sqkm: Math.random() * 1000 + 10,
      alerts: Math.floor(Math.random() * 10),
      last_updated: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    }));

    return { data: mockData };
  },
};

type AOI = {
  id: string;
  name: string;
  geojson: Feature;
  created_at: string;
  status: "active" | "inactive";
  center_lat: number;
  center_lng: number;
  area_sqkm?: number;
  alerts?: number;
  last_updated?: string;
};

type TimeFilter = "7d" | "30d" | "90d" | "all";
type StatusFilter = "all" | "active" | "inactive";

// const LoadingSpinner = () => (
//   <div className="flex items-center justify-center h-64">
//     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
//   </div>
// );

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        <AlertCircle className="w-6 h-6 mr-2" />
        Something went wrong. Please refresh the page.
      </div>
    );
  }

  return <>{children}</>;
};

export default function Dashboard() {
  const [aois, setAois] = useState<AOI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("30d");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const res = await client.get();
      setAois(
        res.data.map((aoi) => ({
          ...aoi,
          status: aoi.status === "active" ? "active" : "inactive",
        }))
      );
    } catch (e) {
      console.error(e);
      setError("Failed to load your AOIs. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
  }, [loadData]);

  // Filtered and processed data
  const filteredAois = useMemo(() => {
    return aois.filter((aoi) => {
      const matchesStatus =
        statusFilter === "all" || aoi.status === statusFilter;
      const matchesSearch = aoi.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      let matchesTime = true;
      if (timeFilter !== "all") {
        const days = parseInt(timeFilter.replace("d", ""));
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        matchesTime = new Date(aoi.created_at) >= cutoff;
      }

      return matchesStatus && matchesSearch && matchesTime;
    });
  }, [aois, statusFilter, searchTerm, timeFilter]);

  const stats = useMemo(() => {
    const active = filteredAois.filter((aoi) => aoi.status === "active");
    const inactive = filteredAois.filter((aoi) => aoi.status === "inactive");
    const totalAlerts = filteredAois.reduce(
      (sum, aoi) => sum + (aoi.alerts || 0),
      0
    );
    const totalArea = filteredAois.reduce(
      (sum, aoi) => sum + (aoi.area_sqkm || 0),
      0
    );

    return {
      total: filteredAois.length,
      active: active.length,
      inactive: inactive.length,
      alerts: totalAlerts,
      totalArea: totalArea,
      avgArea: filteredAois.length ? totalArea / filteredAois.length : 0,
    };
  }, [filteredAois]);

  // Chart data
  const pieData = useMemo(
    () => [
      { name: "Active AOIs", value: stats.active, color: "#10B981" },
      { name: "Inactive AOIs", value: stats.inactive, color: "#EF4444" },
    ],
    [stats]
  );

  const timeSeriesData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        active: Math.floor(Math.random() * 20) + 10,
        inactive: Math.floor(Math.random() * 10) + 5,
        alerts: Math.floor(Math.random() * 15) + 2,
      };
    });
    return last7Days;
  }, []);

  const areaDistribution = useMemo(() => {
    const ranges = [
      { range: "0-50 km²", count: 0, color: "#3B82F6" },
      { range: "50-200 km²", count: 0, color: "#10B981" },
      { range: "200-500 km²", count: 0, color: "#F59E0B" },
      { range: "500+ km²", count: 0, color: "#EF4444" },
    ];

    filteredAois.forEach((aoi) => {
      const area = aoi.area_sqkm || 0;
      if (area <= 50) ranges[0].count++;
      else if (area <= 200) ranges[1].count++;
      else if (area <= 500) ranges[2].count++;
      else ranges[3].count++;
    });

    return ranges;
  }, [filteredAois]);

  const handleViewAoi = useCallback(
    (id: string) => {
      navigate(`/map/${id}`);
    },
    [navigate]
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900">
        {/* Sidebar */}
        <aside
          className={`fixed z-20 inset-y-0 left-0 w-64 bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
            {/* <h1 className="text-lg font-bold text-white">MyApp</h1> */}
            <button
              className="md:hidden p-2 rounded hover:bg-gray-700 text-white"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>
          <nav className="mt-6 space-y-2" role="navigation">
            <a
              href="/dashboard"
              className="block px-6 py-2 text-gray-300 hover:bg-gray-700 hover:text-blue-400 transition rounded"
              aria-current="page"
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
        <div className="md:ml-64">
          {/* Header */}
          <header className="flex items-center justify-between bg-gray-800 shadow px-4 py-3 border-b border-gray-700 sticky top-0 z-10">
            <div className="flex items-center space-x-4">
              <button
                className="md:hidden p-2 rounded hover:bg-gray-700 text-white"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Layout className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-white">Dashboard</h2>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition border border-gray-600 disabled:opacity-50"
                aria-label="Refresh data"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="p-6 space-y-6 text-white">
            {error && (
              <div
                className="bg-red-900/20 border border-red-500/30 rounded-lg p-4"
                role="alert"
              >
                <AlertCircle className="w-5 h-5 inline mr-2 text-red-400" />
                <span className="text-red-300">{error}</span>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center justify-between bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search AOIs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as StatusFilter)
                  }
                  className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <select
                  aria-label="Filter by time"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                  className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition border border-gray-700">
                <div className="flex items-center">
                  <MapPin className="w-6 h-6 text-blue-400 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">
                      Total AOIs
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {stats.total}
                    </p>
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +12% from last month
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition border border-gray-700">
                <div className="flex items-center">
                  <BarChart3 className="w-6 h-6 text-green-400 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">
                      Active
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {stats.active}
                    </p>
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <Activity className="w-3 h-3 mr-1" />
                      {stats.total > 0
                        ? ((stats.active / stats.total) * 100).toFixed(1)
                        : 0}
                      % active rate
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition border border-gray-700">
                <div className="flex items-center">
                  <AlertCircle className="w-6 h-6 text-red-400 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">
                      Alerts
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {stats.alerts}
                    </p>
                    <p className="text-xs text-orange-600 mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Needs attention
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition border border-gray-700">
                <div className="flex items-center">
                  <Calendar className="w-6 h-6 text-yellow-400 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">
                      Total Area
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {stats.totalArea.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      sq km monitored
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution Pie Chart */}
              <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                  AOI Status Distribution
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
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} AOIs`, "Count"]}
                      contentStyle={{
                        backgroundColor: "rgb(31 41 55)",
                        border: "none",
                        borderRadius: "8px",
                        color: "white",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Activity Timeline */}
              <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-green-400" />
                  7-Day Activity Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgb(31 41 55)",
                        border: "none",
                        borderRadius: "8px",
                        color: "white",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="active"
                      stackId="1"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="inactive"
                      stackId="1"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Area Distribution Bar Chart */}
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
                Area Size Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={areaDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="range" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgb(31 41 55)",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                    }}
                  />
                  <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]}>
                    {areaDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent AOIs Table */}
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700">
              <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                  Recent AOIs
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-700 text-gray-400 rounded-full">
                    {filteredAois.length}
                  </span>
                </h3>
              </div>

              {filteredAois.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h4 className="text-lg font-medium text-white mb-2">
                    No AOIs found
                  </h4>
                  <p className="text-gray-400 mb-6">
                    {searchTerm ||
                    statusFilter !== "all" ||
                    timeFilter !== "all"
                      ? "Try adjusting your filters or search terms."
                      : "Create your first Area of Interest to get started monitoring!"}
                  </p>
                  {!searchTerm &&
                    statusFilter === "all" &&
                    timeFilter === "all" && (
                      <button
                        onClick={() => navigate("/draw-aoi")}
                        className="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Create AOI
                      </button>
                    )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {filteredAois.slice(0, 9).map((aoi) => (
                      <div
                        key={aoi.id}
                        className="bg-gray-700 rounded-lg p-4 shadow-md hover:shadow-lg transition border border-gray-600"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-white truncate mr-2">
                            {aoi.name}
                          </h4>
                          <div className="flex items-center space-x-1">
                            <span
                              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                aoi.status === "active"
                                  ? "bg-green-600 text-green-100"
                                  : "bg-red-600 text-red-100"
                              }`}
                            >
                              {aoi.status.toUpperCase()}
                            </span>
                            <button
                              className="p-1 text-gray-400 hover:text-white"
                              aria-label="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-400 mb-4">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            Created:{" "}
                            {new Date(aoi.created_at).toLocaleDateString()}
                          </div>
                          {aoi.area_sqkm && (
                            <div className="flex items-center">
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Area: {aoi.area_sqkm.toFixed(2)} km²
                            </div>
                          )}
                          {aoi.alerts && aoi.alerts > 0 && (
                            <div className="flex items-center">
                              <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
                              {aoi.alerts} alert{aoi.alerts !== 1 ? "s" : ""}
                            </div>
                          )}
                          {aoi.last_updated && (
                            <div className="flex items-center">
                              <Activity className="w-4 h-4 mr-2" />
                              Updated:{" "}
                              {new Date(aoi.last_updated).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewAoi(aoi.id)}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Map
                          </button>
                          <button
                            className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded-lg transition"
                            onClick={() => navigate(`/aois/${aoi.id}/edit`)}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredAois.length > 9 && (
                    <div className="px-6 py-4 border-t border-gray-700 bg-gray-700/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                          Showing 9 of {filteredAois.length} AOIs
                        </span>
                        <a
                          href="/aois"
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition"
                        >
                          View All AOIs →
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-purple-400" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => navigate("/draw-aoi")}
                  className="flex items-center justify-center p-4 bg-blue-900/20 hover:bg-blue-900/30 text-blue-400 rounded-lg transition border border-blue-500/30"
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Create New AOI
                </button>
                <button
                  onClick={() => navigate("/analytics")}
                  className="flex items-center justify-center p-4 bg-green-900/20 hover:bg-green-900/30 text-green-400 rounded-lg transition border border-green-500/30"
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  View Analytics
                </button>
                <button
                  onClick={() => navigate("/alerts")}
                  className="flex items-center justify-center p-4 bg-orange-900/20 hover:bg-orange-900/30 text-orange-400 rounded-lg transition border border-orange-500/30"
                >
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Manage Alerts
                </button>
                <button
                  onClick={() => navigate("/export")}
                  className="flex items-center justify-center p-4 bg-purple-900/20 hover:bg-purple-900/30 text-purple-400 rounded-lg transition border border-purple-500/30"
                >
                  <Activity className="w-5 h-5 mr-2" />
                  Export Data
                </button>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                Performance Metrics
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgb(31 41 55)",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="active"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#10B981", strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="inactive"
                    stroke="#EF4444"
                    strokeWidth={3}
                    dot={{ fill: "#EF4444", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#EF4444", strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="alerts"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    dot={{ fill: "#F59E0B", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#F59E0B", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </main>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
