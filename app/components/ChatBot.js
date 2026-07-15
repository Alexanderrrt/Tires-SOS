"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage, useT } from "../i18n/LanguageContext";
import { CHAT, SITE } from "../site.config";
import { formatShopSlot, getShopDateTime } from "../../lib/shop-time";
import TurnstileChallenge from "./TurnstileChallenge";
import { captureAnalytics } from "./PostHogAnalytics";

const QUOTE_CHAT = {
  title: { en: "Service Desk", es: "Servicio y Citas" },
  subtitle: {
    en: "Tell us the service you need. We can answer questions or help you book.",
    es: "Dinos qué servicio necesitas. Podemos responder tus preguntas o ayudarte a agendar.",
  },
  promptTires: {
    en: "I need tires.",
    es: "Necesito llantas.",
  },
  promptRepair: {
    en: "I have a flat tire. Can you help today?",
    es: "Tengo una llanta ponchada. ¿Me pueden ayudar hoy?",
  },
  promptBrakes: {
    en: "How much for brakes on my car?",
    es: "¿Cuánto cuesta revisar los frenos de mi carro?",
  },
  promptFinance: {
    en: "Do you offer financing?",
    es: "¿Ofrecen financiamiento?",
  },
  placeholder: {
    en: "Tell us the service or question...",
    es: "Cuéntanos qué servicio o pregunta tienes...",
  },
  quickPrompts: [
    {
      en: "I need tires.",
      es: "Necesito llantas.",
    },
    {
      en: "I have a flat tire. Can you help today?",
      es: "Tengo una llanta ponchada. ¿Me pueden ayudar hoy?",
    },
    {
      en: "How much for brakes on my car?",
      es: "¿Cuánto cuesta revisar los frenos de mi carro?",
    },
    {
      en: "Do you offer financing?",
      es: "¿Ofrecen financiamiento?",
    },
  ],
  intro: {
    en: "Hi! What service can we help you with today?",
    es: "¡Hola! ¿Con qué servicio te podemos ayudar hoy?",
  },
};

function copyForMode(mode, settings) {
  if (mode !== "quote") return CHAT;
  const quote = settings || QUOTE_CHAT;
  const prompts = quote.quickPrompts?.length ? quote.quickPrompts : QUOTE_CHAT.quickPrompts;
  return {
    ...CHAT,
    title: quote.title || QUOTE_CHAT.title,
    subtitle: quote.subtitle || QUOTE_CHAT.subtitle,
    quickPrompts: prompts,
    placeholder: quote.placeholder || QUOTE_CHAT.placeholder,
    intro: quote.intro || QUOTE_CHAT.intro,
  };
}

function initialMessages(intro) {
  return [{ role: "assistant", content: intro, createdAt: null }];
}

