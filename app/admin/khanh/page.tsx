'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  Box,
  Calendar,
  CheckCircle,
  Clock,
  Home,
  LogOut,
  Plus,
  QrCode,
  Settings,
  ShieldCheck,
  TrendingUp,
  User,
  X,
  Camera,
  Layers,
  ChevronDown,
  Trash2,
  Edit,
  Building,
  TriangleAlert,
  Upload,
} from 'lucide-react'
import {
  Studio,
  BookingData,
  BookingStatus,
  formatCurrency,
  defaultPaymentSettings,
  PaymentSettings,
  DEFAULT_STUDIO_IMAGE,
} from '@/lib/data'
import {
  deleteRoomFromFirebase,
  getBookingsFromFirebase,
  getPaymentSettingsFromFirebase,
  getRoomsFromFirebase,
  savePaymentSettingsToFirebase,
  saveRoomToFirebase,
  updateBookingStatusInFirebase,
} from '@/lib/firebase-services'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [auth, setAuth] = useState<{ username: string; loggedIn: boolean } | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Active Tab state: 'phong' | 'donhang' | 'quanly' | 'caidat'
  const [activeTab, setActiveTab] = useState<'phong' | 'donhang' | 'quanly' | 'caidat'>('quanly')

  // Rooms state
  const [roomsList, setRoomsList] = useState<Studio[]>([])
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false)
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [newRoom, setNewRoom] = useState({
    name: '',
    type: '',
    city: 'Da Lat',
    address: '',
    pricePerHour: 150000,
    pricePerDay: 1200000,
    guests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    description: '',
    amenitiesText: '',
    rulesText: '',
  })
  const [imagePreview, setImagePreview] = useState<string>('')
  const [roomActionToast, setRoomActionToast] = useState<{ message: string; show: boolean }>({
    message: '',
    show: false,
  })
  const [deleteRoomConfirm, setDeleteRoomConfirm] = useState<{ roomId: string | null; show: boolean }>({
    roomId: null,
    show: false,
  })

  useEffect(() => {
    if (!roomActionToast.show) return

    const timer = setTimeout(() => {
      setRoomActionToast((prev) => ({ ...prev, show: false }))
    }, 2200)

    return () => clearTimeout(timer)
  }, [roomActionToast.show])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const resetRoomForm = () => {
    setNewRoom({
      name: '',
      type: '',
      city: 'Da Lat',
      address: '',
      pricePerHour: 150000,
      pricePerDay: 1200000,
      guests: 2,
      bedrooms: 1,
      beds: 1,
      baths: 1,
      description: '',
      amenitiesText: '',
      rulesText: '',
    })
    setImagePreview('')
    setEditingRoomId(null)
  }

  // Bookings state
  const [bookingsList, setBookingsList] = useState<BookingData[]>([])

  // Payment settings state
  const [paymentConfig, setPaymentConfig] = useState<PaymentSettings>(defaultPaymentSettings)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')
  const [paymentQrPreview, setPaymentQrPreview] = useState('')

  // Authentication Guard
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = localStorage.getItem('studio_admin_auth')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.loggedIn) {
            setAuth(parsed)
            const [rooms, bookings, paymentSettings] = await Promise.all([
              getRoomsFromFirebase(),
              getBookingsFromFirebase(),
              getPaymentSettingsFromFirebase(),
            ])
            setRoomsList(rooms)
            setBookingsList(bookings)
            setPaymentConfig(paymentSettings)
            setPaymentQrPreview(paymentSettings.qrImage || '')
            setCheckingAuth(false)
            return
          }
        }
      } catch {
        // ignore
      }

      setCheckingAuth(false)
      router.push('/admin/login')
    }

    void loadData()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('studio_admin_auth')
    router.push('/admin/login')
  }

  // Handle changing booking status
  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    setBookingsList((prev) =>
      prev.map((b) => (b.id === bookingId || b.code === bookingId ? { ...b, status: newStatus } : b))
    )

    try {
      await updateBookingStatusInFirebase(bookingId, newStatus)
    } catch (error) {
      console.error('Error while updating booking status in Firestore:', error)
    }
  }

  // Handle Add Room submit
  const handleAddRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const displayName = (newRoom.name || 'Studio').trim()
    const safeSlug = displayName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

    const roomId = editingRoomId ?? `${safeSlug || 'studio'}-${Date.now().toString().slice(-5)}`

    const amenities = (newRoom.amenitiesText || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const idx = line.indexOf(':')
        if (idx > -1) {
          const category = line.slice(0, idx).trim() || 'General'
          const items = line
            .slice(idx + 1)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
          return { category, items }
        }
        return { category: 'General', items: [line] }
      })

    const rules = (newRoom.rulesText || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    const roomPayload: Studio = {
      id: roomId,
      name: displayName,
      type: newRoom.type.trim() || 'Photo Studio',
      city: newRoom.city.trim() || 'Hà Nội',
      address: newRoom.address.trim() || 'Địa chỉ studio',
      price: Number(newRoom.pricePerDay) || 0,
      pricePerDay: Number(newRoom.pricePerDay) || 0,
      pricePerHour: Number(newRoom.pricePerHour) || 0,
      rating: 5.0,
      reviewCount: 1,
      guests: Number(newRoom.guests) || 2,
      bedrooms: Number(newRoom.bedrooms) || 0,
      beds: Number(newRoom.beds) || 0,
      baths: Number(newRoom.baths) || 0,
      images: [imagePreview || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=85'],
      tags: ['Studio', 'Chụp ảnh', 'Mới'],
      accent: '#f472b6',
      description: newRoom.description.trim() || 'Studio chụp ảnh hiện đại, phù hợp cho chụp ảnh theo giờ và theo ngày.',
      host: {
        name: auth?.username || 'Khanh',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        isSuperhost: true,
        responseRate: '100%',
        joinedYear: '2024',
      },
      amenities: amenities.length > 0 ? amenities : [{ category: 'General', items: ['Wi-Fi', 'Máy lạnh', 'Phòng thay đồ'] }],
      rules: rules.length > 0 ? rules : ['Check-in 14:00', 'Check-out 12:00', 'Không hút thuốc trong phòng'],
    }

    try {
      await saveRoomToFirebase(roomPayload)

      setRoomsList((prev) => {
        if (editingRoomId) {
          return prev.map((room) => (room.id === editingRoomId ? roomPayload : room))
        }
        return [roomPayload, ...prev]
      })

      const successMessage = editingRoomId ? 'Phòng đã được chỉnh sửa thành công!' : 'Phòng đã được thêm thành công!'
      setRoomActionToast({ message: successMessage, show: true })
      setIsAddRoomOpen(false)
      resetRoomForm()
    } catch (error) {
      console.error('Error saving room to Firestore:', error)
    }
  }

  const handleEditRoom = (room: Studio) => {
    setEditingRoomId(room.id)
    const amenitiesText = room.amenities
      ?.map((item) => `${item.category}: ${item.items.join(', ')}`)
      .join('\n') ?? ''
    const rulesText = room.rules?.join('\n') ?? ''

    setNewRoom({
      name: room.name,
      type: room.type,
      city: room.city,
      address: room.address,
      pricePerHour: room.pricePerHour,
      pricePerDay: room.pricePerDay,
      guests: room.guests,
      bedrooms: room.bedrooms,
      beds: room.beds,
      baths: room.baths,
      description: room.description,
      amenitiesText,
      rulesText,
    })
    setImagePreview(room.images?.[0] || DEFAULT_STUDIO_IMAGE)
    setIsAddRoomOpen(true)
  }

  const handleDeleteRoom = (roomId: string) => {
    setDeleteRoomConfirm({ roomId, show: true })
  }

  const confirmDeleteRoom = async () => {
    if (!deleteRoomConfirm.roomId) return

    try {
      await deleteRoomFromFirebase(deleteRoomConfirm.roomId)
      setRoomsList((prev) => prev.filter((room) => room.id !== deleteRoomConfirm.roomId))
      setRoomActionToast({ message: 'Phòng đã được xoá thành công!', show: true })
    } catch (error) {
      console.error('Error deleting room from Firestore:', error)
    } finally {
      setDeleteRoomConfirm({ roomId: null, show: false })
    }
  }

  // Handle Payment Settings Save
  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const settingsToSave: PaymentSettings = {
        ...paymentConfig,
        qrImage: paymentQrPreview,
      }

      await savePaymentSettingsToFirebase(settingsToSave)
      setPaymentConfig(settingsToSave)
      setSaveSuccessMsg('Đã lưu cấu hình thanh toán thành công!')
    } catch (error) {
      console.error('Error saving payment settings to Firestore:', error)
      setSaveSuccessMsg('Không thể lưu cấu hình thanh toán. Vui lòng thử lại.')
    }

    setTimeout(() => setSaveSuccessMsg(''), 3000)
  }

  const handlePaymentQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 650 * 1024) {
      setSaveSuccessMsg('Ảnh QR quá lớn. Vui lòng chọn ảnh dưới 650KB.')
      setTimeout(() => setSaveSuccessMsg(''), 3000)
      return
    }

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const qrImage = ev.target?.result as string
      const nextSettings: PaymentSettings = {
        ...paymentConfig,
        qrImage,
      }

      setPaymentQrPreview(qrImage)
      setPaymentConfig(nextSettings)

      try {
        await savePaymentSettingsToFirebase(nextSettings)
        setSaveSuccessMsg('Đã cập nhật ảnh QR thanh toán lên Firebase!')
      } catch (error) {
        console.error('Error saving QR image to Firestore:', error)
        setSaveSuccessMsg('Không thể lưu ảnh QR. Kiểm tra Firestore Rules hoặc kích thước ảnh.')
      }

      setTimeout(() => setSaveSuccessMsg(''), 3000)
    }
    reader.readAsDataURL(file)
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3edf7] text-sm text-muted-foreground font-medium">
        Đang tải trang quản trị...
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#f3edf7] text-foreground p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div
          className={`fixed left-1/2 top-1/2 z-[1000] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-emerald-200 bg-white/95 px-4 py-3 shadow-[0_18px_45px_rgba(16,185,129,0.18)] backdrop-blur-xl transition-all duration-700 ease-out ${
            roomActionToast.show
              ? 'translate-y-0 opacity-100 scale-100'
              : '-translate-y-8 opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle size={16} />
            </div>
            <span className="text-sm font-bold text-emerald-900">{roomActionToast.message}</span>
          </div>
        </div>

        <div
          className={`fixed left-1/2 top-1/2 z-[1001] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-rose-200 bg-white/95 px-5 py-4 shadow-[0_18px_45px_rgba(244,63,94,0.18)] backdrop-blur-xl transition-all duration-500 ease-out ${
            deleteRoomConfirm.show
              ? 'translate-y-0 opacity-100 scale-100'
              : '-translate-y-8 opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <TriangleAlert size={22} />
            </div>
            <div className="space-y-3">
              <p className="text-base font-bold text-rose-900">Bạn có chắc chắn muốn xoá phòng không?</p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={confirmDeleteRoom}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
                >
                  Xoá
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteRoomConfirm({ roomId: null, show: false })}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  Huỷ
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Top Header Row */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/80 px-6 py-4 backdrop-blur shadow-sm border border-pink-200/60">
          <div className="flex items-center gap-3">
            <div className="brand-mark bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md">
              <Camera size={20} />
            </div>
            <div>
              <div className="font-serif text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">chupchoet.room Admin</div>
              <p className="text-xs text-muted-foreground font-medium">Studio Manager: {auth?.username || 'Khanh'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              <LogOut size={14} /> Đăng xuất
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-pink-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-pink-600 transition hover:bg-pink-50"
            >
              Xem trang Khách →
            </Link>
          </div>
        </header>

        {/* TOP SEGMENTED PILL TAB NAVIGATION BAR (Matching screenshot) */}
        <nav className="flex items-center justify-between gap-2 overflow-x-auto rounded-3xl bg-white/80 p-2 shadow-sm border border-white/60">
          <div className="flex flex-1 items-center justify-around gap-2 text-sm font-medium">
            {/* Tab 1: Quản lý (Analytics Dashboard - Active Default & First) */}
            <button
              onClick={() => setActiveTab('quanly')}
              className={`flex items-center gap-2 rounded-2xl px-6 py-3 transition ${activeTab === 'quanly'
                  ? 'bg-[#fbf5e8] font-bold text-emerald-950 shadow-sm border border-amber-200/60'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                }`}
            >
              <Settings size={18} className={activeTab === 'quanly' ? 'text-amber-600' : ''} />
              <span>Quản lý</span>
            </button>

            {/* Tab 2: Máy ảnh / Phòng */}
            <button
              onClick={() => setActiveTab('phong')}
              className={`flex items-center gap-2 rounded-2xl px-6 py-3 transition ${activeTab === 'phong'
                  ? 'bg-[#fbf5e8] font-bold text-emerald-950 shadow-sm border border-amber-200/60'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                }`}
            >
              <Camera size={18} className={activeTab === 'phong' ? 'text-amber-600' : ''} />
              <span>Phòng</span>
            </button>

            {/* Tab 3: Đơn hàng */}
            <button
              onClick={() => setActiveTab('donhang')}
              className={`flex items-center gap-2 rounded-2xl px-6 py-3 transition ${activeTab === 'donhang'
                  ? 'bg-[#fbf5e8] font-bold text-emerald-950 shadow-sm border border-amber-200/60'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                }`}
            >
              <Box size={18} className={activeTab === 'donhang' ? 'text-indigo-600' : ''} />
              <span>Đơn hàng</span>
            </button>

            {/* Tab 4: Cài đặt */}
            <button
              onClick={() => setActiveTab('caidat')}
              className={`flex items-center gap-2 rounded-2xl px-6 py-3 transition ${activeTab === 'caidat'
                  ? 'bg-[#fbf5e8] font-bold text-emerald-950 shadow-sm border border-amber-200/60'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                }`}
            >
              <QrCode size={18} className={activeTab === 'caidat' ? 'text-purple-600' : ''} />
              <span>Cài đặt</span>
            </button>
          </div>
        </nav>

        {/* TAB CONTENT AREAS */}

        {/* =========================================================================
            TAB 3: QUẢN LÝ (DASHBOARD ANALYTICS - EXACT REPLICA OF REFERENCE SCREENSHOT)
           ========================================================================= */}
        {activeTab === 'quanly' && (
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* Left Column: Revenue Analysis Chart Card */}
            <div className="rounded-3xl border border-white/60 bg-white p-6 md:p-8 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-serif text-3xl font-bold text-emerald-950">Phân tích doanh thu</h2>
                    <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-emerald-600">
                      <TrendingUp size={16} /> +12.5% so với tháng trước
                    </p>
                  </div>

                  <div className="flex gap-2 text-xs">
                    <button className="rounded-xl border border-border bg-slate-50 px-3.5 py-1.5 font-medium text-foreground hover:bg-slate-100">
                      Mặc định
                    </button>
                    <button className="rounded-xl border border-border bg-white px-3.5 py-1.5 text-muted-foreground hover:text-foreground">
                      Tùy chỉnh
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">TỔNG THU NHẬP</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-serif text-4xl font-extrabold text-emerald-950">23.860.000</span>
                    <span className="text-sm font-bold text-muted-foreground">VNĐ</span>
                  </div>

                  <div className="mt-3">
                    <button className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-border px-4 py-2 text-xs font-medium text-foreground">
                      Trong tháng này <ChevronDown size={14} className="text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Revenue Curve Line Graphic (Matching Reference Image) */}
              <div className="pt-6">
                <div className="relative h-48 w-full">
                  <svg className="h-full w-full" viewBox="0 0 500 150">
                    <defs>
                      <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Gradient Fill under curve */}
                    <path
                      d="M 0,95 C 25,30 45,20 75,50 C 105,80 125,100 160,85 C 195,70 215,65 250,95 C 285,125 320,115 360,110 C 400,105 450,112 500,115 L 500,150 L 0,150 Z"
                      fill="url(#gradientRevenue)"
                    />
                    {/* Glowing curve line */}
                    <path
                      d="M 0,95 C 25,30 45,20 75,50 C 105,80 125,100 160,85 C 195,70 215,65 250,95 C 285,125 320,115 360,110 C 400,105 450,112 500,115"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Highlighted Data Point Dots */}
                    <circle cx="75" cy="50" r="5" fill="#ffffff" stroke="#6366f1" strokeWidth="3" />
                    <circle cx="160" cy="85" r="4" fill="#ffffff" stroke="#6366f1" strokeWidth="2.5" />
                    <circle cx="250" cy="95" r="4" fill="#ffffff" stroke="#6366f1" strokeWidth="2.5" />
                  </svg>
                </div>
                <div className="mt-4 flex justify-between text-[11px] font-medium text-muted-foreground px-2">
                  <span>01/09</span>
                  <span>03/09</span>
                  <span>04/09</span>
                  <span>05/09</span>
                  <span>06/09</span>
                  <span>07/09</span>
                  <span>08/09</span>
                  <span>09/09</span>
                  <span>10/09</span>
                  <span>11/09</span>
                  <span>12/09</span>
                </div>
              </div>
            </div>

            {/* Right Column: 4 Metric Cards Grid + Growth Report */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Metric 1: TỔNG ĐƠN */}
                <div className="rounded-3xl border border-white/60 bg-white p-5 shadow-sm space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
                    <Box size={20} />
                  </div>
                  <div>
                    <div className="font-serif text-3xl font-bold text-emerald-950">2792</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">TỔNG ĐƠN</div>
                  </div>
                </div>

                {/* Metric 2: CHỜ DUYỆT */}
                <div className="rounded-3xl border border-white/60 bg-white p-5 shadow-sm space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="font-serif text-3xl font-bold text-emerald-950">2</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">CHỜ DUYỆT</div>
                  </div>
                </div>

                {/* Metric 3: ĐANG THUÊ */}
                <div className="rounded-3xl border border-white/60 bg-white p-5 shadow-sm space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md">
                    <Camera size={20} />
                  </div>
                  <div>
                    <div className="font-serif text-3xl font-bold text-emerald-950">17</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">ĐANG THUÊ</div>
                  </div>
                </div>

                {/* Metric 4: ĐÃ XONG */}
                <div className="rounded-3xl border border-white/60 bg-white p-5 shadow-sm space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <div className="font-serif text-3xl font-bold text-emerald-950">2182</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">ĐÃ XONG</div>
                  </div>
                </div>
              </div>

              {/* Bottom Card: XEM BÁO CÁO TĂNG TRƯỞNG */}
              <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-sm text-center">
                <button className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900 hover:text-indigo-700 transition">
                  <TrendingUp size={16} /> XEM BÁO CÁO TĂNG TRƯỞNG
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 1: PHÒNG (ROOMS MANAGEMENT - HOURLY & DAILY PRICING)
           ========================================================================= */}
        {activeTab === 'phong' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-3xl bg-white p-6 shadow-sm border border-white/60">
              <div>
                <h2 className="font-serif text-3xl font-bold text-emerald-950">Danh sách Phòng & Giá cho thuê</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quản lý giá thuê theo giờ, thuê theo ngày và chi tiết phòng.
                </p>
              </div>
              <button
                onClick={() => setIsAddRoomOpen(true)}
                className="primary-button cursor-pointer text-sm font-bold shadow-md"
              >
                <Plus size={18} /> Thêm phòng mới
              </button>
            </div>

            {/* Rooms Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {roomsList.map((room) => (
                <div key={room.id} className="rounded-3xl bg-white border border-white/60 p-5 shadow-sm space-y-4">
                  <div className="relative aspect-[1.3] overflow-hidden rounded-2xl">
                    <img src={room.images?.[0] || DEFAULT_STUDIO_IMAGE} alt={room.name} className="h-full w-full object-cover" />
                    <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-emerald-950 backdrop-blur">
                      {room.type}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif text-2xl font-bold text-emerald-950">{room.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{room.address}</p>
                  </div>

                  {/* Dual Price Badge: Hourly vs Daily */}
                  <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-xs border border-border">
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold">Theo giờ</span>
                      <div className="font-bold text-emerald-900 text-sm">{formatCurrency(room.pricePerHour || 150000)}/h</div>
                    </div>
                    <div className="border-l border-border pl-2">
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold">Theo ngày</span>
                      <div className="font-bold text-amber-700 text-sm">{formatCurrency(room.pricePerDay || room.price)}/ngày</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleEditRoom(room)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                    >
                      <Edit size={14} /> Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRoom(room.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                    >
                      <Trash2 size={14} /> Xoá
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ADD ROOM / STUDIO MODAL */}
            {isAddRoomOpen && (
              <div className="modal-backdrop">
                <div className="booking-modal max-w-xl rounded-3xl border border-white/80 bg-white/95 p-6 md:p-8 shadow-2xl shadow-pink-500/20 backdrop-blur-xl">
                  <button
                    onClick={() => {
                      setIsAddRoomOpen(false)
                      resetRoomForm()
                    }}
                    className="absolute right-5 top-5 rounded-full bg-pink-100/80 p-2 text-pink-700 hover:bg-pink-200 transition"
                  >
                    <X size={18} />
                  </button>

                  <h2 className="font-bold text-3xl text-purple-950">Thêm Studio chụp ảnh mới</h2>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    Nhập thông tin chi tiết và cài đặt giá cho thuê Studio.
                  </p>

                  <form onSubmit={handleAddRoomSubmit} className="mt-6 space-y-4 text-sm">
                    <div>
                      <label className="text-xs font-bold uppercase text-purple-900">Tên Studio *</label>
                      <input
                        required
                        type="text"
                        placeholder="VD: Studio Minimalist Pastel & Natural Light"
                        value={newRoom.name}
                        onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                        className="mt-1.5 w-full rounded-2xl border border-pink-200 bg-pink-50/30 p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase text-purple-900">Loại Studio / Concept</label>
                      <input
                        type="text"
                        placeholder="VD: Indoor Studio, Rooftop, Cyberpunk, Vintage Retro..."
                        value={newRoom.type}
                        onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
                        className="mt-1.5 w-full rounded-2xl border border-pink-200 bg-pink-50/30 p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400"
                      />
                    </div>

                    {/* Prices */}
                    <div className="grid grid-cols-2 gap-3 bg-gradient-to-br from-pink-50/80 to-purple-50/80 p-4 rounded-2xl border border-pink-200/70">
                      <div>
                        <label className="text-xs font-bold uppercase text-pink-700">Giá thuê theo Giờ (VNĐ) *</label>
                        <input
                          required
                          type="number"
                          value={newRoom.pricePerHour}
                          onChange={(e) => setNewRoom({ ...newRoom, pricePerHour: Number(e.target.value) })}
                          className="mt-1.5 w-full rounded-xl border border-pink-200 bg-white p-2.5 text-xs font-extrabold text-purple-950 focus:outline-none focus:ring-2 focus:ring-pink-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase text-purple-700">Giá thuê trọn Ngày (VNĐ) *</label>
                        <input
                          required
                          type="number"
                          value={newRoom.pricePerDay}
                          onChange={(e) => setNewRoom({ ...newRoom, pricePerDay: Number(e.target.value) })}
                          className="mt-1.5 w-full rounded-xl border border-pink-200 bg-white p-2.5 text-xs font-extrabold text-purple-950 focus:outline-none focus:ring-2 focus:ring-pink-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase text-purple-900">Hình ảnh Studio</label>
                      <div className="mt-1.5 space-y-2">
                        {/* Preview */}
                        {imagePreview ? (
                          <div className="relative w-full h-40 overflow-hidden rounded-2xl border border-pink-200 shadow-sm">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setImagePreview('')}
                              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-pink-300 bg-pink-50/40 p-6 text-center transition hover:border-pink-500 hover:bg-pink-50/80">
                            <Camera size={26} className="text-pink-500" />
                            <span className="text-xs font-bold text-purple-950">Click để chọn ảnh từ máy tính</span>
                            <span className="text-[10px] font-medium text-muted-foreground">JPG, PNG, WEBP — tối đa 5MB</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase text-purple-900">Giới thiệu về Studio</label>
                      <textarea
                        rows={4}
                        value={newRoom.description}
                        onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                        className="mt-1.5 w-full rounded-2xl border border-pink-200 bg-pink-50/30 p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400"
                        placeholder="Mô tả không gian, phong cách, ánh sáng và trải nghiệm chụp ảnh..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase text-purple-900">Thiết bị & Tiện ích sẵn có</label>
                      <textarea
                        rows={4}
                        value={newRoom.amenitiesText}
                        onChange={(e) => setNewRoom({ ...newRoom, amenitiesText: e.target.value })}
                        className="mt-1.5 w-full rounded-2xl border border-pink-200 bg-pink-50/30 p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400"
                        placeholder={'General: Wi-Fi, Máy lạnh, Phòng thay đồ\nLighting: Đèn LED, Softbox, Godox'}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase text-purple-900">Quy định sử dụng Studio</label>
                      <textarea
                        rows={4}
                        value={newRoom.rulesText}
                        onChange={(e) => setNewRoom({ ...newRoom, rulesText: e.target.value })}
                        className="mt-1.5 w-full rounded-2xl border border-pink-200 bg-pink-50/30 p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400"
                        placeholder={'Check-in 14:00\nCheck-out 12:00\nKhông hút thuốc trong phòng'}
                      />
                    </div>

                    <button type="submit" className="primary-button w-full justify-center text-sm py-3.5 mt-4 shadow-lg cursor-pointer">
                      {editingRoomId ? 'Cập nhật Studio' : 'Lưu Studio mới'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: ĐƠN HÀNG (ORDERS MANAGEMENT - STATUS SELECTION IN RIGHT COLUMN)
           ========================================================================= */}
        {activeTab === 'donhang' && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-white/60">
              <h2 className="font-serif text-3xl font-bold text-emerald-950">Quản lý Đơn hàng & Đặt phòng</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Theo dõi khách hàng, lịch thuê phòng và cập nhật trạng thái đơn hàng ở góc bên phải.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm border border-white/60 overflow-x-auto space-y-4">
              <div className="divide-y divide-border">
                {bookingsList.map((booking, idx) => (
                  <div key={`${booking.id || booking.code}-${idx}`} className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Room & Customer details */}
                    <div className="flex items-start gap-4">
                      <img src={booking.studioImage} alt={booking.studioName} className="h-16 w-20 rounded-xl object-cover" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            {booking.code}
                          </span>
                          <span className="text-xs font-medium text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                            {booking.rentalType === 'hourly' ? 'Thuê theo giờ' : 'Thuê theo ngày'}
                          </span>
                        </div>

                        <h3 className="font-serif text-xl font-bold text-emerald-950">{booking.studioName}</h3>
                        <p className="text-xs text-foreground font-semibold">
                          Khách hàng: {booking.customerName} ({booking.customerPhone})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Lịch thuê: {booking.checkIn} — {booking.checkOut} ({booking.guests} khách)
                        </p>
                      </div>
                    </div>

                    {/* Right: Total Price & Interactive Status Dropdown Selector */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-border">
                      <div className="text-left md:text-right">
                        <div className="text-xs text-muted-foreground">Tổng tiền</div>
                        <div className="font-serif text-lg font-bold text-emerald-950">{formatCurrency(booking.totalPrice)}</div>
                      </div>

                      {/* Interactive Right-side Status Selector */}
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground hidden sm:inline">Trạng thái:</label>
                        <select
                          value={booking.status}
                          onChange={(e) => handleStatusChange(booking.id || booking.code, e.target.value as BookingStatus)}
                          className={`rounded-xl px-3.5 py-2 text-xs font-bold border outline-none cursor-pointer transition ${booking.status === 'chua_xac_nhan' || booking.status === 'pending'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : booking.status === 'da_xac_nhan' || booking.status === 'confirmed' || booking.status === 'deposit_paid'
                                ? 'bg-blue-100 text-blue-900 border-blue-300'
                                : booking.status === 'dang_thue'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : 'bg-purple-100 text-purple-900 border-purple-200'
                            }`}
                        >
                          <option value="chua_xac_nhan">🟠 Chưa xác nhận</option>
                          <option value="da_xac_nhan">🔵 Đã xác nhận</option>
                          <option value="dang_thue">🟢 Đang thuê</option>
                          <option value="da_hoan_thanh">⬛ Đã hoàn thành</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: CÀI ĐẶT (SETTINGS - PAYMENT & VIETQR CONFIGURATION)
           ========================================================================= */}
        {activeTab === 'caidat' && (
          <div className="rounded-2xl border border-violet-100 bg-[#f5f0ff] px-6 py-7 shadow-[0_16px_42px_rgba(76,29,149,0.12)] md:px-12">
            <div className="flex items-center gap-3 text-slate-950">
              <Settings size={20} className="text-violet-300" />
              <h2 className="font-serif text-lg font-bold">Cài đặt thanh toán</h2>
            </div>

            {saveSuccessMsg && (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-900">
                ✓ {saveSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSavePaymentConfig} className="mt-12 space-y-7 text-sm">
              <div className="flex flex-col items-center text-center">
                <label className="text-xs font-semibold text-slate-900">Ảnh mã QR thanh toán</label>
                <div className="mt-2 flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl border border-violet-100 bg-white text-sm font-bold italic text-slate-500 shadow-sm">
                  {paymentQrPreview ? (
                    <img src={paymentQrPreview} alt="Ảnh mã QR thanh toán" className="h-full w-full object-cover" />
                  ) : (
                    <span>Chưa có ảnh</span>
                  )}
                </div>
                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#fffaf0] px-4 py-2 text-xs font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <Upload size={14} />
                  Chọn ảnh QR
                  <input type="file" accept="image/*" className="hidden" onChange={handlePaymentQrUpload} />
                </label>
              </div>

              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-serif text-base font-bold text-blue-900">
                  <QrCode size={18} /> Thông tin chuyển khoản
                </h3>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-blue-900">Ngân hàng</label>
                  <input
                    required
                    type="text"
                    value={paymentConfig.bankName}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, bankName: e.target.value })}
                    placeholder="VD: Vietcombank"
                    className="w-full rounded-full border border-violet-100 bg-[#f7f2ff] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-blue-900">Số tài khoản</label>
                  <input
                    required
                    type="text"
                    value={paymentConfig.accountNumber}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, accountNumber: e.target.value })}
                    placeholder="VD: 0123456789"
                    className="w-full rounded-full border border-violet-100 bg-[#f7f2ff] px-4 py-3 font-mono text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-blue-900">Chủ tài khoản</label>
                  <input
                    required
                    type="text"
                    value={paymentConfig.accountHolder}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, accountHolder: e.target.value.toUpperCase() })}
                    placeholder="VD: CONG TY QUAN LY TOA NHA"
                    className="w-full rounded-full border border-violet-100 bg-[#f7f2ff] px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-blue-900">Cú pháp chuyển khoản</label>
                  <input
                    required
                    type="text"
                    value={paymentConfig.noteSyntax}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, noteSyntax: e.target.value })}
                    placeholder="VD: Thanh toán [Tên] - [Mã đơn]"
                    className="w-full rounded-full border border-violet-100 bg-[#f7f2ff] px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700">
                <CheckCircle size={16} />
                Lưu cài đặt
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
