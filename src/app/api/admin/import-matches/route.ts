import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/admin/import-matches
//
// Importa automáticamente los partidos de un torneo desde la ESPN API pública.
// Estrategia:
//   1. Intenta con un rango de fechas completo (?dates=INICIO-FIN&limit=500)
//   2. Si ESPN no devuelve eventos con ese formato, cae a fetching día a día
//      en lotes paralelos de 40 para no superar el timeout de Vercel (10s).
//
// Requiere: Authorization: Bearer <supabase_access_token> de un admin
// ──────────────────────────────────────────────────────────────────────────────

const ADMIN_EMAILS = ['bdp.usf@gmail.com']

// Mapeo torneo → liga ESPN + rango de fechas de la temporada
const ESPN_CONFIGS: Record<string, { slug: string; start: string; end: string }> = {
  'world-cup-2026':        { slug: 'fifa.world',             start: '20260611', end: '20260719' },
  'champions-league-2526': { slug: 'uefa.champions',         start: '20250917', end: '20260601' },
  'europa-league-2526':    { slug: 'uefa.europa',            start: '20250918', end: '20260521' },
  'nations-league-2526':   { slug: 'uefa.nations',           start: '20241007', end: '20250609' },
  'libertadores-2026':     { slug: 'conmebol.libertadores',  start: '20260201', end: '20261122' },
  'sudamericana-2026':     { slug: 'conmebol.sudamericana',  start: '20260301', end: '20261031' },
  'premier-league-2526':   { slug: 'eng.1',                  start: '20250816', end: '20260526' },
  'la-liga-2526':          { slug: 'esp.1',                  start: '20250815', end: '20260524' },
  'serie-a-2526':          { slug: 'ita.1',                  start: '20250823', end: '20260525' },
  'bundesliga-2526':       { slug: 'ger.1',                  start: '20250823', end: '20260516' },
  'ligue-1-2526':          { slug: 'fra.1',                  start: '20250816', end: '20260517' },
  'liga-mx-apertura-2026': { slug: 'mex.1',                  start: '20260110', end: '20260630' },
  'liga-betplay-2026-1':   { slug: 'col.1',                  start: '20260120', end: '20260630' },
  'mls-2026':              { slug: 'usa.1',                  start: '20260228', end: '20261107' },
  'copa-america-2028':     { slug: 'conmebol.america',       start: '20280601', end: '20280731' },
}

// Para estas ligas, todos los partidos son fase regular → round = 'group'
// col.1 = Liga BetPlay: torneo doméstico, todos los partidos son fase regular
const LEAGUE_SLUGS = new Set(['eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1', 'mex.1', 'usa.1', 'col.1'])

function yyyymmddToDate(s: string): Date {
  return new Date(
    parseInt(s.slice(0, 4)),
    parseInt(s.slice(4, 6)) - 1,
    parseInt(s.slice(6, 8)),
  )
}

function dateToYYYYMMDD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function getAllDates(start: string, end: string): string[] {
  const dates: string[] = []
  const endDate = yyyymmddToDate(end)
  for (let d = yyyymmddToDate(start); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(dateToYYYYMMDD(new Date(d)))
  }
  return dates
}

async function fetchDay(slug: string, dateStr: string): Promise<any[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=${dateStr}&limit=50`
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return []
    const data = await res.json()
    return data.events ?? []
  } catch {
    return []
  }
}

async function fetchRange(slug: string, start: string, end: string): Promise<any[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=${start}-${end}&limit=500`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    return data.events ?? []
  } catch {
    return []
  }
}

async function fetchAllEvents(slug: string, start: string, end: string): Promise<any[]> {
  // Intento 1: rango completo en una sola llamada (ESPN lo soporta en algunos slugs)
  const rangeEvents = await fetchRange(slug, start, end)
  if (rangeEvents.length > 0) return rangeEvents

  // Fallback: día a día en lotes paralelos de 40
  const dates = getAllDates(start, end)
  const seenIds = new Set<string>()
  const allEvents: any[] = []
  const BATCH = 40

  for (let i = 0; i < dates.length; i += BATCH) {
    const batch = dates.slice(i, i + BATCH)
    const results = await Promise.all(batch.map(d => fetchDay(slug, d)))
    for (const events of results) {
      for (const e of events) {
        if (!seenIds.has(e.id)) {
          seenIds.add(e.id)
          allEvents.push(e)
        }
      }
    }
  }
  return allEvents
}

