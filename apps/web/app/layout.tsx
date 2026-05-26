import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMB Funding Navigator",
  description: "Maryland-first funding, paperwork, and business readiness guidance.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
