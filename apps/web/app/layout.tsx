import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  DM_Sans,
  JetBrains_Mono,
} from "next/font/google";
import Link from "next/link";

import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600"],
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
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>

        <header className="border-b border-ink-line/70 bg-bg/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5">
            <Link
              href="/"
              className="group flex items-center gap-2.5 focus:outline-none"
            >
              <Globe />
              <span className="font-display text-[1.05rem] font-semibold tracking-tight text-ink">
                Climate&nbsp;Action&nbsp;Tracker
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase tracking-eyebrow text-ink-mute border-l border-ink-line pl-2.5 ml-1">
                OEF&nbsp;·&nbsp;v0.1
              </span>
            </Link>

            <nav aria-label="Primary" className="text-sm">
              <ul className="flex gap-7">
                <li>
                  <Link
                    href="/"
                    className="text-ink-soft hover:text-ink transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin"
                    className="text-ink-soft hover:text-ink transition-colors inline-flex items-center gap-1.5"
                  >
                    Admin
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-forest-500"
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

        <footer className="border-t border-ink-line/70 mt-16">
          <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <p className="text-ink-mute">
              <span className="text-ink-soft font-medium">
                Climate Action Tracker
              </span>{" "}
              — Built for the OEF AI-Native Software Engineer exercise.
            </p>
            <p className="text-ink-mute uppercase tracking-eyebrow">
              Earth&nbsp;comes&nbsp;first.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

function Globe() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-forest-600"
    >
      <circle cx="12" cy="12" r="9.5" />
      <path d="M2.5 12h19" />
      <path d="M12 2.5a14 14 0 0 1 0 19" />
      <path d="M12 2.5a14 14 0 0 0 0 19" />
    </svg>
  );
}
