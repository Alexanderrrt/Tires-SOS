"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

const ATTRIBUTION_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const ATTRIBUTION_STORAGE_KEY = "tires_sos_campaign_attribution";

function currentAttribution() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const incoming = Object.fromEntries(
    ATTRIBUTION_KEYS.map((key) => [key, params.get(key)?.trim() || ""]).filter(([, value]) => value),
  );

  let stored = {};
  try {
    stored = JSON.parse(window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY) || "{}") || {};
  } catch {
    stored = {};
  }

  const attribution = Object.keys(incoming).length ? incoming : stored;
  if (Object.keys(incoming).length) {
    try {
      window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(incoming));
    } catch {}
  }
  return attribution;
}

function sourceChannel(attribution) {
  return attribution.utm_source || attribution.utm_medium || "direct_or_organic";
}

function contactLocation(link) {
  if (link.dataset.analyticsLocation) return link.dataset.analyticsLocation;
  const section = link.closest("[id]");
  if (section?.id) return section.id;
  if (link.closest("header")) return "header";
  if (link.closest("footer")) return "footer";
  return window.location.pathname || "/";
}

function initializePostHog() {
  if (typeof window === "undefined") return false;
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!token) return false;
  if (!posthog.__loaded) {
    posthog.init(token, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      ui_host: "https://us.posthog.com",
      capture_pageview: "history_change",
      capture_pageleave: true,
      person_profiles: "identified_only",
    });
  }
  return true;
}

export function captureAnalytics(event, properties = {}) {
  if (!initializePostHog()) return;
  const attribution = currentAttribution();
  posthog.capture(event, {
    ...attribution,
    source_channel: properties.source_channel || sourceChannel(attribution),
    page_path: window.location.pathname || "/",
    ...properties,
  });
}

export default function PostHogAnalytics() {
  useEffect(() => {
    if (!initializePostHog()) return undefined;

    const attribution = currentAttribution();
    if (Object.keys(attribution).length) {
      posthog.register({ ...attribution, source_channel: sourceChannel(attribution) });
    }

    const trackContact = (event) => {
      const link = event.target.closest("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      const channel = href.startsWith("tel:")
        ? "telephone"
        : href.startsWith("sms:")
          ? "sms"
          : href.includes("wa.me/")
            ? "whatsapp"
            : "";
      if (!channel) return;
      captureAnalytics("contact_click", { channel, location: contactLocation(link) });
    };

    document.addEventListener("click", trackContact, true);
    return () => document.removeEventListener("click", trackContact, true);
  }, []);

  return null;
}
