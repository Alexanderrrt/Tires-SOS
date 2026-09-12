"use client";

const COPY = {
  retry: { en: "Retry", es: "Reintentar" },
  failed: { en: "Could not load live ad data.", es: "No se pudieron cargar los datos de anuncios en vivo." },
};

export default function AdsDataState({ t, error, onRetry }) {
  if (!error) return null;
  return (
    <div className="editor__group ads-data-error" role="alert">
      <div>
        <strong>{t(COPY.failed)}</strong>
        <p className="editor__hint">{error}</p>
      </div>
      <button type="button" className="btn btn--ghost btn--small" onClick={onRetry}>{t(COPY.retry)}</button>
    </div>
  );
}
