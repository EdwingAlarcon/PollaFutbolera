'use client'

import { useEffect, useState, Fragment } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TeamFlag from '@/components/TeamFlag'
import Link from 'next/link'

type Tab = 'predictions' | 'positions' | 'info'

const ROUND_LABELS: Record<string, { label: string; emoji: string }> = {
  'group':        { label: 'Fase de Grupos',   emoji: '⚽' },
  'round-of-32':  { label: 'Ronda de 32',      emoji: '⚡' },
  'round-of-16':  { label: 'Octavos de Final', emoji: '🔥' },
  'quarterfinal': { label: 'Cuartos de Final', emoji: '💥' },
  'semifinal':    { label: 'Semifinales',      emoji: '🌟' },
  'third-place':  { label: 'Tercer Lugar',     emoji: '🥉' },
  'final':        { label: 'Final',            emoji: '🏆' },
}

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
  const [showTc, setShowTc] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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

  const handleDeletePool = async () => {
    setDeleting(true)
    setDeleteError(null)
    const { error } = await supabase
      .from('pools')
      .delete()
      .eq('id', poolId)
    if (error) {
      setDeleteError(error.message)
      setDeleting(false)
    } else {
      router.push('/dashboard')
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

            {/* ── T&C Copa Mundial 2026 (aviso colapsable para todos los participantes) ── */}
            {pool.tournament_id === 'world-cup-2026' && (
              <div className="mb-4 border border-yellow-700/30 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowTc(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-yellow-900/15 hover:bg-yellow-900/25 transition text-left"
                >
                  <span className="text-yellow-300/80 text-xs font-bold">🏆 Premio al Ganador &amp; Términos y Condiciones</span>
                  <span className="text-yellow-600 text-xs">{showTc ? '▲ Ocultar' : '▼ Ver'}</span>
                </button>
                {showTc && (
                  <div className="px-4 pb-4 pt-2 space-y-2 text-xs text-yellow-200/60 leading-relaxed bg-yellow-900/10">
                    <p className="text-yellow-300 font-bold text-sm">🏆 Premio al Ganador: Una (1) camiseta original de tu equipo favorito del torneo. <span className="font-normal text-yellow-500/70">(Aplican términos y condiciones)</span></p>
                    <p><strong className="text-yellow-300/80">Selección de Equipo:</strong> La camiseta debe ser de uno de los equipos que participan activamente en el torneo actual.</p>
                    <p><strong className="text-yellow-300/80">Versión:</strong> Camiseta original en versión aficionado/hincha. No aplica para versiones Match/Jugador de alto rendimiento.</p>
                    <p><strong className="text-yellow-300/80">Temporada:</strong> Primera o segunda equipación (local o visitante) de la temporada vigente. No aplican ediciones retro, conmemorativas o de años anteriores.</p>
                    <p><strong className="text-yellow-300/80">Personalización:</strong> La prenda se entrega en estado comercial estándar. No incluye estampados de nombres, números ni parches adicionales.</p>
                    <p><strong className="text-yellow-300/80">Disponibilidad:</strong> Sujeta a disponibilidad de inventario en tiendas oficiales o distribuidores autorizados a nivel nacional al finalizar el torneo. En caso de no haber stock, se acordará una alternativa de igual valor con el ganador.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Banner: partidos próximos sin pronóstico ── */}
            {(() => {
              const now = Date.now()
              const soonMissed = matches.filter(m => {
                const t = new Date(m.match_date).getTime()
                return m.status === 'scheduled' && t > now && t < now + 60 * 60 * 1000
                  && !predictions.find(p => p.match_id === m.id)
              })
              if (soonMissed.length === 0) return null
              return (
                <div className="mb-4 flex items-start gap-3 px-4 py-3 bg-orange-900/25 border border-orange-700/50 rounded-xl">
                  <span className="text-xl flex-shrink-0 mt-0.5">⚠️</span>
                  <div>
                    <p className="text-orange-300 font-bold text-sm">
                      {soonMissed.length === 1
                        ? '¡1 partido comienza en menos de 1 hora y no tienes pronóstico!'
                        : `¡${soonMissed.length} partidos comienzan en menos de 1 hora sin pronóstico!`}
                    </p>
                    <p className="text-orange-400/70 text-xs mt-1 leading-relaxed">
                      {soonMissed.map(m => `${m.home_team} vs ${m.away_team}`).join(' · ')}
                    </p>
                    <p className="text-orange-500/60 text-xs mt-1">
                      Los campos se bloquean automáticamente al inicio del partido.
                    </p>
                  </div>
                </div>
              )
            })()}

            {matches.length === 0 ? (
              <div className="text-center py-16 text-gray-500 space-y-3 px-4">
                <div className="text-6xl">📅</div>
                <p className="text-gray-300 font-bold text-base">Aún no hay partidos cargados para este torneo.</p>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Los partidos se agregan desde el Panel Admin. Una vez cargados, aparecerán aquí para que todos puedan ingresar sus pronósticos.
                </p>
                {user?.id === pool.admin_id && (
                  <p className="text-yellow-400/80 text-xs mt-2 bg-yellow-900/20 border border-yellow-700/30 rounded-xl px-4 py-2 inline-block">
                    ⚠️ Eres el admin de esta polla. Solicita al administrador del sistema que cargue los partidos del torneo <strong>{pool.tournament_id}</strong>.
                  </p>
                )}
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
                  {matches.map((match: any, idx: number) => {
                    const round = match.round || 'group'
                    const prevRound = idx > 0 ? ((matches as any[])[idx - 1].round || 'group') : null
                    const showRoundHeader = round !== prevRound
                    const prediction = predictions.find((p: any) => p.match_id === match.id)
                    const local = localPredictions[match.id]
                    const editable = canPredict(match)
                    const isLive = match.status === 'live'
                    const isFinished = match.status === 'finished'

                    return (
                      <Fragment key={match.id}>
                        {showRoundHeader && (
                          <div className="bg-gray-800/50 border-b border-gray-700/60 px-5 py-2.5 flex items-center gap-2.5">
                            <span className="text-base">{ROUND_LABELS[round]?.emoji}</span>
                            <span className="text-xs font-black text-gray-300 uppercase tracking-widest">{ROUND_LABELS[round]?.label}</span>
                            <span className="ml-auto text-gray-600 text-xs">
                              {(matches as any[]).filter((m: any) => (m.round || 'group') === round).length} partidos
                            </span>
                          </div>
                        )}
                        <div
                          className={`transition ${
                          isLive
                            ? 'bg-red-950/20'
                            : isFinished && !prediction
                            ? 'bg-red-950/10'
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
                            <div className="flex items-center justify-center min-w-[84px]">
                              {editable ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number" min="0" max="99"
                                    value={local?.home ?? ''}
                                    onChange={e => updateScore(match.id, 'home', e.target.value)}
                                    className="w-10 h-10 text-center font-black text-lg bg-gray-800 border-2 border-gray-700 focus:border-green-500 rounded-lg text-white outline-none"
                                    placeholder="-"
                                  />
                                  <span className="text-gray-600 font-black">:</span>
                                  <input
                                    type="number" min="0" max="99"
                                    value={local?.away ?? ''}
                                    onChange={e => updateScore(match.id, 'away', e.target.value)}
                                    className="w-10 h-10 text-center font-black text-lg bg-gray-800 border-2 border-gray-700 focus:border-green-500 rounded-lg text-white outline-none"
                                    placeholder="-"
                                  />
                                </div>
                              ) : prediction ? (
                                <span className="bg-gray-700 border border-gray-600 text-white font-black text-base px-2.5 py-1.5 rounded-lg tabular-nums">
                                  {prediction.predicted_home_score} : {prediction.predicted_away_score}
                                </span>
                              ) : (
                                <span className="flex flex-col items-center gap-0.5 text-red-400/70">
                                  <span className="text-base">🔒</span>
                                  <span className="text-[10px] font-bold leading-tight text-center">Sin<br/>pronóstico</span>
                                </span>
                              )}
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
                          <div className="flex items-center justify-center min-w-[110px]">
                            {editable ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number" min="0" max="99"
                                  value={local?.home ?? ''}
                                  onChange={e => updateScore(match.id, 'home', e.target.value)}
                                  className="w-11 h-10 text-center font-black text-base bg-gray-800 border-2 border-gray-700 focus:border-green-500 rounded-lg text-white outline-none"
                                  placeholder="-"
                                />
                                <span className="text-gray-600 font-black text-sm">:</span>
                                <input
                                  type="number" min="0" max="99"
                                  value={local?.away ?? ''}
                                  onChange={e => updateScore(match.id, 'away', e.target.value)}
                                  className="w-11 h-10 text-center font-black text-base bg-gray-800 border-2 border-gray-700 focus:border-green-500 rounded-lg text-white outline-none"
                                  placeholder="-"
                                />
                              </div>
                            ) : prediction ? (
                              <span className="bg-gray-700 border border-gray-600 text-white font-black text-base px-3 py-2 rounded-lg tabular-nums tracking-wide">
                                {prediction.predicted_home_score} : {prediction.predicted_away_score}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-red-400/70">
                                <span className="text-sm">🔒</span>
                                <span className="text-xs font-bold">Sin pronóstico</span>
                              </span>
                            )}
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
                      </Fragment>
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

            {pool.prizes && pool.prizes.length > 0 && (
              <div className="bg-gray-900 rounded-2xl border border-yellow-700/40 p-6">
                <h2 className="text-lg font-bold text-white mb-4">🏆 Premios</h2>
                <div className="space-y-3">
                  {pool.prizes.map((p: { position: string; prize: string }, i: number) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 bg-yellow-900/20 border border-yellow-700/30 rounded-xl">
                      <span className="text-gray-300 font-semibold text-sm">{p.position}</span>
                      <span className="text-yellow-300 font-black text-base">{p.prize}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* T&C — visible en Info General para todos (admin y participantes) */}
            {pool.tournament_id === 'world-cup-2026' && (
              <div className="bg-gray-900 rounded-2xl border border-yellow-700/30 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowTc(v => !v)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-yellow-900/10 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📋</span>
                    <div>
                      <p className="text-yellow-300 font-bold text-sm">Términos y Condiciones del Premio</p>
                      <p className="text-yellow-600/70 text-xs mt-0.5">Copa Mundial FIFA 2026 · Camiseta oficial al ganador</p>
                    </div>
                  </div>
                  <span className="text-yellow-500 text-sm font-bold">{showTc ? '▲ Ocultar' : '▼ Leer'}</span>
                </button>
                {showTc && (
                  <div className="px-6 pb-5 pt-1 border-t border-yellow-700/20 bg-yellow-900/10 space-y-3 text-xs text-yellow-200/60 leading-relaxed">
                    <p className="text-yellow-300 font-bold text-sm pt-2">🏆 Premio al Ganador: Una (1) camiseta original de tu equipo favorito del torneo.</p>
                    <div className="space-y-2">
                      <p><strong className="text-yellow-300/80">Selección de Equipo:</strong> La camiseta debe ser de uno de los equipos que participan activamente en el torneo actual.</p>
                      <p><strong className="text-yellow-300/80">Versión:</strong> Camiseta original en versión aficionado/hincha. No aplica para versiones Match/Jugador de alto rendimiento.</p>
                      <p><strong className="text-yellow-300/80">Temporada:</strong> Primera o segunda equipación (local o visitante) de la temporada vigente. No aplican ediciones retro, conmemorativas o de años anteriores.</p>
                      <p><strong className="text-yellow-300/80">Personalización:</strong> La prenda se entrega en estado comercial estándar. No incluye estampados de nombres, números ni parches adicionales.</p>
                      <p><strong className="text-yellow-300/80">Disponibilidad:</strong> Sujeta a disponibilidad de inventario en tiendas oficiales o distribuidores autorizados a nivel nacional al finalizar el torneo. En caso de no haber stock, se acordará una alternativa de igual valor con el ganador.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

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

            {/* ── Zona peligrosa: solo visible para el admin de la polla ── */}
            {user?.id === pool.admin_id && (
              <div className="bg-gray-900 rounded-2xl border border-red-800/40 p-6">
                <h2 className="text-lg font-bold text-red-400 mb-1">⚠️ Zona de Peligro</h2>
                <p className="text-gray-500 text-xs mb-4">Estas acciones son irreversibles. Solo el administrador de la polla puede ejecutarlas.</p>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => { setShowDeleteConfirm(true); setDeleteError(null) }}
                    className="bg-red-900/40 hover:bg-red-900/70 border border-red-700/50 text-red-300 font-bold px-5 py-2.5 rounded-xl text-sm transition"
                  >
                    🗑️ Eliminar esta polla
                  </button>
                ) : (
                  <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 space-y-3">
                    <p className="text-red-300 font-bold text-sm">¿Estás seguro que deseas eliminar <span className="text-white">"{pool.name}"</span>?</p>
                    <p className="text-red-400/70 text-xs leading-relaxed">
                      Se eliminarán permanentemente: la polla, todos los pronósticos de los participantes y el historial de puntos. Esta acción <strong className="text-red-300">no se puede deshacer</strong>.
                    </p>
                    {deleteError && (
                      <p className="text-red-400 text-xs bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">{deleteError}</p>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setShowDeleteConfirm(false); setDeleteError(null) }}
                        disabled={deleting}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-bold py-2.5 rounded-xl text-sm transition"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleDeletePool}
                        disabled={deleting}
                        className="flex-1 bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-black py-2.5 rounded-xl text-sm transition"
                      >
                        {deleting ? '⏳ Eliminando...' : '🗑️ Sí, eliminar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
