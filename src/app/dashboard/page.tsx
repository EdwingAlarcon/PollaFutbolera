'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type User, type Pool } from '@/lib/supabase'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
    loadPools()
  }, [])

  const checkUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    setUser(profile)
    setLoading(false)
  }

  const loadPools = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data: poolMembers } = await supabase
      .from('pool_members')
      .select(`
        pool_id,
        pools (
          id,
          name,
          invite_code,
          tournament_id,
          created_at
        )
      `)
      .eq('user_id', authUser.id)

    if (poolMembers) {
      const poolsData = poolMembers.map((pm: any) => pm.pools).filter(Boolean)
      setPools(poolsData)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-green-600">
            ⚽ Polla Futbolera
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Hola, {user?.username}!</span>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-800"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Mis Pollas
            </h1>
            <div className="flex gap-4">
              <Link
                href="/pool/create"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                + Crear Nueva Polla
              </Link>
              <Link
                href="/pool/join"
                className="bg-white hover:bg-gray-50 text-green-600 font-bold py-3 px-6 rounded-lg border-2 border-green-600 transition"
              >
                Unirme con Código
              </Link>
            </div>
          </div>

          {pools.length === 0 ? (
            <div className="bg-white p-12 rounded-xl shadow-lg text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No tienes pollas aún
              </h2>
              <p className="text-gray-600 mb-6">
                Crea tu primera polla o únete a una con un código de invitación
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {pools.map((pool) => (
                <Link
                  key={pool.id}
                  href={`/pool/${pool.id}`}
                  className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {pool.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-mono">
                      {pool.invite_code}
                    </span>
                    <span>•</span>
                    <span>{pool.tournament_id}</span>
                  </div>
                  <div className="text-green-600 font-semibold">
                    Ver predicciones →
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
