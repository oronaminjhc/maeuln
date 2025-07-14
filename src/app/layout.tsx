import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from '@/lib/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '마을N - 우리 동네 SNS',
  description: '전국 모든 마을의 이야기',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <HelmetProvider>
          <AuthProvider>
            <div className="max-w-sm mx-auto bg-gray-50 shadow-lg min-h-screen font-sans text-gray-800">
              {children}
            </div>
          </AuthProvider>
        </HelmetProvider>
      </body>
    </html>
  )
} 