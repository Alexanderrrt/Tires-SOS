"use client";

import { useEffect, useState } from "react";

export default function AlertPanel({ clientId }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [clientId]);

  async function fetchAlerts() {
    try {
      const response = await fetch(
        `/api/dashboard/clients/${clientId}/alerts`
      );
      const data = await response.json();
      setAlerts(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  }

  async function resolveAlert(alertId) {
    try {
      await fetch(
        `/api/dashboard/clients/${clientId}/alerts/${alertId}`,
        { method: "PATCH" }
      );
      fetchAlerts();
    } catch (error) {
      console.error("Error resolving alert:", error);
    }
  }

  if (loading) {
    return <div style={{ fontSize: "12px", color: "#999" }}>Loading alerts...</div>;
  }

  return (
    <div>
      <style>{`
        .alert-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .alert {
          padding: 12px;
          border-radius: 6px;
          border-left: 4px solid;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .alert.critical {
          border-left-color: #f44336;
          background: #ffebee;
        }

        .alert.warning {
          border-left-color: #ff9800;
          background: #fff3e0;
        }

        .alert.info {
          border-left-color: #2196f3;
          background: #e3f2fd;
        }

        .alert.success {
          border-left-color: #4caf50;
          background: #e8f5e9;
        }

        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .alert-title {
          font-weight: 600;
          font-size: 13px;
          margin: 0;
        }

        .alert.critical .alert-title {
          color: #c62828;
        }

        .alert.warning .alert-title {
          color: #e65100;
        }

        .alert.info .alert-title {
          color: #1565c0;
        }

        .alert.success .alert-title {
          color: #2e7d32;
        }

        .alert-message {
          font-size: 12px;
          color: #333;
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .alert-time {
          font-size: 11px;
          color: #999;
        }

        .alert-action {
          font-size: 11px;
          padding: 4px 8px;
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .alert-action:hover {
          background: rgba(0,0,0,0.05);
        }

        .empty-state {
          text-align: center;
          padding: 30px 10px;
          color: #999;
        }

        .empty-icon {
          font-size: 32px;
          margin-bottom: 10px;
        }
      `}</style>

      {alerts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <div style={{ fontSize: "12px" }}>No active alerts</div>
        </div>
      ) : (
        <div className="alert-container">
          {alerts.map((alert) => (
            <div key={alert.id} className={`alert ${alert.severity.toLowerCase()}`}>
              <div className="alert-header">
                <h4 className="alert-title">{alert.title}</h4>
              </div>
              <div className="alert-message">{alert.description}</div>
              <div style={{ fontSize: "10px", color: "#666", marginBottom: "8px" }}>
                {alert.action_required}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="alert-time">
                  {new Date(alert.created_at).toLocaleTimeString()}
                </span>
                <button
                  className="alert-action"
                  onClick={() => resolveAlert(alert.id)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
