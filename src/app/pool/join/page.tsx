'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import PFLogo from '@/components/PFLogo'

export default function JoinPoolPage() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [poolInfo, setPoolInfo] = useState<any>(null)

  const handleVerifyCode = async () => {
    if (!inviteCode) return

    setLoading(true)
    setError(null)

    try {
      const { data: pool, error: poolError } = await supabase
        .from('pools')
        .select(`
          id,
          name,
          tournament_id,
          users!pools_admin_id_fkey (
            username
          )
        `)
        .eq('invite_code', inviteCode.toUpperCase())
        .single()

      if (poolError || !pool) {
        throw new Error('Código de invitación inválido')
      }

      setPoolInfo(pool)
    } catch (err: any) {
      setError(err.message || 'Error al verificar el código')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Guardar código y redirigir a registro
        localStorage.setItem('pendingInvite', inviteCode.toUpperCase())
        router.push('/register')
        return
      }

      // Verificar si ya es miembro
      const { data: existing } = await supabase
        .from('pool_members')
        .select('*')
        .eq('pool_id', poolInfo.id)
        .eq('user_id', user.id)
        .single()

      if (existing) {
        router.push(`/pool/${poolInfo.id}`)
        return
      }

      // Unirse a la polla
      const { error: joinError } = await supabase
        .from('pool_members')
        .insert({
          pool_id: poolInfo.id,
          user_id: user.id,
        })

      if (joinError) throw joinError

      router.push(`/pool/${poolInfo.id}`)
    } catch (err: any) {
      setError(err.message || 'Error al unirse a la polla')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1020] text-slate-50 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(34,197,94,0.07) 0%, transparent 60%)' }} />

      <nav className="relative z-10 border-b border-white/5 bg-[#0B1020]/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <Link href="/dashboard" className="text-green-400 hover:text-green-300 font-semibold text-sm transition">
            ← Dashboard
          </Link>
        </div>
      </nav>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#0B1020] border border-green-500/40 flex items-center justify-center">
                <PFLogo size={24} />
              </div>
              <span className="text-lg font-black text-white">Polla<span className="text-green-400">Futbolera</span></span>
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Unirse a una Polla</h1>
            <p className="text-slate-400 text-sm">Ingresa el código de invitación que te compartieron</p>
          </div>

          <div className="bg-[#131A2E] border border-white/8 rounded-2xl p-8 shadow-2xl shadow-black/50">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm">
                {error}
              </div>
            )}

            {!poolInfo ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="w-full px-4 py-4 text-center text-2xl font-mono font-black bg-white/5 border-2 border-white/10 focus:border-green-500 rounded-xl text-white outline-none uppercase tracking-widest transition"
                  placeholder="ABC123"
                />
                <button
                  onClick={handleVerifyCode}
                  disabled={loading || !inviteCode}
                  className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-black py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:-translate-y-px"
                >
                  {loading ? 'Verificando...' : 'Verificar Código →'}
                </button>
              </div>
            ) : (
              <div>
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">🎉</div>
                  <h2 className="text-xl font-black text-white mb-1">¡Polla encontrada!</h2>
                  <p className="text-slate-400 text-sm">Confirma que quieres unirte</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
                  <h3 className="font-black text-lg text-white mb-3">{poolInfo.name}</h3>
                  <div className="space-y-1.5">
                    <p className="text-sm text-slate-400">
                      <span className="text-slate-500">Creada por: </span>
                      <span className="text-slate-300 font-semibold">{poolInfo.users?.username}</span>
                    </p>
                    <p className="text-sm text-slate-400">
                      <span className="text-slate-500">Torneo: </span>
                      <span className="text-slate-300 font-semibold">{poolInfo.tournament_id}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleJoin}
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-black py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 mb-3"
                >
                  {loading ? 'Uniéndose...' : 'Unirme a esta Polla →'}
                </button>

                <button
                  onClick={() => {
                    setPoolInfo(null)
                    setInviteCode('')
                    setError(null)
                  }}
                  className="w-full text-slate-500 hover:text-slate-300 text-sm py-2 transition-colors"
                >
                  Probar otro código
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
