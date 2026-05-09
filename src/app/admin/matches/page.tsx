'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { TOURNAMENT_TEAMS } from '@/lib/tournamentTeams'
import Link from 'next/link'

// ─── Configura aquí los emails que pueden acceder al panel admin ───
const ADMIN_EMAILS = ['bdp.usf@gmail.com']

const TOURNAMENTS = [
  { id: 'world-cup-2026',        label: '🌍 Copa Mundial FIFA 2026' },
  { id: 'champions-league-2526', label: '⭐ UEFA Champions League 2025-26' },
  { id: 'europa-league-2526',    label: '🟠 UEFA Europa League 2025-26' },
  { id: 'nations-league-2526',   label: '🏆 UEFA Nations League 2024-25' },
  { id: 'libertadores-2026',     label: '🏆 Copa Libertadores 2026' },
  { id: 'sudamericana-2026',     label: '🟠 Copa Sudamericana 2026' },
  { id: 'copa-america-2028',     label: '🌎 Copa América 2028' },
  { id: 'premier-league-2526',   label: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League 2025-26' },
  { id: 'la-liga-2526',          label: '🇪🇸 La Liga 2025-26' },
  { id: 'serie-a-2526',          label: '🇮🇹 Serie A 2025-26' },
  { id: 'bundesliga-2526',       label: '🇩🇪 Bundesliga 2025-26' },
  { id: 'ligue-1-2526',          label: '🇫🇷 Ligue 1 2025-26' },
  { id: 'liga-mx-apertura-2026', label: '🇲🇽 Liga MX Apertura 2026' },
  { id: 'liga-betplay-2026-1',   label: '🇨🇴 Liga BetPlay 2026-I' },
  { id: 'mls-2026',              label: '🇺🇸 MLS 2026' },
  { id: 'otro',                  label: '⚽ Otro torneo' },
]

const ROUND_CONFIG: Record<string, { label: string; emoji: string }> = {
  'group':        { label: 'Fase de Grupos',   emoji: '⚽' },
  'round-of-32':  { label: 'Ronda de 32',      emoji: '⚡' },
  'round-of-16':  { label: 'Octavos de Final', emoji: '🔥' },
  'quarterfinal': { label: 'Cuartos de Final', emoji: '💥' },
  'semifinal':    { label: 'Semifinales',      emoji: '🌟' },
  'third-place':  { label: 'Tercer Lugar',     emoji: '🥉' },
  'final':        { label: 'Final',            emoji: '🏆' },
}

type Match = {
  id: string
  home_team: string
  away_team: string
  match_date: string
  status: 'scheduled' | 'live' | 'finished'
  home_score: number | null
  away_score: number | null
  tournament_id: string
  round?: string
}

type EditState = {
  home_score: string
  away_score: string
  status: 'scheduled' | 'live' | 'finished'
}

const STATUS_LABELS = {
  scheduled: { label: 'Programado', color: 'bg-blue-900 text-blue-300' },
  live: { label: 'En vivo', color: 'bg-red-600 text-white' },
  finished: { label: 'Finalizado', color: 'bg-white/10 text-slate-300' },
}

export default function AdminMatchesPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState<Match[]>([])
  const [edits, setEdits] = useState<Record<string, EditState>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'live' | 'finished'>('all')
  const [search, setSearch] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMatch, setNewMatch] = useState({ home_team: '', away_team: '', match_date: '', round: 'group' })
  const [addingMatch, setAddingMatch] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [selectedTournament, setSelectedTournament] = useState('world-cup-2026')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ inserted: number; updated?: number; total: number; message?: string } | null>(null)
  const [cleaning, setCleaning] = useState(false)
  const [cleanResult, setCleanResult] = useState<{ deleted: number; message?: string } | null>(null)

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
      router.push('/dashboard')
      return
    }
    setAuthorized(true)
    await loadMatches('world-cup-2026')
    setLoading(false)
  }

  const loadMatches = async (tournamentId: string) => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('match_date', { ascending: true })

    if (data) {
      setMatches(data)
      // Inicializar estado de edición con valores actuales
      const initialEdits: Record<string, EditState> = {}
      data.forEach((m: Match) => {
        initialEdits[m.id] = {
          home_score: m.home_score !== null ? String(m.home_score) : '',
          away_score: m.away_score !== null ? String(m.away_score) : '',
          status: m.status,
        }
      })
      setEdits(initialEdits)
    }
  }

  const handleSave = async (matchId: string) => {
    const edit = edits[matchId]
    if (!edit) return

    setSaving(s => ({ ...s, [matchId]: true }))

    const homeScore = edit.home_score !== '' ? parseInt(edit.home_score) : null
    const awayScore = edit.away_score !== '' ? parseInt(edit.away_score) : null

    // Si tiene marcador, forzar estado a finished o live
    const status = edit.status

    const { error } = await supabase
      .from('matches')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId)

    setSaving(s => ({ ...s, [matchId]: false }))

    if (!error) {
      setSaved(s => ({ ...s, [matchId]: true }))
      setTimeout(() => setSaved(s => ({ ...s, [matchId]: false })), 2000)
      // Actualizar estado local
      setMatches(ms => ms.map(m =>
        m.id === matchId
          ? { ...m, home_score: homeScore, away_score: awayScore, status }
          : m
      ))
    }
  }

  const handleImport = async () => {
    setImporting(true)
    setImportResult(null)
    setCleanResult(null)
    setAddError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/import-matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ tournamentId: selectedTournament }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      setImportResult(result)
      if (result.inserted > 0 || result.updated > 0) await loadMatches(selectedTournament)
    } catch (err: any) {
      setAddError(err.message)
    } finally {
      setImporting(false)
    }
  }

  const handleCleanDuplicates = async () => {
    if (!confirm(`¿Eliminar partidos duplicados de "${TOURNAMENTS.find(t => t.id === selectedTournament)?.label ?? selectedTournament}"? Se conservará el partido con más datos y se borrarán las copias.`)) return
    setCleaning(true)
    setCleanResult(null)
    setImportResult(null)
    setAddError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/import-matches', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ tournamentId: selectedTournament }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      setCleanResult(result)
      await loadMatches(selectedTournament)
    } catch (err: any) {
      setAddError(err.message)
    } finally {
      setCleaning(false)
    }
  }

  const handleAddMatch = async () => {
    if (!newMatch.home_team.trim() || !newMatch.away_team.trim() || !newMatch.match_date) {
      setAddError('Completa todos los campos antes de agregar.')
      return
    }
    setAddingMatch(true)
    setAddError(null)
    const { error } = await supabase.from('matches').insert({
      tournament_id: selectedTournament,
      home_team: newMatch.home_team.trim(),
      away_team: newMatch.away_team.trim(),
      match_date: new Date(newMatch.match_date).toISOString(),
      round: newMatch.round,
      status: 'scheduled',
    })
    setAddingMatch(false)
    if (error) {
      setAddError(`Error: ${error.message}`)
    } else {
      setNewMatch({ home_team: '', away_team: '', match_date: '', round: 'group' })
      setShowAddForm(false)
      await loadMatches(selectedTournament)
    }
  }

  const handleBulkFinish = async () => {
    // Marcar como finalizados todos los partidos con marcador ingresado
    const toFinish = matches.filter(m => {
      const e = edits[m.id]
      return e && e.home_score !== '' && e.away_score !== '' && m.status !== 'finished'
    })

    if (toFinish.length === 0) return
    if (!confirm(`¿Finalizar ${toFinish.length} partido(s) con marcador?`)) return

    for (const m of toFinish) {
      const e = edits[m.id]
      setEdits(prev => ({ ...prev, [m.id]: { ...e, status: 'finished' } }))
      await handleSave(m.id)
    }
  }

  const filtered = matches.filter(m => {
    const matchesFilter = filter === 'all' || m.status === filter
    const matchesSearch = search === '' ||
      m.home_team.toLowerCase().includes(search.toLowerCase()) ||
      m.away_team.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    total: matches.length,
    finished: matches.filter(m => m.status === 'finished').length,
    live: matches.filter(m => m.status === 'live').length,
    scheduled: matches.filter(m => m.status === 'scheduled').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1020] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/10 border-t-green-500"></div>
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div className="min-h-screen bg-[#0B1020] text-white">
      {/* Nav */}
      <nav className="bg-[#0B1020]/90 backdrop-blur-xl border-b border-white/5 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-green-400 hover:text-green-300 text-sm transition">
              ← Dashboard
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-white font-bold">Panel Admin — Resultados</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-red-900/60 border border-red-700/50 text-red-300 px-3 py-1 rounded-full font-bold">
              🔒 ADMIN
            </span>
            <button
              onClick={() => setShowHelp(h => !h)}
              className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 px-3 py-1 rounded-full font-bold transition"
            >
              {showHelp ? '✕ Cerrar ayuda' : '? Ayuda'}
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* ── PANEL DE AYUDA ── */}
        {showHelp && (
          <div className="mb-8 bg-[#131A2E] border border-blue-800/50 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 bg-blue-950/40 border-b border-blue-800/40 flex items-center gap-2">
              <span className="text-blue-400 text-lg">📖</span>
              <h2 className="text-white font-bold text-base">¿Cómo funciona el Panel Admin?</h2>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-6 text-sm">

              {/* Flujo de trabajo */}
              <div>
                <h3 className="text-green-400 font-bold mb-3 flex items-center gap-2">⚽ Flujo de trabajo por partido</h3>
                <ol className="space-y-2.5 text-slate-300">
                  <li className="flex gap-3">
                    <span className="bg-blue-900/60 text-blue-300 font-black text-xs w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span><strong className="text-white">Antes del partido</strong> — Estado <span className="bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded text-xs font-bold">Programado</span>. Los usuarios pueden ingresar su pronóstico hasta que empiece.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-red-900/60 text-red-300 font-black text-xs w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <div>
                      <span><strong className="text-white">Al comenzar</strong> — Pasa a <span className="bg-red-600/50 text-red-300 px-1.5 py-0.5 rounded text-xs font-bold">En vivo</span> <strong className="text-green-400">✨ automáticamente</strong> cuando llega la hora del partido (cron cada 10 min).</span>
                      <p className="text-slate-600 text-xs mt-1">Si ves un partido que ya empezó pero sigue como Programado, puedes cambiarlo manualmente.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-green-900/60 text-green-300 font-black text-xs w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <div>
                      <span><strong className="text-white">Al terminar</strong> — Pasa a <span className="bg-white/10 text-slate-300 px-1.5 py-0.5 rounded text-xs font-bold">Finalizado</span> con el marcador real <strong className="text-green-400">✨ automáticamente</strong> desde la API de ESPN.</span>
                      <p className="text-slate-600 text-xs mt-1">Solo los 90 minutos reglamentarios (fase de grupos: sin tiempo extra ni penales).</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-yellow-900/60 text-yellow-300 font-black text-xs w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">✓</span>
                    <span><strong className="text-white">Puntos</strong> — Supabase los calcula automáticamente al finalizar y actualiza la tabla de posiciones.</span>
                  </li>
                </ol>
              </div>

              {/* Sistema de puntos */}
              <div>
                <h3 className="text-yellow-400 font-bold mb-3 flex items-center gap-2">🏆 Cálculo de puntos (automático)</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-3 py-2">
                    <span className="text-slate-300">🎯 Resultado exacto</span>
                    <span className="text-yellow-400 font-black">5 pts <span className="text-slate-600 font-normal text-xs">(por defecto)</span></span>
                  </div>
                  <div className="flex items-center justify-between bg-blue-900/20 border border-blue-700/30 rounded-lg px-3 py-2">
                    <span className="text-slate-300">📊 Diferencia correcta</span>
                    <span className="text-blue-400 font-black">3 pts <span className="text-slate-600 font-normal text-xs">(por defecto)</span></span>
                  </div>
                  <div className="flex items-center justify-between bg-purple-900/20 border border-purple-700/30 rounded-lg px-3 py-2">
                    <span className="text-slate-300">✅ Ganador / empate</span>
                    <span className="text-purple-400 font-black">1 pt <span className="text-slate-600 font-normal text-xs">(por defecto)</span></span>
                  </div>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Cada polla puede tener su propio sistema de puntos configurado al crearla. El cálculo usa el trigger <code className="bg-white/10 px-1 rounded">calculate_points</code> en Supabase.
                </p>
              </div>

              {/* Botón bulk */}
              <div className="md:col-span-2 border-t border-white/8 pt-5">
                <h3 className="text-orange-400 font-bold mb-3 flex items-center gap-2">⚡ Botón "Finalizar con marcador"</h3>
                <p className="text-slate-300 leading-relaxed">
                  Toma <strong className="text-white">todos los partidos que tienen marcador ingresado</strong> y que aún no están en estado Finalizado, y los finaliza en lote de una vez.
                  Útil al final de una jornada con varios partidos. Siempre pide confirmación antes de ejecutar.
                </p>
              </div>

              <div className="md:col-span-2 bg-green-900/15 border border-green-700/30 rounded-xl p-4">
                <p className="text-green-300 font-bold text-xs mb-2">✨ Totalmente automático con ESPN</p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  El cron de cron-job.org corre cada 10 min y consulta la <strong className="text-slate-200">API pública de ESPN</strong> (sin key, gratuita).
                  Cuando ESPN reporta un partido como <em>Final</em>, actualiza el marcador en Supabase y dispara el cálculo de puntos automáticamente.
                  Este panel sirve como <strong className="text-slate-200">respaldo manual</strong> en caso de que la API falle o si se necesita corregir un resultado.
                </p>
              </div>

              {/* Notas */}
              <div className="md:col-span-2 bg-orange-900/15 border border-orange-700/30 rounded-xl p-4">
                <p className="text-orange-300 font-bold text-xs mb-2">⚠️ Reglas importantes</p>
                <ul className="text-slate-400 text-xs space-y-1 leading-relaxed">
                  <li>• Solo se cuentan los <strong className="text-slate-200">90 minutos reglamentarios</strong> (sin tiempo extra ni penales).</li>
                  <li>• Si un partido va a penales, el marcador a ingresar es el de los 90 min (ej: 1-1 aunque gane 4-3 en penales).</li>
                  <li>• Cambiar un partido de Finalizado a otro estado <strong className="text-slate-200">no recalcula los puntos</strong> automáticamente — solo la transición a Finalizado los dispara.</li>
                  <li>• El panel actualmente muestra solo partidos del torneo <strong className="text-slate-200">Copa Mundial FIFA 2026</strong>.</li>
                </ul>
              </div>

            </div>
          </div>
        )}

        {/* Selector de torneo */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-bold text-slate-400 whitespace-nowrap">⚽ Torneo activo:</label>
            <select
              value={selectedTournament}
              onChange={e => {
                setSelectedTournament(e.target.value)
                setFilter('all')
                setSearch('')
                setShowAddForm(false)
                setImportResult(null)
                loadMatches(e.target.value)
              }}
              className="flex-1 bg-[#131A2E] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500 [color-scheme:dark]"
            >
              {TOURNAMENTS.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <button
              onClick={handleImport}
              disabled={importing || selectedTournament === 'otro'}
              title={selectedTournament === 'otro' ? 'Importación no disponible para torneos personalizados' : 'Importar partidos desde ESPN API'}
              className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-600 disabled:bg-white/5 disabled:text-slate-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition whitespace-nowrap"
            >
              {importing ? (
                <><span className="animate-spin">⏳</span> Importando...</>
              ) : (
                <>📥 Importar ESPN</>
              )}
            </button>
            <button
              onClick={handleCleanDuplicates}
              disabled={cleaning}
              title="Eliminar partidos duplicados del torneo seleccionado"
              className="flex items-center gap-2 bg-orange-700 hover:bg-orange-600 disabled:bg-white/5 disabled:text-slate-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition whitespace-nowrap active:scale-95"
            >
              {cleaning ? (
                <><span className="animate-spin">⏳</span> Limpiando...</>
              ) : (
                <>🧹 Limpiar duplicados</>
              )}
            </button>
          </div>
          {importResult && (
            <div className={`mt-2 text-sm rounded-xl px-4 py-2 border ${
              importResult.inserted > 0
                ? 'bg-green-900/30 border-green-700/50 text-green-300'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}>
              {importResult.inserted > 0
                ? `✅ ${importResult.inserted} partidos nuevos importados${importResult.updated ? `, ${importResult.updated} actualizados` : ''} (de ${importResult.total} encontrados en ESPN)`
                : `ℹ️ ${importResult.message ?? `0 partidos nuevos (${importResult.total} ya existían)`}`
              }
            </div>
          )}
          {cleanResult && (
            <div className={`mt-2 text-sm rounded-xl px-4 py-2 border ${
              cleanResult.deleted > 0
                ? 'bg-orange-900/30 border-orange-700/50 text-orange-300'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}>
              {cleanResult.deleted > 0
                ? `🧹 ${cleanResult.deleted} partido(s) duplicado(s) eliminados.`
                : `ℹ️ ${cleanResult.message ?? 'No se encontraron duplicados.'}`
              }
            </div>
          )}
          {addError && !showAddForm && (
            <div className="mt-2 text-sm text-red-400 bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-2">
              ❌ {addError}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Finalizados', value: stats.finished, color: 'text-green-400' },
            { label: 'En vivo', value: stats.live, color: 'text-red-400' },
            { label: 'Pendientes', value: stats.scheduled, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#131A2E] border border-white/5 rounded-xl p-4 text-center">
              <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-slate-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Buscar equipo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-[#131A2E] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-600"
          />
          <div className="flex flex-wrap gap-2">
            {(['all', 'scheduled', 'live', 'finished'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                  filter === f
                    ? 'bg-green-600 text-white shadow-sm shadow-green-700/30'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'scheduled' ? 'Pendientes' : f === 'live' ? 'En vivo' : 'Finalizados'}
              </button>
            ))}
          </div>
          <button
            onClick={handleBulkFinish}
            className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition whitespace-nowrap shadow-sm shadow-yellow-700/20 active:scale-95"
          >
            ✅ Finalizar con marcador
          </button>
          <button
            onClick={() => { setShowAddForm(s => !s); setAddError(null) }}
            className="bg-blue-700 hover:bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition whitespace-nowrap active:scale-95"
          >
            {showAddForm ? '✕ Cancelar' : '➕ Agregar partido'}
          </button>
        </div>

        {/* ── Formulario: agregar nuevo partido ── */}
        {showAddForm && (
          <div className="mb-6 bg-[#131A2E] border border-blue-700/50 rounded-2xl p-5">
            <h3 className="text-white font-bold mb-4 text-sm flex items-center gap-2">
              ➕ Nuevo partido — {TOURNAMENTS.find(t => t.id === selectedTournament)?.label ?? selectedTournament}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              {/* datalist de equipos para el torneo seleccionado */}
              <datalist id="team-suggestions">
                {[...new Set([
                  ...(TOURNAMENT_TEAMS[selectedTournament] ?? []),
                  ...matches.flatMap(m => [m.home_team, m.away_team]),
                ])].sort().map(team => (
                  <option key={team} value={team} />
                ))}
              </datalist>
              <input
                type="text"
                list="team-suggestions"
                placeholder="Equipo local (ej: Argentina)"
                value={newMatch.home_team}
                onChange={e => setNewMatch(p => ({ ...p, home_team: e.target.value }))}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                list="team-suggestions"
                placeholder="Equipo visitante (ej: Francia)"
                value={newMatch.away_team}
                onChange={e => setNewMatch(p => ({ ...p, away_team: e.target.value }))}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Fecha y hora (hora local)</label>
                <input
                  type="datetime-local"
                  value={newMatch.match_date}
                  onChange={e => setNewMatch(p => ({ ...p, match_date: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Fase / Ronda</label>
                <select
                  value={newMatch.round}
                  onChange={e => setNewMatch(p => ({ ...p, round: e.target.value }))}
                  className="bg-[#131A2E] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                >
                  {Object.entries(ROUND_CONFIG).map(([val, cfg]) => (
                    <option key={val} value={val}>{cfg.emoji} {cfg.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {addError && (
              <p className="text-red-400 text-xs mb-3">{addError}</p>
            )}
            <button
              onClick={handleAddMatch}
              disabled={addingMatch}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition"
            >
              {addingMatch ? 'Guardando...' : '➕ Agregar partido'}
            </button>
            <p className="text-slate-600 text-xs mt-3">El partido se creará con estado Programado. Puedes editar el resultado desde la lista una vez que termine.</p>
          </div>
        )}

        {/* Lista de partidos */}
        <div className="space-y-3">
          {filtered.map(match => {
            const edit = edits[match.id]
            if (!edit) return null
            const isSaving = saving[match.id]
            const isSaved = saved[match.id]
            const hasChanges =
              String(match.home_score ?? '') !== edit.home_score ||
              String(match.away_score ?? '') !== edit.away_score ||
              match.status !== edit.status

            return (
              <div
                key={match.id}
                className={`bg-[#131A2E] border rounded-xl p-4 transition ${
                  edit.status === 'live'
                    ? 'border-red-600/60'
                    : edit.status === 'finished'
                    ? 'border-white/8'
                    : 'border-blue-900/50'
                }`}
              >
                {/* Fecha + Ronda */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs text-slate-600">
                    {new Date(match.match_date).toLocaleString('es-ES', {
                      weekday: 'short', day: '2-digit', month: 'short',
                      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
                    })}
                  </span>
                  {match.round && match.round !== 'group' && (
                    <span className="text-xs bg-blue-900/50 border border-blue-700/40 text-blue-300 px-2 py-0.5 rounded-full font-bold">
                      {ROUND_CONFIG[match.round]?.emoji} {ROUND_CONFIG[match.round]?.label}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Equipos + marcador */}
                  <div className="flex-1 flex items-center gap-3 w-full">
                    {/* Local */}
                    <span className="flex-1 font-bold text-white text-right text-sm sm:text-base truncate">
                      {match.home_team}
                    </span>

                    {/* Marcador */}
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={edit.home_score}
                        onChange={e => setEdits(prev => ({
                          ...prev,
                          [match.id]: { ...prev[match.id], home_score: e.target.value }
                        }))}
                        className="w-14 text-center bg-white/5 border border-white/10 rounded-lg py-2 text-white font-black text-xl focus:outline-none focus:border-green-500"
                        placeholder="–"
                      />
                      <span className="text-slate-600 font-black">:</span>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={edit.away_score}
                        onChange={e => setEdits(prev => ({
                          ...prev,
                          [match.id]: { ...prev[match.id], away_score: e.target.value }
                        }))}
                        className="w-14 text-center bg-white/5 border border-white/10 rounded-lg py-2 text-white font-black text-xl focus:outline-none focus:border-green-500"
                        placeholder="–"
                      />
                    </div>

                    {/* Visitante */}
                    <span className="flex-1 font-bold text-white text-left text-sm sm:text-base truncate">
                      {match.away_team}
                    </span>
                  </div>

                  {/* Estado + guardar */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={edit.status}
                      onChange={e => setEdits(prev => ({
                        ...prev,
                        [match.id]: { ...prev[match.id], status: e.target.value as Match['status'] }
                      }))}
                      className="bg-[#131A2E] border border-white/8 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 [color-scheme:dark]"
                    >
                      <option value="scheduled">Programado</option>
                      <option value="live">En vivo</option>
                      <option value="finished">Finalizado</option>
                    </select>

                    <button
                      onClick={() => handleSave(match.id)}
                      disabled={isSaving || !hasChanges}
                      className={`px-5 py-2 rounded-xl font-bold text-sm transition ${
                        isSaved
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/30'
                          : hasChanges
                          ? 'bg-green-600 hover:bg-green-500 text-white shadow-sm shadow-green-700/20 active:scale-95'
                          : 'bg-white/5 border border-white/8 text-slate-600 cursor-default'
                      }`}
                    >
                      {isSaving ? '...' : isSaved ? '✓ Guardado' : 'Guardar'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            No hay partidos que coincidan con el filtro.
          </div>
        )}
      </div>
    </div>
  )
}
