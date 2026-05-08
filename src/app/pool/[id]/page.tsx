'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TeamFlag from '@/components/TeamFlag'
import Link from 'next/link'

type Tab = 'predictions' | 'positions' | 'info'

export default function PoolDetailPage() {
  const params = useParams()
  const router = useRouter()
  const poolId = params.id as string

  const [pool, setPool] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [ranking, setRanking] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [localPredictions, setLocalPredictions] = useState<Record<string, { home: string; away: string }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<Tab>('predictions')
  const [copied, setCopied] = useState(false)

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
        // Inicializar localPredictions desde las predicciones existentes
        const local: Record<string, { home: string; away: string }> = {}
        predictionsData.forEach(p => {
          local[p.match_id] = {
            home: p.predicted_home_score.toString(),
            away: p.predicted_away_score.toString(),
          }
        })
        setLocalPredictions(local)
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
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canPredict = (match: any) =>
    match.status === 'scheduled' && new Date(match.match_date) > new Date()

  const updateScore = (matchId: string, side: 'home' | 'away', value: string) => {
    const num = value.replace(/[^0-9]/g, '')
    setLocalPredictions(prev => ({
      ...prev,
      [matchId]: {
        home: prev[matchId]?.home ?? '',
        away: prev[matchId]?.away ?? '',
        [side]: num,
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg(null)
    try {
      const toSave = Object.entries(localPredictions).filter(([matchId, v]) => {
        const match = matches.find(m => m.id === matchId)
        return v.home !== '' && v.away !== '' && canPredict(match)
      })

      for (const [matchId, scores] of toSave) {
        const existing = predictions.find(p => p.match_id === matchId)
        if (existing) {
          await supabase
            .from('predictions')
            .update({
              predicted_home_score: parseInt(scores.home),
              predicted_away_score: parseInt(scores.away),
            })
            .eq('id', existing.id)
        } else {
          await supabase.from('predictions').insert({
            user_id: user.id,
            match_id: matchId,
            pool_id: poolId,
            predicted_home_score: parseInt(scores.home),
            predicted_away_score: parseInt(scores.away),
          })
        }
      }

      const { data: predictionsData } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id)
        .eq('pool_id', poolId)
      if (predictionsData) setPredictions(predictionsData)

      setSaveMsg(`✅ ${toSave.length} predicción(es) guardadas correctamente`)
    } catch (err: any) {
      setSaveMsg(`❌ Error: ${err.message}`)
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(null), 4000)
    }
  }

  const filledCount = matches.filter(
    m => localPredictions[m.id]?.home !== '' && localPredictions[m.id]?.away !== '' &&
         localPredictions[m.id]?.home !== undefined && localPredictions[m.id]?.away !== undefined
  ).length

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

  const tabs: { id: Tab; label: string }[] = [
    { id: 'predictions', label: 'Pronósticos' },
    { id: 'positions', label: 'Posiciones' },
    { id: 'info', label: 'Info General' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/dashboard" className="text-green-400 hover:text-green-300 font-semibold transition text-sm">
            ← Dashboard
          </Link>
          <div className="font-bold text-white truncate max-w-[200px] text-sm">{pool.name}</div>
          <div className="text-sm text-gray-500 hidden sm:block">
            Admin: <span className="text-gray-300">{pool.users?.username}</span>
          </div>
        </div>
      </nav>

      {/* Pool Header + Tabs */}
      <div className="bg-gradient-to-r from-green-900 to-green-950 border-b border-green-800/60">
        <div className="container mx-auto px-4 pt-5 pb-0 max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-black text-white">{pool.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-green-300 text-sm font-medium">{pool.tournament_id}</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400 text-sm">{members.length} participantes</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400 text-sm">{matches.length} partidos</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-black/30 rounded-xl px-4 py-2 border border-white/10 text-center">
                <p className="text-green-400 text-xs uppercase tracking-widest mb-0.5">Código</p>
                <p className="font-mono font-black text-lg tracking-[0.2em] text-white">{pool.invite_code}</p>
              </div>
              <button
                onClick={copyInviteLink}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-xl text-sm transition"
              >
                {copied ? '✅ Copiado' : '📋 Invitar'}
              </button>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-green-400 text-green-400 bg-gray-950/40'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-black/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">

        {/* ===== TAB: PRONÓSTICOS ===== */}
        {activeTab === 'predictions' && (
          <div>
            {/* Recommendations bar */}
            <div className="bg-yellow-950/50 border border-yellow-700/40 rounded-xl p-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-yellow-300 text-sm font-bold mb-1">⚠️ RECOMENDACIONES GENERALES</p>
                <p className="text-yellow-200/60 text-xs">• Ingresa los pronósticos con tiempo. NO dejar para último momento. Validar que hayan quedado correctamente almacenados.</p>
                <p className="text-yellow-200/60 text-xs">• Se debe dar clic en GUARDAR para que queden registrados. Marcador en blanco no significa cero goles.</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm text-gray-400">
                  <span className="text-white font-bold">{filledCount}</span>
                  <span className="text-gray-600"> / </span>
                  <span>{matches.length}</span>
                </span>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-black py-2.5 px-6 rounded-xl transition flex items-center gap-2 text-sm"
                >
                  {saving ? <><span className="animate-spin inline-block">⏳</span> Guardando...</> : <>💾 GUARDAR</>}
                </button>
              </div>
            </div>

            {saveMsg && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold ${
                saveMsg.startsWith('✅')
                  ? 'bg-green-900/50 border border-green-700 text-green-300'
                  : 'bg-red-900/50 border border-red-700 text-red-300'
              }`}>
                {saveMsg}
              </div>
            )}

            {matches.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <div className="text-6xl mb-4">📅</div>
                <p>No hay partidos disponibles para este torneo aún.</p>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                {/* Desktop header */}
                <div className="hidden md:grid md:grid-cols-[48px_130px_1fr_110px_1fr_110px_64px] gap-2 px-4 py-3 bg-gray-800/80 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700">
                  <div className="text-center">#</div>
                  <div>Horario</div>
                  <div className="text-right pr-2">Local</div>
                  <div className="text-center">Pronóstico</div>
                  <div className="pl-2">Visitante</div>
                  <div className="text-center">Resultado</div>
                  <div className="text-center">Pts</div>
                </div>

                <div className="divide-y divide-gray-800/80">
                  {matches.map((match, idx) => {
                    const prediction = predictions.find(p => p.match_id === match.id)
                    const local = localPredictions[match.id]
                    const editable = canPredict(match)
                    const isLive = match.status === 'live'
                    const isFinished = match.status === 'finished'

                    return (
                      <div
                        key={match.id}
                        className={`transition ${
                          isLive
                            ? 'bg-red-950/20'
                            : isFinished
                            ? ''
                            : local?.home !== undefined && local?.home !== ''
                            ? 'bg-green-950/10'
                            : ''
                        }`}
                      >
                        {/* ── MOBILE ── */}
                        <div className="md:hidden px-4 py-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-500 text-xs">
                              {new Date(match.match_date).toLocaleDateString('es-ES', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              isLive ? 'bg-red-500 text-white' : isFinished ? 'bg-gray-700 text-gray-300' : 'bg-blue-900/60 text-blue-300'
                            }`}>
                              {isLive ? '🔴 En vivo' : isFinished ? 'Finalizado' : 'Pendiente'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <span className="text-white font-semibold text-sm text-right leading-tight">{match.home_team}</span>
                              <TeamFlag team={match.home_team} size="sm" />
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="number" min="0" max="99"
                                value={local?.home ?? ''}
                                onChange={e => updateScore(match.id, 'home', e.target.value)}
                                disabled={!editable}
                                className="w-10 h-10 text-center font-black text-lg bg-gray-800 border-2 border-gray-700 focus:border-green-500 rounded-lg text-white outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                                placeholder="-"
                              />
                              <span className="text-gray-600 font-black">:</span>
                              <input
                                type="number" min="0" max="99"
                                value={local?.away ?? ''}
                                onChange={e => updateScore(match.id, 'away', e.target.value)}
                                disabled={!editable}
                                className="w-10 h-10 text-center font-black text-lg bg-gray-800 border-2 border-gray-700 focus:border-green-500 rounded-lg text-white outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                                placeholder="-"
                              />
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                              <TeamFlag team={match.away_team} size="sm" />
                              <span className="text-white font-semibold text-sm leading-tight">{match.away_team}</span>
                            </div>
                          </div>
                          {isFinished && (
                            <div className="mt-2 flex items-center justify-end gap-2">
                              <span className="text-gray-400 text-xs">
                                Resultado: <span className="text-white font-bold">{match.home_score} - {match.away_score}</span>
                              </span>
                              {prediction?.points_earned != null && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${prediction.points_earned > 0 ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-400'}`}>
                                  +{prediction.points_earned} pts
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* ── DESKTOP ── */}
                        <div className="hidden md:grid md:grid-cols-[48px_130px_1fr_110px_1fr_110px_64px] gap-2 px-4 py-3 items-center">
                          <div className="text-gray-600 text-xs font-mono text-center">#{idx + 1}</div>
                          <div>
                            <div className="text-gray-300 text-xs">
                              {new Date(match.match_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                            </div>
                            <div className="text-gray-600 text-xs">
                              {new Date(match.match_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 pr-2">
                            <span className="text-white font-semibold text-sm text-right leading-tight">{match.home_team}</span>
                            <TeamFlag team={match.home_team} size="md" />
                          </div>
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number" min="0" max="99"
                              value={local?.home ?? ''}
                              onChange={e => updateScore(match.id, 'home', e.target.value)}
                              disabled={!editable}
                              className="w-11 h-10 text-center font-black text-base bg-gray-800 border-2 border-gray-700 focus:border-green-500 rounded-lg text-white outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                              placeholder="-"
                            />
                            <span className="text-gray-600 font-black text-sm">:</span>
                            <input
                              type="number" min="0" max="99"
                              value={local?.away ?? ''}
                              onChange={e => updateScore(match.id, 'away', e.target.value)}
                              disabled={!editable}
                              className="w-11 h-10 text-center font-black text-base bg-gray-800 border-2 border-gray-700 focus:border-green-500 rounded-lg text-white outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                              placeholder="-"
                            />
                          </div>
                          <div className="flex items-center gap-2 pl-2">
                            <TeamFlag team={match.away_team} size="md" />
                            <span className="text-white font-semibold text-sm leading-tight">{match.away_team}</span>
                          </div>
                          <div className="text-center">
                            {isFinished ? (
                              <span className="text-white font-bold text-sm">{match.home_score} - {match.away_score}</span>
                            ) : isLive ? (
                              <span className="flex items-center justify-center gap-1 text-red-400 text-xs font-bold">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block"></span>
                                En vivo
                              </span>
                            ) : (
                              <span className="text-gray-700 text-xs">-</span>
                            )}
                          </div>
                          <div className="text-center">
                            {isFinished && prediction?.points_earned != null ? (
                              <span className={`font-black text-xl ${prediction.points_earned > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                                {prediction.points_earned}
                              </span>
                            ) : (
                              <span className="text-gray-700">-</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {matches.length > 0 && (
              <div className="mt-5 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-black py-3 px-10 rounded-xl transition text-sm flex items-center gap-2"
                >
                  {saving ? '⏳ Guardando...' : '💾 GUARDAR PRONÓSTICOS'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: POSICIONES ===== */}
        {activeTab === 'positions' && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">🏆 Tabla de Posiciones</h2>
              <span className="text-sm text-gray-500">{members.length} participantes</span>
            </div>
            {ranking.length === 0 ? (
              <div className="py-20 text-center">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-500 text-sm">El ranking aparecerá cuando haya partidos finalizados.</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-[48px_1fr_110px_80px] gap-2 px-6 py-3 bg-gray-800/60 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700">
                  <div>Pos</div>
                  <div>Jugador</div>
                  <div className="text-center">Predicciones</div>
                  <div className="text-center">Puntos</div>
                </div>
                <div className="divide-y divide-gray-800">
                  {ranking.map((entry, index) => {
                    const medals = ['🥇', '🥈', '🥉']
                    const isMe = entry.user_id === user?.id
                    return (
                      <div
                        key={entry.user_id}
                        className={`grid grid-cols-[48px_1fr_110px_80px] gap-2 px-6 py-4 items-center transition ${
                          isMe ? 'bg-green-950/50' : 'hover:bg-gray-800/40'
                        }`}
                      >
                        <div>
                          {index < 3
                            ? <span className="text-2xl">{medals[index]}</span>
                            : <span className="text-gray-500 font-bold text-sm">#{index + 1}</span>
                          }
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {entry.username?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <span className="font-semibold text-white">{entry.username}</span>
                            {isMe && <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Tú</span>}
                          </div>
                        </div>
                        <div className="text-center text-gray-400 text-sm">{entry.predictions_count || 0}</div>
                        <div className="text-center font-black text-2xl text-green-400">{entry.total_points || 0}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: INFO GENERAL ===== */}
        {activeTab === 'info' && (
          <div className="space-y-5">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Información de la Polla</h2>
              <div className="divide-y divide-gray-800">
                {[
                  { label: 'Nombre', value: pool.name },
                  { label: 'Torneo', value: pool.tournament_id },
                  { label: 'Administrador', value: pool.users?.username },
                  { label: 'Participantes', value: `${members.length} miembros` },
                  { label: 'Partidos', value: `${matches.length} partidos` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-3">
                    <span className="text-gray-500 text-sm">{row.label}</span>
                    <span className="text-white font-semibold text-sm">{row.value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-500 text-sm">Código de invitación</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-green-400 text-lg">{pool.invite_code}</span>
                    <button
                      onClick={copyInviteLink}
                      className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      {copied ? '✅ Copiado' : '📋 Copiar link'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Sistema de Puntuación</h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-yellow-900/30 border border-yellow-700/40 rounded-xl p-4 text-center">
                  <div className="text-yellow-400 font-black text-3xl">{pool.scoring_rules?.exactScore || 5}</div>
                  <div className="text-yellow-200/60 text-xs mt-1">Resultado exacto</div>
                </div>
                <div className="bg-blue-900/30 border border-blue-700/40 rounded-xl p-4 text-center">
                  <div className="text-blue-400 font-black text-3xl">{pool.scoring_rules?.correctDifference || 3}</div>
                  <div className="text-blue-200/60 text-xs mt-1">Diferencia correcta</div>
                </div>
                <div className="bg-purple-900/30 border border-purple-700/40 rounded-xl p-4 text-center">
                  <div className="text-purple-400 font-black text-3xl">{pool.scoring_rules?.correctResult || 1}</div>
                  <div className="text-purple-200/60 text-xs mt-1">Ganador correcto</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h2 className="text-lg font-bold text-white mb-4">👥 Participantes ({members.length})</h2>
              <div className="space-y-2">
                {members.map(member => (
                  <div key={member.user_id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {member.users?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="font-medium text-gray-200">{member.users?.username}</span>
                    {member.user_id === user?.id && (
                      <span className="ml-auto text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Tú</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
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
