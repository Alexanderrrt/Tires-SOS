"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const { error } = await res.json().catch(() => ({}));
      setError(error || "Login failed.");
    }
  }

  return (
    <main className="admin-auth">
      <form className="admin-card" onSubmit={submit}>
        <h1>Admin — Pricing</h1>
        <p className="admin-muted">Enter the admin password to edit quote pricing.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          aria-label="Admin password"
        />
        {error && <p className="admin-error">{error}</p>}
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
