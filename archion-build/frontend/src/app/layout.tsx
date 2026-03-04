import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Archion Build",
  description: "AI-powered architectural floor plan generator",
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
