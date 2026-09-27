'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Ticket, Calendar, MapPin, ArrowRight, Camera } from 'lucide-react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { formatCurrency } from '@/lib/data'
import { getBookingsFromFirebase } from '@/lib/firebase-services'

export default function MyBookingsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [bookings, setBookings] = useState<any[]>([])

  useEffect(() => {
    let active = true

    getBookingsFromFirebase()
      .then((data) => {
        if (active) setBookings(data)
      })
      .catch(() => {
        if (active) setBookings([])
      })

    return () => {
      active = false
    }
  }, [])

  const filteredBookings = bookings.filter(
    (b) =>
      b.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerPhone?.includes(searchQuery) ||
      b.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-5xl px-5">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-100/80 text-pink-700 text-xs font-bold border border-pink-200 shadow-sm">
              <Camera size={14} /> Tra cứu lịch đặt Studio
            </div>
            <h1 className="font-bold text-4xl text-purple-950">Tra cứu đơn đặt chupchoet.room</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Nhập Số điện thoại, Tên Ekip hoặc Mã đơn đặt (ví dụ: CHUP-123456) để kiểm tra vé Studio.
            </p>

            <div className="mt-6 flex gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" />
                <input
                  type="text"
                  placeholder="Nhập SĐT hoặc Mã đơn đặt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-white/80 bg-white/90 py-3.5 pl-11 pr-4 text-sm font-semibold shadow-lg shadow-pink-500/8 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
            </div>
          </div>

          <div className="mt-12 space-y-6">
            <h2 className="font-bold text-2xl text-purple-950">
              {searchQuery ? `Kết quả tìm kiếm (${filteredBookings.length})` : `Tất cả đơn đặt đã lưu (${bookings.length})`}
            </h2>

            {filteredBookings.length === 0 ? (
              <div className="rounded-3xl border border-white/80 bg-white/80 p-12 text-center text-muted-foreground shadow-xl shadow-pink-500/8 backdrop-blur-md">
                <Ticket size={44} className="mx-auto text-pink-400 mb-3" />
                <p className="font-bold text-xl text-purple-950">Chưa tìm thấy đơn đặt Studio nào</p>
                <p className="mt-1 text-xs font-medium">
                  Hãy kiểm tra lại Số điện thoại hoặc Mã đơn hàng bạn đã dùng khi đặt giữ lịch.
                </p>
                <Link href="/#studios" className="primary-button mt-6 inline-flex">
                  Khám phá Studio ngay
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredBookings.map((b) => (
                  <div
                    key={b.code}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-white/80 bg-white/80 p-6 shadow-lg shadow-pink-500/8 backdrop-blur-md hover:shadow-xl hover:shadow-pink-500/15 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={b.studioImage}
                        alt={b.studioName}
                        className="h-16 w-20 rounded-2xl object-cover shadow-sm border border-white/80"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-pink-700 bg-pink-100/80 px-2.5 py-0.5 rounded-full border border-pink-200">
                            {b.code}
                          </span>
                          <span className="text-xs font-bold text-purple-800 bg-purple-100/80 px-2.5 py-0.5 rounded-full border border-purple-200">
                            Đã cọc VietQR
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-purple-950 mt-1.5">{b.studioName}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-pink-500" /> {b.checkIn} — {b.checkOut}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-pink-500" /> {b.customerName} ({b.customerPhone})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-pink-100">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground font-medium">Tổng chi phí</div>
                        <div className="font-bold text-lg text-purple-950">
                          {formatCurrency(b.totalPrice)}
                        </div>
                      </div>
                      <Link
                        href={`/booking/success/${b.code}`}
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-white/80 bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all"
                      >
                        Xem Vé Studio <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

