'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Phone,
  User,
  Ticket,
  Printer,
  Home,
  Clock,
  Sparkles,
  Camera,
} from 'lucide-react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { formatCurrency } from '@/lib/data'
import { getBookingsFromFirebase } from '@/lib/firebase-services'

export default function BookingSuccessPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params)
  const [booking, setBooking] = useState<any>(null)

  useEffect(() => {
    let active = true

    getBookingsFromFirebase()
      .then((bookings) => {
        if (!active) return
        const match = bookings.find((b) => b.code === resolvedParams.code)
        setBooking(match ?? null)
      })
      .catch(() => {
        if (active) setBooking(null)
      })

    return () => {
      active = false
    }
  }, [resolvedParams.code])

  if (!booking) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="my-20 text-center text-sm font-semibold text-purple-950">Đang tải thông tin vé Studio...</div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-3xl px-5">
          {/* Header Banner */}
          <div className="text-center space-y-3">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25">
              <CheckCircle2 size={36} />
            </div>
            <h1 className="font-bold text-3xl text-purple-950 md:text-4xl">Đã nhận đơn đặt giữ Studio!</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Cảm ơn bạn đã lựa chọn <b className="text-purple-950">chupchoet.room</b>. Thông tin vé chụp của bạn đã được ghi nhận.
            </p>
          </div>

          {/* Ticket Card */}
          <div className="mt-8 overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-2xl shadow-pink-500/15 backdrop-blur-xl">
            {/* Ticket Top Header */}
            <div className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-700 p-6 text-white flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-pink-200 font-bold flex items-center gap-1">
                  <Camera size={13} /> chupchoet.room Pass
                </span>
                <div className="font-mono text-2xl font-extrabold tracking-widest mt-0.5">{booking.code}</div>
              </div>
              <div className="rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-bold text-white border border-white/30 backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                <Sparkles size={14} className="text-yellow-300" /> Đã nhận cọc VietQR
              </div>
            </div>

            {/* Ticket Body */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Studio info */}
              <div className="flex items-center gap-4 border-b border-pink-100 pb-6">
                <img
                  src={booking.studioImage}
                  alt={booking.studioName}
                  className="h-20 w-24 rounded-2xl object-cover shadow-sm border border-white/80"
                />
                <div>
                  <h2 className="font-bold text-2xl text-purple-950">{booking.studioName}</h2>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground font-medium">
                    <MapPin size={13} className="text-pink-500" /> {booking.studioAddress}
                  </p>
                </div>
              </div>

              {/* Grid Details */}
              <div className="grid gap-6 sm:grid-cols-2 text-sm border-b border-pink-100 pb-6">
                <div className="space-y-1">
                  <span className="text-xs uppercase text-muted-foreground font-bold flex items-center gap-1">
                    <Calendar size={13} className="text-pink-500" /> Ngày nhận Studio
                  </span>
                  <div className="font-bold text-purple-950 text-base">{booking.checkIn}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                    <Clock size={12} className="text-pink-500" /> Chuẩn bị trước 10-15 phút
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs uppercase text-muted-foreground font-bold flex items-center gap-1">
                    <Calendar size={13} className="text-pink-500" /> Ngày hoàn tất
                  </span>
                  <div className="font-bold text-purple-950 text-base">{booking.checkOut}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                    <Clock size={12} className="text-pink-500" /> Dọn dẹp thiết bị đúng giờ
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs uppercase text-muted-foreground font-bold flex items-center gap-1">
                    <User size={13} className="text-pink-500" /> Người đặt / Ekip
                  </span>
                  <div className="font-bold text-purple-950">{booking.customerName}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                    <Phone size={12} className="text-pink-500" /> {booking.customerPhone}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs uppercase text-muted-foreground font-bold flex items-center gap-1">
                    <Ticket size={13} className="text-pink-500" /> Số lượng & Thời gian
                  </span>
                  <div className="font-bold text-purple-950">
                    {booking.guests || 4} Người trong Ekip · {booking.nights || 1} Khung thời gian
                  </div>
                </div>
              </div>

              {/* Price Summary */}
              <div className="rounded-2xl bg-gradient-to-br from-pink-50/80 to-purple-50/80 p-5 space-y-2 text-xs font-medium border border-pink-200/50">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tổng chi phí Studio:</span>
                  <span className="font-bold text-purple-950">{formatCurrency(booking.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-pink-600 font-extrabold text-sm">
                  <span>Đã cọc 30% VietQR:</span>
                  <span>{formatCurrency(booking.depositPrice)}</span>
                </div>
                <div className="flex justify-between text-purple-900 border-t border-pink-200/60 pt-2 font-bold">
                  <span>Còn lại thanh toán tại Studio:</span>
                  <span className="font-extrabold text-purple-950">
                    {formatCurrency(booking.totalPrice - booking.depositPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Ticket Footer / Barcode graphic */}
            <div className="border-t border-dashed border-pink-200 bg-pink-50/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="font-mono text-xs font-bold text-purple-900">
                PASS-{booking.code}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-pink-200 bg-white px-4 py-2 text-xs font-bold text-purple-950 shadow-sm hover:bg-pink-50 transition"
                >
                  <Printer size={14} /> Lưu / In Vé
                </button>
                <Link
                  href="/my-bookings"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition"
                >
                  Đơn đặt của tôi
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-purple-900 font-bold hover:underline">
              <Home size={16} /> Quay lại Danh sách Studio
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

