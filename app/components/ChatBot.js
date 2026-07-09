"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage, useT } from "../i18n/LanguageContext";
import { CHAT, SITE } from "../site.config";
import Icon from "./Icons";

const QUOTE_CHAT = {
  title: { en: "Quote Desk", es: "Cotizacion" },
  subtitle: {
    en: "Tell us the vehicle, tire size or service, and how soon you need help.",
    es: "Cuentanos el vehiculo, medida de llanta o servicio, y que tan pronto necesitas ayuda.",
  },
  promptTires: {
    en: "I need a quote for 4 tires.",
    es: "Necesito cotizar 4 llantas.",
  },
  promptRepair: {
    en: "I have a flat tire. Can you help today?",
    es: "Tengo una llanta ponchada. Me pueden ayudar hoy?",
  },
  promptBrakes: {
    en: "How much for brakes on my car?",
    es: "Cuanto cuesta revisar los frenos de mi carro?",
  },
  promptFinance: {
    en: "Do you offer financing?",
    es: "Ofrecen financiamiento?",
  },
  placeholder: {
    en: "Start with your car, service, tire size, or problem...",
    es: "Empieza con tu carro, servicio, medida de llanta o problema...",
  },
  quickPrompts: [
    {
      en: "I need a quote for 4 tires.",
      es: "Necesito cotizar 4 llantas.",
    },
    {
      en: "I have a flat tire. Can you help today?",
      es: "Tengo una llanta ponchada. Me pueden ayudar hoy?",
    },
    {
      en: "How much for brakes on my car?",
      es: "Cuanto cuesta revisar los frenos de mi carro?",
    },
    {
      en: "Do you offer financing?",
      es: "Ofrecen financiamiento?",
    },
  ],
  intro: {
    en: "Tell me what you need help with. If you know your vehicle, tire size, or preferred service, send it here and I will help start the quote.",
    es: "Cuentame con que necesitas ayuda. Si sabes tu vehiculo, medida de llanta o servicio, mandalo aqui y te ayudo a iniciar la cotizacion.",
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
  return [{ role: "assistant", content: intro, createdAt: Date.now() }];
}

function makeSessionId() {
  if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function BubbleMeta({ role, createdAt }) {
  const { lang } = useLanguage();
  return (
    <span className="chat-bubble__meta">
      {role === "assistant" ? "Tires SOS" : lang === "es" ? "Tu" : "You"} - {formatTime(createdAt)}
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

const COMPLETED_SIGNALS = [
  /appointment.*(?:set|booked|confirmed|scheduled|received|noted)/i,
  /cita.*(?:agendada|confirmada|recibida|anotada|registrada)/i,
  /(?:we'll|we will|the team will|shop will|shop team will).*(?:confirm|reach out|contact|follow up|get back)/i,
  /(?:el equipo|el taller|nos comunicaremos|te contactaremos|te llamaremos)/i,
  /(?:thank you|thanks).*(?:all the info|everything we need|all set|got it)/i,
  /(?:gracias).*(?:toda la info|todo lo que necesitamos|listo|anotado)/i,
];

function detectChatCompleted(messages) {
  if (messages.length < 4) return false;
  const userTexts = messages.filter((m) => m.role === "user").map((m) => (typeof m.content === "string" ? m.content : ""));
  const allUserText = userTexts.join(" ");
  const hasPhone = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(allUserText);
  const hasName = /\b(?:my name is|me llamo|soy|i'm|i am|name is)\b/i.test(allUserText) ||
    /[A-Z][a-z]+\s+[A-Z][a-z]+/.test(allUserText);
  if (!hasPhone && !hasName) return false;

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  if (!lastAssistant) return false;
  const text = typeof lastAssistant.content === "string" ? lastAssistant.content : "";
  return COMPLETED_SIGNALS.some((re) => re.test(text));
}

export default function ChatBot({ embedded = false, className = "", showComposer = true, mode = "shop" }) {
  const t = useT();
  const { lang } = useLanguage();
  const [adminChatSettings, setAdminChatSettings] = useState(null);
  const copy = useMemo(() => copyForMode(mode, adminChatSettings), [mode, adminChatSettings]);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState(() => initialMessages(copy.intro));
  const [sessionId, setSessionId] = useState(() => makeSessionId());
  const [chatCompleted, setChatCompleted] = useState(false);
  const listRef = useRef(null);
  const textareaRef = useRef(null);

  const visible = embedded || open;
  const canSend = input.trim().length > 0 && !loading && !chatCompleted;

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

  useEffect(() => {
    if (visible) {
      textareaRef.current?.focus();
      scrollToBottom();
    }
  }, [visible]);

  useEffect(() => {
    if (mode !== "quote") return;
    let alive = true;
    fetch("/api/chat-settings")
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

  useEffect(() => {
    if (visible) scrollToBottom();
  }, [messages, loading, visible]);

  useEffect(() => {
    if (embedded) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [embedded]);

  const startNewChat = () => {
    setMessages(initialMessages(copy.intro));
    setSessionId(makeSessionId());
    setChatCompleted(false);
    setInput("");
    setError("");
    scrollToBottom();
    textareaRef.current?.focus();
  };

  const send = async (text) => {
    const content = text.trim();
    if (!content || loading) return;

    const nextMessages = [...messages, { role: "user", content, createdAt: Date.now() }];
    const requestMessages = nextMessages.map((message) => ({
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
        body: JSON.stringify({ lang, context: mode, sessionId, messages: requestMessages }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Chat request failed.");

      const assistantMsg = {
        role: "assistant",
        content:
          data.message ||
          (lang === "es" ? "Estoy aqui si necesitas mas detalles." : "I'm here if you need more details."),
        createdAt: Date.now(),
      };
      setMessages((prev) => {
        const updated = [...prev, assistantMsg];
        if (detectChatCompleted(updated)) {
          setTimeout(() => setChatCompleted(true), 800);
        }
        return updated;
      });
      scrollToBottom();
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: copy.fallback, createdAt: Date.now() },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  return (
    <>
      {!embedded && (
        <button className="chat-fab" onClick={() => setOpen(true)} aria-label={t(copy.launcher)}>
          <span className="chat-fab__glow" aria-hidden="true" />
          <span className="chat-fab__icon chat-fab__icon--logo" aria-hidden="true">
            <img src="/logo-mark.png" alt="" />
          </span>
          <span className="chat-fab__copy">
            <strong>{t(copy.launcher)}</strong>
            <small>{t(copy.launcherSub)}</small>
          </span>
        </button>
      )}

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
                <strong>{t(copy.liveChat)}</strong>
              </div>
              <div>
                <span>{t(copy.callUs)}</span>
                <a href={SITE.phoneHref}>{SITE.phone}</a>
              </div>
              <div>
                <span>{t(copy.whatsapp)}</span>
                <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer">
                  {t(copy.openChat)}
                </a>
              </div>
            </div>

            <div className="chat-panel__prompts">
              {quickPrompts.map((prompt, index) => (
                <button key={`${prompt}-${index}`} className="chat-chip" onClick={() => send(prompt)} disabled={loading}>
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
            </div>

            {showComposer && chatCompleted ? (
              <div className="chat-panel__completed">
                <p className="chat-panel__completed-text">
                  {t({
                    en: "Your info has been sent to the shop team. They'll reach out to confirm.",
                    es: "Tu informacion fue enviada al equipo del taller. Te contactaran para confirmar.",
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
                placeholder={t(copy.placeholder)}
                rows={2}
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
