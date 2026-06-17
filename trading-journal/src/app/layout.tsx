import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Trading Journal',
  description: 'Robinhood trading journal with AI analysis',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 h-14">
              <Link href="/" className="font-semibold text-white flex items-center gap-2">
                <span className="text-green-400">◈</span> Trading Journal
              </Link>
              <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
              <Link href="/trades" className="text-sm text-gray-400 hover:text-white transition-colors">Trades</Link>
              <Link href="/trades?asset=option" className="text-sm text-gray-400 hover:text-white transition-colors">Options</Link>
              <Link href="/trades?agent=agentic" className="text-sm text-gray-400 hover:text-white transition-colors">Agentic</Link>
              <div className="ml-auto">
                <a
                  href="/api/import"
                  className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  ↻ Sync
                </a>
              </div>
            </div>
          </nav>
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
            {children}
          </main>
          <footer className="border-t border-gray-800 text-center text-xs text-gray-600 py-4">
            Trading Journal · Powered by Robinhood MCP + Claude AI
          </footer>
        </div>
      </body>
    </html>
  )
}
