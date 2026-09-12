"use client";

import { useEffect, useState } from "react";
import { SITE } from "../site.config";
import { getShopDateTime } from "../../lib/shop-time";

function computeIsOpen(now) {
  const shopNow = getShopDateTime(now);
  const today = SITE.hours.find((h) => h.day === shopNow.dayOfWeek);
  if (!today || !today.open || !today.close) return false;

  const [openH, openM] = today.open.split(":").map(Number);
  const [closeH, closeM] = today.close.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  const nowMinutes = shopNow.hour * 60 + shopNow.minute;

  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}

// Returns whether the shop is currently open, recomputed every minute.
// Starts as null (unknown) until mounted, to avoid server/client mismatch.
export function useOpenStatus() {
  const [isOpen, setIsOpen] = useState(null);

  useEffect(() => {
    const update = () => setIsOpen(computeIsOpen(new Date()));
    update();
    const id = setInterval(update, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return isOpen;
}