function detectRound(event: any, slug: string): string {
  if (LEAGUE_SLUGS.has(slug)) return 'group'

  const note = (event.competitions?.[0]?.notes?.[0]?.headline ?? '').toLowerCase()
  const name = (event.name ?? '').toLowerCase()
  const c = `${note} ${name}`

  if (c.includes('final') && !c.includes('semi') && !c.includes('quarter') && !c.includes('semifinal')) return 'final'
  if (c.includes('semifinal') || c.includes('semi-final') || c.includes('semi final')) return 'semifinal'
  if (c.includes('quarterfinal') || c.includes('quarter-final') || c.includes('quarterfinals')) return 'quarterfinal'
  if (c.includes('round of 16') || c.includes('last 16') || c.includes('1/8')) return 'round-of-16'
  if (c.includes('round of 32') || c.includes('last 32') || c.includes('1/16')) return 'round-of-32'
  if (c.includes('third') && c.includes('place')) return 'third-place'
  return 'group'
}

function mapStatus(statusName: string): 'scheduled' | 'live' | 'finished' {
  if (['STATUS_IN_PROGRESS', 'STATUS_HALFTIME', 'STATUS_END_PERIOD'].includes(statusName)) return 'live'
  if (['STATUS_FINAL', 'STATUS_FULL_TIME', 'STATUS_POSTPONED', 'STATUS_ABANDONED'].includes(statusName)) return 'finished'
  return 'scheduled'
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function verifyAdmin(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return { error: 'No autorizado', supabaseAdmin: null, user: null }
  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user || !ADMIN_EMAILS.includes(user.email ?? '')) return { error: 'Acceso denegado', supabaseAdmin: null, user: null }
  return { error: null, supabaseAdmin, user }
}

