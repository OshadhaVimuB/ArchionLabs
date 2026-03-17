import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ArchionLabs | AI-Powered Architecture & 3D Modeling",
  description: "Transform static 2D floor plans into intelligent 3D spaces in seconds. ArchionLabs offers AI-driven architectural modeling, movement simulation, and real-time browser collaboration.",
  keywords: "AI architecture, 2D to 3D floor plans, architectural movement simulation, AI for architects, 3D modeling automation, BIM software alternative, ArchionLabs",
  openGraph: {
    title: "ArchionLabs | AI-Powered Architecture & 3D Modeling",
    description: "Transform static 2D floor plans into intelligent 3D spaces in seconds. Built specifically for boundary-pushing architects.",
    url: "https://www.archionlabs.com/",
    type: "website",
    images: [{ url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ArchionLabs | AI-Powered Architecture",
    description: "Turn 2D plans into intelligent 3D spaces in seconds with AI-driven movement simulation and real-time collaboration.",
    images: ["https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop"],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
