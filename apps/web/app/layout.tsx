import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import Link from "next/link";

import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "City Climate Action Tracker",
  description:
    "Track municipal climate actions and progress toward emission targets.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-40 border-b border-ink-line/60 bg-bg/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
            <Link
              href="/"
              className="group flex items-center gap-2.5 focus:outline-none"
            >
              <LeafMark />
              <div className="flex flex-col leading-none">
                <span className="text-[15px] font-bold tracking-tight text-ink">
                  Climate&nbsp;Action&nbsp;Tracker
                </span>
                <span className="mt-1 text-[10px] font-medium uppercase tracking-eyebrow text-emerald-700">
                  Open&nbsp;Earth · OEF
                </span>
              </div>
            </Link>

            <nav aria-label="Primary" className="text-sm">
              <ul className="flex items-center gap-1">
                <li>
                  <Link
                    href="/"
                    className="rounded-full px-4 py-2 font-medium text-ink-soft transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium text-ink-soft transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    Admin
                    <span
                      aria-hidden="true"
                      className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-soft-pulse"
                    />
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
          {children}
        </main>

        <footer className="mt-20 border-t border-ink-line/60 bg-bg-elev/40">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-8 text-xs sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5 text-ink-soft">
              <LeafMark small />
              <p>
                <span className="font-semibold text-ink">
                  Climate Action Tracker
                </span>{" "}
                · Built for the OEF AI-Native Software Engineer exercise.
              </p>
            </div>
            <p className="font-medium uppercase tracking-eyebrow text-emerald-700">
              Earth&nbsp;comes&nbsp;first.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

/**
 * Sprout / leaf mark — two stylised leaves growing from a stem.
 * Evokes nature without literal photography.
 */
function LeafMark({ small = false }: { small?: boolean }) {
  const size = small ? 16 : 22;
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center rounded-full bg-emerald-100 p-1.5"
      style={{ width: size + 12, height: size + 12 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-emerald-700"
      >
        <path d="M12 21V11" />
        <path d="M12 11C12 7 8 4 4 4c0 4 3 7 8 7Z" fill="currentColor" fillOpacity="0.18" />
        <path d="M12 13C12 9 16 6 20 6c0 4-3 7-8 7Z" fill="currentColor" fillOpacity="0.18" />
      </svg>
    </span>
  );
}
