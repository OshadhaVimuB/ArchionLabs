import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ArchionLabs | AI-Powered Architecture & 3D Modeling',
  description:
    'Transform static 2D floor plans into intelligent 3D spaces in seconds. ArchionLabs offers AI-driven architectural modeling, movement simulation, and real-time browser collaboration.',
  keywords:
    'AI architecture, 2D to 3D floor plans, architectural movement simulation, AI for architects, 3D modeling automation, BIM software alternative, ArchionLabs',
  robots: 'index, follow',
  authors: [{ name: 'ArchionLabs' }],
  metadataBase: new URL('https://www.archionlabs.com'),
  openGraph: {
    type: 'website',
    url: 'https://www.archionlabs.com/',
    title: 'ArchionLabs | AI-Powered Architecture & 3D Modeling',
    description:
      'Transform static 2D floor plans into intelligent 3D spaces in seconds. Built specifically for boundary-pushing architects.',
    images: [
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop',
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ArchionLabs | AI-Powered Architecture',
    description:
      'Turn 2D plans into intelligent 3D spaces in seconds with AI-driven movement simulation and real-time collaboration.',
    images: [
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop',
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/Assets/favicon.svg" />
        <link rel="canonical" href="https://www.archionlabs.com/" />
        <script src="https://unpkg.com/@phosphor-icons/web"></script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'ArchionLabs',
              operatingSystem: 'WebBrowser',
              applicationCategory: 'DesignApplication',
              description:
                'AI-powered architecture platform that transforms static 2D floor plans into intelligent 3D spaces in seconds with movement simulations.',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              publisher: {
                '@type': 'Organization',
                name: 'ArchionLabs',
                url: 'https://www.archionlabs.com/',
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.className} antialiased selection:bg-black selection:text-white overflow-hidden`}>
        {children}
      </body>
    </html>
  )
}
