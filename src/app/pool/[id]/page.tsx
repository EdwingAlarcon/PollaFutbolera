'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function PoolDetailPage() {
  const params = useParams()
  const router = useRouter()
  const poolId = params.id as string

  const [pool, setPool] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [poolId])

  const loadData = async () => {
    try {
      // Obtener usuario actual
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }
      setUser(authUser)

      // Obtener información de la polla
      const { data: poolData, error: poolError } = await supabase
        .from('pools')
        .select(`
          *,
          users!pools_admin_id_fkey (
            username
          )
        `)
        .eq('id', poolId)
        .single()

      if (poolError) throw poolError
      setPool(poolData)

      // Obtener miembros
      const { data: membersData } = await supabase
        .from('pool_members')
        .select(`
          user_id,
          joined_at,
          users (
            username,
            avatar_url
          )
        `)
        .eq('pool_id', poolId)

      if (membersData) {
        setMembers(membersData)
      }

      // Obtener partidos del torneo
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', poolData.tournament_id)
        .order('match_date', { ascending: true })

      if (matchesData) {
        setMatches(matchesData)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading pool:', error)
      setLoading(false)
    }
  }

  const copyInviteLink = () => {
    const link = `${window.location.origin}/pool/join?code=${pool.invite_code}`
    navigator.clipboard.writeText(link)
    alert('¡Link copiado al portapapeles!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!pool) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Polla no encontrada</h1>
          <Link href="/dashboard" className="text-green-600 hover:underline">
            Volver al Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-green-600 hover:text-green-700 font-semibold">
            ← Volver al Dashboard
          </Link>
          <div className="text-sm text-gray-600">
            Admin: {pool.users?.username}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header de la Polla */}
          <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {pool.name}
                </h1>
                <p className="text-gray-600">
                  Torneo: {pool.tournament_id}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-2">Código de invitación:</div>
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-mono font-bold text-xl mb-2">
                  {pool.invite_code}
                </div>
                <button
                  onClick={copyInviteLink}
                  className="text-sm text-green-600 hover:text-green-700 font-semibold"
                >
                  📋 Copiar link de invitación
                </button>
              </div>
            </div>

            {/* Reglas de puntuación */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                Reglas de Puntuación:
              </h3>
              <div className="text-sm text-blue-800 space-y-1">
                <div>• Resultado exacto: <strong>{pool.scoring_rules?.exactScore || 5} puntos</strong></div>
                <div>• Diferencia correcta: <strong>{pool.scoring_rules?.correctDifference || 3} puntos</strong></div>
                <div>• Ganador correcto: <strong>{pool.scoring_rules?.correctResult || 1} punto</strong></div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Miembros */}
            <div className="md:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Miembros ({members.length})
                </h2>
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold">
                        {member.users?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {member.users?.username}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Partidos */}
            <div className="md:col-span-2">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Partidos
                </h2>
                {matches.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    No hay partidos disponibles para este torneo aún.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {matches.map((match) => (
                      <div
                        key={match.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-gray-600">
                            {new Date(match.match_date).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              match.status === 'finished'
                                ? 'bg-gray-200 text-gray-700'
                                : match.status === 'live'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {match.status === 'finished' ? 'Finalizado' : match.status === 'live' ? 'En vivo' : 'Programado'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 text-right font-semibold text-gray-900">
                            {match.home_team}
                          </div>
                          <div className="px-6 text-center">
                            {match.status === 'finished' ? (
                              <div className="text-2xl font-bold text-gray-900">
                                {match.home_score} - {match.away_score}
                              </div>
                            ) : (
                              <div className="text-gray-400 text-sm">vs</div>
                            )}
                          </div>
                          <div className="flex-1 font-semibold text-gray-900">
                            {match.away_team}
                          </div>
                        </div>
                        {match.status === 'scheduled' && (
                          <div className="mt-3">
                            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition">
                              Hacer predicción
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
