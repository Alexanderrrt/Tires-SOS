"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage, useT } from "../i18n/LanguageContext";
import { CHAT, SITE } from "../site.config";
import Icon from "./Icons";

function initialMessages() {
  return [{ role: "assistant", content: CHAT.intro, createdAt: Date.now() }];
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

export default function ChatBot() {
  const t = useT();
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const listRef = useRef(null);
  const textareaRef = useRef(null);

  const copy = useMemo(() => CHAT, []);
  const canSend = input.trim().length > 0 && !loading;

  const quickPrompts = useMemo(
    () => [t(copy.promptServices), t(copy.promptPrice), t(copy.promptHours), t(copy.promptSpanish)],
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
    if (open) {
      textareaRef.current?.focus();
      scrollToBottom();
    }
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
        body: JSON.stringify({ lang, messages: requestMessages }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Chat request failed.");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.message ||
            (lang === "es" ? "Estoy aqui si necesitas mas detalles." : "I'm here if you need more details."),
          createdAt: Date.now(),
        },
      ]);
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
      <button className="chat-fab" onClick={() => setOpen(true)} aria-label={t(copy.launcher)}>
        <span className="chat-fab__glow" aria-hidden="true" />
        <span className="chat-fab__icon" aria-hidden="true">
          <Icon name="chat" />
        </span>
        <span className="chat-fab__copy">
          <strong>{t(copy.launcher)}</strong>
          <small>{t(copy.launcherSub)}</small>
        </span>
      </button>

      {open && (
        <div className="chat-shell" role="dialog" aria-modal="true" aria-label={t(copy.title)}>
          <div className="chat-shell__backdrop" onClick={() => setOpen(false)} />
          <section className="chat-panel">
            <header className="chat-panel__header">
              <div className="chat-panel__brand">
                <div className="chat-panel__avatar" aria-hidden="true">
                  <img src="/logo-mark.png" alt="" />
                </div>
                <div>
                  <p className="chat-panel__kicker">Tires SOS Rescue</p>
                  <h2 className="chat-panel__title">{t(copy.title)}</h2>
                  <p className="chat-panel__subtitle">{t(copy.subtitle)}</p>
                </div>
              </div>
              <button className="chat-panel__close" onClick={() => setOpen(false)} aria-label={t(copy.close)}>
                x
              </button>
            </header>

            <div className="chat-panel__stats">
              <div>
                <span>{t(copy.fastAnswers)}</span>
                <strong>{t(copy.humanStyle)}</strong>
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
              {quickPrompts.map((prompt) => (
                <button key={prompt} className="chat-chip" onClick={() => send(prompt)} disabled={loading}>
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
          </section>
        </div>
      )}
    </>
  );
}
