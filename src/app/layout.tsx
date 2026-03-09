import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Parafin — AI Financial Assistant",
  description: "Your proactive AI financial assistant for smarter money management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
