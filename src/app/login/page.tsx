'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PFLogo from '@/components/PFLogo'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (loginError) throw loginError

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="min-h-screen bg-[#0B1020] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(34,197,94,0.07) 0%, transparent 60%)' }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-5">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/30 rounded-xl blur-md group-hover:bg-green-500/50 transition-all duration-300" />
              <div className="relative w-10 h-10 rounded-xl bg-[#0B1020] border border-green-500/40 flex items-center justify-center group-hover:border-green-400 transition-colors">
                <PFLogo size={28} />
              </div>
            </div>
            <span className="text-xl font-black text-white">Polla<span className="text-green-400">Futbolera</span></span>
          </Link>
          <h1 className="text-3xl font-black text-white mb-2">Bienvenido de vuelta</h1>
          <p className="text-slate-400">Inicia sesión en tu cuenta</p>
        </div>

        <div className="bg-[#131A2E] border border-white/8 rounded-2xl p-8 shadow-2xl shadow-black/50">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-white outline-none transition"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Contraseña</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-white outline-none transition"
                placeholder="Tu contraseña"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-black py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:-translate-y-px"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión →'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-green-400 hover:text-green-300 font-semibold transition-colors">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
