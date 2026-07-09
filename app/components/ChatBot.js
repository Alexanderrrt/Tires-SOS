"use client";

import { useMemo, useRef, useState } from "react";
import { COPY, SITE } from "../site.config";
import { useT } from "../i18n/LanguageContext";
import Icon from "./Icons";

const quickPrompts = [
  "What services do you offer?",
  "How much is a flat repair?",
  "What are your hours today?",
  "Hablas español?",
];

const starterMessages = [
  {
    role: "assistant",
    content:
      "Hey, I’m here at the shop desk with you. Ask me anything about tires, brakes, alignment, oil changes, batteries, rims, hours, location, or walk-in help.",
  },
];

function BubbleMeta({ role }) {
  const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <span className="chat-bubble__meta">
      {role === "assistant" ? "Tires SOS" : "You"} · {time}
    </span>
  );
}

export default function ChatBot() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState(starterMessages);
  const listRef = useRef(null);

  const canSend = input.trim().length > 0 && !loading;

  const enrichedMessages = useMemo(() => messages, [messages]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const send = async (text) => {
    const content = text.trim();
    if (!content || loading) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");
    scrollToBottom();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Chat request failed.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.message || "I’m here if you need more details." }]);
      scrollToBottom();
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I couldn’t reach the chat service just now. Please call the shop or try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen(true)} aria-label="Open chat assistant">
        <span className="chat-fab__glow" aria-hidden="true" />
        <span className="chat-fab__icon">
          <Icon name="chat" />
        </span>
        <span className="chat-fab__copy">
          <strong>Chat</strong>
          <small>{t(COPY.nav.quote)}</small>
        </span>
      </button>

      {open && (
        <div className="chat-shell" role="dialog" aria-modal="true" aria-label="Tires SOS chat assistant">
          <div className="chat-shell__backdrop" onClick={() => setOpen(false)} />
          <section className="chat-panel">
            <header className="chat-panel__header">
              <div>
                <p className="chat-panel__kicker">Tires SOS Rescue</p>
                <h2 className="chat-panel__title">Real Shop Help</h2>
                <p className="chat-panel__subtitle">
                  Talk to me like you would at the counter. I’ll keep it friendly, direct, and human.
                </p>
              </div>
              <button className="chat-panel__close" onClick={() => setOpen(false)} aria-label="Close chat">
                ×
              </button>
            </header>

            <div className="chat-panel__stats">
              <div>
                <span>Fast answers</span>
                <strong>Human-style chat</strong>
              </div>
              <div>
                <span>Call us</span>
                <a href={SITE.phoneHref}>{SITE.phone}</a>
              </div>
              <div>
                <span>WhatsApp</span>
                <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer">
                  Open chat
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
              {enrichedMessages.map((message, index) => (
                <article key={`${message.role}-${index}`} className={`chat-bubble chat-bubble--${message.role}`}>
                  <BubbleMeta role={message.role} />
                  <p>{message.content}</p>
                </article>
              ))}
              {loading && (
                <article className="chat-bubble chat-bubble--assistant">
                  <BubbleMeta role="assistant" />
                  <p>Typing a quick answer...</p>
                </article>
              )}
            </div>

            <form
              className="chat-panel__composer"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your car..."
                rows={2}
              />
              <div className="chat-panel__composer-bar">
                <span className="chat-panel__error">{error}</span>
                <button type="submit" className="btn btn--primary" disabled={!canSend}>
                  Send
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
