"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export default function AuthProviderScope({ children }) {
  const pathname = usePathname();
  const needsAuth = pathname === "/admin" || pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  if (!needsAuth) return children;
  return <ClerkProvider>{children}</ClerkProvider>;
}
