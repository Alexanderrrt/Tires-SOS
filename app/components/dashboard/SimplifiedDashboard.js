"use client";

import { useEffect, useState } from "react";

export default function SimplifiedDashboard() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [showHelp, setShowHelp] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchMetrics();
    }
  }, [selectedClient]);

  async function fetchClients() {
    try {
      const response = await fetch("/api/dashboard/clients");
      const data = await response.json();
      setClients(data);
      if (data.length > 0) {
        setSelectedClient(data[0]);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function fetchMetrics() {
    try {
      const response = await fetch(
        `/api/dashboard/clients/${selectedClient.id}/metrics?days=7`
      );
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  return (
    <div className="dashboard">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .dashboard {
          min-height: 100vh;
          background: #f5f7fa;
          padding: 20px;
        }

        /* TOP BAR */
        .top-bar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px 30px;
          border-radius: 12px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .top-bar-title {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }

        .help-button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .help-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* HELP BANNER */
        .help-banner {
          background: #e3f2fd;
          border-left: 4px solid #2196f3;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 20px;
        }

        .help-content {
          flex: 1;
        }

        .help-title {
          font-weight: bold;
          color: #1565c0;
          margin: 0 0 8px 0;
        }

        .help-text {
          color: #0d47a1;
          font-size: 14px;
          margin: 0;
          line-height: 1.5;
        }

        .help-close {
          background: none;
          border: none;
          color: #1565c0;
          cursor: pointer;
          font-size: 20px;
          font-weight: bold;
        }

        /* MAIN LAYOUT */
        .main-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 20px;
        }

        /* SIDEBAR */
        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: all 0.3s;
        }

        .card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        }

        .card-title {
          font-size: 14px;
          font-weight: 700;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
        }

        /* CLIENT LIST */
        .client-item {
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 8px;
          background: #f9f9f9;
          border-left: 3px solid transparent;
          transition: all 0.2s;
        }

        .client-item:hover {
          background: #f0f0f0;
          border-left-color: #667eea;
        }

        .client-item.active {
          background: #e8eaf6;
          border-left-color: #667eea;
          font-weight: 600;
        }

        .client-name {
          font-weight: 600;
          margin-bottom: 4px;
          color: #333;
        }

        .client-status {
          font-size: 12px;
          color: #999;
        }

        /* MAIN CONTENT */
        .content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* BIG STAT BOXES */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .stat-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #333;
          margin: 8px 0;
        }

        .stat-label {
          font-size: 12px;
          color: #999;
          text-transform: uppercase;
        }

        /* TABS */
        .tabs {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid #e0e0e0;
          margin-bottom: 20px;
        }

        .tab-button {
          background: none;
          border: none;
          padding: 12px 20px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #666;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          transition: all 0.2s;
        }

        .tab-button:hover {
          color: #667eea;
        }

        .tab-button.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }

        /* QUICK ACTIONS */
        .quick-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .action-button {
          background: white;
          border: 2px solid #e0e0e0;
          padding: 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #333;
        }

        .action-button:hover {
          border-color: #667eea;
          background: #f8faff;
          transform: translateY(-2px);
        }

        .action-button-icon {
          font-size: 24px;
        }

        /* PLATFORM BOXES */
        .platform-boxes {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .platform-box {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .platform-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }

        .platform-icon {
          font-size: 24px;
        }

        .platform-name {
          font-weight: bold;
          font-size: 16px;
        }

        .platform-metrics {
          display: grid;
          gap: 10px;
        }

        .platform-metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .platform-metric:last-child {
          border-bottom: none;
        }

        .metric-label {
          color: #666;
        }

        .metric-value {
          font-weight: bold;
          color: #333;
          font-size: 16px;
        }

        /* RESPONSIVE */
        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .platform-boxes {
            grid-template-columns: 1fr;
          }

          .quick-actions {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .main-layout {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .top-bar {
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }

          .help-banner {
            flex-direction: column;
          }
        }

        /* LOADING */
        .loading {
          text-align: center;
          padding: 40px;
          color: #999;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
      `}</style>

      {/* TOP BAR */}
      <div className="top-bar">
        <h1 className="top-bar-title">🎛️ Campaign Dashboard</h1>
        <button className="help-button" onClick={() => setShowHelp(!showHelp)}>
          {showHelp ? "Hide Help" : "Show Help"}
        </button>
      </div>

      {/* HELP BANNER */}
      {showHelp && (
        <div className="help-banner">
          <div className="help-content">
            <p className="help-title">💡 How to use this dashboard</p>
            <p className="help-text">
              Pick a client from the left → View their metrics → Click quick action buttons to manage campaigns.
              Everything updates in real-time. Hover over any number to see more details.
            </p>
          </div>
          <button className="help-close" onClick={() => setShowHelp(false)}>
            ✕
          </button>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="main-layout">
        {/* SIDEBAR - CLIENT LIST */}
        <div className="sidebar">
          <div className="card">
            <h3 className="card-title">📊 Clients</h3>
            {clients.length === 0 ? (
              <div className="empty-state">No clients yet</div>
            ) : (
              clients.map((client) => (
                <div
                  key={client.id}
                  className={`client-item ${selectedClient?.id === client.id ? "active" : ""}`}
                  onClick={() => setSelectedClient(client)}
                >
                  <div className="client-name">{client.client_name}</div>
                  <div className="client-status">
                    {client.status === "active" ? "✅ Active" : "⚠️ " + client.status}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <h3 className="card-title">💰 Revenue</h3>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#667eea" }}>
              ${clients.reduce((sum, c) => sum + (c.monthly_fee || 0), 0)}/mo
            </div>
            <div style={{ fontSize: "12px", color: "#999", marginTop: "8px" }}>
              {clients.filter((c) => c.status === "active").length} active clients
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="content">
          {!selectedClient ? (
            <div className="empty-state">
              <div className="empty-icon">👈</div>
              <p>Select a client to get started</p>
            </div>
          ) : (
            <>
              {/* CLIENT HEADER */}
              <div className="card">
                <h2 style={{ margin: "0 0 8px 0", fontSize: "24px" }}>
                  {selectedClient.client_name}
                </h2>
                <div style={{ fontSize: "14px", color: "#666" }}>
                  📧 {selectedClient.business_email} • 💰 ${selectedClient.monthly_fee}/month
                </div>
              </div>

              {/* STATS */}
              {metrics && (
                <>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon">💰</div>
                      <div className="stat-value">${metrics.totalSpend.toFixed(0)}</div>
                      <div className="stat-label">Total Spend</div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon">🎯</div>
                      <div className="stat-value">{metrics.totalConversions}</div>
                      <div className="stat-label">Conversions</div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon">📈</div>
                      <div className="stat-value">{metrics.avgROAS}x</div>
                      <div className="stat-label">ROAS</div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon">🔗</div>
                      <div className="stat-value">${metrics.avgCPC}</div>
                      <div className="stat-label">Avg CPC</div>
                    </div>
                  </div>

                  {/* TABS */}
                  <div>
                    <div className="tabs">
                      <button
                        className={`tab-button ${activeTab === "overview" ? "active" : ""}`}
                        onClick={() => setActiveTab("overview")}
                      >
                        📊 Overview
                      </button>
                      <button
                        className={`tab-button ${activeTab === "platforms" ? "active" : ""}`}
                        onClick={() => setActiveTab("platforms")}
                      >
                        🎯 By Platform
                      </button>
                      <button
                        className={`tab-button ${activeTab === "actions" ? "active" : ""}`}
                        onClick={() => setActiveTab("actions")}
                      >
                        ⚙️ Actions
                      </button>
                    </div>

                    {/* OVERVIEW TAB */}
                    {activeTab === "overview" && (
                      <div className="card">
                        <h3 className="card-title">📋 Summary (Last 7 Days)</h3>
                        <div style={{ display: "grid", gap: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid #f0f0f0" }}>
                            <span>Total Spend:</span>
                            <strong>${metrics.totalSpend.toFixed(2)}</strong>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid #f0f0f0" }}>
                            <span>Total Clicks:</span>
                            <strong>{metrics.totalClicks.toLocaleString()}</strong>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid #f0f0f0" }}>
                            <span>Total Conversions:</span>
                            <strong>{metrics.totalConversions}</strong>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid #f0f0f0" }}>
                            <span>Click-Through Rate:</span>
                            <strong>{metrics.avgCTR}%</strong>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px" }}>
                            <span>Trend:</span>
                            <strong style={{ color: metrics.trend === "improving" ? "#4caf50" : "#f44336" }}>
                              {metrics.trend === "improving" ? "📈 Improving" : metrics.trend === "declining" ? "📉 Declining" : "➡️ Stable"}
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PLATFORMS TAB */}
                    {activeTab === "platforms" && (
                      <div className="platform-boxes">
                        {Object.entries(metrics.byPlatform).map(([platform, data]) => (
                          <div key={platform} className="platform-box">
                            <div className="platform-header">
                              <span className="platform-icon">
                                {platform === "google_ads" ? "G" : platform === "meta_ads" ? "M" : "Y"}
                              </span>
                              <span className="platform-name">
                                {platform === "google_ads" ? "Google" : platform === "meta_ads" ? "Meta" : "Yelp"}
                              </span>
                            </div>
                            <div className="platform-metrics">
                              <div className="platform-metric">
                                <span className="metric-label">Spend</span>
                                <span className="metric-value">${data.spend.toFixed(0)}</span>
                              </div>
                              <div className="platform-metric">
                                <span className="metric-label">Conversions</span>
                                <span className="metric-value">{data.conversions}</span>
                              </div>
                              <div className="platform-metric">
                                <span className="metric-label">ROAS</span>
                                <span className="metric-value">{data.roas}x</span>
                              </div>
                              <div className="platform-metric">
                                <span className="metric-label">Clicks</span>
                                <span className="metric-value">{data.clicks.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ACTIONS TAB */}
                    {activeTab === "actions" && (
                      <div>
                        <div className="quick-actions">
                          <button className="action-button">
                            <span className="action-button-icon">💰</span>
                            <span>Adjust Budget</span>
                          </button>
                          <button className="action-button">
                            <span className="action-button-icon">⏸️</span>
                            <span>Pause Campaign</span>
                          </button>
                          <button className="action-button">
                            <span className="action-button-icon">➕</span>
                            <span>New Ad</span>
                          </button>
                          <button className="action-button">
                            <span className="action-button-icon">🎯</span>
                            <span>Keywords</span>
                          </button>
                          <button className="action-button">
                            <span className="action-button-icon">📊</span>
                            <span>Full Report</span>
                          </button>
                          <button className="action-button">
                            <span className="action-button-icon">📧</span>
                            <span>Send Email</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
