import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ghost — Trust the proof, not the promise",
    template: "%s | Ghost",
  },
  description:
    "Ghost is the verifiable autonomy layer for AI commerce agents. Set hard spending rules, proof-backed approvals, and instant revocation — built on Midnight.",
  keywords: [
    "AI agent", "autonomous commerce", "spending policy", "zero-knowledge proof",
    "Midnight blockchain", "verifiable autonomy", "trust infrastructure",
  ],
  openGraph: {
    title: "Ghost — Trust the proof, not the promise",
    description:
      "Verifiable autonomy for AI shopping agents. Hard spending rules. ZK proof enforcement. Built on Midnight.",
    type: "website",
    siteName: "Ghost",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ghost — Trust the proof, not the promise",
    description: "Verifiable autonomy for AI commerce agents.",
  },
  metadataBase: new URL("https://ghost.xyz"),
  robots: { index: true, follow: true },
};

import { MidnightProvider } from "@/lib/midnight/MidnightProvider";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <MidnightProvider>
          {children}
          <Toaster theme="dark" position="bottom-right" richColors />
        </MidnightProvider>
      </body>
    </html>
  );
}
