import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const sans = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#12110f" },
    { media: "(prefers-color-scheme: dark)", color: "#12110f" },
  ],
};

export const metadata: Metadata = {
  title: "KITSUNE & EMBER — паназиатский ресторан",
  description:
    "Уголь биночётан, саке Ниигаты и консьерж Кицунэ. Ключ Google AI Studio остаётся в браузере.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className={`${display.variable} ${sans.variable} antialiased`}>{children}</body>
    </html>
  );
}
