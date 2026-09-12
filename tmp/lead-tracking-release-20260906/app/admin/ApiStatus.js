"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const COPY = {
  heading: { en: "Groq API status", es: "Estado de la API de Groq" },
  hint: {
    en: "Live status of the chatbot's AI provider. Numbers come straight from Groq's own rate-limit headers.",
    es: "Estado en vivo del proveedor de IA del chat. Los números vienen directamente de los límites informados por Groq.",
  },
  notConfigured: {
    en: "GROQ_API_KEY is not set — the chatbot is disabled.",
    es: "GROQ_API_KEY no está configurada; el chat está desactivado.",
  },
  unknown: { en: "No data yet", es: "Sin datos todavía" },
  unknownHint: {
    en: "Nothing has called the API yet in this server session. Click Check now, or send a chat message.",
    es: "Todavía no se ha llamado a la API en esta sesión del servidor. Haz clic en Verificar ahora o envía un mensaje de chat.",
  },
  ok: { en: "Good — API is responding", es: "Bien — la API responde" },
  rateLimited: { en: "Rate limited", es: "Límite alcanzado" },
  error: { en: "Error contacting Groq", es: "Error al contactar Groq" },
  waitLabel: { en: "Wait before retrying", es: "Espera antes de reintentar" },
  readyNow: { en: "Ready to retry now", es: "Listo para reintentar" },
  requests: { en: "Requests remaining (this window)", es: "Solicitudes restantes (esta ventana)" },
  tokens: { en: "Tokens remaining (this window)", es: "Tokens restantes (esta ventana)" },
  resetsIn: { en: "Resets in", es: "Se reinicia en" },
  lastChecked: { en: "Last checked", es: "Última verificación" },
  never: { en: "Never", es: "Nunca" },
  checkNow: { en: "Check now", es: "Verificar ahora" },
  checking: { en: "Checking…", es: "Verificando…" },
  model: { en: "Model", es: "Modelo" },
  autoNote: {
    en: "Updates automatically whenever a customer chat calls the API. \"Check now\" sends a tiny 1-token test call.",
    es: "Se actualiza automáticamente cuando un chat de cliente llama a la API. \"Verificar ahora\" envía una prueba mínima de 1 token.",
  },
};

function formatSeconds(totalSeconds, lang) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return lang === "es" ? `${r}s` : `${r}s`;
  return lang === "es" ? `${m}m ${r}s` : `${m}m ${r}s`;
}

function Bar({ remaining, limit }) {
  if (!Number.isFinite(remaining) || !Number.isFinite(limit) || limit <= 0) return null;
  const pct = Math.max(0, Math.min(100, (remaining / limit) * 100));
  const low = pct < 15;
  return (
    <div className="api-status__bar-track">
      <div
        className={`api-status__bar-fill ${low ? "api-status__bar-fill--low" : ""}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function ApiStatus({ t, lang = "en" }) {
  const [data, setData] = useState(null);
  const [checking, setChecking] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const pollRef = useRef(null);

  const load = useCallback(async (refresh) => {
    if (refresh) setChecking(true);
    try {
      const res = await fetch(`/api/admin/groq-status${refresh ? "?refresh=1" : ""}`, { cache: "no-store" });
      const body = await res.json().catch(() => null);
      if (body) setData(body);
    } finally {
      if (refresh) setChecking(false);
    }
  }, []);

  useEffect(() => {
    load(false);
    pollRef.current = setInterval(() => load(false), 15000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(pollRef.current);
      clearInterval(tick);
    };
  }, [load]);

  const retryAfterEndsAt =
    data?.status === "rate_limited" && Number.isFinite(data?.retryAfterSeconds) && data?.checkedAt
      ? data.checkedAt + data.retryAfterSeconds * 1000
      : null;
  const secondsLeft = retryAfterEndsAt ? Math.max(0, (retryAfterEndsAt - now) / 1000) : 0;
  const isWaiting = Boolean(retryAfterEndsAt) && secondsLeft > 0;

  const badge = !data?.configured
    ? { cls: "api-status__badge--off", label: COPY.notConfigured }
    : !data?.checkedAt
      ? { cls: "api-status__badge--unknown", label: COPY.unknown }
      : isWaiting
        ? { cls: "api-status__badge--warn", label: COPY.rateLimited }
        : data?.status === "error"
          ? { cls: "api-status__badge--warn", label: COPY.error }
          : { cls: "api-status__badge--ok", label: COPY.ok };

  return (
    <section className="editor__group api-status">
      <h2>{t(COPY.heading)}</h2>
      <p className="editor__hint">{t(COPY.hint)}</p>

      <div className="api-status__row">
        <span className={`api-status__badge ${badge.cls}`}>{t(badge.label)}</span>
        <button
          type="button"
          className="btn btn--ghost btn--small"
          onClick={() => load(true)}
          disabled={checking || !data?.configured}
        >
          {checking ? t(COPY.checking) : t(COPY.checkNow)}
        </button>
      </div>

      {data?.configured && !data?.checkedAt && (
        <p className="editor__hint">{t(COPY.unknownHint)}</p>
      )}

      {isWaiting && (
        <p className="api-status__wait">
          {t(COPY.waitLabel)}: <strong>{formatSeconds(secondsLeft, lang)}</strong>
        </p>
      )}

      {data?.status === "error" && data?.message && (
        <p className="api-status__wait api-status__wait--err">{data.message}</p>
      )}

      {(Number.isFinite(data?.remainingRequests) || Number.isFinite(data?.remainingTokens)) && (
        <div className="api-status__grid">
          {Number.isFinite(data?.remainingRequests) && Number.isFinite(data?.limitRequests) && (
            <div className="api-status__meter">
              <div className="api-status__meter-label">
                <span>{t(COPY.requests)}</span>
                <span>
                  {data.remainingRequests} / {data.limitRequests}
                </span>
              </div>
              <Bar remaining={data.remainingRequests} limit={data.limitRequests} />
              {data.resetRequests && (
                <p className="editor__hint">{t(COPY.resetsIn)}: {data.resetRequests}</p>
              )}
            </div>
          )}
          {Number.isFinite(data?.remainingTokens) && Number.isFinite(data?.limitTokens) && (
            <div className="api-status__meter">
              <div className="api-status__meter-label">
                <span>{t(COPY.tokens)}</span>
                <span>
                  {data.remainingTokens.toLocaleString()} / {data.limitTokens.toLocaleString()}
                </span>
              </div>
              <Bar remaining={data.remainingTokens} limit={data.limitTokens} />
              {data.resetTokens && (
                <p className="editor__hint">{t(COPY.resetsIn)}: {data.resetTokens}</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="api-status__meta">
        <span>
          {t(COPY.model)}: <strong>{data?.model || "—"}</strong>
        </span>
        <span>
          {t(COPY.lastChecked)}:{" "}
          <strong>{data?.checkedAt ? new Date(data.checkedAt).toLocaleTimeString() : t(COPY.never)}</strong>
        </span>
      </div>

      <p className="editor__hint">{t(COPY.autoNote)}</p>
    </section>
  );
}
