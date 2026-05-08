'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const TOURNAMENTS = [
  { id: 'world-cup-2026', label: 'Copa Mundo 2026' },
  { id: 'copa-america-2024', label: 'Copa América 2024' },
  { id: 'euro-2024', label: 'Euro 2024' },
  { id: 'champions-league', label: 'UEFA Champions League 2025-2026' },
]

export default function CreatePoolPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    tournament_id: 'world-cup-2026',
    description: '',
    exactScore: 5,
    correctDifference: 3,
    correctResult: 1,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data: pool, error: poolError } = await supabase
        .from('pools')
        .insert({
          name: formData.name,
          admin_id: user.id,
          tournament_id: formData.tournament_id,
          invite_code: '',
          scoring_rules: {
            exactScore: formData.exactScore,
            correctDifference: formData.correctDifference,
            correctResult: formData.correctResult,
          },
        })
        .select()
        .single()

      if (poolError) throw poolError

      const { error: memberError } = await supabase
        .from('pool_members')
        .insert({ pool_id: pool.id, user_id: user.id })

      if (memberError) throw memberError

      router.push(`/pool/${pool.id}`)
    } catch (err: any) {
      setError(err.message || 'Error al crear la polla')
      setLoading(false)
    }
  }

  const steps = [
    { n: 1, label: 'Info General' },
    { n: 2, label: 'Puntuación' },
    { n: 3, label: 'Resumen' },
  ]

  const selectedTournament = TOURNAMENTS.find(t => t.id === formData.tournament_id)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-3">
          <Link href="/dashboard" className="text-green-400 hover:text-green-300 font-semibold text-sm transition">
            ← Dashboard
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-2xl font-black text-white mb-8 text-center">Crear Nueva Polla</h1>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition ${
                  step === s.n
                    ? 'bg-green-500 text-white'
                    : step > s.n
                    ? 'bg-green-800 text-green-300'
                    : 'bg-gray-800 text-gray-500'
                }`}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span className={`text-xs mt-1 font-medium ${step === s.n ? 'text-green-400' : 'text-gray-600'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 mb-4 ${step > s.n ? 'bg-green-700' : 'bg-gray-800'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-800">
            {steps.map(s => (
              <div
                key={s.n}
                className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition ${
                  step === s.n
                    ? 'border-green-500 text-green-400'
                    : step > s.n
                    ? 'border-green-800/40 text-gray-500 cursor-pointer hover:text-gray-300'
                    : 'border-transparent text-gray-600'
                }`}
                onClick={() => step > s.n && setStep(s.n)}
              >
                {s.label}
              </div>
            ))}
          </div>

          <div className="p-8">
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-xl mb-6 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* ── PASO 1: INFO GENERAL ── */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Torneo *</label>
                  <select
                    value={formData.tournament_id}
                    onChange={e => setFormData({ ...formData, tournament_id: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-white outline-none"
                  >
                    {TOURNAMENTS.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Nombre de la Polla *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    maxLength={100}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-white outline-none placeholder-gray-600"
                    placeholder="Ej: POLLA FUTBOLERA MUNDIAL 2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Descripción <span className="text-gray-600 font-normal">(opcional)</span></label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-white outline-none placeholder-gray-600 resize-none"
                    placeholder="Descripción o reglas adicionales..."
                  />
                </div>
                <button
                  onClick={() => {
                    if (!formData.name.trim()) { setError('El nombre de la polla es obligatorio'); return }
                    setError(null)
                    setStep(2)
                  }}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-xl transition"
                >
                  SIGUIENTE →
                </button>
              </div>
            )}

            {/* ── PASO 2: PUNTUACIÓN ── */}
            {step === 2 && (
              <div className="space-y-6">
                <p className="text-gray-400 text-sm">Personaliza cuántos puntos vale cada tipo de acierto:</p>

                {[
                  { key: 'exactScore', label: 'Resultado exacto', desc: 'Ej: predices 2-1 y termina 2-1', color: 'yellow' },
                  { key: 'correctDifference', label: 'Diferencia correcta', desc: 'Ej: predices 2-1 y termina 3-2', color: 'blue' },
                  { key: 'correctResult', label: 'Ganador / empate correcto', desc: 'Solo aciertas quién gana o si empata', color: 'purple' },
                ].map(rule => (
                  <div key={rule.key} className={`bg-${rule.color}-900/20 border border-${rule.color}-700/30 rounded-xl p-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-${rule.color}-300 font-bold text-sm`}>{rule.label}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{rule.desc}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, [rule.key]: Math.max(0, (prev as any)[rule.key] - 1) }))}
                          className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold text-white transition"
                        >-</button>
                        <span className={`text-${rule.color}-400 font-black text-2xl w-10 text-center`}>
                          {(formData as any)[rule.key]}
                        </span>
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, [rule.key]: (prev as any)[rule.key] + 1 }))}
                          className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold text-white transition"
                        >+</button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition border border-gray-700"
                  >
                    ← ANTERIOR
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-xl transition"
                  >
                    SIGUIENTE →
                  </button>
                </div>
              </div>
            )}

            {/* ── PASO 3: RESUMEN ── */}
            {step === 3 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-white">Resumen</h3>

                <div className="bg-gray-800/50 rounded-xl divide-y divide-gray-700">
                  {[
                    { label: 'Torneo', value: selectedTournament?.label },
                    { label: 'Nombre', value: formData.name },
                    { label: 'Descripción', value: formData.description || '-' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center px-4 py-3">
                      <span className="text-gray-500 text-sm">{row.label}</span>
                      <span className="text-white font-semibold text-sm text-right max-w-[60%]">{row.value}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-gray-500 text-sm mb-3">Puntuación:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-yellow-900/30 border border-yellow-700/30 rounded-xl p-3 text-center">
                      <div className="text-yellow-400 font-black text-2xl">{formData.exactScore}</div>
                      <div className="text-yellow-200/50 text-xs mt-0.5">Exacto</div>
                    </div>
                    <div className="bg-blue-900/30 border border-blue-700/30 rounded-xl p-3 text-center">
                      <div className="text-blue-400 font-black text-2xl">{formData.correctDifference}</div>
                      <div className="text-blue-200/50 text-xs mt-0.5">Diferencia</div>
                    </div>
                    <div className="bg-purple-900/30 border border-purple-700/30 rounded-xl p-3 text-center">
                      <div className="text-purple-400 font-black text-2xl">{formData.correctResult}</div>
                      <div className="text-purple-200/50 text-xs mt-0.5">Ganador</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition border border-gray-700"
                  >
                    ← ANTERIOR
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {loading ? '⏳ Creando...' : '⚽ CREAR GRUPO'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


