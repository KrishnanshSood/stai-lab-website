import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Safe and Trusted AI Lab · BITS Pilani",
  description: "Research on human-AI trust, safety assessment, algorithmic auditing, and AI governance at BITS Pilani.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
