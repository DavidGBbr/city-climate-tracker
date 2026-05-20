"use client";

import { ADMIN_TOKEN_COOKIE } from "@/lib/auth-constants";

/**
 * Admin token is stored in a SameSite=Lax cookie (NOT httpOnly) so the
 * Next.js middleware can gate /admin/* navigation while client-side SWR
 * hooks can also forward it as `Authorization: Bearer ...` to the FastAPI
 * backend. The non-httpOnly choice trades XSS resistance for simplicity —
 * acceptable for a single-admin demo; production should adopt a BFF proxy.
 */

const ONE_DAY_SECONDS = 60 * 60 * 24;

export function getAdminToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ADMIN_TOKEN_COOKIE}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export function setAdminToken(token: string, maxAgeSeconds = ONE_DAY_SECONDS): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ADMIN_TOKEN_COOKIE}=${encodeURIComponent(
    token,
  )}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
}

export function clearAdminToken(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ADMIN_TOKEN_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}
