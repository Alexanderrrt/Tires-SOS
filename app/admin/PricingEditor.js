"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage, useT } from "../i18n/LanguageContext";
import { COPY } from "../site.config";
import AdminLoader from "./AdminLoader";

const E = COPY.admin.editor;
const CHAT_ADMIN = {
  adminTitle: { en: "Admin", es: "Admin" },
  chatTab: { en: "Chat", es: "Chat" },
  pricingTab: { en: "Pricing", es: "Precios" },
  chatTitle: { en: "Chat Settings", es: "Configuracion del chat" },
  chatStorageWarn: {
    en: "Chat storage is not connected - changes apply for this session only.",
    es: "El almacenamiento del chat no esta conectado - los cambios solo aplican en esta sesion.",
  },
  publicText: { en: "Public chat text", es: "Texto publico del chat" },
  publicHint: {
    en: "These fields control the quote chat page customers see.",
    es: "Estos campos controlan la pagina de chat de cotizacion que ven los clientes.",
  },
  title: { en: "Title", es: "Titulo" },
  subtitle: { en: "Subtitle", es: "Subtitulo" },
  intro: { en: "First message", es: "Primer mensaje" },
  placeholder: { en: "Input placeholder", es: "Texto del campo" },
  prompts: { en: "Starter prompts", es: "Preguntas rapidas" },
  promptsHint: {
    en: "Keep these short. They should start a quote quickly.",
    es: "Mantenlas cortas. Deben iniciar una cotizacion rapido.",
  },
  prompt: { en: "Prompt", es: "Pregunta" },
  behavior: { en: "Response guidance", es: "Guia de respuesta" },
  behaviorHint: {
    en: "Private guidance for the chat responses. Customers do not see this text.",
    es: "Guia privada para las respuestas del chat. Los clientes no ven este texto.",
  },
  saved: { en: "Chat saved.", es: "Chat guardado." },
  savedSession: {
    en: "Chat saved for this session - connect Supabase to make it permanent.",
    es: "Chat guardado para esta sesion - conecta Supabase para hacerlo permanente.",
  },
  saveFailed: { en: "Chat save failed.", es: "No se pudo guardar el chat." },
  english: { en: "English", es: "Ingles" },
  spanish: { en: "Spanish", es: "Espanol" },
};

function BilingualField({ label, value, onChange, multiline = false, languageLabels }) {
  const Control = multiline ? "textarea" : "input";
  return (
    <div className="editor__bi-field">
      <p className="editor__field-title">{label}</p>
      <label>
        <span>{languageLabels.en}</span>
        <Control value={value?.en || ""} onChange={(e) => onChange("en", e.target.value)} />
      </label>
      <label>
        <span>{languageLabels.es}</span>
        <Control value={value?.es || ""} onChange={(e) => onChange("es", e.target.value)} />
      </label>
    </div>
  );
}

