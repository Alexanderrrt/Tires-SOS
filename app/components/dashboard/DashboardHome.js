"use client";

import { useEffect, useState } from "react";
import ClientList from "./ClientList";
import ClientDashboard from "./ClientDashboard";
import AlertPanel from "./AlertPanel";

export default function DashboardHome() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchClients();
    const interval = setInterval(fetchClients, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function fetchClients() {
    try {
      const response = await fetch("/api/dashboard/clients");
      const data = await response.json();
      setClients(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  }

  return (
    <div className="dashboard-container">
      <style>{`
        .dashboard-container {
          display: grid;
          grid-template-columns: 300px 1fr 300px;
          gap: 20px;
          padding: 20px;
          min-height: 100vh;
          background: #f5f5f5;
        }

        .dashboard-section {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 20px;
          overflow-y: auto;
          max-height: calc(100vh - 40px);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f0f0f0;
        }

        .dashboard-header h1 {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }

        .stat-card.revenue {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .stat-card.active-clients {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .stat-card.total-spend {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }

        .stat-value {
          font-size: 32px;
          font-weight: bold;
          margin: 10px 0;
        }

        .stat-label {
          font-size: 12px;
          opacity: 0.9;
          text-transform: uppercase;
        }

        .client-item {
          padding: 15px;
          border-radius: 6px;
          cursor: pointer;
          margin-bottom: 10px;
          border-left: 4px solid transparent;
          transition: all 0.2s;
        }

        .client-item:hover {
          background: #f9f9f9;
          border-left-color: #667eea;
        }

        .client-item.active {
          background: #e8eaf6;
          border-left-color: #667eea;
        }

        .client-name {
          font-weight: bold;
          margin-bottom: 5px;
        }

        .client-status {
          font-size: 12px;
          color: #666;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
        }

        .status-badge.active {
          background: #c8e6c9;
          color: #2e7d32;
        }

        .status-badge.warning {
          background: #fff3cd;
          color: #856404;
        }

        .status-badge.critical {
          background: #f8d7da;
          color: #721c24;
        }

        .alert-item {
          padding: 12px;
          border-left: 4px solid #ff6b6b;
          background: #ffe0e0;
          border-radius: 4px;
          margin-bottom: 10px;
        }

        .alert-item.warning {
          border-left-color: #ffd43b;
          background: #fff9c4;
        }

        .alert-item.info {
          border-left-color: #4dabf7;
          background: #e3f2fd;
        }

        .alert-title {
          font-weight: bold;
          margin-bottom: 5px;
        }

        .alert-message {
          font-size: 12px;
          color: #333;
        }

        @media (max-width: 1400px) {
          .dashboard-container {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 10px;
            gap: 10px;
          }

          .dashboard-section {
            padding: 15px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* LEFT SIDEBAR - CLIENT LIST */}
      <div className="dashboard-section">
        <div className="dashboard-header">
          <h2>Clients ({clients.length})</h2>
        </div>

        {loading ? (
          <div style={{ padding: "20px", textAlign: "center" }}>
            Loading clients...
          </div>
        ) : (
          <div>
            {clients.map((client) => (
              <div
                key={client.id}
                className={`client-item ${
                  selectedClient?.id === client.id ? "active" : ""
                }`}
                onClick={() => setSelectedClient(client)}
              >
                <div className="client-name">{client.client_name}</div>
                <div className="client-status">
                  <span
                    className={`status-badge ${
                      client.status === "active" ? "active" : "warning"
                    }`}
                  >
                    {client.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: "11px", marginTop: "8px", color: "#666" }}>
                  <div>💰 ${client.monthly_fee}/mo</div>
                  <div>📊 {client.campaign_count || 0} campaigns</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CENTER - MAIN DASHBOARD */}
      <div className="dashboard-section" style={{ gridColumn: "2" }}>
        {selectedClient ? (
          <ClientDashboard client={selectedClient} />
        ) : (
          <div>
            <div className="dashboard-header">
              <h2>Overview</h2>
            </div>

            <div className="stats-grid">
              <div className="stat-card revenue">
                <div className="stat-label">Monthly Revenue</div>
                <div className="stat-value">
                  ${clients.reduce((sum, c) => sum + (c.monthly_fee || 0), 0)}
                </div>
              </div>

              <div className="stat-card active-clients">
                <div className="stat-label">Active Clients</div>
                <div className="stat-value">
                  {clients.filter((c) => c.status === "active").length}
                </div>
              </div>

              <div className="stat-card total-spend">
                <div className="stat-label">Ad Spend (30d)</div>
                <div className="stat-value">
                  ${clients.reduce((sum, c) => sum + (c.total_spend_30d || 0), 0).toFixed(0)}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Avg ROAS</div>
                <div className="stat-value">
                  {(
                    clients.reduce((sum, c) => sum + (c.avg_roas || 0), 0) /
                      clients.length || 0
                  ).toFixed(2)}
                  x
                </div>
              </div>
            </div>

            <div style={{ marginTop: "30px" }}>
              <p style={{ textAlign: "center", color: "#999" }}>
                Select a client to view detailed metrics
              </p>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR - ALERTS */}
      <div className="dashboard-section">
        <div className="dashboard-header">
          <h2>Alerts</h2>
        </div>

        {selectedClient ? (
          <AlertPanel clientId={selectedClient.id} />
        ) : (
          <div style={{ fontSize: "12px", color: "#999" }}>
            Select a client to see alerts
          </div>
        )}
      </div>
    </div>
  );
}
