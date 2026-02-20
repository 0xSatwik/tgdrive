import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap'
})

export const metadata = {
  title: 'Telegram Drive - Unlimited Cloud Storage',
  description: 'Your personal unlimited cloud storage powered by Telegram. Store, stream, and share files securely.',
  keywords: ['cloud storage', 'telegram', 'file storage', 'video streaming', 'unlimited storage'],
  authors: [{ name: 'Telegram Drive' }],
  openGraph: {
    title: 'Telegram Drive - Unlimited Cloud Storage',
    description: 'Your personal unlimited cloud storage powered by Telegram',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <div className="min-h-screen relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}
