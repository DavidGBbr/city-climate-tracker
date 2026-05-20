"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Button, ErrorMessage } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { setAdminToken } from "@/lib/auth";

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

function LoginForm() {
  const search = useSearchParams();
  const next = search.get("next") || "/admin";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      setError("Enter the admin password to continue.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<TokenResponse>("/auth/login", { password });
      setAdminToken(res.access_token, res.expires_in);
      window.location.assign(next);
      return;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Invalid password.");
      } else {
        setError(err instanceof Error ? err.message : "Login failed.");
      }
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-ink-line/70 bg-white p-6 shadow-sm"
    >
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="flex items-center gap-1 text-xs font-semibold text-ink-soft"
        >
          Admin password
          <span aria-hidden="true" className="text-emerald-600">
            *
          </span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-mute focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all ${
            error ? "border-ember-500" : "border-ink-line"
          }`}
        />
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </div>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <section className="mx-auto mt-12 max-w-md">
      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-emerald-700">
          Admin access
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
          Sign in to manage actions
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          The climate team uses a shared password. Read-only views remain public.
        </p>
      </header>

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </section>
  );
}
