// Public Google Ads tag identifiers, not credentials.
export const GOOGLE_ADS_TAG_ID = "AW-18328053401";
export const GOOGLE_ADS_LEAD_DESTINATION = "AW-18328053401/FBlCCNbM0-8cEJnNv6NE";

export function isProductionTrackingHost(hostname) {
  return hostname === "tiressosrescue.com" || hostname === "www.tiressosrescue.com";
}

export function initializeGoogleTag(browser) {
  if (!browser || !isProductionTrackingHost(browser.location.hostname)) return false;
  browser.dataLayer = browser.dataLayer || [];
  browser.gtag = browser.gtag || function () { browser.dataLayer.push(arguments); };
  if (!browser.__tiresGoogleTagConfigured) {
    browser.gtag("js", new Date());
    browser.gtag("config", GOOGLE_ADS_TAG_ID, { allow_ad_personalization_signals: false });
    browser.__tiresGoogleTagConfigured = true;
  }
  return true;
}

export function trackConfirmedLead(status, browser = typeof window !== "undefined" ? window : null) {
  if (status?.leadCaptured !== true || status?.persisted !== true ||
      typeof status.leadConversionId !== "string" || !/^lead_[a-zA-Z0-9-]{8,80}$/.test(status.leadConversionId)) return false;
  if (!initializeGoogleTag(browser)) return false;
  const id = status.leadConversionId;
  const key = `tires:google-lead:${id}`;
  browser.__tiresTrackedLeads = browser.__tiresTrackedLeads || new Set();
  if (browser.__tiresTrackedLeads.has(id)) return false;
  try { if (browser.localStorage.getItem(key)) return false; } catch { /* Storage may be disabled. */ }
  try {
    // Never include customer names, contact details, or chat text.
    browser.gtag("event", "conversion", {
      send_to: GOOGLE_ADS_LEAD_DESTINATION,
      transaction_id: id,
    });
    browser.__tiresTrackedLeads.add(id);
    try { browser.localStorage.setItem(key, "1"); } catch { /* Google's transaction ID also deduplicates. */ }
    return true;
  } catch { return false; }
}
