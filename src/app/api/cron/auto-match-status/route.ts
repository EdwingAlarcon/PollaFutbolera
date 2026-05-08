import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { findEspnEvent } from '@/lib/teamCodes'

// ──────────────────────────────────────────────────────────────────────────────
// CRON: Sincronización automática de partidos con ESPN API
//
// Hace dos cosas en cada ejecución:
//   1. scheduled → live   : cuando match_date <= now  (basado en hora)
//   2. live → finished    : toma el marcador real de ESPN (automático)
//
// Fuente: ESPN API pública (sin API key, gratuita)
//   https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
//
// Ejecutar desde cron-job.org cada 10 minutos:
//   URL:    https://polla-futbolera-five.vercel.app/api/cron/auto-match-status
//   Header: Authorization: Bearer <CRON_SECRET>
//
// ⚠️  Solo fase de grupos (sin tiempo extra/penales).
//     Los 90 minutos son el resultado final en esta fase.
// ──────────────────────────────────────────────────────────────────────────────

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/** Obtiene los eventos WC del scoreboard de ESPN para una fecha YYYYMMDD */
async function fetchEspnScoreboard(dateStr: string): Promise<any[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return data.events ?? []
  } catch {
    return []
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const now = new Date()
  const nowIso = now.toISOString()

  // ── 1. scheduled → live (por hora, fallback) ────────────────────────────────
  const { data: activated, error: activateError } = await supabase
    .from('matches')
    .update({ status: 'live', updated_at: nowIso })
    .eq('status', 'scheduled')
    .lte('match_date', nowIso)
    .select('id, home_team, away_team')

  if (activateError) {
    console.error('[sync] Error activating matches:', activateError)
  }

  // ── 2. Sincronizar marcadores desde ESPN ─────────────────────────────────────
  // Consultamos hoy y ayer (UTC) para cubrir partidos que crucen medianoche
  const toDateStr = (d: Date) =>
    d.toISOString().slice(0, 10).replace(/-/g, '')

  const todayStr     = toDateStr(now)
  const yesterdayStr = toDateStr(new Date(now.getTime() - 24 * 60 * 60 * 1000))

  const [todayEvents, yesterdayEvents] = await Promise.all([
    fetchEspnScoreboard(todayStr),
    fetchEspnScoreboard(yesterdayStr),
  ])
  const espnEvents = [...todayEvents, ...yesterdayEvents]

  // Traer partidos que aún no están finalizados
  const { data: pendingMatches } = await supabase
    .from('matches')
    .select('id, home_team, away_team, status, match_date')
    .eq('tournament_id', 'world-cup-2026')
    .in('status', ['live', 'scheduled'])

  const finished: string[] = []
  const errors: string[] = []

  for (const match of pendingMatches ?? []) {
    const found = findEspnEvent(espnEvents, match.home_team, match.away_team)
    if (!found) continue

    const { event, home, away } = found
    const espnStatus: string = event.status?.type?.name ?? ''

    // STATUS_FINAL → marcar como finalizado con marcador real
    if (espnStatus === 'STATUS_FINAL') {
      const homeScore = parseInt(home.score ?? '-1')
      const awayScore = parseInt(away.score ?? '-1')
      if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0) continue

      const { error } = await supabase
        .from('matches')
        .update({
          status: 'finished',
          home_score: homeScore,
          away_score: awayScore,
          updated_at: nowIso,
        })
        .eq('id', match.id)

      if (error) {
        errors.push(`${match.home_team} vs ${match.away_team}: ${error.message}`)
      } else {
        finished.push(`${match.home_team} ${homeScore}-${awayScore} ${match.away_team}`)
      }
    }

    // STATUS_IN_PROGRESS → asegurar live (por si llegó antes del cron de hora)
    if (espnStatus === 'STATUS_IN_PROGRESS' && match.status === 'scheduled') {
      await supabase
        .from('matches')
        .update({ status: 'live', updated_at: nowIso })
        .eq('id', match.id)
    }
  }

  return NextResponse.json({
    timestamp: nowIso,
    activated:        activated?.length ?? 0,
    activatedMatches: activated?.map(m => `${m.home_team} vs ${m.away_team}`) ?? [],
    finishedFromEspn: finished.length,
    finished,
    espnEventsFound: espnEvents.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}

