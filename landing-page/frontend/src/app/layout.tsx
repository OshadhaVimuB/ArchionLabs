import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google';
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ArchionLabs | AI-Powered Architecture & 3D Modeling",
  description: "Transform static 2D floor plans into intelligent 3D spaces in seconds. ArchionLabs offers AI-driven architectural modeling, movement simulation, and real-time browser collaboration.",
  keywords: "AI architecture, 2D to 3D floor plans, architectural movement simulation, AI for architects, 3D modeling automation, BIM software alternative, ArchionLabs",
  icons: {
    icon: "/Assets/favicon.svg",
  },
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
  },
  metadataBase: new URL("https://www.archionlabs.com"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ArchionLabs",
    "url": "https://www.archionlabs.com/",
    "logo": "https://www.archionlabs.com/Assets/favicon.svg",
    "description": "Transform static 2D floor plans into intelligent 3D spaces in seconds.",
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased overflow-x-hidden`}>
        {children}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
