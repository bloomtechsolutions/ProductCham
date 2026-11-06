import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Product Champion · Refresher Training 2026",
  description: "Live True/False quiz on BML products and services",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0a0e1a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
