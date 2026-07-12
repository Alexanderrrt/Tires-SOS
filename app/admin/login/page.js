"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage, useT } from "../../i18n/LanguageContext";
import { COPY } from "../../site.config";
import AdminLoader from "../AdminLoader";

export const dynamic = "force-dynamic";

const L = COPY.admin.login;

export default function AdminLogin() {
  const router = useRouter();
  const { lang, toggleLang } = useLanguage();
  const t = useT();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null); // bilingual object or null
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
      return;
    }
    setBusy(false);
    // Map known statuses to bilingual copy; the server only speaks English.
    if (res.status === 401) setError(L.wrongPassword);
    else if (res.status === 503) setError(L.notConfigured);
    else setError(L.failed);
  }

  return (
    <>
      {busy && <AdminLoader message={t(L.signingIn)} />}
      <main className="admin-auth">
      <form className="admin-card" onSubmit={submit}>
        <div className="admin-card__bar">
          <h1>{t(L.title)}</h1>
          <button type="button" className="lang-toggle" onClick={toggleLang} aria-label="Toggle language">
            {lang === "en" ? "ES" : "EN"}
          </button>
        </div>
        <p className="admin-muted">{t(L.intro)}</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t(L.passwordPlaceholder)}
          autoFocus
          aria-label={t(L.passwordAria)}
        />
        {error && <p className="admin-error">{t(error)}</p>}
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? t(L.signingIn) : t(L.signIn)}
        </button>
      </form>
    </main>
    </>
  );
}
