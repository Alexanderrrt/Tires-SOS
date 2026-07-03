"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MODEL_HELP = {
  perUnit: "Per-unit price × vehicle factor × qty, plus fees.",
  labor: "Parts + (labor hours × vehicle factor × labor rate).",
  options: "Customer picks one option; that price is used.",
  flat: "Single flat price.",
};

export default function PricingEditor({ initialPricing, persistent, authReady }) {
  const router = useRouter();
  const [pricing, setPricing] = useState(initialPricing);
  const [status, setStatus] = useState(null); // {ok, msg}
  const [saving, setSaving] = useState(false);

  // immutable-ish update helper
  const edit = (mutator) =>
    setPricing((p) => {
      const next = structuredClone(p);
      mutator(next);
      return next;
    });

  const numHandler = (mutator) => (e) => {
    const v = e.target.value === "" ? 0 : Number(e.target.value);
    if (Number.isFinite(v)) edit((n) => mutator(n, Math.max(0, v)));
  };

  async function save() {
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
      setStatus({
        ok: true,
        msg: body.persisted
          ? "Saved."
          : "Saved for this session — connect Supabase to make it permanent.",
      });
      router.refresh();
    } else {
      setStatus({ ok: false, msg: body.error || "Save failed." });
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="editor">
      <header className="editor__bar">
        <div>
          <h1>Quote Pricing</h1>
          {!persistent && (
            <p className="editor__warn">
              Storage not connected — changes apply for this session only. Set SUPABASE_URL and
              SUPABASE_SERVICE_ROLE_KEY to persist.
            </p>
          )}
        </div>
        <div className="editor__actions">
          {status && (
            <span className={status.ok ? "editor__ok" : "editor__err"}>{status.msg}</span>
          )}
          <button className="btn btn--ghost btn--small" onClick={logout}>
            Log out
          </button>
          <button className="btn btn--primary btn--small" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </header>

      {/* Global settings */}
      <section className="editor__group">
        <h2>Global</h2>
        <div className="editor__row">
          <label>
            <span>Labor rate ($/hr)</span>
            <input type="number" min="0" value={pricing.laborRate} onChange={numHandler((n, v) => (n.laborRate = v))} />
          </label>
          <label>
            <span>Estimate spread (%)</span>
            <input
              type="number"
              min="0"
              max="90"
              value={Math.round(pricing.rangePct * 100)}
              onChange={numHandler((n, v) => (n.rangePct = Math.min(0.9, v / 100)))}
            />
          </label>
          <label>
            <span>Currency</span>
            <input value={pricing.currency} onChange={(e) => edit((n) => (n.currency = e.target.value))} />
          </label>
        </div>
      </section>

      {/* Vehicle multipliers */}
      <section className="editor__group">
        <h2>Vehicle multipliers</h2>
        <p className="editor__hint">Sedan is the 1.0 baseline. Bigger/more premium vehicles cost more.</p>
        <div className="editor__grid">
          {pricing.vehicleClasses.map((vc, i) => (
            <label key={vc.id} className="editor__cell">
              <span>{vc.label.en}</span>
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
        <h2>Services</h2>
        {pricing.services.map((svc, i) => (
          <div key={svc.id} className="editor__svc">
            <div className="editor__svc-head">
              <strong>{svc.label.en}</strong>
              <span className="editor__tag">{svc.model}</span>
              <label className="editor__inline-check">
                <input
                  type="checkbox"
                  checked={svc.appliesVehicleFactor}
                  onChange={(e) => edit((n) => (n.services[i].appliesVehicleFactor = e.target.checked))}
                />
                applies vehicle factor
              </label>
            </div>
            <p className="editor__hint">{MODEL_HELP[svc.model]}</p>

            <div className="editor__row">
              {svc.model === "perUnit" && (
                <>
                  <label>
                    <span>Base price / unit</span>
                    <input type="number" min="0" value={svc.basePrice} onChange={numHandler((n, v) => (n.services[i].basePrice = v))} />
                  </label>
                  {svc.fees?.map((f, fi) => (
                    <label key={fi}>
                      <span>{f.label.en} ({f.per})</span>
                      <input type="number" min="0" value={f.amount} onChange={numHandler((n, v) => (n.services[i].fees[fi].amount = v))} />
                    </label>
                  ))}
                </>
              )}

              {svc.model === "labor" && (
                <>
                  <label>
                    <span>Parts base</span>
                    <input type="number" min="0" value={svc.partsBase} onChange={numHandler((n, v) => (n.services[i].partsBase = v))} />
                  </label>
                  <label>
                    <span>Labor hours</span>
                    <input type="number" min="0" step="0.25" value={svc.laborHours} onChange={numHandler((n, v) => (n.services[i].laborHours = v))} />
                  </label>
                </>
              )}

              {svc.model === "options" &&
                svc.options.map((o, oi) => (
                  <label key={o.id}>
                    <span>{o.label.en}</span>
                    <input type="number" min="0" value={o.price} onChange={numHandler((n, v) => (n.services[i].options[oi].price = v))} />
                  </label>
                ))}

              {svc.model === "flat" && (
                <label>
                  <span>Flat price</span>
                  <input type="number" min="0" value={svc.flatPrice} onChange={numHandler((n, v) => (n.services[i].flatPrice = v))} />
                </label>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
