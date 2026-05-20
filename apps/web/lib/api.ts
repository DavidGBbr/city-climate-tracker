/**
 * Thin typed fetch client around the FastAPI backend.
 *
 * - Throws ApiError on non-2xx so SWR surfaces it via the `error` field.
 * - Body parsing handled here; downstream callers can validate with Zod.
 */

import { ADMIN_TOKEN_COOKIE } from "@/lib/auth-constants";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function readAdminToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ADMIN_TOKEN_COOKIE}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export type ApiErrorBody = {
  error: string;
  message: string;
  details?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function parseJsonSafe(res: Response): Promise<ApiErrorBody | null> {
  try {
    return (await res.json()) as ApiErrorBody;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = readAdminToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!res.ok) {
    const body = await parseJsonSafe(res);
    throw new ApiError(
      res.status,
      body,
      body?.message ?? `Request failed with ${res.status}`,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T,>(path: string) => request<T>(path, { method: "GET" }),
  post: <T,>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T,>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T,>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** SWR fetcher signature. */
export const fetcher = <T,>(path: string) => api.get<T>(path);
