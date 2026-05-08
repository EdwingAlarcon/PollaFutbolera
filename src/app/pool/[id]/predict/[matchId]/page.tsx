'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Partido no encontrado</h1>
          <Link href={`/pool/${poolId}`} className="text-green-600 hover:underline">
            Volver a la polla
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href={`/pool/${poolId}`} className="text-green-600 hover:text-green-700 font-semibold">
            ← Volver a la polla
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              {prediction ? 'Editar Predicción' : 'Hacer Predicción'}
            </h1>
            <p className="text-gray-600 mb-6 text-center text-sm">
              {new Date(match.match_date).toLocaleDateString('es-ES', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="mb-8">
              <div className="flex items-center justify-between gap-8">
                {/* Equipo Local */}
                <div className="flex-1 text-center">
                  <div className="text-4xl mb-4">🏠</div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {match.home_team}
                  </h2>
                  <input
                    type="number"
                    min="0"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    className="w-24 h-24 text-center text-4xl font-bold border-4 border-gray-300 rounded-lg focus:ring-4 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                    placeholder="0"
                  />
                </div>

                {/* VS */}
                <div className="text-gray-400 text-2xl font-bold">VS</div>

                {/* Equipo Visitante */}
                <div className="flex-1 text-center">
                  <div className="text-4xl mb-4">✈️</div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {match.away_team}
                  </h2>
                  <input
                    type="number"
                    min="0"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    className="w-24 h-24 text-center text-4xl font-bold border-4 border-gray-300 rounded-lg focus:ring-4 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Reglas de puntuación */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm">
                Sistema de Puntuación:
              </h3>
              <div className="text-xs text-blue-800 space-y-1">
                <div>• Resultado exacto: <strong>{pool?.scoring_rules?.exactScore || 5} puntos</strong></div>
                <div>• Diferencia correcta: <strong>{pool?.scoring_rules?.correctDifference || 3} puntos</strong></div>
                <div>• Ganador correcto: <strong>{pool?.scoring_rules?.correctResult || 1} punto</strong></div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !homeScore || !awayScore}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : prediction ? 'Actualizar Predicción' : 'Guardar Predicción'}
            </button>

            {prediction && (
              <p className="text-center text-sm text-gray-600 mt-4">
                Puedes editar tu predicción hasta que comience el partido
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
