import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "City Climate Action Tracker",
  description: "Track city climate actions and progress toward emission targets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
