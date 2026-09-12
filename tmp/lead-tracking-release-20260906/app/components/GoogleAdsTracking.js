"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { GOOGLE_ADS_TAG_ID, initializeGoogleTag } from "../../lib/google-lead-tracking";

export default function GoogleAdsTracking() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => { setEnabled(initializeGoogleTag(window)); }, []);
  if (!enabled) return null;
  return <Script id="tires-google-ads" src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_TAG_ID}`} strategy="afterInteractive" />;
}
