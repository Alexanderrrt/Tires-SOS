"use client";

import { useEffect, useState } from "react";

const PLATFORM_META = {
  google_ads: { label: "Google Ads", icon: "🔍" },
  meta_ads: { label: "Meta Ads", icon: "📘" },
  yelp: { label: "Yelp Ads", icon: "⭐" },
};

const COPY = {
  intro: { en: "🔐 Connect the ad accounts here. Credentials are stored server-side and never shown again in full — only the last 4 characters. Connecting a platform unlocks its features across the ads panel.", es: "🔐 Conecta las cuentas de anuncios aquí. Las credenciales se guardan en el servidor y nunca se vuelven a mostrar por completo — solo los últimos 4 caracteres. Conectar una plataforma desbloquea sus funciones." },
  connected: { en: "● Connected", es: "● Conectado" },
  notConnected: { en: "○ Not connected", es: "○ No conectado" },
  connectedOn: { en: "Connected", es: "Conectado" },
  update: { en: "Update Credentials", es: "Actualizar credenciales" },
  connect: { en: "Connect", es: "Conectar" },
  saving: { en: "Saving…", es: "Guardando…" },
  disconnect: { en: "Disconnect", es: "Desconectar" },
  requiredNote: { en: "All fields required to connect", es: "Todos los campos son obligatorios" },
  loading: { en: "Loading connections…", es: "Cargando conexiones…" },
  leaveBlank: { en: "Leave blank to keep saved value", es: "Deja en blanco para mantener el valor guardado" },
  saved: { en: "saved", es: "guardado" },
};

export default function AdsSettings({ t }) {
  const [connections, setConnections] = useState(null);
  const [forms, setForms] = useState({});
  const [busyPlatform, setBusyPlatform] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch("/api/admin/ads-connections")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.platforms) setConnections(data.platforms); })
      .catch(() => {});
  }, []);

  function showToast(message, tone = "ok") {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4000);
  }

  function setFormValue(platform, key, value) {
    setForms((prev) => ({ ...prev, [platform]: { ...(prev[platform] || {}), [key]: value } }));
  }

  async function connectPlatform(platform) {
    setBusyPlatform(platform);
    try {
      const res = await fetch("/api/admin/ads-connections", {
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
      const res = await fetch("/api/admin/ads-connections", {
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

  return (
    <>
      <div className="editor__group">
        <p className="editor__hint" style={{ margin: 0 }}>{t(COPY.intro)}</p>
      </div>

      {connections ? (
        Object.entries(connections).map(([platform, conn]) => {
          const meta = PLATFORM_META[platform];
          return (
            <div key={platform} className="ads-conn-card">
              <div className="ads-platform-head">
                <span>{meta.icon}</span>
                <div>
                  <div className="ads-platform-name">{meta.label}</div>
                  {conn.connected && conn.connectedAt && (
                    <div style={{ fontSize: 11.5, color: "var(--admin-muted)" }}>
                      {t(COPY.connectedOn)} {new Date(conn.connectedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <span className={`ads-status-pill ${conn.connected ? "connected" : "disconnected"}`}>
                  {conn.connected ? t(COPY.connected) : t(COPY.notConnected)}
                </span>
              </div>

              <div className="ads-fields">
                {conn.fields.map((f) => (
                  <div key={f.key} className="ads-field">
                    <label>
                      {f.label}
                      {f.saved && <span style={{ color: "var(--admin-good)" }}> ✓ {t(COPY.saved)}{f.secret ? ` (${f.maskedValue})` : ""}</span>}
                    </label>
                    <input
                      type={f.secret ? "password" : "text"}
                      placeholder={f.saved ? (f.secret ? t(COPY.leaveBlank) : f.maskedValue) : f.placeholder || f.label}
                      value={forms[platform]?.[f.key] || ""}
                      onChange={(e) => setFormValue(platform, f.key, e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button type="button" className="btn btn--primary btn--small" disabled={busyPlatform === platform} onClick={() => connectPlatform(platform)}>
                  {busyPlatform === platform ? t(COPY.saving) : conn.connected ? t(COPY.update) : t(COPY.connect)}
                </button>
                {conn.connected && (
                  <button type="button" className="btn btn--danger btn--small" disabled={busyPlatform === platform} onClick={() => disconnectPlatform(platform)}>
                    {t(COPY.disconnect)}
                  </button>
                )}
                <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--admin-muted)" }}>{t(COPY.requiredNote)}</span>
              </div>
            </div>
          );
        })
      ) : (
        <p className="editor__hint">{t(COPY.loading)}</p>
      )}

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 100, padding: "13px 20px", borderRadius: 12,
          fontSize: 13.5, fontWeight: 600, color: "white",
          background: toast.tone === "ok" ? "#16a34a" : toast.tone === "warn" ? "#d97706" : "#dc2626",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}>
          {toast.message}
        </div>
      )}
    </>
  );
}
