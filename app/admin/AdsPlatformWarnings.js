"use client";

const LABELS = { google_ads: "Google Ads", meta_ads: "Meta Ads", yelp: "Yelp" };

export default function AdsPlatformWarnings({ metrics }) {
  const errors = Object.entries(metrics?.byPlatform || {}).filter(([, data]) => data.connected && data.error);
  if (!errors.length) return null;
  return (
    <div className="editor__group" role="status">
      {errors.map(([platform, data]) => <p key={platform} className="editor__warn" style={{ margin: 0 }}>⚠ {LABELS[platform] || platform}: {data.error}</p>)}
    </div>
  );
}
