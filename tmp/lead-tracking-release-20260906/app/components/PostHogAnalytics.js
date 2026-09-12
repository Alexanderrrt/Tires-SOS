"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

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
  if (initializePostHog()) posthog.capture(event, properties);
}

export default function PostHogAnalytics() {
  useEffect(() => {
    if (!initializePostHog()) return undefined;

    const trackContact = (event) => {
      const link = event.target.closest("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      const channel = href.startsWith("sms:") ? "sms" : href.includes("wa.me/") ? "whatsapp" : "";
      if (!channel) return;
      posthog.capture("contact_click", { channel, location: contactLocation(link) });
    };

    document.addEventListener("click", trackContact, true);
    return () => document.removeEventListener("click", trackContact, true);
  }, []);

  return null;
}
