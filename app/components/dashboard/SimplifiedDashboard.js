"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { UserButton } from "@clerk/nextjs";

const PLATFORM_META = {
  google_ads: { label: "Google Ads", icon: "🔍", color: "#4285F4" },
  meta_ads: { label: "Meta Ads", icon: "📘", color: "#0866FF" },
  yelp: { label: "Yelp Ads", icon: "⭐", color: "#D32323" },
};

// requires: "any" = at least one platform connected, a platform key = that
// platform connected, "soon" = not built yet (always locked).
const NAV_SECTIONS = [
  {
    title: "Main",
    items: [
      { id: "overview", icon: "📊", label: "Overview", requires: null },
      { id: "insights", icon: "🤖", label: "AI Insights", requires: null },
    ],
  },
  {
    title: "Campaign Management",
    items: [
      { id: "campaigns", icon: "📢", label: "Campaigns", requires: "any" },
      { id: "creatives", icon: "🎨", label: "Ad Creatives", requires: "any" },
      { id: "keywords", icon: "🔑", label: "Keywords", requires: "google_ads" },
      { id: "audiences", icon: "👥", label: "Audiences", requires: "meta_ads" },
    ],
  },
  {
    title: "Analytics",
    items: [
      { id: "reports", icon: "📈", label: "Reports", requires: "soon" },
      { id: "alerts", icon: "🔔", label: "Alerts", requires: "soon" },
    ],
  },
  {
    title: "Business",
    items: [
      { id: "automation", icon: "⚡", label: "Automation", requires: "soon" },
      { id: "billing", icon: "💳", label: "Billing", requires: "soon" },
      { id: "settings", icon: "⚙️", label: "Settings", requires: null },
    ],
  },
];

const QUICK_ACTIONS = [
  { icon: "💰", label: "Adjust Budget", requires: "any" },
  { icon: "⏸️", label: "Pause Campaign", requires: "any" },
  { icon: "➕", label: "New Ad", requires: "any" },
  { icon: "🔑", label: "Keywords", requires: "google_ads" },
  { icon: "📊", label: "Full Report", requires: "soon" },
  { icon: "📧", label: "Email Client", requires: "soon" },
];

const AI_FEATURES = [
  { icon: "🚨", title: "Anomaly Detection", desc: "Watches for CPC spikes and CTR drops overnight." },
  { icon: "🔮", title: "ROAS Forecasting", desc: "Predicts the next 7 days of return on ad spend." },
  { icon: "⏰", title: "Smart Bidding", desc: "Adjusts bids by time of day, device, and audience." },
  { icon: "🔑", title: "Keyword Discovery", desc: "Finds high-intent, low-competition keywords." },
  { icon: "🔁", title: "Cross-Platform Learning", desc: "Applies what works on Google to Meta, and back." },
  { icon: "✍️", title: "Ad Copy Generation", desc: "Writes 5 bilingual ad variations to test daily." },
];

