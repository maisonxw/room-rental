'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera, Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'
import { loginAdminWithFirebase } from '@/lib/firebase-services'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('admin@gmail.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const inputAccount = username.trim()

    if (!inputAccount.includes('@')) {
      setError('Vui lòng dùng email admin của Firebase để đăng nhập.')
      setLoading(false)
      return
    }

    try {
      const user = await loginAdminWithFirebase(inputAccount, password)
      localStorage.setItem(
        'studio_admin_auth',
        JSON.stringify({
          username: user.email || inputAccount,
          uid: user.uid,
          loggedIn: true,
        })
      )
      router.push('/admin/khanh')
    } catch (err: any) {
      console.error('Firebase Auth Error:', err)
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        setError('Tài khoản hoặc mật khẩu trên Firebase không chính xác!')
      } else if (err?.code === 'auth/wrong-password') {
        setError('Mật khẩu không chính xác!')
      } else if (err?.code === 'auth/invalid-email') {
        setError('Định dạng Email không hợp lệ!')
      } else {
        setError(`Lỗi đăng nhập Firebase: ${err?.message || 'Kiểm tra lại Email/Mật khẩu'}`)
      }
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 px-5 py-12 text-foreground">
      <div className="w-full max-w-md">
        {/* Top Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="brand-mark bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg">
              <Camera size={22} />
            </div>
            <div className="text-left text-white">
              <div className="font-serif text-2xl font-bold tracking-tight bg-gradient-to-r from-pink-300 to-purple-200 bg-clip-text text-transparent">
                chupchoet.room
              </div>
              <div className="text-[10px] uppercase tracking-[.2em] text-pink-300 font-bold">Studio Administration</div>
            </div>
          </Link>
        </div>

        {/* Login Form Box */}
        <div className="mt-8 rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-pink-600 mb-3 border border-pink-200">
              <Lock size={22} />
            </div>
            <h1 className="font-serif text-2xl text-purple-950 font-bold">Studio Admin Login</h1>
            <p className="mt-1 text-xs text-muted-foreground font-medium">
              Nhập tài khoản quản trị viên để đăng nhập Dashboard.
            </p>
          </div>

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-purple-900">Email / Tài khoản</label>
              <div className="relative mt-1">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-500" />
                <input
                  required
                  type="text"
                  placeholder="admin@gmail.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-pink-200 bg-pink-50/30 py-3 pl-10 pr-4 text-sm font-medium focus:outline-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-purple-900">Mật khẩu</label>
              <div className="relative mt-1">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-500" />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-pink-200 bg-pink-50/30 py-3 pl-10 pr-4 text-sm font-medium focus:outline-pink-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-button mt-4 w-full justify-center text-sm py-3.5 shadow-md cursor-pointer"
            >
              {loading ? 'Đang xác thực với Firebase...' : 'Đăng nhập Quản trị'} <ArrowRight size={16} />
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-white/70 font-medium">
          <Link href="/" className="hover:text-pink-300 transition">
            ← Quay lại trang chủ chupchoet.room
          </Link>
        </div>
      </div>
    </main>
  )
}

