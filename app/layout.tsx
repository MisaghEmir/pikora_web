import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: {
    default: "PIKORA | Play Poker Online",
    template: "%s | PIKORA",
  },
  description:
    "Play free online poker with friends and players worldwide. Create private poker tables, join multiplayer games and enjoy Texas Hold'em on PIKORA.",
  applicationName: "PIKORA",
  keywords: [
    "free online poker",
    "play poker online",
    "Texas Hold'em",
    "multiplayer poker",
    "private poker tables",
    "online poker game",
  ],
  openGraph: {
    type: "website",
    siteName: "PIKORA",
    title: "PIKORA | Play Poker Online",
    description:
      "Join PIKORA and enjoy free online Texas Hold'em poker with friends and players worldwide.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PIKORA | Play Poker Online",
    description: "Play free online poker with PIKORA.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090E0D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Analytics />
        {children}
      </body>
    </html>
  );
}
