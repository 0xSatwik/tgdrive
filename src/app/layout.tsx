import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800'] })

export const metadata = {
  title: 'Telegram Drive - Unlimited Storage',
  description: 'Your private, unlimited file storage powered by Telegram and Cloudflare.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <div className="min-h-screen relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}
