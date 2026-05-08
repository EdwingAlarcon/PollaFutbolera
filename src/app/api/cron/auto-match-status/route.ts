import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ──────────────────────────────────────────────────────────────────────────────
// CRON: Transiciones automáticas de estado de partidos
//
// scheduled → live   : cuando match_date <= now
// live → finished    : NO automático — requiere marcador real del admin
//
// Recomendado: ejecutar cada 5-10 min desde cron-job.org
//   URL: https://polla-futbolera-five.vercel.app/api/cron/auto-match-status
//   Header: Authorization: Bearer <CRON_SECRET>
// ──────────────────────────────────────────────────────────────────────────────

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const now = new Date().toISOString()

  // scheduled → live: partidos cuya hora ya pasó
  const { data: toActivate, error: e1 } = await supabase
    .from('matches')
    .update({ status: 'live', updated_at: now })
    .eq('status', 'scheduled')
    .lte('match_date', now)
    .select('id, home_team, away_team, match_date')

  if (e1) {
    console.error('[auto-status] Error activating matches:', e1)
    return NextResponse.json({ error: e1.message }, { status: 500 })
  }

  return NextResponse.json({
    activated: toActivate?.length ?? 0,
    matches: toActivate?.map(m => `${m.home_team} vs ${m.away_team}`) ?? [],
    timestamp: now,
  })
}
