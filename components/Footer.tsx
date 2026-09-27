import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-white/30 bg-white/45 px-5 py-8 text-sm text-fuchsia-950/65 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <div className="font-serif text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            chupchoet.room
          </div>
          <p className="mt-1 text-xs">
            Cho thuê phòng studio chụp ảnh và không gian sáng tạo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-xs font-semibold">
          <Link href="/#booking-section" className="hover:text-pink-500">
            Đặt phòng
          </Link>
          <Link href="/my-bookings" className="hover:text-pink-500">
            Tra cứu đơn thuê
          </Link>
          <Link href="/admin/khanh" className="hover:text-pink-500">
            Admin
          </Link>
        </div>
        <div className="text-xs">
          © {new Date().getFullYear()} chupchoet.room
        </div>
      </div>
    </footer>
  )
}
