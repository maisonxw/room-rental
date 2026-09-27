import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'chupchoet.room — Cho thuê Studio chụp ảnh chuyên nghiệp',
  description: 'Hệ thống đặt lịch thuê phòng Studio chụp hình, concept phong phú, đầy đủ thiết bị ánh sáng tại chupchoet.room.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ec4899',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" className="bg-background"><body className="antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}