export default function PricingEditor({ initialPricing, initialChatSettings, persistent, chatPersistent, authReady }) {
  const router = useRouter();
  const { lang, toggleLang } = useLanguage();
  const t = useT();
  const [activeTab, setActiveTab] = useState("chat");
  const [pricing, setPricing] = useState(initialPricing);
  const [chatSettings, setChatSettings] = useState(initialChatSettings);
  const [status, setStatus] = useState(null); // {ok, msg: {en, es}}
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // immutable-ish update helper
  const edit = (mutator) =>
    setPricing((p) => {
      const next = structuredClone(p);
      mutator(next);
      return next;
    });

  const editChat = (mutator) =>
    setChatSettings((settings) => {
      const next = structuredClone(settings);
      mutator(next);
      return next;
    });

  const numHandler = (mutator) => (e) => {
    const v = e.target.value === "" ? 0 : Number(e.target.value);
    if (Number.isFinite(v)) edit((n) => mutator(n, Math.max(0, v)));
  };

  async function savePricing() {
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/admin/pricing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pricing),
    });
    setSaving(false);
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setStatus({ ok: true, msg: body.persisted ? E.saved : E.savedSession });
      router.refresh();
    } else {
      // Server detail (validation etc.) is English-only; show it after the
      // bilingual headline rather than dropping it.
      const detail = body.error ? ` (${body.error})` : "";
      setStatus({ ok: false, msg: { en: E.saveFailed.en + detail, es: E.saveFailed.es + detail } });
    }
  }

  async function saveChat() {
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/admin/chat", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatSettings),
    });
    setSaving(false);
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setStatus({ ok: true, msg: body.persisted ? CHAT_ADMIN.saved : CHAT_ADMIN.savedSession });
      router.refresh();
    } else {
      const detail = body.error ? ` (${body.error})` : "";
      setStatus({
        ok: false,
        msg: { en: CHAT_ADMIN.saveFailed.en + detail, es: CHAT_ADMIN.saveFailed.es + detail },
      });
    }
  }

  async function save() {
    if (activeTab === "chat") return saveChat();
    return savePricing();
  }

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      {loggingOut && <AdminLoader message={t(E.loggingOut)} />}
      <div className="editor">
      <header className="editor__bar">
        <div>
          <h1>{activeTab === "chat" ? t(CHAT_ADMIN.chatTitle) : t(E.title)}</h1>
          {activeTab === "pricing" && !persistent && <p className="editor__warn">{t(E.storageWarn)}</p>}
          {activeTab === "chat" && !chatPersistent && <p className="editor__warn">{t(CHAT_ADMIN.chatStorageWarn)}</p>}
        </div>
        <div className="editor__actions">
          {status && (
            <span className={status.ok ? "editor__ok" : "editor__err"}>{t(status.msg)}</span>
          )}
          <button type="button" className="lang-toggle" onClick={toggleLang} aria-label="Toggle language">
            {lang === "en" ? "ES" : "EN"}
          </button>
          <button className="btn btn--ghost btn--small" onClick={logout} disabled={loggingOut || saving}>
            {loggingOut ? t(E.loggingOut) : t(E.logOut)}
          </button>
          <button className="btn btn--primary btn--small" onClick={save} disabled={saving}>
            {saving ? t(E.saving) : t(E.save)}
          </button>
        </div>
      </header>

      <nav className="editor__tabs" aria-label={t(CHAT_ADMIN.adminTitle)}>
        <button
          type="button"
          className={`editor__tab ${activeTab === "chat" ? "editor__tab--on" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          {t(CHAT_ADMIN.chatTab)}
        </button>
        <button
          type="button"
          className={`editor__tab ${activeTab === "pricing" ? "editor__tab--on" : ""}`}
          onClick={() => setActiveTab("pricing")}
        >
          {t(CHAT_ADMIN.pricingTab)}
        </button>
      </nav>

      {activeTab === "chat" ? (
        <>
          <section className="editor__group">
            <h2>{t(CHAT_ADMIN.publicText)}</h2>
            <p className="editor__hint">{t(CHAT_ADMIN.publicHint)}</p>
            <div className="editor__bi-grid">
              <BilingualField
                label={t(CHAT_ADMIN.title)}
                value={chatSettings.title}
                languageLabels={{ en: t(CHAT_ADMIN.english), es: t(CHAT_ADMIN.spanish) }}
                onChange={(key, value) => editChat((n) => (n.title[key] = value))}
              />
              <BilingualField
                label={t(CHAT_ADMIN.subtitle)}
                value={chatSettings.subtitle}
                languageLabels={{ en: t(CHAT_ADMIN.english), es: t(CHAT_ADMIN.spanish) }}
                onChange={(key, value) => editChat((n) => (n.subtitle[key] = value))}
                multiline
              />
              <BilingualField
                label={t(CHAT_ADMIN.intro)}
                value={chatSettings.intro}
                languageLabels={{ en: t(CHAT_ADMIN.english), es: t(CHAT_ADMIN.spanish) }}
                onChange={(key, value) => editChat((n) => (n.intro[key] = value))}
                multiline
              />
              <BilingualField
                label={t(CHAT_ADMIN.placeholder)}
                value={chatSettings.placeholder}
                languageLabels={{ en: t(CHAT_ADMIN.english), es: t(CHAT_ADMIN.spanish) }}
                onChange={(key, value) => editChat((n) => (n.placeholder[key] = value))}
              />
            </div>
          </section>

          <section className="editor__group">
            <h2>{t(CHAT_ADMIN.prompts)}</h2>
            <p className="editor__hint">{t(CHAT_ADMIN.promptsHint)}</p>
            <div className="editor__prompt-grid">
              {chatSettings.quickPrompts.map((prompt, index) => (
                <div key={index} className="editor__prompt-card">
                  <p className="editor__field-title">
                    {t(CHAT_ADMIN.prompt)} {index + 1}
                  </p>
                  <label>
                    <span>{t(CHAT_ADMIN.english)}</span>
                    <input
                      value={prompt.en}
                      onChange={(e) =>
                        editChat((n) => {
                          n.quickPrompts[index].en = e.target.value;
                        })
                      }
                    />
                  </label>
                  <label>
                    <span>{t(CHAT_ADMIN.spanish)}</span>
                    <input
                      value={prompt.es}
                      onChange={(e) =>
                        editChat((n) => {
                          n.quickPrompts[index].es = e.target.value;
                        })
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className="editor__group">
            <h2>{t(CHAT_ADMIN.behavior)}</h2>
            <p className="editor__hint">{t(CHAT_ADMIN.behaviorHint)}</p>
            <textarea
              className="editor__textarea"
              value={chatSettings.systemInstructions}
              onChange={(e) => editChat((n) => (n.systemInstructions = e.target.value))}
              rows={6}
            />
          </section>
        </>
      ) : (
        <>

      {/* Global settings */}
      <section className="editor__group">
        <h2>{t(E.globalHeading)}</h2>
        <div className="editor__row">
          <label>
            <span>{t(E.laborRate)}</span>
            <input type="number" min="0" value={pricing.laborRate} onChange={numHandler((n, v) => (n.laborRate = v))} />
          </label>
          <label>
            <span>{t(E.spread)}</span>
            <input
              type="number"
              min="0"
              max="90"
              value={Math.round(pricing.rangePct * 100)}
              onChange={numHandler((n, v) => (n.rangePct = Math.min(0.9, v / 100)))}
            />
          </label>
          <label>
            <span>{t(E.currency)}</span>
            <input value={pricing.currency} onChange={(e) => edit((n) => (n.currency = e.target.value))} />
          </label>
        </div>
      </section>

      {/* Vehicle multipliers */}
      <section className="editor__group">
        <h2>{t(E.vehicleHeading)}</h2>
        <p className="editor__hint">{t(E.vehicleHint)}</p>
        <div className="editor__grid">
          {pricing.vehicleClasses.map((vc, i) => (
            <label key={vc.id} className="editor__cell">
              <span>{t(vc.label)}</span>
              <input
                type="number"
                step="0.05"
                min="0"
                value={vc.factor}
                onChange={numHandler((n, v) => (n.vehicleClasses[i].factor = v))}
              />
            </label>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="editor__group">
        <h2>{t(E.servicesHeading)}</h2>
        {pricing.services.map((svc, i) => (
          <div key={svc.id} className="editor__svc">
            <div className="editor__svc-head">
              <strong>{t(svc.label)}</strong>
              <span className="editor__tag">{svc.model}</span>
              <label className="editor__inline-check">
                <input
                  type="checkbox"
                  checked={svc.appliesVehicleFactor}
                  onChange={(e) => edit((n) => (n.services[i].appliesVehicleFactor = e.target.checked))}
                />
                {t(E.appliesFactor)}
              </label>
            </div>
            <p className="editor__hint">{t(E.modelHelp[svc.model])}</p>

            <div className="editor__row">
              {svc.model === "perUnit" && (
                <>
                  <label>
                    <span>{t(E.basePrice)}</span>
                    <input type="number" min="0" value={svc.basePrice} onChange={numHandler((n, v) => (n.services[i].basePrice = v))} />
                  </label>
                  {svc.fees?.map((f, fi) => (
                    <label key={fi}>
                      <span>{t(f.label)} ({t(f.per === "unit" ? E.perUnit : E.perJob)})</span>
                      <input type="number" min="0" value={f.amount} onChange={numHandler((n, v) => (n.services[i].fees[fi].amount = v))} />
                    </label>
                  ))}
                </>
              )}

              {svc.model === "labor" && (
                <>
                  <label>
                    <span>{t(E.partsBase)}</span>
                    <input type="number" min="0" value={svc.partsBase} onChange={numHandler((n, v) => (n.services[i].partsBase = v))} />
                  </label>
                  <label>
                    <span>{t(E.laborHours)}</span>
                    <input type="number" min="0" step="0.25" value={svc.laborHours} onChange={numHandler((n, v) => (n.services[i].laborHours = v))} />
                  </label>
                </>
              )}

              {svc.model === "options" &&
                svc.options.map((o, oi) => (
                  <label key={o.id}>
                    <span>{t(o.label)}</span>
                    <input type="number" min="0" value={o.price} onChange={numHandler((n, v) => (n.services[i].options[oi].price = v))} />
                  </label>
                ))}

              {svc.model === "flat" && (
                <label>
                  <span>{t(E.flatPrice)}</span>
                  <input type="number" min="0" value={svc.flatPrice} onChange={numHandler((n, v) => (n.services[i].flatPrice = v))} />
                </label>
              )}
            </div>
          </div>
        ))}
      </section>
        </>
      )}
      </div>
    </>
  );
}
