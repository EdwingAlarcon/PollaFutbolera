'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type User, type Pool } from '@/lib/supabase'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [pools, setPools] = useState<Pool[]>([])
  const [rankings, setRankings] = useState<any[]>([])
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

    // Obtener ranking del usuario en todas sus pollas
    const { data: rankingData } = await supabase
      .from('pool_rankings')
      .select('*')
      .eq('user_id', authUser.id)

    if (rankingData) setRankings(rankingData)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-700 border-t-green-500"></div>
          <p className="text-gray-400 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <span className="text-xl font-black text-white">Polla Futbolera</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm hidden sm:block">
              Hola, <span className="text-white font-semibold">{user?.username}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-300 text-sm transition"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">Grupos Activos</h1>
            <p className="text-gray-500 text-sm mt-1">{pools.length} polla(s) activa(s)</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/pool/create"
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-5 rounded-xl transition text-sm flex items-center gap-2"
            >
              ⚽ CREAR POLLA
            </Link>
            <Link
              href="/pool/join"
              className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 px-5 rounded-xl border border-gray-700 transition text-sm"
            >
              + Unirme con Código
            </Link>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-yellow-950/40 border border-yellow-700/40 rounded-xl p-4 mb-6">
          <p className="text-yellow-300 text-sm font-bold mb-1">⚠️ RECOMENDACIONES</p>
          <p className="text-yellow-200/60 text-xs">1. Ingresar los pronósticos con tiempo. Puede adicionarlos inicialmente y luego decidir si se modifican. Validar que hayan quedado correctamente almacenados.</p>
          <p className="text-yellow-200/60 text-xs mt-0.5">2. Se debe dar clic en GUARDAR por cada página. Marcador en blanco no significa cero goles.</p>
        </div>

        {pools.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-16 text-center">
            <div className="text-7xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-white mb-2">No tienes pollas aún</h2>
            <p className="text-gray-500 mb-8">Crea tu primera polla o únete a una con un código de invitación</p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/pool/create"
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-xl transition"
              >
                Crear Polla
              </Link>
              <Link
                href="/pool/join"
                className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-xl border border-gray-700 transition"
              >
                Unirme con Código
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_180px_80px_80px_100px] gap-2 px-6 py-3 bg-gray-800/60 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700">
              <div>Nombre</div>
              <div>Torneo</div>
              <div className="text-center">Pos</div>
              <div className="text-center">Ptje</div>
              <div className="text-center">Acciones</div>
            </div>
            <div className="divide-y divide-gray-800">
              {pools.map((pool) => {
                const myRanking = rankings.find(r => r.pool_id === pool.id)
                return (
                  <div
                    key={pool.id}
                    className="grid grid-cols-[1fr_180px_80px_80px_100px] gap-2 px-6 py-4 items-center hover:bg-gray-800/30 transition"
                  >
                    <div>
                      <div className="font-bold text-white">{pool.name}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{pool.invite_code}</div>
                    </div>
                    <div className="text-gray-400 text-sm truncate">{pool.tournament_id}</div>
                    <div className="text-center">
                      {myRanking ? (
                        <span className="font-bold text-white text-lg">{myRanking.rank || '-'}</span>
                      ) : (
                        <span className="text-gray-600">0</span>
                      )}
                    </div>
                    <div className="text-center">
                      <span className="font-black text-green-400 text-lg">
                        {myRanking?.total_points || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/pool/${pool.id}`}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition"
                        title="Ver pronósticos"
                      >
                        📋 Ver
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

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
