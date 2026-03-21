import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Archion Build | ArchionLabs",
  description: "AI-powered architectural floor plan generator",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
