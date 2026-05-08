'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getTeamFlagUrl } from '@/lib/flags'
import TeamFlag from '@/components/TeamFlag'
import Link from 'next/link'

export default function PredictMatchPage() {
  const params = useParams()
  const router = useRouter()
  const poolId = params.id as string
  const matchId = params.matchId as string

  const [match, setMatch] = useState<any>(null)
  const [pool, setPool] = useState<any>(null)
  const [prediction, setPrediction] = useState<any>(null)
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [poolId, matchId])

  const loadData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }
      setUser(authUser)

      // Obtener partido
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (matchData) {
        setMatch(matchData)
        
        // Verificar si ya pasó el partido
        if (new Date(matchData.match_date) <= new Date()) {
          setError('Este partido ya comenzó, no puedes hacer predicciones')
        }
      }

      // Obtener polla
      const { data: poolData } = await supabase
        .from('pools')
        .select('*')
        .eq('id', poolId)
        .single()

      setPool(poolData)

      // Verificar si ya existe una predicción
      const { data: existingPrediction } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('match_id', matchId)
        .eq('pool_id', poolId)
        .single()

      if (existingPrediction) {
        setPrediction(existingPrediction)
        setHomeScore(existingPrediction.predicted_home_score.toString())
        setAwayScore(existingPrediction.predicted_away_score.toString())
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!homeScore || !awayScore) {
      setError('Debes ingresar ambos marcadores')
      return
    }

    if (parseInt(homeScore) < 0 || parseInt(awayScore) < 0) {
      setError('Los marcadores deben ser números positivos')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (prediction) {
        // Actualizar predicción existente
        const { error: updateError } = await supabase
          .from('predictions')
          .update({
            predicted_home_score: parseInt(homeScore),
            predicted_away_score: parseInt(awayScore),
            updated_at: new Date().toISOString(),
          })
          .eq('id', prediction.id)

        if (updateError) throw updateError
      } else {
        // Crear nueva predicción
        const { error: insertError } = await supabase
          .from('predictions')
          .insert({
            user_id: user.id,
            match_id: matchId,
            pool_id: poolId,
            predicted_home_score: parseInt(homeScore),
            predicted_away_score: parseInt(awayScore),
          })

        if (insertError) throw insertError
      }

      router.push(`/pool/${poolId}`)
    } catch (err: any) {
      setError(err.message || 'Error al guardar la predicción')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1020] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-white/10 border-t-green-500"></div>
          <p className="text-slate-400 text-sm">Cargando partido...</p>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[#0B1020] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-white mb-4">Partido no encontrado</h1>
          <Link href={`/pool/${poolId}`} className="text-green-400 hover:text-green-300 underline">
            Volver a la polla
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-page min-h-screen bg-[#0B1020] text-white">
      <nav className="bg-[#0B1020]/90 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 py-4">
          <Link href={`/pool/${poolId}`} className="text-green-400 hover:text-green-300 font-semibold transition">
            ← Volver a la polla
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10">
        <div className="max-w-lg mx-auto">
          <div className="bg-[#131A2E] rounded-2xl border border-white/8 shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-green-900/60 to-[#0d1424] border-b border-green-800/30 px-8 py-6 text-center">
              <h1 className="text-2xl font-black text-white mb-1">
                {prediction ? '✏️ Editar Predicción' : '🔮 Hacer Predicción'}
              </h1>
              <p className="text-green-200 text-sm capitalize">
                {new Date(match.match_date).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="p-8">
              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-xl mb-6 text-sm">
                  ⚠️ {error}
                </div>
              )}

              {/* Teams + Inputs */}
              <div className="flex items-center justify-between gap-4 mb-8">
                {/* Local */}
                <div className="flex-1 text-center">
                  <div className="flex justify-center mb-3">
                    <TeamFlag team={match.home_team} espnId={match.home_team_espn_id} tournamentId={match.tournament_id} size="xl" />
                  </div>
                  <p className="font-bold text-white text-sm mb-4 leading-tight">{match.home_team}</p>
                  <input
                    type="number"
                    min="0"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    className="w-20 h-20 text-center text-4xl font-black border-2 border-white/10 rounded-xl focus:ring-4 focus:ring-green-500 focus:border-green-500 bg-white/5 text-white outline-none block mx-auto"
                    placeholder="0"
                  />
                </div>

                {/* Separador */}
                <div className="text-slate-700 text-3xl font-black pb-4">—</div>

                {/* Visitante */}
                <div className="flex-1 text-center">
                  <div className="flex justify-center mb-3">
                    <TeamFlag team={match.away_team} espnId={match.away_team_espn_id} tournamentId={match.tournament_id} size="xl" />
                  </div>
                  <p className="font-bold text-white text-sm mb-4 leading-tight">{match.away_team}</p>
                  <input
                    type="number"
                    min="0"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    className="w-20 h-20 text-center text-4xl font-black border-2 border-white/10 rounded-xl focus:ring-4 focus:ring-green-500 focus:border-green-500 bg-white/5 text-white outline-none block mx-auto"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Sistema de puntos */}
              <div className="grid grid-cols-3 gap-2 mb-8">
                <div className="bg-yellow-900/30 border border-yellow-700/40 rounded-xl p-3 text-center">
                  <div className="text-yellow-400 font-black text-xl">{pool?.scoring_rules?.exactScore || 5}</div>
                  <div className="text-yellow-200/60 text-xs mt-0.5">pts exacto</div>
                </div>
                <div className="bg-blue-900/30 border border-blue-700/40 rounded-xl p-3 text-center">
                  <div className="text-blue-400 font-black text-xl">{pool?.scoring_rules?.correctDifference || 3}</div>
                  <div className="text-blue-200/60 text-xs mt-0.5">pts diferencia</div>
                </div>
                <div className="bg-purple-900/30 border border-purple-700/40 rounded-xl p-3 text-center">
                  <div className="text-purple-400 font-black text-xl">{pool?.scoring_rules?.correctResult || 1}</div>
                  <div className="text-purple-200/60 text-xs mt-0.5">pt ganador</div>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !homeScore || !awayScore}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-white/5 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition text-lg"
              >
                {saving ? '⏳ Guardando...' : prediction ? '✅ Actualizar Predicción' : '🚀 Guardar Predicción'}
              </button>

              {prediction && (
                <p className="text-center text-xs text-gray-600 mt-4">
                  Puedes editar tu predicción hasta que comience el partido
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
