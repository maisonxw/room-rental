'use client'

import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Star,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { BookingData, BookingStatus, PaymentSettings, Studio, defaultPaymentSettings, formatCurrency } from '@/lib/data'
import { createBookingInFirebase, getBookingsFromFirebase, getPaymentSettingsFromFirebase, getRoomsFromFirebase } from '@/lib/firebase-services'

type BookingStep = 'dates' | 'select' | 'details' | 'confirm'

const fallbackStudios: Studio[] = [
  {
    id: 'studio-light-room',
    name: 'Light Room Studio',
    type: 'Indoor Studio',
    address: 'Ba Dinh, Ha Noi',
    city: 'Ha Noi',
    price: 1200000,
    pricePerDay: 1200000,
    pricePerHour: 180000,
    rating: 4.9,
    reviewCount: 42,
    quantity: 1,
    guests: 8,
    bedrooms: 0,
    beds: 0,
    baths: 1,
    images: ['https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=1200&q=80'],
    tags: ['Đèn studio', 'Phông trắng', 'Makeup corner'],
    accent: '#111827',
    description: 'Phòng studio ánh sáng tự nhiên, hợp chụp lookbook và chân dung.',
    host: {
      name: 'ChupChoet Studio',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      isSuperhost: true,
      responseRate: '98%',
      joinedYear: '2023',
    },
    amenities: [],
    rules: [],
  },
  {
    id: 'studio-concept-room',
    name: 'Concept Room',
    type: 'Concept Studio',
    address: 'Dong Da, Ha Noi',
    city: 'Ha Noi',
    price: 1600000,
    pricePerDay: 1600000,
    pricePerHour: 220000,
    rating: 4.8,
    reviewCount: 36,
    quantity: 1,
    guests: 10,
    bedrooms: 0,
    beds: 0,
    baths: 1,
    images: ['https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80'],
    tags: ['Backdrop', 'Đạo cụ', 'Đèn Godox'],
    accent: '#111827',
    description: 'Không gian setup sẵn concept, có đạo cụ và hệ đèn cơ bản.',
    host: {
      name: 'ChupChoet Studio',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      isSuperhost: true,
      responseRate: '98%',
      joinedYear: '2023',
    },
    amenities: [],
    rules: [],
  },
]

const timeOptions = Array.from({ length: 14 }, (_, index) => {
  const hour = index + 8
  return `${hour.toString().padStart(2, '0')}:00`
})

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
})

const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const stepsConfig: { key: BookingStep; label: string; icon: LucideIcon }[] = [
  { key: 'dates', label: 'Chọn ngày', icon: CalendarDays },
  { key: 'select', label: 'Chọn phòng', icon: Camera },
  { key: 'details', label: 'Thông tin khách', icon: User },
  { key: 'confirm', label: 'Xác nhận', icon: CheckCircle2 },
]

const depositOptions = [
  { value: 'bank-transfer', label: 'Cọc CCCD +tài sản tương đương (Laptop, Macbook, xe máy,...)' },
  { value: 'cash', label: 'Cọc CCCD + 80% giá trị máy' },
  { value: 'contact', label: 'Cọc 100% giá trị máy' },
]

const blockingBookingStatuses = new Set<BookingStatus>(['da_xac_nhan', 'dang_thue', 'confirmed'])

function getHours(startTime: string, endTime: string) {
  if (!startTime || !endTime) return 0
  const start = Number(startTime.split(':')[0])
  const end = Number(endTime.split(':')[0])
  return Math.max(0, end - start)
}

function timeToMinutes(value?: string) {
  if (!value) return 0
  const [hours, minutes] = value.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

function rangesOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA
}

function formatDate(value: string) {
  if (!value) return 'Chưa chọn'
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value))
}

function toDateValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const start = new Date(firstDay)
  start.setDate(firstDay.getDate() - firstDay.getDay())

  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return {
      date,
      inCurrentMonth: date.getMonth() === month,
      value: toDateValue(date),
    }
  })
}

