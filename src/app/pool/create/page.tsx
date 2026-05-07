'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function CreatePoolPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    tournament_id: 'world-cup-2026',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      // Crear polla
      const { data: pool, error: poolError } = await supabase
        .from('pools')
        .insert({
          name: formData.name,
          admin_id: user.id,
          tournament_id: formData.tournament_id,
          invite_code: '', // Se genera automáticamente con el trigger
        })
        .select()
        .single()

      if (poolError) throw poolError

      // Agregar al creador como miembro
      const { error: memberError } = await supabase
        .from('pool_members')
        .insert({
          pool_id: pool.id,
          user_id: user.id,
        })

      if (memberError) throw memberError

      router.push(`/pool/${pool.id}`)
    } catch (err: any) {
      setError(err.message || 'Error al crear la polla')
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
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Crear Nueva Polla
          </h1>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Polla
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  maxLength={100}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                  placeholder="Ej: Polla de la Oficina"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Torneo
                </label>
                <select
                  value={formData.tournament_id}
                  onChange={(e) =>
                    setFormData({ ...formData, tournament_id: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="world-cup-2026">Mundial 2026</option>
                  <option value="copa-america-2024">Copa América 2024</option>
                  <option value="euro-2024">Euro 2024</option>
                  <option value="champions-league">Champions League</option>
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Reglas de Puntuación por Defecto:
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Resultado exacto: <strong>5 puntos</strong></li>
                  <li>• Diferencia de goles correcta: <strong>3 puntos</strong></li>
                  <li>• Ganador/empate correcto: <strong>1 punto</strong></li>
                </ul>
                <p className="text-xs text-blue-600 mt-2">
                  Podrás personalizar estas reglas después
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Polla'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
