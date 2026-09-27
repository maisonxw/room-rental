'use client'

import { use, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  CreditCard,
  Lock,
  MapPin,
  Moon,
  QrCode,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
  Camera,
} from 'lucide-react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Studio, formatCurrency } from '@/lib/data'
import { createBookingInFirebase, getRoomByIdFromFirebase } from '@/lib/firebase-services'
import { DEFAULT_STUDIO_IMAGE } from '@/lib/data'

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [room, setRoom] = useState<Studio | null>(null)

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

  // Read rental type from URL
  const rentalType = (searchParams.get('rentalType') || 'hourly') as 'daily' | 'hourly'

  // Daily params
  const checkIn = searchParams.get('checkIn') || '2026-09-18'
  const checkOut = searchParams.get('checkOut') || '2026-09-20'
  const nights = parseInt(searchParams.get('nights') || '1', 10)

  // Hourly params
  const checkInDate = searchParams.get('checkIn') || '2026-09-18'
  const checkInTime = searchParams.get('checkInTime') || '10:00'
  const hoursCount = parseInt(searchParams.get('hours') || '4', 10)

  // Shared
  const guests = parseInt(searchParams.get('guests') || '4', 10)

  // Price calculations
  const baseTotal = rentalType === 'daily'
    ? (room?.pricePerDay || 1200000) * nights
    : (room?.pricePerHour || 150000) * hoursCount
  const grandTotal = baseTotal
  const depositAmount = grandTotal * 0.3

  // Form states
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'deposit' | 'full'>('deposit')
  const [loading, setLoading] = useState(false)

  if (!room) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="my-20 text-center">
          <h1 className="font-serif text-3xl text-purple-950">Không tìm thấy Studio</h1>
          <Link href="/" className="primary-button mt-4">
            Quay lại trang chủ
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!room) return

    setLoading(true)

    const bookingCode = `CHUP-${Math.floor(100000 + Math.random() * 900000)}`

    const bookingData: any = {
      code: bookingCode,
      studioId: room.id,
      studioName: room.name,
      studioImage: room.images?.[0] || DEFAULT_STUDIO_IMAGE,
      studioAddress: room.address,
      customerName,
      customerPhone,
      customerEmail,
      specialRequests,
      rentalType,
      checkIn: rentalType === 'daily' ? checkIn : checkInDate,
      checkOut: rentalType === 'daily' ? checkOut : '',
      checkInTime: rentalType === 'hourly' ? checkInTime : '',
      hoursCount: rentalType === 'hourly' ? hoursCount : 0,
      nights: rentalType === 'daily' ? nights : 0,
      guests,
      totalPrice: grandTotal,
      depositPrice: depositAmount,
      status: paymentMethod === 'deposit' ? 'deposit_paid' : 'confirmed',
      createdAt: new Date().toISOString(),
    }

    try {
      await createBookingInFirebase(bookingData)
      setTimeout(() => {
        router.push(`/booking/success/${bookingCode}`)
      }, 800)
    } catch (error) {
      console.error('Error creating booking in Firestore:', error)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 pb-20">
        {/* Navigation Breadcrumb */}
        <div className="mx-auto max-w-7xl px-5 pt-6 lg:px-8">
          <Link
            href={`/rooms/${room.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-pink-600 transition hover:text-purple-700"
          >
            <ChevronLeft size={16} /> Quay lại {room.name}
          </Link>
        </div>

        <section className="mx-auto max-w-7xl px-5 pt-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow ${rentalType === 'daily'
                  ? 'bg-purple-900 text-white'
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                }`}
            >
              {rentalType === 'daily' ? <Moon size={13} /> : <Timer size={13} />}
              {rentalType === 'daily' ? 'Thuê trọn ngày' : 'Thuê theo giờ'}
            </div>
          </div>
          <h1 className="mt-3 font-serif text-4xl text-purple-950 font-bold">Xác nhận đơn đặt Studio</h1>
          <p className="mt-2 text-sm text-muted-foreground font-medium">
            Điền thông tin Ekip và chuyển khoản đặt cọc 30% qua VietQR để giữ lịch Studio.
          </p>
        </section>

        <section className="mx-auto mt-8 grid max-w-7xl gap-10 px-5 lg:grid-cols-[1.3fr_1fr] lg:px-8">
          {/* Left Column: Form & VietQR Box */}
          <form onSubmit={handleBookingSubmit} className="space-y-8">
            {/* Step 1: Customer Details */}
            <div className="rounded-3xl border border-pink-200/60 bg-white/90 p-6 md:p-8 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-serif text-sm font-bold">
                  1
                </span>
                <h2 className="font-serif text-2xl text-purple-950 font-bold">Thông tin Ekip / Khách hàng</h2>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold uppercase text-purple-900">Họ và Tên *</label>
                  <input
                    required
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-pink-200 bg-pink-50/30 p-3 text-sm font-medium focus:outline-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-purple-900">Số Điện Thoại / Zalo *</label>
                  <input
                    required
                    type="tel"
                    placeholder="0912 345 678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-pink-200 bg-pink-50/30 p-3 text-sm font-medium focus:outline-pink-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase text-purple-900">Email nhận xác nhận *</label>
                  <input
                    required
                    type="email"
                    placeholder="ekip@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-pink-200 bg-pink-50/30 p-3 text-sm font-medium focus:outline-pink-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase text-purple-900">
                    Ghi chú thêm / Yêu cầu bối cảnh special
                  </label>
                  <textarea
                    rows={2}
                    placeholder="VD: Cần setup sẵn phông giấy hồng, đến sớm 15p chuẩn bị makeup..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-pink-200 bg-pink-50/30 p-3 text-sm font-medium focus:outline-pink-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="rounded-3xl border border-pink-200/60 bg-white/90 p-6 md:p-8 shadow-sm backdrop-blur-md space-y-6">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-serif text-sm font-bold">
                  2
                </span>
                <h2 className="font-serif text-2xl text-purple-950 font-bold">Hình thức thanh toán</h2>
              </div>

              <div className="space-y-3">
                <label
                  onClick={() => setPaymentMethod('deposit')}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${paymentMethod === 'deposit'
                      ? 'border-pink-500 bg-pink-50/70 ring-1 ring-pink-500'
                      : 'border-pink-200/60 bg-white/50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <QrCode className="text-pink-600" size={22} />
                    <div>
                      <div className="font-bold text-sm text-foreground">Đặt cọc 30% qua VietQR (Khuyên dùng)</div>
                      <div className="text-xs text-muted-foreground font-medium">
                        Chuyển trước {formatCurrency(depositAmount)} để khoá lịch Studio ngay lập tức.
                      </div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'deposit'}
                    onChange={() => setPaymentMethod('deposit')}
                    className="accent-pink-600"
                  />
                </label>

                <label
                  onClick={() => setPaymentMethod('full')}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${paymentMethod === 'full'
                      ? 'border-purple-500 bg-purple-50/70 ring-1 ring-purple-500'
                      : 'border-pink-200/60 bg-white/50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="text-purple-600" size={22} />
                    <div>
                      <div className="font-bold text-sm text-foreground">Thanh toán 100% trọn gói</div>
                      <div className="text-xs text-muted-foreground font-medium">
                        Chuyển toàn bộ số tiền {formatCurrency(grandTotal)} cho buổi chụp.
                      </div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'full'}
                    onChange={() => setPaymentMethod('full')}
                    className="accent-purple-600"
                  />
                </label>
              </div>

              {/* VietQR Bank Transfer Box */}
              <div className="mt-4 rounded-2xl border border-pink-300/50 bg-gradient-to-br from-pink-50/80 to-purple-50/80 p-5 shadow-inner">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Simulated VietQR graphic */}
                  <div className="flex flex-col items-center bg-white p-4 rounded-2xl border border-pink-200 shadow-md">
                    <div className="flex h-36 w-36 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-700 text-white font-mono text-xs text-center p-3 shadow-inner">
                      <div>
                        <div className="font-extrabold text-lg">VietQR</div>
                        <div className="mt-1 text-[10px] text-white/90">MBBANK</div>
                        <div className="mt-2 text-[10px] text-yellow-300 font-bold">
                          {formatCurrency(paymentMethod === 'deposit' ? depositAmount : grandTotal)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] text-center text-muted-foreground font-mono font-bold">
                      Quét mã bằng App Ngân Hàng
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-foreground flex-1">
                    <div className="font-bold text-sm text-purple-950 flex items-center gap-1.5">
                      <Sparkles size={15} className="text-pink-600" /> Thông tin tài khoản chupchoet.room
                    </div>
                    <div>
                      Ngân hàng: <b className="text-purple-950">MBBank (Ngân hàng Quân Đội)</b>
                    </div>
                    <div>
                      Số tài khoản: <b className="text-purple-950">0369 399 740</b>
                    </div>
                    <div>
                      Chủ tài khoản: <b className="text-purple-950">CHUPCHOET ROOM STUDIO</b>
                    </div>
                    <div>
                      Số tiền chuyển:{' '}
                      <b className="text-pink-600 font-extrabold text-sm">
                        {formatCurrency(paymentMethod === 'deposit' ? depositAmount : grandTotal)}
                      </b>
                    </div>
                    <div className="rounded-lg bg-pink-100/90 p-2.5 text-[11px] text-purple-950 border border-pink-200">
                      Nội dung chuyển khoản:{' '}
                      <b className="font-mono bg-white px-2 py-0.5 rounded text-pink-600 font-bold">
                        CHUPCHOET {customerPhone || 'SDT'}
                      </b>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Action */}
            <button
              type="submit"
              disabled={loading}
              className="primary-button w-full justify-center text-base py-4 shadow-xl cursor-pointer"
            >
              {loading ? 'Đang gửi yêu cầu đặt Studio...' : 'Xác nhận & Gửi yêu cầu đặt Studio'} <ArrowRight size={18} />
            </button>
          </form>

          {/* Right Column: Order Summary Card */}
          <div>
            <div className="sticky top-24 rounded-3xl border border-pink-200/60 bg-white/95 p-6 shadow-sm backdrop-blur-md">
              <h2 className="font-serif text-2xl text-purple-950 font-bold border-b border-pink-200/50 pb-4">
                Tóm tắt đơn đặt
              </h2>

              <div className="mt-5 flex gap-4">
                <img
                  src={room.images?.[0] || DEFAULT_STUDIO_IMAGE}
                  alt={room.name}
                  className="h-20 w-24 rounded-xl object-cover border border-pink-200"
                />
                <div>
                  <span className="text-[11px] font-bold uppercase text-pink-600">{room.type}</span>
                  <h3 className="font-serif text-lg font-bold leading-snug">{room.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground font-medium">
                    <MapPin size={12} className="text-pink-500" /> {room.city}
                  </p>
                </div>
              </div>

              {/* Booking Detail Summary */}
              <div className="mt-6 space-y-3 border-t border-b border-pink-200/50 py-4 text-xs font-medium">
                {rentalType === 'daily' ? (
                  <>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-pink-500" /> Ngày nhận phòng
                      </span>
                      <span className="font-bold text-foreground">{checkIn}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-pink-500" /> Ngày trả phòng
                      </span>
                      <span className="font-bold text-foreground">{checkOut}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Moon size={14} className="text-purple-600" /> Số ngày
                      </span>
                      <span className="font-bold text-foreground">{nights} ngày</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-pink-500" /> Ngày chụp
                      </span>
                      <span className="font-bold text-foreground">{checkInDate}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-pink-500" /> Giờ vào
                      </span>
                      <span className="font-bold text-foreground">{checkInTime}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Timer size={14} className="text-purple-600" /> Số giờ thuê
                      </span>
                      <span className="font-bold text-foreground">{hoursCount} giờ</span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users size={14} className="text-pink-500" /> Ekip / Khách
                  </span>
                  <span className="font-bold text-foreground">{guests} Người</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="mt-4 space-y-2.5 text-xs font-medium">
                {rentalType === 'daily' ? (
                  <div className="flex justify-between text-muted-foreground">
                    <span>{formatCurrency(room.pricePerDay)} × {nights} ngày</span>
                    <span>{formatCurrency(room.pricePerDay * nights)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-muted-foreground">
                    <span>{formatCurrency(room.pricePerHour)} × {hoursCount} giờ</span>
                    <span>{formatCurrency(room.pricePerHour * hoursCount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-pink-200/50 pt-3 text-sm font-extrabold text-purple-950">
                  <span>Tổng tiền thuê</span>
                  <span className="text-pink-600">{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-pink-300 pt-2 text-xs font-bold text-purple-900">
                  <span>Đặt cọc ngay (30%)</span>
                  <span className="text-pink-600">{formatCurrency(depositAmount)}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground font-semibold">
                <Lock size={14} className="text-pink-500" /> Bảo mật thông tin đơn hàng 100%
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

