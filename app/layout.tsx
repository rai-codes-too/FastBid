import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import Navbar from '@/components/ui/Navbar'

export const metadata: Metadata = {
  title: 'FastBid – NISER Marketplace',
  description: 'The student-only auction marketplace for NISER.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body bg-bg text-text antialiased">
        <ThemeProvider>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <footer className="border-t border-border mt-16 py-8 text-center text-sm text-muted">
            <p>FastBid · NISER Marketplace · Transactions are offline. Stay safe.</p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}