// DELETE /api/admin/import-matches  — removes duplicate matches for a tournament,
// keeping the copy that has the most data (scores > external_api_id > oldest created_at).
export async function DELETE(request: NextRequest) {
  const { error, supabaseAdmin } = await verifyAdmin(request)
  if (error || !supabaseAdmin) return NextResponse.json({ error }, { status: 401 })

  const { tournamentId } = (await request.json()) as { tournamentId: string }

  // Fetch all matches for this tournament, ordered so the "best" row comes first
  const { data: all, error: fetchErr } = await supabaseAdmin
    .from('matches')
    .select('id, home_team, away_team, match_date, home_score, away_score, external_api_id, created_at')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true })

  if (fetchErr || !all) return NextResponse.json({ error: fetchErr?.message ?? 'fetch failed' }, { status: 500 })

  // Group by normalised key: team names + UTC ms
  const groups = new Map<string, typeof all>()
  for (const m of all) {
    const key = `${m.home_team}|${m.away_team}|${new Date(m.match_date).getTime()}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(m)
  }

  // For each group with > 1 row: keep the "best" one, delete the rest
  const toDelete: string[] = []
  for (const rows of groups.values()) {
    if (rows.length <= 1) continue
    // Score: prefer row with scores > row with external_api_id > fallback to first inserted
    const scored = rows.map(r => ({
      r,
      score: (r.home_score !== null ? 4 : 0) + (r.external_api_id ? 2 : 0),
    }))
    scored.sort((a, b) => b.score - a.score || a.r.created_at.localeCompare(b.r.created_at))
    // Keep first, delete the rest
    toDelete.push(...scored.slice(1).map(s => s.r.id))
  }

  if (toDelete.length === 0) {
    return NextResponse.json({ deleted: 0, message: 'No se encontraron duplicados.' })
  }

  const { error: delErr } = await supabaseAdmin.from('matches').delete().in('id', toDelete)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  return NextResponse.json({ deleted: toDelete.length, groups: groups.size })
}

export async function POST(request: NextRequest) {
  const { error, supabaseAdmin } = await verifyAdmin(request)
  if (error || !supabaseAdmin) return NextResponse.json({ error }, { status: 401 })

  const { tournamentId } = (await request.json()) as { tournamentId: string }
  const config = ESPN_CONFIGS[tournamentId]
  if (!config) {
    return NextResponse.json({
      error: 'Este torneo no tiene importación automática disponible. Agrega los partidos manualmente con el formulario.',
    }, { status: 400 })
  }

  // Obtener eventos de ESPN
  const espnEvents = await fetchAllEvents(config.slug, config.start, config.end)

  if (espnEvents.length === 0) {
    return NextResponse.json({
      inserted: 0, total: 0,
      message: 'ESPN no devolvió partidos para este torneo. Es posible que el calendario aún no esté publicado.',
    })
  }

  // Transformar eventos al esquema de matches
  const matches = espnEvents.flatMap(event => {
    const comp = event.competitions?.[0]
    const home = comp?.competitors?.find((c: any) => c.homeAway === 'home')
    const away = comp?.competitors?.find((c: any) => c.homeAway === 'away')
    if (!home?.team?.displayName || !away?.team?.displayName) return []

    const statusName: string = event.status?.type?.name ?? 'STATUS_SCHEDULED'
    const status = mapStatus(statusName)
    const homeScore = home.score != null ? parseInt(home.score) : null
    const awayScore = away.score != null ? parseInt(away.score) : null

    return [{
      external_api_id: String(event.id),
      tournament_id: tournamentId,
      home_team: home.team.displayName as string,
      away_team: away.team.displayName as string,
      home_team_espn_id: home.team.id ? parseInt(home.team.id) : null,
      away_team_espn_id: away.team.id ? parseInt(away.team.id) : null,
      match_date: event.date as string,
      status,
      home_score: status === 'scheduled' ? null : homeScore,
      away_score: status === 'scheduled' ? null : awayScore,
      round: detectRound(event, config.slug),
    }]
  })

  // Fetch existing matches — keyed by external_api_id (most reliable) with date fallback
  const { data: existing } = await supabaseAdmin
    .from('matches')
    .select('id, home_team, away_team, match_date, external_api_id, home_team_espn_id, away_team_espn_id')
    .eq('tournament_id', tournamentId)

  // Build lookup maps: prefer external_api_id, fall back to normalized date string
  const byApiId = new Map((existing ?? []).filter((m: any) => m.external_api_id).map((m: any) => [m.external_api_id, m]))
  const byDateKey = new Map(
    (existing ?? []).map((m: any) => [
      `${m.home_team}|${m.away_team}|${new Date(m.match_date).getTime()}`,
      m,
    ]),
  )

  const findExisting = (m: typeof matches[number]) => {
    if (m.external_api_id) {
      const byId = byApiId.get(m.external_api_id)
      if (byId) return byId
    }
    return byDateKey.get(`${m.home_team}|${m.away_team}|${new Date(m.match_date).getTime()}`) ?? null
  }

  const newMatches = matches.filter(m => findExisting(m) === null)

  // Update ESPN IDs (and external_api_id if missing) on existing matches
  const toUpdate = matches.flatMap(m => {
    const ex = findExisting(m)
    if (!ex) return []
    const needsUpdate =
      (ex.home_team_espn_id == null && m.home_team_espn_id != null) ||
      (ex.away_team_espn_id == null && m.away_team_espn_id != null) ||
      (!ex.external_api_id && m.external_api_id)
    return needsUpdate ? [{ ex, m }] : []
  })

  if (toUpdate.length > 0) {
    await Promise.all(toUpdate.map(({ ex, m }) =>
      supabaseAdmin.from('matches').update({
        ...(m.home_team_espn_id != null ? { home_team_espn_id: m.home_team_espn_id } : {}),
        ...(m.away_team_espn_id != null ? { away_team_espn_id: m.away_team_espn_id } : {}),
        ...(!ex.external_api_id && m.external_api_id ? { external_api_id: m.external_api_id } : {}),
      }).eq('id', ex.id),
    ))
  }

  if (newMatches.length === 0) {
    return NextResponse.json({
      inserted: 0, updated: toUpdate.length, total: matches.length,
      message: toUpdate.length > 0
        ? `ESPN IDs actualizados en ${toUpdate.length} partido(s) existentes.`
        : `Todos los partidos encontrados (${matches.length}) ya estaban en la base de datos.`,
    })
  }

  const { error: insertError } = await supabaseAdmin.from('matches').insert(newMatches)
  if (insertError) {
    return NextResponse.json({ error: `Error al insertar: ${insertError.message}` }, { status: 500 })
  }

  return NextResponse.json({ inserted: newMatches.length, updated: toUpdate.length, total: espnEvents.length })
}
