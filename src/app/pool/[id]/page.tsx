'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getTeamFlagUrl } from '@/lib/flags'
import TeamFlag from '@/components/TeamFlag'
import Link from 'next/link'

export default function PoolDetailPage() {
  const params = useParams()
  const router = useRouter()
  const poolId = params.id as string

  const [pool, setPool] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [ranking, setRanking] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
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

      // Obtener ranking
      const { data: rankingData } = await supabase
        .from('pool_rankings')
        .select('*')
        .eq('pool_id', poolId)
        .order('total_points', { ascending: false })

      if (rankingData) {
        setRanking(rankingData)
      }

      // Obtener predicciones del usuario actual
      const { data: predictionsData } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('pool_id', poolId)

      if (predictionsData) {
        setPredictions(predictionsData)
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-700 border-t-green-500"></div>
          <p className="text-gray-400 text-sm">Cargando polla...</p>
        </div>
      </div>
    )
  }

  if (!pool) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-white mb-4">Polla no encontrada</h1>
          <Link href="/dashboard" className="text-green-400 hover:text-green-300 underline">
            Volver al Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2 text-green-400 hover:text-green-300 font-semibold transition">
            ← Dashboard
          </Link>
          <div className="text-sm text-gray-400">
            Admin: <span className="text-white font-semibold">{pool.users?.username}</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-green-800 to-green-950 rounded-2xl p-8 shadow-2xl">
            <div
              className="absolute inset-0 opacity-5"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px' }}
            />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-5xl">⚽</span>
                  <div>
                    <h1 className="text-3xl font-black text-white">{pool.name}</h1>
                    <span className="inline-block mt-1 px-3 py-1 bg-white/20 rounded-full text-green-100 text-sm font-medium">
                      {pool.tournament_id}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="flex items-center gap-1.5 bg-yellow-400/20 border border-yellow-500/40 rounded-full px-3 py-1 text-sm">
                    <span className="text-yellow-300 font-bold">{pool.scoring_rules?.exactScore || 5} pts</span>
                    <span className="text-yellow-200/60">resultado exacto</span>
                  </span>
                  <span className="flex items-center gap-1.5 bg-blue-400/20 border border-blue-500/40 rounded-full px-3 py-1 text-sm">
                    <span className="text-blue-300 font-bold">{pool.scoring_rules?.correctDifference || 3} pts</span>
                    <span className="text-blue-200/60">diferencia</span>
                  </span>
                  <span className="flex items-center gap-1.5 bg-purple-400/20 border border-purple-500/40 rounded-full px-3 py-1 text-sm">
                    <span className="text-purple-300 font-bold">{pool.scoring_rules?.correctResult || 1} pt</span>
                    <span className="text-purple-200/60">ganador</span>
                  </span>
                </div>
              </div>
              <div className="bg-black/30 backdrop-blur rounded-2xl p-5 text-center min-w-[200px] border border-white/10">
                <p className="text-green-300 text-xs uppercase tracking-widest mb-2 font-semibold">Código de invitación</p>
                <div className="font-mono font-black text-3xl text-white tracking-[0.25em] mb-4">{pool.invite_code}</div>
                <button
                  onClick={copyInviteLink}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-xl text-sm transition"
                >
                  📋 Copiar link
                </button>
              </div>
            </div>
          </div>

          {/* Ranking */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <h2 className="text-xl font-bold text-white">Tabla de Posiciones</h2>
              <span className="ml-auto text-sm text-gray-500">{members.length} participantes</span>
            </div>
            {ranking.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-5xl mb-4">📊</div>
                <p className="text-gray-500">El ranking aparecerá cuando los participantes hagan predicciones.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {ranking.map((entry, index) => {
                  const medals = ['🥇', '🥈', '🥉']
                  const isMe = entry.user_id === user?.id
                  return (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-4 px-6 py-4 transition ${
                        isMe ? 'bg-green-950/60' : 'hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="w-10 text-center">
                        {index < 3
                          ? <span className="text-2xl">{medals[index]}</span>
                          : <span className="text-gray-500 font-bold text-sm">#{index + 1}</span>
                        }
                      </div>
                      <div className="w-9 h-9 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {entry.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-white">{entry.username}</span>
                        {isMe && <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Tú</span>}
                      </div>
                      <div className="text-sm text-gray-500 hidden sm:block">{entry.predictions_count || 0} predicciones</div>
                      <div className="text-2xl font-black text-green-400 min-w-[48px] text-right">{entry.total_points || 0}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Grid Partidos + Miembros */}
          <div className="grid md:grid-cols-3 gap-6">

            {/* Miembros */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-xl">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="text-lg font-bold text-white">
                  👥 Miembros <span className="text-gray-500 font-normal text-sm">({members.length})</span>
                </h2>
              </div>
              <div className="p-4 space-y-2">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition"
                  >
                    <div className="w-9 h-9 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {member.users?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="font-medium text-gray-200 truncate">{member.users?.username}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Partidos */}
            <div className="md:col-span-2 bg-gray-900 rounded-2xl border border-gray-800 shadow-xl">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="text-lg font-bold text-white">⚽ Partidos</h2>
              </div>
              <div className="p-4">
                {matches.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="text-5xl mb-4">📅</div>
                    <p className="text-gray-500">No hay partidos disponibles para este torneo aún.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matches.map((match) => {
                      const prediction = predictions.find(p => p.match_id === match.id)
                      const isLive = match.status === 'live'
                      const isFinished = match.status === 'finished'
                      const isScheduled = match.status === 'scheduled'

                      return (
                        <div
                          key={match.id}
                          className={`rounded-xl border transition overflow-hidden ${
                            isLive
                              ? 'border-red-500/60 bg-red-950/20'
                              : isFinished
                              ? 'border-gray-700 bg-gray-800/30'
                              : 'border-gray-700 bg-gray-800/50 hover:border-green-600/50'
                          }`}
                        >
                          {/* Status bar */}
                          <div className="flex justify-between items-center px-4 py-2 bg-black/20">
                            <span className="text-gray-400 text-xs">
                              {new Date(match.match_date).toLocaleDateString('es-ES', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              isLive
                                ? 'bg-red-500 text-white'
                                : isFinished
                                ? 'bg-gray-700 text-gray-300'
                                : 'bg-blue-900 text-blue-300'
                            }`}>
                              {isLive && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>}
                              {isLive ? 'En vivo' : isFinished ? 'Finalizado' : 'Programado'}
                            </span>
                          </div>

                          {/* Teams */}
                          <div className="flex items-center px-4 py-4 gap-2">
                            <div className="flex-1 flex items-center justify-end gap-2">
                              <span className="font-bold text-white text-sm text-right leading-tight">{match.home_team}</span>
                              <TeamFlag team={match.home_team} size="lg" />
                            </div>
                            <div className="px-3 text-center min-w-[72px]">
                              {isFinished ? (
                                <div className="text-2xl font-black text-white">{match.home_score} - {match.away_score}</div>
                              ) : (
                                <div className="text-gray-600 text-xs font-black uppercase tracking-widest">vs</div>
                              )}
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                              <TeamFlag team={match.away_team} size="lg" />
                              <span className="font-bold text-white text-sm leading-tight">{match.away_team}</span>
                            </div>
                          </div>

                          {/* Predicción */}
                          {prediction && (
                            <div className="mx-4 mb-3 px-3 py-2 bg-blue-900/40 border border-blue-700/50 rounded-lg flex items-center justify-between">
                              <span className="text-blue-300 text-xs font-semibold">Tu predicción</span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">
                                  {prediction.predicted_home_score} - {prediction.predicted_away_score}
                                </span>
                                {isFinished && prediction.points_earned !== null && (
                                  <span className="px-2 py-0.5 bg-green-600 text-white rounded-full text-xs font-bold">
                                    +{prediction.points_earned} pts
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* CTA */}
                          {isScheduled && (
                            <div className="px-4 pb-4">
                              <Link
                                href={`/pool/${poolId}/predict/${match.id}`}
                                className="block w-full text-center bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded-xl text-sm transition"
                              >
                                {prediction ? '✏️ Editar predicción' : '🔮 Hacer predicción'}
                              </Link>
                            </div>
                          )}
                        </div>
                      )
                    })}
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
