import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tethereum (T99) - Coinbase Wallet Integration',
  description: 'Connect to Tethereum token on BNB Smart Chain via Coinbase Wallet',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
