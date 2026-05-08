'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PFLogo from '@/components/PFLogo'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Crear cuenta en Supabase Auth
      // El perfil en public.users se crea automáticamente via trigger (SECURITY DEFINER)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario')
      }

      // Si la sesión viene de inmediato, la verificación está desactivada
      if (authData.session) {
        const pendingInvite = localStorage.getItem('pendingInvite')
        if (pendingInvite) {
          const { data: pool } = await supabase
            .from('pools')
            .select('id')
            .eq('invite_code', pendingInvite)
            .single()
          if (pool) {
            await supabase.from('pool_members').insert({
              pool_id: pool.id,
              user_id: authData.user.id,
            })
            localStorage.removeItem('pendingInvite')
            router.push(`/pool/${pool.id}`)
            return
          }
        }
        router.push('/dashboard')
      } else {
        // Verificación de email activa — mostrar pantalla de confirmación
        setEmailSent(true)
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#0B1020] flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(34,197,94,0.07) 0%, transparent 60%)' }} />
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="bg-[#131A2E] border border-white/8 rounded-2xl p-10 shadow-2xl shadow-black/50">
            <div className="text-6xl mb-5">📧</div>
            <h2 className="text-2xl font-black text-white mb-3">Revisa tu email</h2>
            <p className="text-slate-400 mb-2 text-sm">Te enviamos un enlace de verificación a:</p>
            <p className="font-black text-green-400 mb-6">{formData.email}</p>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              Haz clic en el enlace del email para activar tu cuenta. Puede tardar unos minutos.
            </p>
            <Link
              href="/login"
              className="block w-full bg-green-500 hover:bg-green-400 text-black font-black py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/40"
            >
              Ir al inicio de sesión →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B1020] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 50%, rgba(34,197,94,0.07) 0%, transparent 60%)' }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-5">
            <PFLogo size={52} className="group-hover:scale-105 transition-transform duration-300" />
            <span className="text-xl font-black text-white">Polla<span className="text-green-400">Futbolera</span></span>
          </Link>
          <h1 className="text-3xl font-black text-white mb-2">Crea tu cuenta gratis</h1>
          <p className="text-slate-400">Únete y comienza a competir hoy</p>
        </div>

        <div className="bg-[#131A2E] border border-white/8 rounded-2xl p-8 shadow-2xl shadow-black/50">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Nombre de usuario</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                minLength={3}
                maxLength={20}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-white outline-none transition"
                placeholder="tu_username"
              />
            </div>

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
                minLength={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-white outline-none transition"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-black py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:-translate-y-px"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta →'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-green-400 hover:text-green-300 font-semibold transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
