'use client'

import Link from 'next/link'
import { Camera, Menu, Ticket, X } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-white/30 bg-white/55 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-8">
        <Link href="/" className="flex items-center gap-3 transition hover:opacity-90">
          <div className="brand-mark">
            <Camera size={20} />
          </div>
          <div>
            <div className="font-serif text-2xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              chupchoet.room
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[.22em] text-pink-600/75">
              Photography Studio Rental
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-fuchsia-950/70 md:flex">
          <Link href="/#booking-section" className="transition hover:text-pink-400">
            Đặt phòng
          </Link>
          <Link href="/#booking-section" className="transition hover:text-pink-400">
            Bảng giá
          </Link>
          <Link href="/my-bookings" className="flex items-center gap-1.5 transition hover:text-pink-400">
            <Ticket size={15} className="text-pink-400" />
            Tra cứu đơn thuê
          </Link>
        </nav>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-full border border-white/50 bg-white/35 p-2 text-pink-500 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/30 bg-white/75 px-5 py-4 backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-3 text-sm font-semibold">
            <Link
              href="/#booking-section"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-fuchsia-950/75 hover:text-pink-500"
            >
              Đặt phòng
            </Link>
            <Link
              href="/#booking-section"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-fuchsia-950/75 hover:text-pink-500"
            >
              Bảng giá
            </Link>
            <Link
              href="/my-bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 text-pink-500"
            >
              <Ticket size={16} /> Tra cứu đơn thuê
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