export default function SimplifiedDashboard() {
  const [view, setView] = useState("overview");
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [connections, setConnections] = useState(null);
  const [forms, setForms] = useState({});
  const [busyPlatform, setBusyPlatform] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, tone = "ok") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    fetch("/api/dashboard/clients")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setClients(data);
          if (data.length > 0) setSelectedClient(data[0]);
        }
      })
      .catch(() => {});
    refreshConnections();
  }, []);

  useEffect(() => {
    if (!selectedClient) return;
    let cancelled = false;
    const load = () => {
      fetch(`/api/dashboard/clients/${selectedClient.id}/metrics?days=7`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!cancelled && data && typeof data.totalSpend === "number") setMetrics(data);
        })
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [selectedClient]);

  function refreshConnections() {
    fetch("/api/dashboard/connections")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.platforms) setConnections(data.platforms);
      })
      .catch(() => {});
  }

  const connectedCount = useMemo(
    () => (connections ? Object.values(connections).filter((p) => p.connected).length : 0),
    [connections]
  );

  const isUnlocked = useCallback(
    (requires) => {
      if (!requires) return true;
      if (requires === "soon") return false;
      if (!connections) return false;
      if (requires === "any") return connectedCount > 0;
      return Boolean(connections[requires]?.connected);
    },
    [connections, connectedCount]
  );

  function lockReason(requires) {
    if (requires === "soon") return "Coming soon";
    if (requires === "any") return "Connect an ad account to unlock";
    return `Connect ${PLATFORM_META[requires]?.label || requires} to unlock`;
  }

  function setFormValue(platform, key, value) {
    setForms((prev) => ({
      ...prev,
      [platform]: { ...(prev[platform] || {}), [key]: value },
    }));
  }

  async function connectPlatform(platform) {
    setBusyPlatform(platform);
    try {
      const res = await fetch("/api/dashboard/connections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, fields: forms[platform] || {} }),
      });
      const data = await res.json();
      if (data.platforms) setConnections(data.platforms);
      if (res.ok) {
        setForms((prev) => ({ ...prev, [platform]: {} }));
        showToast(
          data.persisted
            ? `${PLATFORM_META[platform].label} connected ✓`
            : `${PLATFORM_META[platform].label} connected (saved in memory only — database table missing)`,
          data.persisted ? "ok" : "warn"
        );
      } else {
        showToast(data.error || "Could not connect.", "error");
      }
    } catch {
      showToast("Network error — try again.", "error");
    } finally {
      setBusyPlatform(null);
    }
  }

  async function disconnectPlatform(platform) {
    setBusyPlatform(platform);
    try {
      const res = await fetch("/api/dashboard/connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      const data = await res.json();
      if (data.platforms) setConnections(data.platforms);
      showToast(`${PLATFORM_META[platform].label} disconnected`, "ok");
    } catch {
      showToast("Network error — try again.", "error");
    } finally {
      setBusyPlatform(null);
    }
  }

  const activeNavItem = NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.id === view);
  const viewLocked = activeNavItem && !isUnlocked(activeNavItem.requires) && view !== "settings";

  return (
    <div className="dash">
      <style>{`
        .dash { display: flex; min-height: 100vh; background: #f1f5f9; color: #0f172a; }
        .dash * { box-sizing: border-box; }
        .dash button { font-family: inherit; }

        /* ============ SIDEBAR ============ */
        .side {
          width: 240px; flex-shrink: 0; background: #0f172a; color: #cbd5e1;
          display: flex; flex-direction: column; padding: 20px 14px;
          position: sticky; top: 0; height: 100vh; overflow-y: auto;
        }
        .side-brand { display: flex; align-items: center; gap: 10px; padding: 4px 10px 18px; border-bottom: 1px solid #1e293b; margin-bottom: 14px; }
        .side-brand-icon {
          width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; font-size: 18px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
        }
        .side-brand-name { font-weight: 800; color: #f8fafc; font-size: 15px; line-height: 1.1; }
        .side-brand-sub { font-size: 11px; color: #64748b; }
        .side-section { font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #475569; padding: 14px 10px 6px; }
        .nav-item {
          display: flex; align-items: center; gap: 10px; width: 100%;
          background: none; border: none; color: #cbd5e1; cursor: pointer;
          padding: 9px 10px; border-radius: 9px; font-size: 13.5px; font-weight: 600;
          transition: background 0.15s, color 0.15s; text-align: left;
        }
        .nav-item:hover { background: #1e293b; color: #f1f5f9; }
        .nav-item.active { background: linear-gradient(135deg, #6366f1, #7c3aed); color: white; box-shadow: 0 4px 14px rgba(99,102,241,0.35); }
        .nav-item.locked { color: #64748b; }
        .nav-item.locked:hover { background: #17203a; }
        .nav-icon { width: 20px; text-align: center; }
        .nav-label { flex: 1; }
        .nav-lock { font-size: 10px; background: #1e293b; border: 1px solid #334155; color: #94a3b8; padding: 2px 7px; border-radius: 20px; font-weight: 700; }
        .nav-item.active .nav-lock { background: rgba(255,255,255,0.18); border-color: transparent; color: #fff; }
        .side-footer { margin-top: auto; padding: 14px 10px 4px; border-top: 1px solid #1e293b; font-size: 11px; color: #475569; line-height: 1.6; }
        .side-conn { display: flex; gap: 6px; margin-bottom: 6px; }
        .conn-dot { width: 8px; height: 8px; border-radius: 50%; background: #334155; }
        .conn-dot.on { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.7); }

        /* ============ MAIN ============ */
        .main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .topbar {
          background: white; border-bottom: 1px solid #e2e8f0; padding: 14px 28px;
          display: flex; align-items: center; gap: 16px; position: sticky; top: 0; z-index: 10;
        }
        .topbar-title { font-size: 17px; font-weight: 800; margin: 0; }
        .client-select {
          margin-left: auto; padding: 8px 12px; border-radius: 9px; border: 1px solid #e2e8f0;
          font-size: 13px; font-weight: 600; background: #f8fafc; color: #0f172a; cursor: pointer;
        }
        .topbar-pills { display: flex; gap: 6px; }
        .pill {
          font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px;
          border: 1px solid #e2e8f0; background: #f8fafc; color: #94a3b8; display: flex; align-items: center; gap: 5px;
        }
        .pill.on { border-color: #bbf7d0; background: #f0fdf4; color: #15803d; }

        .content { padding: 26px 28px 60px; display: flex; flex-direction: column; gap: 20px; max-width: 1200px; width: 100%; }

        .card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px; }
        .card-title { font-size: 12px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; color: #64748b; margin: 0 0 14px; }

        /* stats */
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .stat { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; }
        .stat-top { display: flex; justify-content: space-between; align-items: center; }
        .stat-label { font-size: 12px; font-weight: 700; color: #64748b; }
        .stat-icon { width: 34px; height: 34px; border-radius: 9px; display: grid; place-items: center; font-size: 16px; background: #eef2ff; }
        .stat-value { font-size: 28px; font-weight: 800; margin-top: 10px; letter-spacing: -0.5px; }
        .stat-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }

        /* platform cards */
        .platforms { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .platform { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
        .platform-head { display: flex; align-items: center; gap: 10px; }
        .platform-logo { width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; font-size: 18px; background: #f1f5f9; }
        .platform-name { font-weight: 800; font-size: 15px; }
        .status-pill { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; margin-left: auto; }
        .status-pill.connected { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
        .status-pill.disconnected { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
        .platform-rows { display: flex; flex-direction: column; gap: 8px; }
        .platform-row { display: flex; justify-content: space-between; font-size: 13px; padding: 7px 0; border-bottom: 1px dashed #f1f5f9; }
        .platform-row:last-child { border-bottom: none; }
        .platform-row .k { color: #64748b; }
        .platform-row .v { font-weight: 700; }

        /* buttons */
        .btn {
          border: none; border-radius: 9px; padding: 10px 16px; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: transform 0.12s, box-shadow 0.12s, opacity 0.12s;
        }
        .btn:hover:not(:disabled) { transform: translateY(-1px); }
        .btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .btn-primary { background: linear-gradient(135deg, #6366f1, #7c3aed); color: white; box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
        .btn-ghost { background: #f1f5f9; color: #334155; }
        .btn-danger { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

        /* quick actions */
        .actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .action {
          position: relative; background: white; border: 1px solid #e2e8f0; border-radius: 12px;
          padding: 18px 14px; display: flex; flex-direction: column; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 700; color: #0f172a; cursor: pointer; transition: all 0.15s;
        }
        .action:hover:not(.locked) { border-color: #6366f1; background: #f8faff; transform: translateY(-2px); }
        .action-icon { font-size: 22px; }
        .action.locked { color: #94a3b8; cursor: not-allowed; background: #f8fafc; }
        .action.locked .action-icon { filter: grayscale(1); opacity: 0.6; }
        .action-badge {
          position: absolute; top: 8px; right: 8px; font-size: 9px; font-weight: 800;
          background: #f1f5f9; border: 1px solid #e2e8f0; color: #64748b; padding: 2px 7px; border-radius: 20px;
        }

        /* locked panel */
        .locked-panel { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 70px 30px; text-align: center; }
        .locked-panel-icon { font-size: 46px; margin-bottom: 14px; }
        .locked-panel h2 { margin: 0 0 8px; font-size: 22px; }
        .locked-panel p { color: #64748b; margin: 0 0 22px; font-size: 14px; }

        /* settings */
        .settings-grid { display: flex; flex-direction: column; gap: 16px; }
        .conn-card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px; }
        .conn-fields { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 16px 0; }
        .field label { display: block; font-size: 11.5px; font-weight: 700; color: #475569; margin-bottom: 5px; }
        .field input {
          width: 100%; padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 9px;
          font-size: 13px; font-family: inherit; background: #f8fafc; transition: border-color 0.15s;
        }
        .field input:focus { outline: none; border-color: #6366f1; background: white; }
        .conn-foot { display: flex; align-items: center; gap: 10px; }
        .conn-note { font-size: 12px; color: #94a3b8; margin-left: auto; }

        .soon-toggles { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .soon-toggle {
          display: flex; align-items: center; gap: 12px; padding: 14px; border: 1px dashed #e2e8f0;
          border-radius: 12px; background: #f8fafc; color: #94a3b8; font-size: 13px; font-weight: 600;
        }
        .soon-switch { width: 34px; height: 19px; border-radius: 20px; background: #e2e8f0; position: relative; flex-shrink: 0; }
        .soon-switch::after { content: ""; position: absolute; width: 15px; height: 15px; border-radius: 50%; background: white; top: 2px; left: 2px; }

        /* insights */
        .insights { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .insight { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; }
        .insight-icon { font-size: 24px; margin-bottom: 10px; }
        .insight h4 { margin: 0 0 6px; font-size: 14px; }
        .insight p { margin: 0; font-size: 12.5px; color: #64748b; line-height: 1.5; }

        .toast {
          position: fixed; bottom: 24px; right: 24px; z-index: 100; padding: 13px 20px;
          border-radius: 12px; font-size: 13.5px; font-weight: 600; color: white;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25); animation: toast-in 0.25s ease;
        }
        .toast.ok { background: #16a34a; }
        .toast.warn { background: #d97706; }
        .toast.error { background: #dc2626; }
        @keyframes toast-in { from { transform: translateY(12px); opacity: 0; } to { transform: none; opacity: 1; } }

        .empty { text-align: center; color: #94a3b8; padding: 50px 20px; font-size: 14px; }
        .empty-icon { font-size: 40px; margin-bottom: 12px; }

        @media (max-width: 1100px) {
          .stats { grid-template-columns: repeat(2, 1fr); }
          .platforms, .insights { grid-template-columns: 1fr; }
          .conn-fields { grid-template-columns: 1fr; }
        }
        @media (max-width: 800px) {
          .side { display: none; }
          .actions, .soon-toggles { grid-template-columns: repeat(2, 1fr); }
          .stats { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ============ SIDEBAR ============ */}
      <aside className="side">
        <div className="side-brand">
          <div className="side-brand-icon">🎛️</div>
          <div>
            <div className="side-brand-name">Ads Manager</div>
            <div className="side-brand-sub">Internal Operations</div>
          </div>
        </div>

        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="side-section">{section.title}</div>
            {section.items.map((item) => {
              const unlocked = isUnlocked(item.requires);
              return (
                <button
                  key={item.id}
                  className={`nav-item ${view === item.id ? "active" : ""} ${!unlocked ? "locked" : ""}`}
                  onClick={() => setView(item.id)}
                  title={unlocked ? item.label : lockReason(item.requires)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {!unlocked && (
                    <span className="nav-lock">{item.requires === "soon" ? "SOON" : "🔒"}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        <div className="side-footer">
          <div className="side-conn">
            {Object.keys(PLATFORM_META).map((p) => (
              <span key={p} className={`conn-dot ${connections?.[p]?.connected ? "on" : ""}`} title={PLATFORM_META[p].label} />
            ))}
          </div>
          {connectedCount}/3 platforms connected
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <div className="main">
        <div className="topbar">
          <h1 className="topbar-title">
            {activeNavItem ? `${activeNavItem.icon} ${activeNavItem.label}` : "Dashboard"}
          </h1>
          <div className="topbar-pills">
            {Object.entries(PLATFORM_META).map(([key, meta]) => (
              <span key={key} className={`pill ${connections?.[key]?.connected ? "on" : ""}`}>
                {meta.icon} {connections?.[key]?.connected ? "Live" : "Off"}
              </span>
            ))}
          </div>
          {clients.length > 0 && (
            <select
              className="client-select"
              value={selectedClient?.id || ""}
              onChange={(e) => setSelectedClient(clients.find((c) => String(c.id) === e.target.value) || null)}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.client_name}
                </option>
              ))}
            </select>
          )}
          <UserButton afterSignOutUrl="/sign-in" />
        </div>

        <div className="content">
          {/* -------- locked view -------- */}
          {viewLocked && (
            <div className="locked-panel">
              <div className="locked-panel-icon">{activeNavItem.requires === "soon" ? "🚧" : "🔒"}</div>
              <h2>{activeNavItem.label} is {activeNavItem.requires === "soon" ? "coming soon" : "locked"}</h2>
              <p>
                {activeNavItem.requires === "soon"
                  ? "This feature is on the roadmap and will unlock in a future update."
                  : `${lockReason(activeNavItem.requires)}. Once connected, this section fills with live data automatically.`}
              </p>
              {activeNavItem.requires !== "soon" && (
                <button className="btn btn-primary" onClick={() => setView("settings")}>
                  ⚙️ Go to Settings
                </button>
              )}
            </div>
          )}

          {/* -------- OVERVIEW -------- */}
          {!viewLocked && view === "overview" && (
            <>
              <div className="stats">
                <div className="stat">
                  <div className="stat-top"><span className="stat-label">Total Spend</span><span className="stat-icon">💰</span></div>
                  <div className="stat-value">${metrics ? metrics.totalSpend.toFixed(0) : "0"}</div>
                  <div className="stat-sub">last 7 days</div>
                </div>
                <div className="stat">
                  <div className="stat-top"><span className="stat-label">Conversions</span><span className="stat-icon">🎯</span></div>
                  <div className="stat-value">{metrics ? metrics.totalConversions : "0"}</div>
                  <div className="stat-sub">calls, bookings, leads</div>
                </div>
                <div className="stat">
                  <div className="stat-top"><span className="stat-label">ROAS</span><span className="stat-icon">📈</span></div>
                  <div className="stat-value">{metrics ? metrics.avgROAS : "0"}x</div>
                  <div className="stat-sub">
                    {metrics?.trend === "improving" ? "📈 improving" : metrics?.trend === "declining" ? "📉 declining" : "➡️ stable"}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-top"><span className="stat-label">Avg CPC</span><span className="stat-icon">🔗</span></div>
                  <div className="stat-value">${metrics ? metrics.avgCPC : "0"}</div>
                  <div className="stat-sub">{metrics ? `${metrics.totalClicks.toLocaleString()} clicks` : "no clicks yet"}</div>
                </div>
              </div>

              <div>
                <h3 className="card-title" style={{ marginBottom: 12 }}>Platforms</h3>
                <div className="platforms">
                  {Object.entries(PLATFORM_META).map(([key, meta]) => {
                    const conn = connections?.[key];
                    const data = metrics?.byPlatform?.[key];
                    return (
                      <div key={key} className="platform">
                        <div className="platform-head">
                          <div className="platform-logo">{meta.icon}</div>
                          <div className="platform-name">{meta.label}</div>
                          <span className={`status-pill ${conn?.connected ? "connected" : "disconnected"}`}>
                            {conn?.connected ? "● Connected" : "○ Not connected"}
                          </span>
                        </div>
                        {conn?.connected ? (
                          <div className="platform-rows">
                            <div className="platform-row"><span className="k">Spend</span><span className="v">${data ? data.spend.toFixed(0) : 0}</span></div>
                            <div className="platform-row"><span className="k">Conversions</span><span className="v">{data ? data.conversions : 0}</span></div>
                            <div className="platform-row"><span className="k">ROAS</span><span className="v">{data ? data.roas : 0}x</span></div>
                          </div>
                        ) : (
                          <>
                            <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 8px" }}>
                              Connect this account to start pulling live metrics and let the AI optimize it.
                            </p>
                            <button className="btn btn-primary" onClick={() => setView("settings")}>
                              Connect →
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="card-title" style={{ marginBottom: 12 }}>Quick Actions</h3>
                <div className="actions">
                  {QUICK_ACTIONS.map((a) => {
                    const unlocked = isUnlocked(a.requires);
                    return (
                      <button
                        key={a.label}
                        className={`action ${unlocked ? "" : "locked"}`}
                        title={unlocked ? a.label : lockReason(a.requires)}
                        onClick={() => {
                          if (!unlocked) showToast(lockReason(a.requires), "warn");
                        }}
                      >
                        {!unlocked && <span className="action-badge">{a.requires === "soon" ? "SOON" : "🔒"}</span>}
                        <span className="action-icon">{a.icon}</span>
                        <span>{a.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* -------- AI INSIGHTS -------- */}
          {!viewLocked && view === "insights" && (
            <>
              <div className="card">
                <h3 className="card-title">🤖 AI Optimization Engine</h3>
                <p style={{ margin: 0, fontSize: 14, color: "#475569", lineHeight: 1.6 }}>
                  Runs automatically every day at <strong>9:00 AM</strong>. It analyzes all connected platforms,
                  rebalances the ${selectedClient?.ad_budget || 500}/month budget toward whatever is converting best,
                  and emails you a report with recommended actions.
                  {connectedCount === 0 && " Connect at least one platform in Settings to activate it."}
                </p>
                <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                  <button className="btn btn-primary" disabled={connectedCount === 0} title={connectedCount === 0 ? "Connect a platform first" : "Trigger an optimization run"}>
                    ▶ Run Optimization Now
                  </button>
                  {connectedCount === 0 && (
                    <button className="btn btn-ghost" onClick={() => setView("settings")}>Connect a platform</button>
                  )}
                </div>
              </div>
              <div className="insights">
                {AI_FEATURES.map((f) => (
                  <div key={f.title} className="insight">
                    <div className="insight-icon">{f.icon}</div>
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* -------- CAMPAIGNS / CREATIVES / KEYWORDS / AUDIENCES (unlocked, no data yet) -------- */}
          {!viewLocked && ["campaigns", "creatives", "keywords", "audiences"].includes(view) && (
            <div className="empty card">
              <div className="empty-icon">📭</div>
              <p style={{ fontWeight: 700, color: "#475569", marginBottom: 6 }}>No {activeNavItem.label.toLowerCase()} synced yet</p>
              <p style={{ margin: 0 }}>
                Data syncs automatically after the first daily optimization run pulls from your connected accounts.
              </p>
            </div>
          )}

          {/* -------- SETTINGS -------- */}
          {view === "settings" && (
            <div className="settings-grid">
              <div className="card" style={{ padding: "16px 22px" }}>
                <p style={{ margin: 0, fontSize: 13.5, color: "#475569", lineHeight: 1.6 }}>
                  🔐 Connect the client&apos;s ad accounts here. Credentials are stored server-side and never shown
                  again in full — only the last 4 characters. Connecting a platform unlocks its features across the dashboard.
                </p>
              </div>

              {connections &&
                Object.entries(connections).map(([platform, conn]) => {
                  const meta = PLATFORM_META[platform];
                  return (
                    <div key={platform} className="conn-card">
                      <div className="platform-head">
                        <div className="platform-logo">{meta.icon}</div>
                        <div>
                          <div className="platform-name">{meta.label}</div>
                          {conn.connected && conn.connectedAt && (
                            <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
                              Connected {new Date(conn.connectedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <span className={`status-pill ${conn.connected ? "connected" : "disconnected"}`}>
                          {conn.connected ? "● Connected" : "○ Not connected"}
                        </span>
                      </div>

                      <div className="conn-fields">
                        {conn.fields.map((f) => (
                          <div key={f.key} className="field">
                            <label>
                              {f.label}
                              {f.saved && <span style={{ color: "#16a34a" }}> ✓ saved{f.secret ? ` (${f.maskedValue})` : ""}</span>}
                            </label>
                            <input
                              type={f.secret ? "password" : "text"}
                              placeholder={f.saved ? (f.secret ? "Leave blank to keep saved value" : f.maskedValue) : f.placeholder || f.label}
                              value={forms[platform]?.[f.key] || ""}
                              onChange={(e) => setFormValue(platform, f.key, e.target.value)}
                              autoComplete="off"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="conn-foot">
                        <button
                          className="btn btn-primary"
                          disabled={busyPlatform === platform}
                          onClick={() => connectPlatform(platform)}
                        >
                          {busyPlatform === platform ? "Saving…" : conn.connected ? "Update Credentials" : "Connect"}
                        </button>
                        {conn.connected && (
                          <button
                            className="btn btn-danger"
                            disabled={busyPlatform === platform}
                            onClick={() => disconnectPlatform(platform)}
                          >
                            Disconnect
                          </button>
                        )}
                        <span className="conn-note">All fields required to connect</span>
                      </div>
                    </div>
                  );
                })}
              {!connections && <div className="empty">Loading connections…</div>}

              <div className="card">
                <h3 className="card-title">Preferences (coming soon)</h3>
                <div className="soon-toggles">
                  <div className="soon-toggle"><span className="soon-switch" /> 📧 Daily email report</div>
                  <div className="soon-toggle"><span className="soon-switch" /> ⚡ Auto-apply AI budget changes</div>
                  <div className="soon-toggle"><span className="soon-switch" /> 🔔 Anomaly alerts</div>
                  <div className="soon-toggle"><span className="soon-switch" /> 🌐 Spanish report language</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && <div className={`toast ${toast.tone}`}>{toast.message}</div>}
    </div>
  );
}
