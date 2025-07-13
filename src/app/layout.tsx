import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'CityGenerator - 3D City Visualization Platform',
  description: 'Production-grade 3D city visualization platform showcasing photorealistic cities with real-time data integration',
  keywords: ['3D', 'city', 'visualization', 'Three.js', 'Vancouver', 'urban planning'],
  authors: [{ name: 'CityGenerator Team' }],
  openGraph: {
    title: 'CityGenerator - 3D City Visualization',
    description: 'Experience cities like never before with photorealistic 3D visualization',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
          {children}
        </div>
      </body>
    </html>
  )
}