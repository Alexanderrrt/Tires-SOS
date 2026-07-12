"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

const TAPS_REQUIRED = 5;
const TAP_WINDOW_MS = 2200;

// Five quick taps on the header logo → /admin/login. Invisible to normal visitors.
export function useSecretAdminTap() {
  const router = useRouter();
  const countRef = useRef(0);
  const windowStartRef = useRef(0);

  return useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      const now = Date.now();
      if (!windowStartRef.current || now - windowStartRef.current > TAP_WINDOW_MS) {
        countRef.current = 0;
        windowStartRef.current = now;
      }

      countRef.current += 1;
      if (countRef.current >= TAPS_REQUIRED) {
        countRef.current = 0;
        windowStartRef.current = 0;
        router.push("/admin/login");
      }
    },
    [router]
  );
}
