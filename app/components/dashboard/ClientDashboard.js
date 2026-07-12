"use client";

import { useEffect, useState } from "react";

export default function ClientDashboard({ client }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("overview"); // overview, campaigns, keywords, actions

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [client.id]);

  async function fetchMetrics() {
    try {
      const response = await fetch(
        `/api/dashboard/clients/${client.id}/metrics?days=30`
      );
      const data = await response.json();
      setMetrics(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  }

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>;
  }

  if (!metrics) {
    return <div style={{ padding: "20px", textAlign: "center" }}>No data available</div>;
  }

  return (
    <div>
      <style>{`
        .client-header {
          margin-bottom: 25px;
        }

        .client-title {
          font-size: 28px;
          font-weight: bold;
          margin: 0 0 10px 0;
        }

        .client-info {
          display: flex;
          gap: 20px;
          font-size: 14px;
          color: #666;
        }

        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 2px solid #f0f0f0;
        }

        .tab {
          padding: 10px 20px;
          cursor: pointer;
          border: none;
          background: none;
          font-size: 14px;
          font-weight: 500;
          color: #666;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
        }

        .tab.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }

        .metric-box {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }

        .metric-label {
          font-size: 12px;
          color: #999;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .metric-value {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .metric-change {
          font-size: 12px;
          color: #666;
        }

        .metric-change.positive {
          color: #4caf50;
        }

        .metric-change.negative {
          color: #f44336;
        }

        .platform-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }

        .platform-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
        }

        .platform-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .platform-icon {
          width: 24px;
          height: 24px;
          background: #667eea;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
        }

        .platform-metrics {
          display: grid;
          gap: 10px;
          font-size: 13px;
        }

        .platform-metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .platform-metric-label {
          color: #666;
        }

        .platform-metric-value {
          font-weight: bold;
          color: #333;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 20px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #667eea;
          color: white;
        }

        .btn-primary:hover {
          background: #5568d3;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: #f0f0f0;
          color: #333;
          border: 1px solid #ddd;
        }

        .btn-secondary:hover {
          background: #e8e8e8;
        }

        .btn-danger {
          background: #f44336;
          color: white;
        }

        .btn-danger:hover {
          background: #da190b;
        }

        .trend-chart {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
          margin-top: 20px;
        }

        .trend-chart h4 {
          margin: 0 0 15px 0;
          font-size: 16px;
        }

        @media (max-width: 1200px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .platform-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Header */}
      <div className="client-header">
        <h1 className="client-title">{client.client_name}</h1>
        <div className="client-info">
          <span>📧 {client.business_email}</span>
          <span>📱 {client.phone}</span>
          <span>💰 ${client.monthly_fee}/month</span>
          <span>📊 {client.campaign_count || 0} campaigns</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${view === "overview" ? "active" : ""}`}
          onClick={() => setView("overview")}
        >
          Overview
        </button>
        <button
          className={`tab ${view === "campaigns" ? "active" : ""}`}
          onClick={() => setView("campaigns")}
        >
          Campaigns
        </button>
        <button
          className={`tab ${view === "keywords" ? "active" : ""}`}
          onClick={() => setView("keywords")}
        >
          Keywords
        </button>
        <button
          className={`tab ${view === "actions" ? "active" : ""}`}
          onClick={() => setView("actions")}
        >
          Actions
        </button>
      </div>

      {/* Overview Tab */}
      {view === "overview" && (
        <>
          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-box">
              <div className="metric-label">Total Spend</div>
              <div className="metric-value">
                ${metrics.totalSpend.toFixed(2)}
              </div>
              <div className="metric-change">Last 30 days</div>
            </div>

            <div className="metric-box">
              <div className="metric-label">Conversions</div>
              <div className="metric-value">{metrics.totalConversions}</div>
              <div className="metric-change">Last 30 days</div>
            </div>

            <div className="metric-box">
              <div className="metric-label">Avg ROAS</div>
              <div className="metric-value">{metrics.avgROAS}x</div>
              <div className={`metric-change ${metrics.trend === "improving" ? "positive" : "negative"}`}>
                {metrics.trend.toUpperCase()}
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-label">Avg CPC</div>
              <div className="metric-value">${metrics.avgCPC}</div>
              <div className="metric-change">Across platforms</div>
            </div>
          </div>

          {/* Platform Performance */}
          <h3 style={{ marginBottom: "15px" }}>Platform Performance</h3>
          <div className="platform-grid">
            {Object.entries(metrics.byPlatform).map(([platform, data]) => (
              <div key={platform} className="platform-card">
                <div className="platform-name">
                  <span className="platform-icon">
                    {platform === "google_ads"
                      ? "G"
                      : platform === "meta_ads"
                        ? "M"
                        : "Y"}
                  </span>
                  {platform === "google_ads"
                    ? "Google Ads"
                    : platform === "meta_ads"
                      ? "Meta Ads"
                      : "Yelp"}
                </div>
                <div className="platform-metrics">
                  <div className="platform-metric">
                    <span className="platform-metric-label">Spend:</span>
                    <span className="platform-metric-value">
                      ${data.spend.toFixed(2)}
                    </span>
                  </div>
                  <div className="platform-metric">
                    <span className="platform-metric-label">Conversions:</span>
                    <span className="platform-metric-value">
                      {data.conversions}
                    </span>
                  </div>
                  <div className="platform-metric">
                    <span className="platform-metric-label">ROAS:</span>
                    <span className="platform-metric-value">{data.roas}x</span>
                  </div>
                  <div className="platform-metric">
                    <span className="platform-metric-label">Clicks:</span>
                    <span className="platform-metric-value">
                      {data.clicks.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="btn btn-primary">📊 Adjust Budgets</button>
            <button className="btn btn-primary">➕ Create Ad</button>
            <button className="btn btn-secondary">🎯 Manage Keywords</button>
            <button className="btn btn-secondary">⚙️ Settings</button>
            <button className="btn btn-secondary">📧 Send Report</button>
          </div>
        </>
      )}

      {/* Campaigns Tab */}
      {view === "campaigns" && (
        <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
          Campaign management coming soon...
        </div>
      )}

      {/* Keywords Tab */}
      {view === "keywords" && (
        <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
          Keyword management coming soon...
        </div>
      )}

      {/* Actions Tab */}
      {view === "actions" && (
        <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
          Action history coming soon...
        </div>
      )}
    </div>
  );
}
