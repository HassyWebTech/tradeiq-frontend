import { useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  Users, TrendingDown, AlertTriangle, CheckCircle, Upload, MessageSquare
} from "lucide-react";

const API = "https://tradeiq-xlam.onrender.com";

export default function App() {
  const [file, setFile] = useState(null);
  const [filepath, setFilepath] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleUpload = async () => {
    if (!file) return alert("Please select a CSV file first.");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${API}/upload`, formData);
      const fp = res.data.filepath;
      setFilepath(fp);

      const [dashRes, personaRes] = await Promise.all([
        axios.get(`${API}/dashboard`, { params: { filepath: fp } }),
        axios.get(`${API}/personas`, { params: { filepath: fp } }),
      ]);

      setDashboard(dashRes.data);
      setPersonas(personaRes.data.customers);
    } catch (err) {
      alert("Error uploading file. Make sure the backend is running.");
    }
    setLoading(false);
  };

  const handleRecommendations = async () => {
    if (!filepath) return alert("Please upload a file first.");
    setLoading(true);
    try {
      const res = await axios.get(`${API}/recommendations`, {
        params: { filepath },
      });
      setRecommendations(res.data.recommendations);
      setActiveTab("recommendations");
    } catch (err) {
      alert("Error generating recommendations.");
    }
    setLoading(false);
  };

  const riskColor = (risk) => {
    if (risk === "Active") return "bg-green-100 text-green-700";
    if (risk === "At Risk") return "bg-yellow-100 text-yellow-700";
    if (risk === "High Risk") return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
  };

  const chartData = dashboard
    ? [
        { name: "Active", value: dashboard.active, fill: "#22c55e" },
        { name: "At Risk", value: dashboard.at_risk, fill: "#eab308" },
        { name: "High Risk", value: dashboard.high_risk, fill: "#f97316" },
        { name: "Lost", value: dashboard.lost, fill: "#ef4444" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-700">TradeIQ</h1>
          <p className="text-sm text-gray-500">Know Your Customer</p>
        </div>
        <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
          AI-Powered
        </span>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Upload size={20} className="text-blue-600" />
            Upload Customer Data
          </h2>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100"
            />
            <button
              onClick={handleUpload}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Analysing..." : "Analyse Customers"}
            </button>
            {dashboard && (
              <button
                onClick={handleRecommendations}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <MessageSquare size={16} />
                {loading ? "Generating..." : "Get Re-engagement Messages"}
              </button>
            )}
          </div>
        </div>

        {/* Dashboard */}
        {dashboard && (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {["dashboard", "customers", "recommendations"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                    activeTab === tab
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 border hover:bg-gray-50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Total Customers", value: dashboard.total_customers, icon: <Users size={20} />, color: "text-blue-600 bg-blue-50" },
                    { label: "Active", value: dashboard.active, icon: <CheckCircle size={20} />, color: "text-green-600 bg-green-50" },
                    { label: "At Risk", value: dashboard.at_risk + dashboard.high_risk, icon: <AlertTriangle size={20} />, color: "text-orange-600 bg-orange-50" },
                    { label: "Lost", value: dashboard.lost, icon: <TrendingDown size={20} />, color: "text-red-600 bg-red-50" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl shadow-sm border p-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                        {stat.icon}
                      </div>
                      <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Chart + Top Customer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <h3 className="font-semibold text-gray-700 mb-4">Customer Health</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <h3 className="font-semibold text-gray-700 mb-4">Revenue Summary</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Total Revenue</p>
                        <p className="text-3xl font-bold text-blue-700">
                          ₦{dashboard.total_revenue.toLocaleString()}
                        </p>
                      </div>
                      <div className="border-t pt-4">
                        <p className="text-sm text-gray-500">Top Customer</p>
                        <p className="text-xl font-bold text-gray-800">{dashboard.top_customer}</p>
                        <p className="text-sm text-green-600 font-medium">
                          ₦{dashboard.top_customer_spend.toLocaleString()} total spend
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Customers Tab */}
            {activeTab === "customers" && (
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {["Customer", "Segment", "Risk", "Orders", "Total Spend", "Last Purchase", "Favourite Product"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {personas.map((p, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{p.customer_name}</td>
                        <td className="px-4 py-3 text-gray-600">{p.value_segment}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskColor(p.churn_risk)}`}>
                            {p.churn_risk}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.purchase_count}</td>
                        <td className="px-4 py-3 text-gray-800 font-medium">₦{p.total_spend.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600">{p.last_purchase_date}</td>
                        <td className="px-4 py-3 text-gray-600">{p.favourite_product}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Recommendations Tab */}
            {activeTab === "recommendations" && (
              <div className="space-y-4">
                {recommendations.length === 0 ? (
                  <div className="bg-white rounded-2xl border p-8 text-center text-gray-500">
                    Click "Get Re-engagement Messages" to generate AI recommendations.
                  </div>
                ) : (
                  recommendations.map((rec, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800">{rec.customer_name}</h3>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskColor(rec.churn_risk)}`}>
                            {rec.churn_risk}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {rec.value_segment}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                          <MessageSquare size={14} /> WhatsApp Message
                        </p>
                        <p className="text-gray-800">{rec.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}