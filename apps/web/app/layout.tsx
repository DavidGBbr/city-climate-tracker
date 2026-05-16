import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "City Climate Action Tracker",
  description: "Track city climate actions and progress toward emission targets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-slate-900 focus:px-3 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
            >
              <span aria-hidden="true">🌍</span>{" "}
              <span>Climate Action Tracker</span>
            </Link>
            <nav aria-label="Primary">
              <ul className="flex gap-6 text-sm font-medium">
                <li>
                  <Link
                    href="/"
                    className="text-slate-700 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin"
                    className="text-slate-700 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                  >
                    Admin
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 p-6">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-3 text-xs text-slate-500">
            OEF · AI-Native Software Engineer Exercise
          </div>
        </footer>
      </body>
    </html>
  );
}
