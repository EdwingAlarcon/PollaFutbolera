'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-6xl mb-4">📧</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Revisa tu email</h2>
            <p className="text-gray-600 mb-2">
              Te enviamos un enlace de verificación a:
            </p>
            <p className="font-bold text-green-600 mb-6">{formData.email}</p>
            <p className="text-sm text-gray-500 mb-6">
              Haz clic en el enlace del email para activar tu cuenta. Puede tardar unos minutos.
            </p>
            <Link
              href="/login"
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition text-center"
            >
              Ir al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ⚽ Polla Futbolera
          </h1>
          <p className="text-gray-600">Crea tu cuenta gratis</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de usuario
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
                minLength={3}
                maxLength={20}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                placeholder="tu_username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-green-600 hover:text-green-700 font-semibold">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