function formatTime(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function BubbleMeta({ role, createdAt }) {
  const { lang } = useLanguage();
  const time = formatTime(createdAt);
  return (
    <span className="chat-bubble__meta">
      {role === "assistant" ? "Tires SOS" : lang === "es" ? "Tú" : "You"}{time ? ` - ${time}` : ""}
    </span>
  );
}

function TypingDots() {
  return (
    <span className="chat-typing" aria-label="Tires SOS is typing">
      <span />
      <span />
      <span />
    </span>
  );
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatTime12(t24) {
  const [h, m] = t24.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${pad(m)} ${suffix}`;
}

const DAY_NAMES = {
  0: { en: "Sunday", es: "Domingo" },
  1: { en: "Monday", es: "Lunes" },
  2: { en: "Tuesday", es: "Martes" },
  3: { en: "Wednesday", es: "Miercoles" },
  4: { en: "Thursday", es: "Jueves" },
  5: { en: "Friday", es: "Viernes" },
  6: { en: "Saturday", es: "Sabado" },
};

function AppointmentPicker({ t, lang, onSelect, onSessionExpired, disabled = false, refreshKey = 0 }) {
  const [days, setDays] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [fetchError, setFetchError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setDays(null);
    setFetchError("");
    fetch("/api/availability", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          onSessionExpired?.();
          throw new Error("session");
        }
        if (!response.ok) throw new Error("availability");
        return response.json();
      })
      .then((data) => {
        if (!alive) return;
        setDays(Array.isArray(data?.days) ? data.days : []);
      })
      .catch(() => {
        if (alive) setFetchError("unavailable");
      });
    return () => { alive = false; };
  }, [onSessionExpired, refreshKey, retryKey]);

  if (fetchError) {
    return (
      <div className="chat-picker chat-picker--error" role="status">
        <p className="chat-picker__title">
          {t({ en: "Times are temporarily unavailable.", es: "Los horarios no están disponibles por ahora." })}
        </p>
        <p>{t({ en: "You can retry or use WhatsApp for help.", es: "Puedes intentar de nuevo o usar WhatsApp para ayuda." })}</p>
        <button type="button" className="btn btn--ghost btn--small" onClick={() => setRetryKey((value) => value + 1)}>
          {t({ en: "Retry", es: "Intentar de nuevo" })}
        </button>
      </div>
    );
  }
  if (!days) {
    return (
      <div className="chat-picker">
        <p className="chat-picker__title">{t({ en: "Loading times...", es: "Cargando horarios..." })}</p>
      </div>
    );
  }
  if (days.length === 0) {
    return (
      <div className="chat-picker chat-picker--error" role="status">
        <p className="chat-picker__title">
          {t({ en: "No online times are open right now.", es: "No hay horarios disponibles en linea por ahora." })}
        </p>
        <p>{t({ en: "Please use WhatsApp and we will help you directly.", es: "Usa WhatsApp y te ayudamos directamente." })}</p>
      </div>
    );
  }

  const day = days[selectedDay];
  const todayStr = getShopDateTime().dateKey;
  const isToday = day.date === todayStr;
  const dayName = DAY_NAMES[day.dayOfWeek] || { en: "", es: "" };
  const dayNum = parseInt(day.date.split("-")[2], 10);
  const dayLabel = isToday ? t({ en: "Today", es: "Hoy" }) : `${t(dayName)} ${dayNum}`;

  return (
    <div className="chat-picker">
      <p className="chat-picker__title">
        {t({ en: "Pick a time", es: "Elige un horario" })}
      </p>
      <p className="chat-picker__timezone">
        {t({ en: "All times are Pacific time.", es: "Todos los horarios son hora del Pacifico." })}
      </p>
      <div className="chat-picker__days">
        {days.map((d, i) => {
          const dIsToday = d.date === todayStr;
          const dNum = parseInt(d.date.split("-")[2], 10);
          const dName = DAY_NAMES[d.dayOfWeek] || { en: "", es: "" };
          return (
            <button
              key={d.date}
              type="button"
              className={`chat-picker__day ${i === selectedDay ? "chat-picker__day--active" : ""}`}
              onClick={() => setSelectedDay(i)}
              disabled={disabled}
            >
              {dIsToday ? t({ en: "Today", es: "Hoy" }) : `${t(dName).slice(0, 3)} ${dNum}`}
            </button>
          );
        })}
      </div>
      <div className="chat-picker__slots">
        {day.slots.map((slot) => (
          <button
            key={slot}
            type="button"
            className="chat-picker__slot"
            disabled={disabled}
            onClick={() => {
              const msg = t({
                en: `I'd like to come in on ${dayLabel} at ${formatTime12(slot)}`,
                es: `Me gustaria ir el ${dayLabel} a las ${formatTime12(slot)}`,
              });
              onSelect({
                date: day.date,
                time: slot,
                message: msg,
                label: formatShopSlot(day.date, slot, lang),
              });
            }}
          >
            {formatTime12(slot)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatBot({
  embedded = false,
  className = "",
  showComposer = true,
  mode = "shop",
  turnstileSiteKey = "",
  initialPrompt = "",
}) {
  const t = useT();
  const { lang } = useLanguage();
  const [adminChatSettings, setAdminChatSettings] = useState(null);
  const copy = useMemo(() => copyForMode(mode, adminChatSettings), [mode, adminChatSettings]);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState(() => initialMessages(copy.intro));
  const [session, setSession] = useState({
    loading: true,
    ready: false,
    id: "",
    turnstileRequired: false,
    error: "",
  });
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [nextAction, setNextAction] = useState("collect_details");
  const [chatCompleted, setChatCompleted] = useState(false);
  const [completion, setCompletion] = useState(null);
  const [pickerUsed, setPickerUsed] = useState(false);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [pickerRefreshKey, setPickerRefreshKey] = useState(0);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const busyRef = useRef(false);
  const wasVisibleRef = useRef(false);

  const visible = embedded || open;
  const canInteract = session.ready && privacyConsent && !loading && !reservationLoading && !chatCompleted;
  const canSend = input.trim().length > 0 && canInteract;

  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      captureAnalytics("chat_opened", { chat_mode: mode });
    }
    wasVisibleRef.current = visible;
  }, [mode, visible]);
  const showPicker = nextAction === "show_availability" && !pickerUsed && !chatCompleted && !loading;

  const quickPrompts = useMemo(
    () =>
      (copy.quickPrompts || [copy.promptServices, copy.promptPrice, copy.promptHours, copy.promptSpanish])
        .filter(Boolean)
        .map((prompt) => t(prompt)),
    [t, copy]
  );

  const renderMessage = (message) => {
    return typeof message.content === "string" ? message.content : t(message.content);
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const bootstrapSession = useCallback(async ({ turnstileToken = "", rotate = false } = {}) => {
    setSession((current) => ({ ...current, loading: true, error: "" }));
    try {
      const usePost = Boolean(turnstileToken || rotate);
      const response = await fetch("/api/chat/session", {
        method: usePost ? "POST" : "GET",
        headers: usePost ? { "Content-Type": "application/json" } : undefined,
        body: usePost ? JSON.stringify({ turnstileToken, rotate }) : undefined,
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "session_failed");

      if (data.ok) {
        setSession({
          loading: false,
          ready: true,
          id: data.sessionId || "",
          turnstileRequired: false,
          error: "",
        });
        return true;
      }

      if (data.turnstileRequired) {
        setSession({ loading: false, ready: false, id: "", turnstileRequired: true, error: "" });
        return false;
      }

      throw new Error("session_failed");
    } catch {
      setSession({
        loading: false,
        ready: false,
        id: "",
        turnstileRequired: false,
        error: "session_failed",
      });
      return false;
    }
  }, []);

  const handleTurnstileToken = useCallback(
    async (token) => {
      if (!token) return;
      const ok = await bootstrapSession({ turnstileToken: token });
      if (!ok) setTurnstileResetKey((value) => value + 1);
    },
    [bootstrapSession],
  );

  const handleTurnstileError = useCallback(() => {
    setSession((current) => ({ ...current, error: "challenge_failed" }));
  }, []);

  const handleSessionExpired = useCallback(() => {
    setError(t({ en: "Your secure chat session expired. Please try again.", es: "Tu sesión segura expiró. Intenta de nuevo." }));
    bootstrapSession();
  }, [bootstrapSession, t]);

  useEffect(() => {
    bootstrapSession();
  }, [bootstrapSession]);

  useEffect(() => {
    if (visible && session.ready && privacyConsent && !embedded) {
      textareaRef.current?.focus();
      scrollToBottom();
    }
  }, [embedded, privacyConsent, session.ready, visible]);

  useEffect(() => {
    if (mode !== "quote") return;
    let alive = true;
    fetch("/api/chat-settings", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((settings) => {
        if (alive && settings) setAdminChatSettings(settings);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [mode]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0].role !== "assistant") return prev;
      return [{ ...prev[0], content: copy.intro }];
    });
  }, [copy.intro]);

  // A CTA elsewhere on the site (e.g. the alignment spotlight) can pass a
  // topic-specific prompt so the customer lands with it already typed —
  // one click on the consent box + send instead of picking a quick prompt.
  useEffect(() => {
    if (!initialPrompt) return;
    setInput((current) => current || initialPrompt);
    textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    textareaRef.current?.focus();
  }, [initialPrompt]);

  useEffect(() => {
    if (visible) scrollToBottom();
  }, [messages, loading, visible, showPicker]);

  useEffect(() => {
    if (embedded) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [embedded]);

  useEffect(() => {
    if (embedded) return;
    const openFromSite = () => setOpen(true);
    window.addEventListener("tires-sos:open-chat", openFromSite);
    return () => window.removeEventListener("tires-sos:open-chat", openFromSite);
  }, [embedded]);

  const startNewChat = async () => {
    setMessages(initialMessages(copy.intro));
    setChatCompleted(false);
    setCompletion(null);
    setNextAction("collect_details");
    setPickerUsed(false);
    setPickerRefreshKey((value) => value + 1);
    setInput("");
    setError("");
    await bootstrapSession({ rotate: true });
    scrollToBottom();
    textareaRef.current?.focus();
  };

  const send = async (text) => {
    const content = text.trim();
    if (!content || busyRef.current || !canInteract) return;
    busyRef.current = true;

    const nextMessages = [...messages, { role: "user", content, createdAt: Date.now() }];
    captureAnalytics("chat_message_sent", { chat_mode: mode, lang });
    const requestMessages = nextMessages.slice(-24).map((message) => ({
      role: message.role,
      content: typeof message.content === "string" ? message.content : t(message.content),
    }));

    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");
    scrollToBottom();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, context: mode, privacyConsent: true, messages: requestMessages }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) handleSessionExpired();
        const saved = data?.status?.leadCaptured;
        setError(data?.error || t({ en: "Chat is temporarily unavailable.", es: "El chat no está disponible por ahora." }));
        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            content: saved
              ? t({
                  en: "I saved the details you sent, but I could not answer just now. You can retry or use WhatsApp.",
                  es: "Guardé los datos que enviaste, pero no pude responder ahora. Intenta de nuevo o llama al taller.",
                })
              : copy.fallback,
            createdAt: Date.now(),
          },
        ]);
        return;
      }

      const assistantMsg = {
        role: "assistant",
        content:
          data.message ||
          (lang === "es" ? "Estoy aqui si necesitas mas detalles." : "I'm here if you need more details."),
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setNextAction(data?.action?.type || "collect_details");
      scrollToBottom();
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: copy.fallback, createdAt: Date.now() },
      ]);
    } finally {
      busyRef.current = false;
      setLoading(false);
      scrollToBottom();
    }
  };

  const handlePickerSelect = async (selection) => {
    if (busyRef.current || reservationLoading || !session.ready || !privacyConsent) return;
    busyRef.current = true;
    setReservationLoading(true);
    setPickerUsed(true);
    setError("");
    setMessages((previous) => [
      ...previous,
      { role: "user", content: selection.message, createdAt: Date.now() },
    ]);

    try {
      const response = await fetch("/api/appointments/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate: selection.date,
          scheduledTime: selection.time,
          privacyConsent: true,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("session");
      }

      if (response.status === 409) {
        setPickerUsed(false);
        setPickerRefreshKey((value) => value + 1);
        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            content: t({
              en: "That time was just taken. I refreshed the available times—please choose another one.",
              es: "Ese horario acaba de ocuparse. Actualicé los horarios; elige otro, por favor.",
            }),
            createdAt: Date.now(),
          },
        ]);
        return;
      }

      if (!response.ok || !data.ok) throw new Error(data?.error || "reservation_failed");

      const notificationStatus = data?.notification?.status || "pending";
      const persisted = data?.persisted === true;
      captureAnalytics("appointment_requested", {
        chat_mode: mode,
        persisted,
        notification_status: notificationStatus,
        scheduled_date: selection.date,
        scheduled_time: selection.time,
      });
      const confirmation = persisted
        ? notificationStatus === "provider_accepted" || notificationStatus === "sent"
          ? t({
              en: `Your request for ${selection.label} is reserved, and the shop notification was accepted. The team will confirm it with you.`,
              es: `Tu solicitud para ${selection.label} quedó reservada y la notificación fue aceptada. El equipo te la confirmará.`,
            })
          : t({
              en: `Your request for ${selection.label} is safely saved. The shop can see it in the admin desk; notification delivery is pending.`,
              es: `Tu solicitud para ${selection.label} quedó guardada. El taller puede verla; la notificación está pendiente.`,
            })
        : t({
            en: "The request is only stored temporarily. Please use WhatsApp to make sure the time is held.",
            es: "La solicitud solo está guardada temporalmente. Usa WhatsApp para asegurar el horario.",
          });

      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: confirmation, createdAt: Date.now() },
      ]);
      setCompletion({ persisted, notificationStatus, slotLabel: selection.label });
      setChatCompleted(true);
      setNextAction("completed");
    } catch (reservationError) {
      if (reservationError.message !== "session") {
        setPickerUsed(false);
        setError(t({ en: "We could not reserve that time. Please retry or use WhatsApp.", es: "No pudimos reservar ese horario. Intenta de nuevo o usa WhatsApp." }));
      }
    } finally {
      busyRef.current = false;
      setReservationLoading(false);
      scrollToBottom();
    }
  };

  return (
    <>
      {visible && (
        <div className={`chat-shell ${embedded ? "chat-shell--embedded" : ""}`} role={embedded ? undefined : "dialog"} aria-modal={embedded ? undefined : true} aria-label={t(copy.title)}>
          {!embedded && <div className="chat-shell__backdrop" onClick={() => setOpen(false)} />}
          <section className={`chat-panel ${embedded ? "chat-panel--embedded" : ""} ${className}`}>
            <header className="chat-panel__header">
              <div className="chat-panel__brand">
                <div className="chat-panel__logo-wrap" aria-hidden="true">
                  <img className="chat-panel__logo" src="/logo-mark.png" alt="" />
                </div>
                <div>
                  <p className="chat-panel__kicker">Tires SOS Rescue</p>
                  <h2 className="chat-panel__title">{t(copy.title)}</h2>
                  <p className="chat-panel__subtitle">{t(copy.subtitle)}</p>
                </div>
              </div>
              {!embedded && (
                <button className="chat-panel__close" onClick={() => setOpen(false)} aria-label={t(copy.close)}>
                  x
                </button>
              )}
            </header>

            <div className="chat-panel__stats">
              <div>
                <span>{t(copy.fastAnswers)}</span>
                <strong>{t({ en: "AI assistant", es: "Asistente con IA" })}</strong>
              </div>
              <div>
                <span>{t(copy.callUs)}</span>
                <a href={SITE.smsHref}>
                  {t(copy.sms)}
                </a>
              </div>
              <div>
                <span>{t(copy.whatsapp)}</span>
                <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer">
                  {t(copy.openChat)}
                </a>
              </div>
            </div>

            <div className="chat-panel__security" aria-live="polite">
              {session.loading ? (
                <p>{t({ en: "Starting a secure chat...", es: "Iniciando un chat seguro..." })}</p>
              ) : session.turnstileRequired ? (
                <div>
                  <p>{t({ en: "Please complete the security check to continue.", es: "Completa la verificación para continuar." })}</p>
                  {turnstileSiteKey ? (
                    <TurnstileChallenge
                      siteKey={turnstileSiteKey}
                      language={lang}
                      resetKey={turnstileResetKey}
                      onToken={handleTurnstileToken}
                      onError={handleTurnstileError}
                    />
                  ) : (
                    <p className="chat-panel__error">
                      {t({
                        en: "The security check is not configured. Please use WhatsApp.",
                        es: "La verificación no está configurada. Usa WhatsApp.",
                      })}
                    </p>
                  )}
                </div>
              ) : session.error ? (
                <div>
                  <p className="chat-panel__error">
                    {t({ en: "Secure chat could not start.", es: "No se pudo iniciar el chat seguro." })}
                  </p>
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => bootstrapSession()}>
                    {t({ en: "Retry", es: "Intentar de nuevo" })}
                  </button>
                </div>
              ) : null}
            </div>

            <label className="chat-consent">
              <input
                type="checkbox"
                checked={privacyConsent}
                onChange={(event) => setPrivacyConsent(event.target.checked)}
                disabled={!session.ready || loading || reservationLoading || chatCompleted}
              />
              <span>
                {t({
                  en: "I agree to send these details to the shop and its service providers under the",
                  es: "Acepto enviar estos datos al taller y sus proveedores según la",
                })}{" "}
                <a href="/privacy" target="_blank" rel="noreferrer">
                  {t({ en: "Privacy Policy", es: "Política de Privacidad" })}
                </a>.
              </span>
            </label>

            <div className="chat-panel__prompts">
              {quickPrompts.map((prompt, index) => (
                <button key={`${prompt}-${index}`} className="chat-chip" onClick={() => send(prompt)} disabled={!canInteract}>
                  {prompt}
                </button>
              ))}
            </div>

            <div className="chat-panel__messages" ref={listRef}>
              {messages.map((message, index) => (
                <article key={`${message.role}-${index}`} className={`chat-bubble chat-bubble--${message.role}`}>
                  <BubbleMeta role={message.role} createdAt={message.createdAt} />
                  <p>{renderMessage(message)}</p>
                </article>
              ))}
              {loading && (
                <article className="chat-bubble chat-bubble--assistant">
                  <BubbleMeta role="assistant" createdAt={Date.now()} />
                  <p className="chat-bubble__typing-row">
                    <TypingDots />
                    <span>{t(copy.typing)}</span>
                  </p>
                </article>
              )}
              {reservationLoading && (
                <article className="chat-bubble chat-bubble--assistant">
                  <BubbleMeta role="assistant" createdAt={Date.now()} />
                  <p className="chat-bubble__typing-row">
                    <TypingDots />
                    <span>{t({ en: "Reserving your request...", es: "Reservando tu solicitud..." })}</span>
                  </p>
                </article>
              )}
              {showPicker && (
                <AppointmentPicker
                  t={t}
                  lang={lang}
                  onSelect={handlePickerSelect}
                  onSessionExpired={handleSessionExpired}
                  disabled={reservationLoading}
                  refreshKey={pickerRefreshKey}
                />
              )}
            </div>

            {showComposer && chatCompleted ? (
              <div className="chat-panel__completed">
                <p className="chat-panel__completed-text">
                  {completion?.persisted
                    ? completion.notificationStatus === "provider_accepted" || completion.notificationStatus === "sent"
                      ? t({
                          en: "Your appointment request is saved. The shop alert was accepted, but the team still needs to confirm the time.",
                          es: "Tu solicitud está guardada. La alerta fue aceptada, pero el equipo todavía debe confirmar el horario.",
                        })
                      : t({
                          en: "Your appointment request is saved in the shop dashboard. Notification delivery is pending.",
                          es: "Tu solicitud está guardada en el panel del taller. La notificación está pendiente.",
                        })
                    : t({
                        en: "This request is only stored temporarily. Please use WhatsApp to confirm.",
                        es: "Esta solicitud solo está guardada temporalmente. Usa WhatsApp para confirmar.",
                      })}
                </p>
                <button type="button" className="btn btn--primary chat-panel__new-chat" onClick={startNewChat}>
                  {t({ en: "Start a new chat", es: "Iniciar un nuevo chat" })}
                </button>
              </div>
            ) : showComposer ? (
              <form
                className="chat-panel__composer"
                onSubmit={(event) => {
                  event.preventDefault();
                  send(input);
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder={
                    privacyConsent
                      ? t(copy.placeholder)
                      : t({ en: "Accept the privacy notice to begin...", es: "Acepta el aviso de privacidad para comenzar..." })
                  }
                  rows={2}
                  maxLength={2000}
                  disabled={!session.ready || !privacyConsent || loading || reservationLoading}
                />
                <div className="chat-panel__composer-bar">
                  <span className="chat-panel__error">{error}</span>
                  <button type="submit" className="btn btn--primary" disabled={!canSend}>
                    {t(copy.send)}
                  </button>
                </div>
              </form>
            ) : null}
          </section>
        </div>
      )}
    </>
  );
}