export default function HomePage() {
  const [allListings, setAllListings] = useState<Studio[]>([])
  const [bookingsList, setBookingsList] = useState<BookingData[]>([])
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(defaultPaymentSettings)
  const [selectedStudioId, setSelectedStudioId] = useState('')
  const [step, setStep] = useState<BookingStep>('dates')
  const [stepError, setStepError] = useState('')
  const [startDate, setStartDate] = useState('')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [timePickerOpen, setTimePickerOpen] = useState<'start' | 'end' | null>(null)
  const [visibleMonth, setVisibleMonth] = useState(() => new Date())
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('12:00')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [note, setNote] = useState('')
  const [depositMethod, setDepositMethod] = useState('bank-transfer')
  const [depositPickerOpen, setDepositPickerOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    Promise.all([getRoomsFromFirebase(), getPaymentSettingsFromFirebase(), getBookingsFromFirebase()])
      .then(([rooms, settings, bookings]) => {
        if (!active) return
        setAllListings(rooms.length > 0 ? rooms : fallbackStudios)
        setPaymentSettings(settings)
        setBookingsList(bookings)
      })
      .catch(() => {
        if (active) setAllListings(fallbackStudios)
      })

    return () => {
      active = false
    }
  }, [])

  const listings = allListings.length > 0 ? allListings : fallbackStudios
  const selectedStudio = listings.find((item) => item.id === selectedStudioId) ?? null

  const rentalQuantity = getHours(startTime, endTime)
  const unitPrice = selectedStudio ? selectedStudio.pricePerHour : 0
  const totalPrice = unitPrice * Math.max(1, rentalQuantity)
  const depositPrice = Math.round(totalPrice * 0.3)
  const phoneValid = customerPhone === '' || /^[0-9]{9,11}$/.test(customerPhone)
  const selectedDepositLabel = depositOptions.find((option) => option.value === depositMethod)?.label ?? depositOptions[0].label
  const transferContent = `${paymentSettings.noteSyntax} ${customerPhone || 'SDT'}`

  function doesBookingOverlapSelection(booking: BookingData) {
    if (!startDate || booking.checkIn !== startDate) return false

    if (booking.rentalType === 'daily') return true

    const selectedStart = timeToMinutes(startTime)
    const selectedEnd = timeToMinutes(endTime)
    const bookingStart = timeToMinutes(booking.checkInTime || '00:00')
    const bookingEnd = booking.checkOutTime
      ? timeToMinutes(booking.checkOutTime)
      : bookingStart + Math.max(1, Number(booking.hoursCount || 1)) * 60

    return rangesOverlap(selectedStart, selectedEnd, bookingStart, bookingEnd)
  }

  function getAvailableQuantity(studio: Studio) {
    const totalQuantity = Math.max(1, Number(studio.quantity || 1))
    const blockedCount = bookingsList.filter((booking) => (
      booking.studioId === studio.id &&
      blockingBookingStatuses.has(booking.status) &&
      doesBookingOverlapSelection(booking)
    )).length

    return Math.max(0, totalQuantity - blockedCount)
  }

  function goToStep(nextStep: BookingStep) {
    const currentIndex = stepsConfig.findIndex((item) => item.key === step)
    const nextIndex = stepsConfig.findIndex((item) => item.key === nextStep)

    if (nextIndex <= currentIndex || canEnterStep(nextStep)) {
      setStepError('')
      setStep(nextStep)
      document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    setStepError('Vui lòng hoàn tất bước hiện tại trước khi tiếp tục.')
  }

  function canEnterStep(nextStep: BookingStep) {
    if (nextStep === 'dates') return true
    if (nextStep === 'select') return isDateStepValid()
    if (nextStep === 'details') return isDateStepValid() && Boolean(selectedStudio)
    return isDateStepValid() && Boolean(selectedStudio) && isDetailsValid()
  }

  function isDateStepValid() {
    if (!startDate) return false
    return getHours(startTime, endTime) > 0
  }

  function isDetailsValid() {
    return Boolean(customerName && customerPhone && customerEmail && depositMethod && phoneValid)
  }

  async function handleCustomerBookingSubmit() {
    if (!selectedStudio || submitting) return

    if (getAvailableQuantity(selectedStudio) <= 0) {
      setStepError('PhÃ²ng nÃ y vá»«a háº¿t lá»‹ch trong khung giá» báº¡n chá»n. Vui lÃ²ng chá»n phÃ²ng hoáº·c khá»ung giá» khÃ¡c.')
      setStep('select')
      return
    }

    setSubmitting(true)

    const bookingCode = `CHUP-${Math.floor(100000 + Math.random() * 900000)}`
    const bookingData: Omit<BookingData, 'id'> = {
      code: bookingCode,
      studioId: selectedStudio.id,
      studioName: selectedStudio.name,
      studioImage: selectedStudio.images?.[0] || '',
      studioAddress: selectedStudio.address,
      customerName,
      customerPhone,
      customerEmail,
      specialRequests: note,
      rentalType: 'hourly',
      checkIn: startDate,
      checkOut: '',
      checkInTime: startTime,
      checkOutTime: endTime,
      hoursCount: rentalQuantity,
      nights: 0,
      guests: 1,
      totalPrice,
      depositPrice,
      status: 'chua_xac_nhan',
      createdAt: new Date().toISOString(),
    }

    try {
      const bookingId = await createBookingInFirebase(bookingData)
      setBookingsList((prev) => [{ id: bookingId, ...bookingData }, ...prev])
      setSubmitted(true)
      setStepError('')
    } catch (error) {
      console.error('Error creating customer booking:', error)
      setStepError('KhÃ´ng thá»ƒ gá»­i yÃªu cáº§u thuÃª phÃ²ng. Vui lÃ²ng thá»­ láº¡i.')
    } finally {
      setSubmitting(false)
    }
  }

  function shiftVisibleMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1">
        <section className="border-b border-white/30 bg-white/35 backdrop-blur-2xl">
          <div className="mx-auto max-w-7xl px-5 py-12 text-center lg:px-8">
            <div className="eyebrow dark justify-center">studio booking</div>
            <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-extrabold tracking-tight text-fuchsia-950 md:text-6xl">
              Thuê phòng chụp ảnh theo luồng đặt lịch rõ ràng.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-fuchsia-950/70 md:text-lg">
              Ghi lại khoảnh khắc theo cách của bạn! Trải nghiệm dịch vụ thuê phòng chuyên nghiệp.

            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                className="primary-button"
                onClick={() => document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                Đặt thuê ngay
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => document.getElementById('studio-story')?.scrollIntoView({ behavior: 'smooth', block: 'end' })}
              >
                Tìm hiểu thêm
              </button>
            </div>
          </div>
        </section>

        <section id="booking-section" className="mx-auto max-w-6xl px-5 pb-28 pt-10 lg:px-8">
          <div className="booking-steps-panel">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {stepsConfig.map((stepItem, index) => {
                const Icon = stepItem.icon
                const activeIndex = stepsConfig.findIndex((item) => item.key === step)
                const isActive = step === stepItem.key
                const isCompleted = activeIndex > index

                return (
                  <button
                    key={stepItem.key}
                    type="button"
                    onClick={() => goToStep(stepItem.key)}
                    className="booking-step-button"
                  >
                    <span
                      className={`booking-step-circle ${isActive
                        ? 'active'
                        : isCompleted
                          ? 'completed'
                          : ''
                        }`}
                    >
                      {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                    </span>
                    <span className={`text-sm font-medium ${isActive ? 'text-pink-600' : 'text-fuchsia-950'}`}>
                      {stepItem.label}
                    </span>
                  </button>
                )
              })}
            </div>
            {stepError && <p className="mt-4 text-center text-sm font-medium text-rose-600">{stepError}</p>}
          </div>

          <div className="mt-6">
            {step === 'dates' && (
              <div className={`date-booking-card mx-auto ${calendarOpen || timePickerOpen ? 'calendar-open' : ''}`}>
                <div className="text-center">
                  <h2 className="text-base font-bold text-fuchsia-950">Chọn ngày nhận và thời gian thuê phòng</h2>
                </div>

                <div className="booking-legend">
                  <span><i className="bg-pink-500" /> Ngày nhận phòng</span>
                  <span><i className="bg-slate-300" /> Không khả dụng</span>
                </div>

                <div className="date-time-grid">
                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-fuchsia-950/65">Ngày nhận</div>
                    <div className="date-picker-wrap">
                      <button
                        type="button"
                        className="pill-field"
                        onClick={() => {
                          setTimePickerOpen(null)
                          setCalendarOpen((open) => !open)
                        }}
                      >
                        <CalendarDays size={16} />
                        <span>{startDate ? formatDate(startDate) : 'Ngày nhận'}</span>
                      </button>

                      {calendarOpen && (
                        <div className="soft-calendar-popover">
                          <div className="soft-calendar-head">
                            <button type="button" onClick={() => shiftVisibleMonth(-1)} aria-label="Tháng trước">
                              <ChevronLeft size={16} />
                            </button>
                            <strong>{monthFormatter.format(visibleMonth)}</strong>
                            <button type="button" onClick={() => shiftVisibleMonth(1)} aria-label="Tháng sau">
                              <ChevronRight size={16} />
                            </button>
                          </div>

                          <div className="soft-calendar-weekdays">
                            {weekdayLabels.map((day) => (
                              <span key={day}>{day}</span>
                            ))}
                          </div>

                          <div className="soft-calendar-grid">
                            {getCalendarDays(visibleMonth).map((day) => (
                              <button
                                key={day.value}
                                type="button"
                                className={`${day.inCurrentMonth ? '' : 'muted'} ${startDate === day.value ? 'selected' : ''}`}
                                onClick={() => {
                                  setStartDate(day.value)
                                  setCalendarOpen(false)
                                  setStepError('')
                                }}
                              >
                                {day.date.getDate()}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-fuchsia-950/65">Giờ nhận</div>
                    <div className="date-picker-wrap">
                      <button
                        type="button"
                        className="pill-field"
                        onClick={() => {
                          setCalendarOpen(false)
                          setTimePickerOpen((open) => (open === 'start' ? null : 'start'))
                        }}
                      >
                        <Clock size={16} />
                        <span>{startTime || 'Giờ nhận'}</span>
                        <ChevronDown size={14} className="pill-chevron" />
                      </button>

                      {timePickerOpen === 'start' && (
                        <div className="soft-time-popover">
                          {timeOptions.slice(0, -1).map((time) => (
                            <button
                              key={time}
                              type="button"
                              className={startTime === time ? 'selected' : ''}
                              onClick={() => {
                                setStartTime(time)
                                if (endTime <= time) {
                                  const nextEndTime = timeOptions.find((option) => option > time) ?? timeOptions[timeOptions.length - 1]
                                  setEndTime(nextEndTime)
                                }
                                setTimePickerOpen(null)
                                setStepError('')
                              }}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-fuchsia-950/65">Giờ trả</div>
                    <div className="date-picker-wrap">
                      <button
                        type="button"
                        className="pill-field"
                        onClick={() => {
                          setCalendarOpen(false)
                          setTimePickerOpen((open) => (open === 'end' ? null : 'end'))
                        }}
                      >
                        <Clock size={16} />
                        <span>{endTime || 'Giờ trả'}</span>
                        <ChevronDown size={14} className="pill-chevron" />
                      </button>

                      {timePickerOpen === 'end' && (
                        <div className="soft-time-popover">
                          {timeOptions.slice(1).map((time) => (
                            <button
                              key={time}
                              type="button"
                              className={endTime === time ? 'selected' : ''}
                              disabled={time <= startTime}
                              onClick={() => {
                                setEndTime(time)
                                setTimePickerOpen(null)
                                setStepError('')
                              }}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-3">
                  <button type="button" className="back-pill">
                    Quay lại
                  </button>
                  <button
                    type="button"
                    className="continue-pill"
                    onClick={() => {
                      if (!isDateStepValid()) {
                        setStepError('Vui lòng chọn đủ ngày và giờ thuê hợp lệ.')
                        return
                      }
                      goToStep('select')
                    }}
                  >
                    Tiếp tục
                  </button>
                </div>
              </div>
            )}

            {step === 'select' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-fuchsia-950">Chọn phòng studio</h2>
                  <p className="mt-1 text-sm text-fuchsia-950/60">Chọn không gian phù hợp với buổi chụp của bạn.</p>
                </div>

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {listings.map((item) => {
                    const availableQuantity = getAvailableQuantity(item)
                    const isUnavailable = availableQuantity <= 0

                    return (
                      <article key={item.id} className={`listing-card group ${selectedStudioId === item.id ? 'selected' : ''} ${isUnavailable ? 'opacity-60' : ''}`}>
                        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-white/35">
                          <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                          <div className="rating absolute bottom-3 left-3">
                            <Star size={12} fill="currentColor" className="text-yellow-400" />
                            {item.rating} <span>({item.reviewCount})</span>
                          </div>
                          <div className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${isUnavailable ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {isUnavailable ? 'Hết phòng' : `Còn ${availableQuantity} phòng`}
                          </div>
                        </div>
                        <div className="pt-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-xl font-bold text-fuchsia-950">{item.name}</h3>
                              <p className="mt-1 flex items-center gap-1 text-sm text-fuchsia-950/60">
                                <MapPin size={14} />
                                {item.address}
                              </p>
                            </div>
                            <Camera className="mt-1 h-5 w-5 text-pink-500" />
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                            <div className="rounded-xl bg-white/45 p-3 text-center">
                              <div className="text-[10px] font-bold uppercase text-pink-600">Giá thuê</div>
                              <strong className="mt-1 block text-fuchsia-950">{formatCurrency(item.pricePerHour)}</strong>
                            </div>
                            <div className="rounded-xl border border-white/45 bg-white/55 p-3 text-center">
                              <div className="text-[10px] font-bold uppercase text-purple-500">Sức chứa</div>
                              <strong className="mt-1 block text-fuchsia-950">{item.guests} người</strong>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-1 text-xs text-fuchsia-950/60">
                            <span className="flex items-center gap-1"><Users size={13} /> Tối đa {item.guests} người</span>
                            <span>Tổng số lượng: {item.quantity ?? 1} phòng</span>
                          </div>

                          <button
                            type="button"
                            disabled={isUnavailable}
                            className="primary-button mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => {
                              if (isUnavailable) {
                                setStepError('Phòng này đã kín lịch trong khung giờ bạn chọn.')
                                return
                              }

                              setSelectedStudioId(item.id)
                              setStepError('')
                              setStep('details')
                              document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }}
                          >
                            {isUnavailable ? 'Hết phòng trong khung giờ này' : 'Chọn thuê phòng này'}
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>

                {listings.length === 0 && (
                  <div className="rounded-2xl border border-white/40 bg-white/45 p-8 text-center backdrop-blur-2xl">
                    <p className="font-semibold text-fuchsia-950">Chưa có phòng studio để hiển thị.</p>
                  </div>
                )}
              </div>
            )}

            {step === 'details' && (

              <div className="booking-card mx-auto max-w-3xl">

                <div>
                  <h2 className="text-2xl font-bold text-fuchsia-950">Thông tin khách hàng</h2>
                  <p className="mt-1 text-sm text-fuchsia-950/60">Vui lòng điền đầy đủ thông tin để hoàn tất đặt thuê.</p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <label className="form-field">
                    <span>Họ và tên *</span>
                    <input
                      id="name"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="Nhập họ và tên"
                    />
                  </label>

                  <label className="form-field">
                    <span>Số điện thoại *</span>
                    <input
                      id="phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(event.target.value)}
                      placeholder="Nhập số điện thoại"
                    />
                    {!phoneValid && <small className="text-sm font-medium text-rose-600">Số điện thoại phải có từ 9-11 chữ số.</small>}
                  </label>

                  <label className="form-field sm:col-span-2">
                    <span className="instagram-warning">Tài khoản Instagram *</span>
                    <input
                      id="instagram"
                      type="text"
                      value={customerEmail}
                      onChange={(event) => setCustomerEmail(event.target.value)}
                      placeholder="Nhập tài khoản instagram"
                      className="border-red-400"
                    />
                  </label>
                  <label className="form-field sm:col-span-2">
                    <span>Ghi chú</span>
                    <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Concept, nhu cầu đèn, phông nền..." rows={3} />
                  </label>
                  <div className="form-field sm:col-span-2">
                    <span>Phương thức cọc phòng *</span>
                    <div className="soft-select-wrap">
                      <button
                        type="button"
                        className="soft-select-trigger"
                        aria-expanded={depositPickerOpen}
                        onClick={() => setDepositPickerOpen((open) => !open)}
                      >
                        <span>{selectedDepositLabel}</span>
                        <ChevronDown size={18} />
                      </button>

                      {depositPickerOpen && (
                        <div className="soft-select-popover">
                          {depositOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={depositMethod === option.value ? 'selected' : ''}
                              onClick={() => {
                                setDepositMethod(option.value)
                                setDepositPickerOpen(false)
                                setStepError('')
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="button" className="secondary-button" onClick={() => goToStep('select')}>
                    Quay lại
                  </button>
                  <button
                    type="button"
                    className="primary-button flex-1"
                    onClick={() => {
                      if (!isDetailsValid()) {
                        setStepError('Vui lòng nhập đủ thông tin khách hàng hợp lệ.')
                        return
                      }
                      goToStep('confirm')
                    }}
                  >
                    Xem lại đơn hàng
                  </button>
                </div>
              </div>
            )}

            {step === 'confirm' && selectedStudio && (
              <div className="booking-card mx-auto max-w-4xl">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-fuchsia-950">Xác nhận đặt thuê</h2>
                  <p className="bill-warning mt-1 text-sm font-semibold text-rose-600">Vui lòng gửi bill chuyển khoản cho Fanpage hoặc Instagram sau khi đặt cọc để studio xác nhận đơn.</p>
                </div>

                <div className="grid gap-5 md:grid-cols-[1fr_320px]">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/45 bg-white/35 p-4">
                      <Camera className="h-8 w-8 text-pink-500" />
                      <div>
                        <h3 className="font-bold text-fuchsia-950">{selectedStudio.name}</h3>
                        <p className="text-sm text-fuchsia-950/60">{selectedStudio.address}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/45 p-4">
                        <div className="flex items-center gap-2 font-semibold text-fuchsia-950"><CalendarDays size={16} /> Thời gian thuê</div>
                        <p className="mt-2 text-fuchsia-950/65">
                          {formatDate(startDate)}, {startTime} - {endTime}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/45 p-4">
                        <div className="flex items-center gap-2 font-semibold text-fuchsia-950"><Clock size={16} /> Hình thức</div>
                        <p className="mt-2 text-fuchsia-950/65">{rentalQuantity} giờ</p>
                      </div>
                      <div className="rounded-2xl bg-white/45 p-4">
                        <div className="flex items-center gap-2 font-semibold text-fuchsia-950"><User size={16} /> Khách hàng</div>
                        <p className="mt-2 text-fuchsia-950/65">{customerName}</p>
                        <p className="text-fuchsia-950/65">{customerPhone}</p>
                        <p className="text-fuchsia-950/65">{customerEmail}</p>
                      </div>
                      <div className="rounded-2xl bg-white/45 p-4">
                        <div className="flex items-center gap-2 font-semibold text-fuchsia-950"><CreditCard size={16} /> Cọc phòng</div>
                        <p className="mt-2 text-fuchsia-950/65">{selectedDepositLabel}</p>
                      </div>
                    </div>

                    {note && (
                      <div className="rounded-2xl border border-white/45 bg-white/35 p-4 text-sm">
                        <div className="font-semibold text-fuchsia-950">Ghi chú</div>
                        <p className="mt-2 text-fuchsia-950/65">{note}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/45 bg-white/45 p-5">
                      <h3 className="font-bold text-fuchsia-950">Tổng thanh toán</h3>
                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex justify-between gap-4">
                          <span className="text-fuchsia-950/60">Đơn giá</span>
                          <strong>{formatCurrency(unitPrice)}</strong>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-fuchsia-950/60">Thời lượng</span>
                          <strong>{rentalQuantity} giờ</strong>
                        </div>
                        <div className="border-t border-white/50 pt-3">
                          <div className="flex justify-between gap-4">
                            <span className="text-fuchsia-950/60">Tạm tính</span>
                            <strong>{formatCurrency(totalPrice)}</strong>
                          </div>
                        </div>
                        <div className="flex justify-between gap-4 text-base">
                          <span className="font-bold text-pink-700">Đặt cọc 30%</span>
                          <strong className="text-pink-700">{formatCurrency(depositPrice)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-pink-100/70 bg-white/60 p-5 text-sm shadow-sm">
                      <div className="flex items-center gap-2 font-bold text-fuchsia-950">
                        <CreditCard size={16} /> Thông tin chuyển khoản
                      </div>
                      <div className="mt-4 flex flex-col items-center gap-3">
                        <div className="grid h-32 w-32 place-items-center overflow-hidden rounded-2xl border border-pink-100 bg-white text-center text-xs font-bold italic text-fuchsia-950/50 shadow-sm">
                          {paymentSettings.qrImage ? (
                            <img src={paymentSettings.qrImage} alt="Mã QR thanh toán" className="h-full w-full object-cover" />
                          ) : (
                            'Chưa có ảnh QR'
                          )}
                        </div>
                        <div className="w-full space-y-2 rounded-2xl bg-white/60 p-3">
                          <div className="flex justify-between gap-3">
                            <span className="text-fuchsia-950/60">Ngân hàng</span>
                            <strong className="text-right">{paymentSettings.bankName}</strong>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-fuchsia-950/60">Số TK</span>
                            <strong className="font-mono text-right">{paymentSettings.accountNumber}</strong>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-fuchsia-950/60">Chủ TK</span>
                            <strong className="text-right">{paymentSettings.accountHolder}</strong>
                          </div>
                          <div className="border-t border-pink-100 pt-2">
                            <span className="text-fuchsia-950/60">Nội dung CK</span>
                            <div className="mt-1 rounded-xl bg-pink-50 px-3 py-2 font-mono font-bold text-pink-700">{transferContent}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="button" className="secondary-button" onClick={() => goToStep('details')}>
                    Quay lại
                  </button>
                  <button
                    type="button"
                    className="primary-button flex-1"
                    disabled={submitting}
                    onClick={handleCustomerBookingSubmit}
                  >
                    {submitting ? 'Đang gửi...' : 'Gửi yêu cầu thuê phòng'}
                  </button>
                </div>

                {submitted && (
                  <div className="rounded-2xl border border-emerald-300/60 bg-emerald-50/80 p-4 text-sm font-medium text-emerald-800">
                    Đã ghi nhận yêu cầu. Studio sẽ liên hệ xác nhận lịch và thông tin đặt cọc.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>


        <section id="studio-story" className="mx-auto max-w-6xl px-5 pb-24 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/55 p-7 shadow-[0_24px_80px_rgba(236,72,153,0.12)] backdrop-blur-2xl md:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div className="min-h-[260px] overflow-hidden rounded-3xl bg-[url('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85')] bg-cover bg-center shadow-2xl shadow-pink-500/10" />
              <div>
                <span className="eyebrow dark">câu chuyện studio</span>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-fuchsia-950 md:text-4xl">Một căn phòng nhỏ, nhưng đủ sáng cho rất nhiều câu chuyện</h2>
                <div className="mt-5 space-y-4 text-sm leading-7 text-fuchsia-950/70 md:text-base">
                  <p>
                    Có những buổi chụp bắt đầu rất nhẹ: một chiếc váy vừa ủi xong, vài món phụ kiện để trong túi vải, và một người vẫn còn hơi ngại khi đứng trước ống kính. Rồi ánh đèn bật lên, background được kéo xuống, bài nhạc quen vang nhẹ trong phòng. Mọi thứ tự nhiên chậm lại đúng một nhịp.
                  </p>
                  <p>
                    ChupChoet thích những khoảnh khắc như vậy. Studio không chỉ là nơi đặt máy và bấm chụp; đó là khoảng riêng để bạn thử một phiên bản khác của mình: tự tin hơn, mềm mại hơn, hoặc đơn giản là thật hơn. Một tấm ảnh đẹp đôi khi không cần quá nhiều đạo cụ, chỉ cần đúng ánh sáng và đúng cảm giác.
                  </p>
                  <p>
                    Vì vậy tụi mình chuẩn bị phòng, ánh sáng và quy trình đặt lịch thật rõ ràng để khi bạn bước vào, phần khó nhất chỉ còn là chọn dáng nào khiến bạn thấy mình xinh nhất hôm nay.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {submitted && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-purple-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white shadow-lg shadow-pink-500/25">
              <Check size={30} />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-fuchsia-950">Cảm ơn bạn đã đặt thuê phòng!</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-fuchsia-950/65">
              ChupChoet đã nhận được yêu cầu của bạn rồi nha. Studio sẽ liên hệ xác nhận lịch và thông tin đặt cọc sớm nhất có thể.
            </p>
            <div className="mt-5 rounded-2xl bg-pink-50 px-4 py-3 text-sm font-bold text-pink-700">
              Hẹn gặp bạn trong buổi chụp thật xinh!
            </div>
            <button type="button" className="primary-button mt-5 w-full justify-center" onClick={() => window.location.href = '/'}>
              Đóng
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
