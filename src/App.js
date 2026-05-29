import { useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
      alert("Error uploading file. Backend may be starting up — try again in 30 seconds.");
    }
    setLoading(false);
  };

  const handleRecommendations = async () => {
    if (!filepath) return alert("Please upload a file first.");
    setLoading(true);
    try {
      const res = await axios.get(`${API}/recommendations`, { params: { filepath } });
      setRecommendations(res.data.recommendations);
      setActiveTab("recommendations");
    } catch (err) {
      alert("Error generating recommendations.");
    }
    setLoading(false);
  };

  const riskClass = (risk) => {
    if (risk === "Active") return "risk-badge risk-active";
    if (risk === "At Risk") return "risk-badge risk-atrisk";
    if (risk === "High Risk") return "risk-badge risk-highrisk";
    return "risk-badge risk-lost";
  };

  const chartData = dashboard ? [
    { name: "Active", value: dashboard.active },
    { name: "At Risk", value: dashboard.at_risk },
    { name: "High Risk", value: dashboard.high_risk },
    { name: "Lost", value: dashboard.lost },
  ] : [];

  return (
    <div>
      {/* Header */}
      <div className="header">
        <div>
          <h1>TradeIQ</h1>
          <p>Know Your Customer</p>
        </div>
        <span className="badge">AI-Powered</span>
      </div>

      <div className="container">
        {/* Upload */}
        <div className="card">
          <h2>📂 Upload Customer Data</h2>
          <div className="upload-row">
            <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
            <button className="btn btn-blue" onClick={handleUpload} disabled={loading}>
              {loading ? "Analysing..." : "Analyse Customers"}
            </button>
            {dashboard && (
              <button className="btn btn-green" onClick={handleRecommendations} disabled={loading}>
                {loading ? "Generating..." : "💬 Get Re-engagement Messages"}
              </button>
            )}
          </div>
        </div>

        {/* Tabs + Content */}
        {dashboard && (
          <>
            <div className="tabs">
              {["dashboard", "customers", "recommendations"].map((tab) => (
                <button key={tab} className={`tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              <>
                <div className="stats-grid">
                  {[
                    { label: "Total Customers", value: dashboard.total_customers, icon: "👥", bg: "#eff6ff" },
                    { label: "Active", value: dashboard.active, icon: "✅", bg: "#f0fdf4" },
                    { label: "At Risk", value: dashboard.at_risk + dashboard.high_risk, icon: "⚠️", bg: "#fff7ed" },
                    { label: "Lost", value: dashboard.lost, icon: "📉", bg: "#fef2f2" },
                  ].map((s) => (
                    <div className="stat-card" key={s.label}>
                      <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                      <div className="stat-value">{s.value}</div>
                      <div className="stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="charts-grid">
                  <div className="card">
                    <h2>Customer Health</h2>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card">
                    <h2>Revenue Summary</h2>
                    <p style={{ color: "#6b7280", fontSize: 14 }}>Total Revenue</p>
                    <p style={{ fontSize: 32, fontWeight: 700, color: "#1d4ed8", margin: "8px 0 16px" }}>
                      ₦{dashboard.total_revenue.toLocaleString()}
                    </p>
                    <hr style={{ borderColor: "#f3f4f6", marginBottom: 16 }} />
                    <p style={{ color: "#6b7280", fontSize: 14 }}>Top Customer</p>
                    <p style={{ fontSize: 20, fontWeight: 700 }}>{dashboard.top_customer}</p>
                    <p style={{ color: "#16a34a", fontWeight: 500, fontSize: 14 }}>
                      ₦{dashboard.top_customer_spend.toLocaleString()} total spend
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Customers Tab */}
            {activeTab === "customers" && (
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <table>
                  <thead>
                    <tr>
                      {["Customer", "Segment", "Risk", "Orders", "Total Spend", "Last Purchase", "Favourite Product"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {personas.map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{p.customer_name}</td>
                        <td>{p.value_segment}</td>
                        <td><span className={riskClass(p.churn_risk)}>{p.churn_risk}</span></td>
                        <td>{p.purchase_count}</td>
                        <td style={{ fontWeight: 600 }}>₦{p.total_spend.toLocaleString()}</td>
                        <td>{p.last_purchase_date}</td>
                        <td>{p.favourite_product}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Recommendations Tab */}
            {activeTab === "recommendations" && (
              <div>
                {recommendations.length === 0 ? (
                  <div className="card" style={{ textAlign: "center", color: "#6b7280" }}>
                    Click "Get Re-engagement Messages" to generate AI recommendations.
                  </div>
                ) : (
                  recommendations.map((rec, i) => (
                    <div className="rec-card" key={i}>
                      <div className="rec-header">
                        <strong style={{ fontSize: 16 }}>{rec.customer_name}</strong>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span className={riskClass(rec.churn_risk)}>{rec.churn_risk}</span>
                          <span className="risk-badge" style={{ background: "#eff6ff", color: "#1d4ed8" }}>{rec.value_segment}</span>
                        </div>
                      </div>
                      <div className="rec-message">
                        <p>💬 WhatsApp Message</p>
                        <p style={{ color: "#111827", fontSize: 15 }}>{rec.message}</p>
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