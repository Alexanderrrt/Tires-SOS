"use client";

import { useState } from "react";
import AdsDataState from "./AdsDataState";
import { useAdsConnections } from "./useAdsData";

const PLATFORM_META = {
  google_ads: { label: "Google Ads", icon: "🔍" },
  meta_ads: { label: "Meta Ads", icon: "📘" },
  yelp: { label: "Yelp Ads", icon: "⭐" },
};

const COPY = {
  intro: { en: "🔐 Credentials are encrypted and stored server-side. Secret values are never returned in full.", es: "🔐 Las credenciales se cifran y guardan en el servidor. Los valores secretos nunca se muestran completos." },
  connected: { en: "● Configured", es: "● Configurado" },
  notConnected: { en: "○ Not connected", es: "○ No conectado" },
  connectedOn: { en: "Saved", es: "Guardado" },
  update: { en: "Update Credentials", es: "Actualizar credenciales" },
  connect: { en: "Connect", es: "Conectar" },
  saving: { en: "Saving…", es: "Guardando…" },
  disconnect: { en: "Disconnect", es: "Desconectar" },
  disconnectConfirm: { en: "Disconnect this ad account? Saved credentials will be removed.", es: "¿Desconectar esta cuenta? Se eliminarán las credenciales guardadas." },
  requiredNote: { en: "Fill all required fields", es: "Completa los campos obligatorios" },
  loading: { en: "Loading connections…", es: "Cargando conexiones…" },
  leaveBlank: { en: "Leave blank to keep saved value", es: "Deja en blanco para mantener el valor guardado" },
  saved: { en: "saved", es: "guardado" },
  connectedToast: { en: "connected", es: "conectado" },
  connectedMemoryOnly: { en: "connected temporarily — database storage is unavailable", es: "conectado temporalmente — el almacenamiento no está disponible" },
  couldNotConnect: { en: "Could not connect.", es: "No se pudo conectar." },
  networkError: { en: "Network error — try again.", es: "Error de red — intenta de nuevo." },
  disconnectedToast: { en: "disconnected", es: "desconectado" },
};

export default function AdsSettings({ t }) {
  const connectionsState = useAdsConnections();
  const connections = connectionsState.data;
  const setConnections = connectionsState.setData;
  const [forms, setForms] = useState({});
  const [busyPlatform, setBusyPlatform] = useState(null);
  const [toast, setToast] = useState(null);

  function showToast(message, tone = "ok") {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 4000);
  }

  function setFormValue(platform, key, value) {
    setForms((previous) => ({ ...previous, [platform]: { ...(previous[platform] || {}), [key]: value } }));
  }

  async function connectPlatform(platform) {
    setBusyPlatform(platform);
    try {
      const response = await fetch("/api/admin/ads-connections", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ platform, fields: forms[platform] || {} }) });
      const data = await response.json().catch(() => ({}));
      if (data.platforms) setConnections(data.platforms);
      if (!response.ok) throw new Error(data.error || t(COPY.couldNotConnect));
      setForms((previous) => ({ ...previous, [platform]: {} }));
      showToast(data.persisted ? `${PLATFORM_META[platform].label} ${t(COPY.connectedToast)} ✓` : `${PLATFORM_META[platform].label} ${t(COPY.connectedMemoryOnly)}`, data.persisted ? "ok" : "warn");
    } catch (error) {
      showToast(error?.message || t(COPY.networkError), "error");
    } finally {
      setBusyPlatform(null);
    }
  }

  async function disconnectPlatform(platform) {
    if (!window.confirm(t(COPY.disconnectConfirm))) return;
    setBusyPlatform(platform);
    try {
      const response = await fetch("/api/admin/ads-connections", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ platform }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || t(COPY.networkError));
      if (data.platforms) setConnections(data.platforms);
      showToast(`${PLATFORM_META[platform].label} ${t(COPY.disconnectedToast)}`, "ok");
    } catch (error) {
      showToast(error?.message || t(COPY.networkError), "error");
    } finally {
      setBusyPlatform(null);
    }
  }

  return (
    <>
      <AdsDataState t={t} error={connectionsState.error} onRetry={connectionsState.retry} />
      <div className="editor__group"><p className="editor__hint" style={{ margin: 0 }}>{t(COPY.intro)}</p></div>
      {connections ? Object.entries(connections).map(([platform, connection]) => {
        const meta = PLATFORM_META[platform];
        return (
          <div key={platform} className="ads-conn-card">
            <div className="ads-platform-head">
              <span>{meta.icon}</span>
              <div><div className="ads-platform-name">{meta.label}</div>{connection.connected && connection.connectedAt && <div style={{ fontSize: 11.5, color: "var(--admin-muted)" }}>{t(COPY.connectedOn)} {new Date(connection.connectedAt).toLocaleDateString()}</div>}</div>
              <span className={`ads-status-pill ${connection.connected ? "connected" : "disconnected"}`}>{connection.connected ? t(COPY.connected) : t(COPY.notConnected)}</span>
            </div>
            <div className="ads-fields">
              {connection.fields.map((field) => (
                <div key={field.key} className="ads-field">
                  <label>{field.label}{field.saved && <span style={{ color: "var(--admin-good)" }}> ✓ {t(COPY.saved)}{field.secret ? ` (${field.maskedValue})` : ""}</span>}</label>
                  <input type={field.secret ? "password" : "text"} placeholder={field.saved ? (field.secret ? t(COPY.leaveBlank) : field.maskedValue) : field.placeholder || field.label} value={forms[platform]?.[field.key] || ""} onChange={(event) => setFormValue(platform, field.key, event.target.value)} autoComplete="off" />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button type="button" className="btn btn--primary btn--small" disabled={busyPlatform === platform} onClick={() => connectPlatform(platform)}>{busyPlatform === platform ? t(COPY.saving) : connection.connected ? t(COPY.update) : t(COPY.connect)}</button>
              {connection.connected && <button type="button" className="btn btn--danger btn--small" disabled={busyPlatform === platform} onClick={() => disconnectPlatform(platform)}>{t(COPY.disconnect)}</button>}
              <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--admin-muted)" }}>{t(COPY.requiredNote)}</span>
            </div>
          </div>
        );
      }) : !connectionsState.error ? <p className="editor__hint">{t(COPY.loading)}</p> : null}
      {toast && <div role="status" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100, padding: "13px 20px", borderRadius: 12, fontSize: 13.5, fontWeight: 600, color: "white", background: toast.tone === "ok" ? "#16a34a" : toast.tone === "warn" ? "#d97706" : "#dc2626", boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>{toast.message}</div>}
    </>
  );
}
