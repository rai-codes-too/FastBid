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
        {/* Inter: clean neutral body font. Fraunces: warm editorial serif for headings. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-bg text-text antialiased">
        <ThemeProvider>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <footer style={{
            borderTop: '1px solid var(--border)',
            marginTop: '64px',
            padding: '32px 24px',
            textAlign: 'center',
            fontSize: '0.825rem',
            color: 'var(--text-muted)',
          }}>
            FastBid - NISER Marketplace - Contact pritipriya.dasbehera@niser.ac.in for issues
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}
