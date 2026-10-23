import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AMANA — Secure Device Registration",
  description: "Know the device. Check the status. Make informed decisions.",
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
