'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard" className="text-2xl font-bold text-green-600">
            ← Volver
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Unirse a una Polla
          </h1>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {!poolInfo ? (
              <>
                <p className="text-gray-600 mb-6 text-center">
                  Ingresa el código de invitación que te compartieron
                </p>

                <div className="space-y-4">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={10}
                    className="w-full px-4 py-3 text-center text-2xl font-mono font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase"
                    placeholder="ABC123"
                  />

                  <button
                    onClick={handleVerifyCode}
                    disabled={loading || !inviteCode}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
                  >
                    {loading ? 'Verificando...' : 'Verificar Código'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-4">🎉</div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    ¡Polla encontrada!
                  </h2>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    {poolInfo.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Creada por: {poolInfo.users?.username}
                  </p>
                  <p className="text-sm text-gray-600">
                    Torneo: {poolInfo.tournament_id}
                  </p>
                </div>

                <button
                  onClick={handleJoin}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Uniéndose...' : 'Unirme a esta Polla'}
                </button>

                <button
                  onClick={() => {
                    setPoolInfo(null)
                    setInviteCode('')
                    setError(null)
                  }}
                  className="w-full mt-3 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Probar otro código
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
