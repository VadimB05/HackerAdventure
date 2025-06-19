import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { GameProvider } from '@/lib/contexts/game-context'

export const metadata: Metadata = {
  title: 'INTRUSION - Hacker Adventure',
  description: 'Ein Next.js-basiertes Hacker-Adventure-Spiel mit React Frontend und Node.js API Backend',
  generator: 'Next.js',
  keywords: ['hacker', 'adventure', 'game', 'puzzle', 'cybersecurity'],
  authors: [{ name: 'INTRUSION Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <GameProvider>
            {children}
          </GameProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
