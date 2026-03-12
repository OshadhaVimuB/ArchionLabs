import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArchionLabs | AI-Powered Architecture Design Software",
  description:
    "Transform 2D floor plans into intelligent 3D models with AI simulations.",
  icons: {
    icon: [
      { url: "/Assets/favicon.svg", type: "image/svg+xml" },
      { url: "/Assets/favicon.svg", sizes: "32x32", type: "image/png" },
      { url: "/Assets/favicon.svg", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/Assets/favicon.svg", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Rethink+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
