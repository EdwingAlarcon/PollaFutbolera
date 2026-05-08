'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type User, type Pool } from '@/lib/supabase'
import Link from 'next/link'
import PFLogo from '@/components/PFLogo'

// Emails con acceso al panel admin
const ADMIN_EMAILS = ['bdp.usf@gmail.com']

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [authEmail, setAuthEmail] = useState<string>('')
  const [pools, setPools] = useState<Pool[]>([])
  const [rankings, setRankings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPool, setEditingPool] = useState<Pool | null>(null)
  const [editRules, setEditRules] = useState({ exactScore: 5, correctDifference: 3, correctResult: 1 })
  const [editPrizes, setEditPrizes] = useState([{ position: '\uD83E\uDD47 1er Lugar', prize: '' }, { position: '\uD83E\uDD48 2do Lugar', prize: '' }, { position: '\uD83E\uDD49 3er Lugar', prize: '' }])
  const [saving, setSaving] = useState(false)

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

    setAuthEmail(authUser.email ?? '')

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    // Guardrail: si no hay perfil, crearlo ahora
    if (!profile || profileError?.code === 'PGRST116') {
      const { data: newProfile } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'user',
          email: authUser.email!,
        })
        .select('*')
        .single()
      setUser(newProfile)
    } else {
      setUser(profile)
    }
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
          scoring_rules,
          prizes,
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

  const handleDeletePool = async (pool: Pool) => {
    if (!confirm(`¿Seguro que deseas eliminar la polla "${pool.name}"? Esta acción no se puede deshacer.`)) return
    const { error } = await supabase.from('pools').delete().eq('id', pool.id)
    if (error) {
      alert('Error al eliminar: ' + error.message)
    } else {
      setPools(prev => prev.filter(p => p.id !== pool.id))
    }
  }

  const openEdit = (pool: Pool) => {
    setEditingPool(pool)
    setEditRules(pool.scoring_rules ?? { exactScore: 5, correctDifference: 3, correctResult: 1 })
    const base = [{ position: '\uD83E\uDD47 1er Lugar', prize: '' }, { position: '\uD83E\uDD48 2do Lugar', prize: '' }, { position: '\uD83E\uDD49 3er Lugar', prize: '' }]
    if (pool.prizes?.length) {
      setEditPrizes(base.map((b, i) => pool.prizes![i] ? { ...pool.prizes![i] } : b))
    } else {
      setEditPrizes(base)
    }
  }

  const handleEditSave = async () => {
    if (!editingPool) return
    setSaving(true)
    const prizes = editPrizes.filter(p => p.prize.trim()).map(p => ({ position: p.position, prize: p.prize.trim() }))
    const { error } = await supabase
      .from('pools')
      .update({
        scoring_rules: editRules,
        prizes: prizes.length ? prizes : null,
      })
      .eq('id', editingPool.id)
    setSaving(false)
    if (error) {
      alert('Error al guardar: ' + error.message)
    } else {
      setPools(prev => prev.map(p => p.id === editingPool.id
        ? { ...p, scoring_rules: editRules, prizes: prizes.length ? prizes : undefined }
        : p))
      setEditingPool(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1020] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-white/10 border-t-green-500"></div>
          <p className="text-slate-400 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  const isAdmin = ADMIN_EMAILS.includes(authEmail)

  return (
    <div className="min-h-screen bg-[#0B1020] text-white">
      {/* Edit Modal */}
      {editingPool && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4" onClick={() => setEditingPool(null)}>
          <div className="bg-[#131A2E] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-black text-white mb-1">✏️ Editar Polla</h2>
            <p className="text-xs text-slate-500 mb-5">{editingPool.name}</p>

            {/* Scoring rules */}
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sistema de Puntuación</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {([
                { key: 'exactScore', label: 'Marcador Exacto' },
                { key: 'correctDifference', label: 'Diferencia Correcta' },
                { key: 'correctResult', label: 'Resultado Correcto' },
              ] as const).map(({ key, label }) => (
                <div key={key} className="bg-white/5 rounded-xl p-3">
                  <label className="block text-xs text-slate-400 mb-2 leading-tight">{label}</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditRules(r => ({ ...r, [key]: Math.max(0, r[key] - 1) }))} className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 text-white font-bold text-sm flex items-center justify-center transition">-</button>
                    <span className="flex-1 text-center font-black text-green-400 text-lg">{editRules[key]}</span>
                    <button onClick={() => setEditRules(r => ({ ...r, [key]: r[key] + 1 }))} className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 text-white font-bold text-sm flex items-center justify-center transition">+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Prizes */}
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Premios (opcional)</p>
            <div className="space-y-2 mb-6">
              {editPrizes.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm w-28 text-slate-300 flex-shrink-0">{p.position}</span>
                  <input
                    type="text"
                    value={p.prize}
                    onChange={e => setEditPrizes(prev => prev.map((x, j) => j === i ? { ...x, prize: e.target.value } : x))}
                    placeholder="ej: $50.000"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditingPool(null)} className="text-sm text-slate-400 hover:text-white transition px-4 py-2">Cancelar</button>
              <button
                onClick={handleEditSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-2 px-5 rounded-xl text-sm transition"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Nav */}
      <nav className="bg-[#0B1020]/90 backdrop-blur-xl border-b border-white/5 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#0B1020] border border-green-500/40 flex items-center justify-center group-hover:border-green-400 transition-colors">
              <PFLogo size={22} />
            </div>
            <span className="text-lg font-black text-white">Polla<span className="text-green-400">Futbolera</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm hidden sm:block">
              Hola, <span className="text-white font-semibold">{user?.username}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-slate-300 text-sm transition"
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
            <p className="text-slate-500 text-sm mt-1">{pools.length} polla(s) activa(s)</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/pool/create"
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-5 rounded-xl transition text-sm flex items-center gap-2"
            >
              ⚽ CREAR POLLA
            </Link>
            <Link
              href="/pool/join"
              className="bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 px-5 rounded-xl border border-white/10 transition text-sm"
            >
              + Unirme con Código
            </Link>
            {ADMIN_EMAILS.includes(authEmail) && (
              <Link
                href="/admin/matches"
                className="bg-red-900/60 hover:bg-red-800/60 text-red-300 font-bold py-2.5 px-5 rounded-xl border border-red-700/50 transition text-sm"
              >
                🔒 Admin
              </Link>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-yellow-950/40 border border-yellow-700/40 rounded-xl p-4 mb-6">
          <p className="text-yellow-300 text-sm font-bold mb-1">⚠️ RECOMENDACIONES</p>
          <p className="text-yellow-200/60 text-xs">1. Ingresar los pronósticos con tiempo. Puede adicionarlos inicialmente y luego decidir si se modifican. Validar que hayan quedado correctamente almacenados.</p>
          <p className="text-yellow-200/60 text-xs mt-0.5">2. Se debe dar clic en GUARDAR por cada página. Marcador en blanco no significa cero goles.</p>
        </div>

        {pools.length === 0 ? (
          <div className="bg-[#131A2E] rounded-2xl border border-white/5 p-16 text-center">
            <div className="text-7xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-white mb-2">No tienes pollas aún</h2>
            <p className="text-slate-500 mb-8">Crea tu primera polla o únete a una con un código de invitación</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pool/create"
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-xl transition text-center"
              >
                Crear Polla
              </Link>
              <Link
                href="/pool/join"
                className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-8 rounded-xl border border-white/10 transition text-center"
              >
                Unirme con Código
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-[#131A2E] rounded-2xl border border-white/5 overflow-hidden">
            {/* Mobile cards (hidden on md+) */}
            <div className="md:hidden divide-y divide-white/5">
              {pools.map((pool) => {
                const myRanking = rankings.find(r => r.pool_id === pool.id)
                return (
                  <div key={pool.id} className="px-4 py-4 flex items-center gap-3 hover:bg-white/[0.03] transition">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm leading-tight truncate">{pool.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">{pool.tournament_id}</div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-slate-500">Pos: <span className="text-white font-bold">{myRanking?.rank || '-'}</span></span>
                        <span className="text-xs text-slate-500">Pts: <span className="text-green-400 font-black">{myRanking?.total_points || 0}</span></span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <Link
                        href={`/pool/${pool.id}`}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-xl text-sm transition text-center"
                      >
                        📋 Ver
                      </Link>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openEdit(pool)}
                            className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl text-sm transition"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDeletePool(pool)}
                            className="bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl text-sm transition"
                          >
                            🗑️ Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Desktop table (hidden on mobile) */}
            <div className="hidden md:block">
              <div className={`grid ${isAdmin ? 'grid-cols-[1fr_180px_80px_80px_180px]' : 'grid-cols-[1fr_180px_80px_80px_100px]'} gap-2 px-6 py-3 bg-white/5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-white/5`}>
                <div>Nombre</div>
                <div>Torneo</div>
                <div className="text-center">Pos</div>
                <div className="text-center">Ptje</div>
                <div className="text-center">Acciones</div>
              </div>
              <div className="divide-y divide-white/5">
                {pools.map((pool) => {
                  const myRanking = rankings.find(r => r.pool_id === pool.id)
                  return (
                    <div
                      key={pool.id}
                      className={`grid ${isAdmin ? 'grid-cols-[1fr_180px_80px_80px_180px]' : 'grid-cols-[1fr_180px_80px_80px_100px]'} gap-2 px-6 py-4 items-center hover:bg-white/[0.03] transition`}
                    >
                      <div>
                        <div className="font-bold text-white">{pool.name}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{pool.invite_code}</div>
                      </div>
                      <div className="text-slate-400 text-sm truncate">{pool.tournament_id}</div>
                      <div className="text-center">
                        {myRanking ? (
                          <span className="font-bold text-white text-lg">{myRanking.rank || '-'}</span>
                        ) : (
                          <span className="text-slate-600">0</span>
                        )}
                      </div>
                      <div className="text-center">
                        <span className="font-black text-green-400 text-lg">
                          {myRanking?.total_points || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/pool/${pool.id}`}
                          className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-3 rounded-lg text-xs transition"
                          title="Ver pronósticos"
                        >
                          📋 Ver
                        </Link>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => openEdit(pool)}
                              className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-lg text-xs transition"
                              title="Editar polla"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeletePool(pool)}
                              className="bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition"
                              title="Eliminar polla"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
