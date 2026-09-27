'use client'

import { use, useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowRight,
  Camera,
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  Heart,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Star,
  Users,
  Wifi,
  Sparkles,
  Home as HomeIcon,
  Moon,
  Timer,
  Layers,
} from 'lucide-react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Studio, formatCurrency } from '@/lib/data'
import { getRoomByIdFromFirebase } from '@/lib/firebase-services'
import { DEFAULT_STUDIO_IMAGE } from '@/lib/data'

type RentalMode = 'daily' | 'hourly'

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [room, setRoom] = useState<Studio | null>(null)

  // Rental mode state
  const [rentalMode, setRentalMode] = useState<RentalMode>('hourly')

  // Daily booking state
  const [checkIn, setCheckIn] = useState('2026-09-18')
  const [checkOut, setCheckOut] = useState('2026-09-20')

  // Hourly booking state
  const [checkInDate, setCheckInDate] = useState('2026-09-18')
  const [checkInTime, setCheckInTime] = useState('10:00')
  const [hoursCount, setHoursCount] = useState(4)

  // Guest state (shared)
  const [guests, setGuests] = useState(4)

  useEffect(() => {
    let active = true

    getRoomByIdFromFirebase(resolvedParams.id)
      .then((data) => {
        if (active) setRoom(data ?? null)
      })
      .catch(() => {
        if (active) setRoom(null)
      })

    return () => {
      active = false
    }
  }, [resolvedParams.id])

  // ---- Price calculations ----
  const nights = useMemo(() => {
    try {
      const d1 = new Date(checkIn)
      const d2 = new Date(checkOut)
      const diffTime = Math.abs(d2.getTime() - d1.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return isNaN(diffDays) || diffDays <= 0 ? 1 : diffDays
    } catch {
      return 2
    }
  }, [checkIn, checkOut])

  const setupFee = 0 // No extra setup fee

  const baseTotal = room
    ? rentalMode === 'daily'
      ? room.pricePerDay * nights
      : room.pricePerHour * hoursCount
    : 0

  const grandTotal = baseTotal
  const deposit = grandTotal * 0.3

  // Build checkout query string
  const checkoutHref = room
    ? rentalMode === 'daily'
      ? `/checkout/${room.id}?rentalType=daily&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&nights=${nights}`
      : `/checkout/${room.id}?rentalType=hourly&checkIn=${checkInDate}&checkInTime=${checkInTime}&hours=${hoursCount}&guests=${guests}`
    : '/'

  if (!room) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="my-20 text-center">
          <h1 className="font-serif text-4xl text-purple-950">Đang tải Studio...</h1>
          <p className="mt-3 text-muted-foreground">Đang lấy thông tin phòng từ Firestore.</p>
          <Link href="/" className="primary-button mt-6">
            Quay lại trang chủ
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 pb-16">
        {/* Navigation Breadcrumb */}
        <div className="mx-auto max-w-7xl px-5 pt-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-pink-600 transition hover:text-purple-700"
          >
            <ChevronLeft size={16} /> Xem tất cả Studio
          </Link>
        </div>

        {/* Title Header */}
        <section className="mx-auto max-w-7xl px-5 pt-4 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="eyebrow dark">{room.type}</div>
              <h1 className="mt-2 font-serif text-4xl tracking-tight text-purple-950 md:text-5xl font-bold">{room.name}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                <MapPin size={15} className="text-pink-600" /> {room.address}, {room.city}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="rating text-sm">
                <Star size={14} fill="currentColor" className="text-yellow-400" />
                <b>{room.rating}</b> <span>({room.reviewCount} đánh giá)</span>
              </div>
              <button
                className="flex items-center gap-1.5 rounded-full border border-pink-200 bg-white/80 px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-pink-50"
                onClick={() => alert('Đã lưu vào danh sách yêu thích')}
              >
                <Heart size={14} className="text-pink-500" /> Lưu lại
              </button>
            </div>
          </div>
        </section>

        {/* Photo Gallery Grid */}
        <section className="mx-auto mt-6 max-w-7xl px-5 lg:px-8">
          <div className="grid gap-3 overflow-hidden rounded-3xl md:grid-cols-4 md:grid-rows-2 shadow-lg">
            <div className="relative aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-auto">
              <img src={room.images?.[0] || DEFAULT_STUDIO_IMAGE} alt={room.name} className="h-full w-full object-cover" />
            </div>
            {room.images.slice(1, 5).map((img, idx) => (
              <div key={idx} className="relative aspect-[4/3] hidden md:block">
                <img src={img} alt={`${room.name} ${idx + 2}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </section>

        {/* Main Content & Sticky Booking Box */}
        <section className="mx-auto mt-10 grid max-w-7xl gap-12 px-5 lg:grid-cols-[1.5fr_1fr] lg:px-8">
          {/* Left Column: Details & Amenities */}
          <div className="space-y-10">
            {/* Pricing badges */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2.5 text-sm text-white font-bold shadow-lg shadow-pink-500/20">
                <Timer size={16} />
                <span>{formatCurrency(room.pricePerHour)}</span>
                <span className="text-white/80 font-normal">/ giờ</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/90 px-5 py-2.5 text-sm text-purple-950 font-bold shadow-md shadow-pink-500/10">
                <Moon size={16} className="text-pink-600" />
                <span>{formatCurrency(room.pricePerDay)}</span>
                <span className="text-muted-foreground font-normal">/ ngày</span>
              </div>
            </div>

            {/* Quick Overview Badges */}
            <div className="flex flex-wrap items-center gap-6 rounded-2xl bg-white/60 p-4 shadow-sm text-sm text-foreground/80 font-semibold backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-purple-600" /> Loại Studio: {room.type}
              </div>
              <div className="flex items-center gap-2">
                <Wifi size={18} className="text-pink-600" /> Wifi tốc độ cao 5G
              </div>
            </div>

            {/* Host Section */}
            <div className="flex items-center justify-between rounded-3xl bg-white/70 p-6 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-4">
                <img src={room.host.avatar} alt={room.host.name} className="h-14 w-14 rounded-full object-cover shadow-sm border-2 border-white" />
                <div>
                  <div className="font-bold text-xl text-purple-950">Quản lý Studio bởi {room.host.name}</div>
                  <p className="mt-0.5 text-xs text-muted-foreground font-medium">
                    Kinh nghiệm {room.host.joinedYear} · Tỷ lệ phản hồi {room.host.responseRate}
                  </p>
                </div>
              </div>
              {room.host.isSuperhost && (
                <div className="rounded-full bg-pink-100/90 px-4 py-2 text-xs font-bold text-pink-700 flex items-center gap-1.5 shadow-xs">
                  <ShieldCheck size={15} /> Verified Studio Host
                </div>
              )}
            </div>

            {/* Description */}
            <div className="rounded-3xl bg-white/70 p-6 md:p-8 shadow-sm backdrop-blur-md space-y-4">
              <h2 className="text-2xl text-purple-950 font-bold">Giới thiệu về Studio</h2>
              <p className="leading-relaxed text-foreground/85 whitespace-pre-line font-sans text-sm sm:text-base">{room.description}</p>
            </div>

            {/* Amenities Section */}
            <div className="rounded-3xl bg-white/70 p-6 md:p-8 shadow-sm backdrop-blur-md space-y-6">
              <h2 className="text-2xl text-purple-950 font-bold">Thiết bị & Tiện ích sẵn có</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {room.amenities.map((cat) => (
                  <div key={cat.category} className="space-y-3 rounded-2xl bg-white/80 p-4 shadow-xs">
                    <h3 className="text-xs uppercase tracking-wider font-extrabold text-pink-600">
                      {cat.category}
                    </h3>
                    <ul className="space-y-2 text-sm text-foreground font-semibold">
                      {cat.items.map((item) => (
                        <li key={item} className="flex items-center gap-2.5">
                          <Check size={16} className="text-purple-600 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* House Rules */}
            <div className="rounded-3xl bg-white/70 p-6 md:p-8 shadow-sm backdrop-blur-md space-y-4">
              <h2 className="text-2xl text-purple-950 font-bold">Quy định sử dụng Studio</h2>
              <ul className="space-y-3 text-sm text-muted-foreground font-semibold">
                {room.rules.map((rule, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <Clock size={16} className="text-pink-500 shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Sticky Booking Widget (Soft Elevated Card) */}
          <div>
            <div className="sticky top-24 rounded-3xl border border-white bg-white/95 p-6 shadow-2xl shadow-pink-500/15 backdrop-blur-lg">

              {/* Rental Mode Toggle */}
              <div className="mb-5 flex rounded-2xl bg-purple-50/80 p-1.5 shadow-inner">
                <button
                  type="button"
                  onClick={() => setRentalMode('hourly')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
                    rentalMode === 'hourly'
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Timer size={15} /> Theo giờ
                </button>
                <button
                  type="button"
                  onClick={() => setRentalMode('daily')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
                    rentalMode === 'daily'
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Moon size={15} /> Trọn ngày
                </button>
              </div>

              {/* Price Display */}
              <div className="flex items-baseline justify-between pb-5">
                <div>
                  <span className="font-serif text-3xl font-extrabold text-purple-950">
                    {formatCurrency(rentalMode === 'daily' ? room.pricePerDay : room.pricePerHour)}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {rentalMode === 'daily' ? ' / ngày' : ' / giờ'}
                  </span>
                </div>
                <div className="rating text-xs shadow-sm">
                  <Star size={13} fill="currentColor" className="text-yellow-400" /> {room.rating}
                </div>
              </div>

              {/* Booking Inputs Box */}
              <div className="mt-4 rounded-2xl bg-white p-4 space-y-4 shadow-md shadow-pink-500/5">

                {rentalMode === 'daily' ? (
                  /* ── Daily Mode ── */
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase text-purple-900">Ngày nhận phòng</label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="mt-1 w-full rounded-xl border-0 bg-pink-50/50 p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase text-purple-900">Ngày trả phòng</label>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="mt-1 w-full rounded-xl border-0 bg-pink-50/50 p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-inner"
                      />
                    </div>
                  </div>
                ) : (
                  /* ── Hourly Mode ── */
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold uppercase text-purple-900">Ngày chụp</label>
                        <input
                          type="date"
                          value={checkInDate}
                          onChange={(e) => setCheckInDate(e.target.value)}
                          className="mt-1 w-full rounded-xl border-0 bg-pink-50/50 p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase text-purple-900">Giờ vào</label>
                        <input
                          type="time"
                          value={checkInTime}
                          onChange={(e) => setCheckInTime(e.target.value)}
                          className="mt-1 w-full rounded-xl border-0 bg-pink-50/50 p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Hours counter — direct input */}
                    <div>
                      <label className="text-[11px] font-bold uppercase text-purple-900">Số giờ thuê</label>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={hoursCount}
                        onChange={(e) => setHoursCount(Math.min(24, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="mt-1 w-full rounded-xl border-0 bg-pink-50/50 p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-inner"
                        placeholder="Nhập số giờ (tối đa 24)"
                      />
                    </div>
                  </div>
                )}

                {/* Guests (shared) — direct input */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-purple-900">Số người trong Ekip</label>
                  <input
                    type="number"
                    min={1}
                    value={guests}
                    onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
                    className="mt-1 w-full rounded-xl border-0 bg-pink-50/50 p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-inner"
                    placeholder="Nhập số người"
                  />
                </div>
              </div>

              {/* Cost Calculation */}
              <div className="mt-6 space-y-3 text-sm">
                {rentalMode === 'daily' ? (
                  <div className="flex justify-between text-muted-foreground font-medium">
                    <span>{formatCurrency(room.pricePerDay)} × {nights} ngày</span>
                    <span>{formatCurrency(room.pricePerDay * nights)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-muted-foreground font-medium">
                    <span>{formatCurrency(room.pricePerHour)} × {hoursCount} giờ</span>
                    <span>{formatCurrency(room.pricePerHour * hoursCount)}</span>
                  </div>
                )}

                <div className="flex justify-between pt-3 font-bold text-foreground text-base">
                  <span>Tổng tiền thuê</span>
                  <span className="text-pink-600 font-extrabold">{formatCurrency(grandTotal)}</span>
                </div>

                <div className="rounded-xl bg-pink-100/80 p-3 text-xs text-purple-950 shadow-xs">
                  <div className="font-bold flex items-center gap-1 text-pink-700">
                    <Sparkles size={14} /> Đặt cọc 30% giữ chỗ
                  </div>
                  <div className="mt-1 font-medium">
                    Chuyển khoản <b>{formatCurrency(deposit)}</b> qua VietQR để hoàn tất giữ lịch Studio.
                  </div>
                </div>
              </div>

              {/* Reserve Button */}
              <Link
                href={checkoutHref}
                className="primary-button mt-6 w-full justify-center text-base py-3.5 cursor-pointer shadow-xl"
              >
                {rentalMode === 'daily' ? 'Đặt lịch Studio theo ngày' : 'Đặt lịch Studio theo giờ'} <ArrowRight size={18} />
              </Link>
              <p className="mt-3 text-center text-xs text-muted-foreground font-medium">
                Xác nhận lịch ngay · Hỗ trợ đổi ca chụp
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

