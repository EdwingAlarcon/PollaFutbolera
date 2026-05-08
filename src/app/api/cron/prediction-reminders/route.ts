import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// ──────────────────────────────────────────────────────────────────────────────
// CRON JOB: Envía recordatorios de pronósticos para partidos del día
// Schedule: diariamente a las 12:00 UTC  →  vercel.json: "schedule": "0 12 * * *"
//
// ⚠️  Para recordatorios más frecuentes (ej: cada hora), usa cron-job.org
//    (gratuito) apuntando a: https://polla-futbolera-five.vercel.app/api/cron/prediction-reminders
//    con el header: Authorization: Bearer <CRON_SECRET>
//
// Variables de entorno requeridas en Vercel:
//   SUPABASE_SERVICE_ROLE_KEY  →  Supabase → Project Settings → API → service_role secret
//   RESEND_API_KEY             →  resend.com → API Keys
//   CRON_SECRET                →  string aleatorio para proteger el endpoint
//   NEXT_PUBLIC_APP_URL        →  https://polla-futbolera-five.vercel.app
//   RESEND_FROM_EMAIL          →  (opcional) ej: recordatorio@tu-dominio.com
// ──────────────────────────────────────────────────────────────────────────────

const resend = new Resend(process.env.RESEND_API_KEY)

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  // 1. Verificar el cron secret para evitar llamadas no autorizadas
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const now = new Date()

  // 2. Buscar partidos que empiecen en las próximas 12 horas sin recordatorio
  //    (cron diario a mediodía UTC cubre los partidos de la tarde/noche del mismo día)
  const windowStart = now
  const windowEnd   = new Date(now.getTime() + 12 * 60 * 60 * 1000)  // +12 horas

  const { data: upcomingMatches, error: matchError } = await supabase
    .from('matches')
    .select('id, tournament_id, home_team, away_team, match_date')
    .eq('status', 'scheduled')
    .gte('match_date', windowStart.toISOString())
    .lte('match_date', windowEnd.toISOString())

  if (matchError) {
    console.error('[cron] Error fetching matches:', matchError)
    return NextResponse.json({ error: matchError.message }, { status: 500 })
  }

  if (!upcomingMatches || upcomingMatches.length === 0) {
    return NextResponse.json({ sent: 0, message: 'Sin partidos próximos en la ventana de 60-90 min' })
  }

  // 3. Obtener los IDs de torneos involucrados y buscar pollas asociadas
  const tournamentIds = [...new Set(upcomingMatches.map(m => m.tournament_id))]

  const { data: pools } = await supabase
    .from('pools')
    .select('id, name, tournament_id, scoring_rules')
    .in('tournament_id', tournamentIds)

  if (!pools || pools.length === 0) {
    return NextResponse.json({ sent: 0, message: 'Sin pollas para estos torneos' })
  }

  // 4. Obtener todos los miembros de esas pollas con su email y username
  const poolIds = pools.map(p => p.id)

  const { data: members } = await supabase
    .from('pool_members')
    .select('pool_id, user_id, users(email, username)')
    .in('pool_id', poolIds)

  if (!members || members.length === 0) {
    return NextResponse.json({ sent: 0, message: 'Sin miembros en las pollas' })
  }

  // 5. Verificar qué predicciones ya existen para estos partidos
  const matchIds = upcomingMatches.map(m => m.id)

  const { data: existingPredictions } = await supabase
    .from('predictions')
    .select('user_id, match_id')
    .in('match_id', matchIds)

  const predictedSet = new Set(
    (existingPredictions ?? []).map(p => `${p.user_id}:${p.match_id}`)
  )

  // 6. Enviar correos a quienes aún no tienen pronóstico
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://polla-futbolera-five.vercel.app'
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  let emailsSent = 0
  const sentKeys = new Set<string>()

  for (const match of upcomingMatches) {
    const matchPools = pools.filter(p => p.tournament_id === match.tournament_id)

    for (const pool of matchPools) {
      const poolMembers = members.filter(m => m.pool_id === pool.id)

      for (const member of poolMembers) {
        const hasPrediction = predictedSet.has(`${member.user_id}:${match.id}`)
        if (hasPrediction) continue

        const user = (Array.isArray(member.users) ? member.users[0] : member.users) as { email: string; username: string } | null
        if (!user?.email) continue

        // Evitar duplicados si un usuario está en dos pollas del mismo torneo
        const key = `${member.user_id}:${match.id}:${pool.id}`
        if (sentKeys.has(key)) continue
        sentKeys.add(key)

        const matchDate = new Date(match.match_date)
        const timeStr = matchDate.toLocaleTimeString('es-ES', {
          hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota',
        })
        const dateStr = matchDate.toLocaleDateString('es-ES', {
          weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Bogota',
        })

        try {
          await resend.emails.send({
            from: `PollaFutbolera <${fromEmail}>`,
            to: user.email,
            subject: `⚽ ¡Menos de 1 hora! ${match.home_team} vs ${match.away_team}`,
            html: buildReminderEmail({
              username: user.username,
              poolName: pool.name,
              poolId: pool.id,
              homeTeam: match.home_team,
              awayTeam: match.away_team,
              dateStr,
              timeStr,
              appUrl,
              scoring: pool.scoring_rules,
            }),
          })
          emailsSent++
        } catch (err) {
          console.error(`[cron] Error sending email to ${user.email}:`, err)
        }
      }
    }
  }

  return NextResponse.json({
    sent: emailsSent,
    matchesChecked: upcomingMatches.length,
    pools: pools.length,
  })
}

// ─── Plantilla HTML del correo ───────────────────────────────────────────────

function buildReminderEmail(opts: {
  username: string
  poolName: string
  poolId: string
  homeTeam: string
  awayTeam: string
  dateStr: string
  timeStr: string
  appUrl: string
  scoring: { exactScore?: number; correctDifference?: number; correctResult?: number } | null
}) {
  const { username, poolName, poolId, homeTeam, awayTeam, dateStr, timeStr, appUrl, scoring } = opts
  const pts = {
    exact: scoring?.exactScore ?? 5,
    diff:  scoring?.correctDifference ?? 3,
    win:   scoring?.correctResult ?? 1,
  }
  const poolUrl = `${appUrl}/pool/${poolId}`

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de pronóstico</title>
</head>
<body style="margin:0;padding:0;background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#030712;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#111827;border-radius:20px;overflow:hidden;border:1px solid #1f2937;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#064e3b 0%,#065f46 60%,#047857 100%);padding:36px 32px 28px;text-align:center;">
              <p style="color:#6ee7b7;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">⚽ PollaFutbolera</p>
              <h1 style="color:#ffffff;margin:0 0 6px;font-size:24px;font-weight:900;line-height:1.2;">¡Tienes menos de 1 hora!</h1>
              <p style="color:#a7f3d0;margin:0;font-size:14px;">Grupo: <strong>${poolName}</strong></p>
            </td>
          </tr>

          <!-- CUERPO -->
          <tr>
            <td style="padding:32px 28px 8px;">

              <p style="color:#9ca3af;margin:0 0 20px;font-size:15px;line-height:1.6;">
                Hola <strong style="color:#f9fafb;">${username}</strong>,<br>
                el siguiente partido comienza pronto y aún no has ingresado tu pronóstico:
              </p>

              <!-- MATCH CARD -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1f2937;border:1px solid #374151;border-radius:14px;padding:0;margin-bottom:20px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;text-align:center;">
                    <p style="color:#6b7280;font-size:11px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">${dateStr} &nbsp;·&nbsp; ${timeStr} (COL)</p>
                    <p style="color:#f9fafb;font-size:26px;font-weight:900;margin:0 0 4px;line-height:1.1;">
                      ${homeTeam}
                    </p>
                    <p style="color:#4b5563;font-size:14px;font-weight:700;margin:4px 0;letter-spacing:2px;">VS</p>
                    <p style="color:#f9fafb;font-size:26px;font-weight:900;margin:0;line-height:1.1;">
                      ${awayTeam}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- ALERTA DE BLOQUEO -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#431407;border:1px solid #9a3412;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="color:#fdba74;font-size:13px;margin:0;line-height:1.5;">
                      🔒 <strong>Los campos se bloquean automáticamente cuando el partido comienza.</strong>
                      Solo se tienen en cuenta los 90 minutos reglamentarios (sin tiempo extra ni penales).
                    </p>
                  </td>
                </tr>
              </table>

              <!-- SISTEMA DE PUNTOS -->
              <p style="color:#6b7280;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 10px;">Sistema de puntuación</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;margin-bottom:28px;border:1px solid #1f2937;">
                <tr style="background:#1c2a1e;">
                  <td style="padding:10px 14px;color:#86efac;font-size:13px;font-weight:600;">🏆 Resultado exacto</td>
                  <td style="padding:10px 14px;color:#4ade80;font-size:16px;font-weight:900;text-align:right;">${pts.exact} pts</td>
                </tr>
                <tr style="background:#1a2535;">
                  <td style="padding:10px 14px;color:#93c5fd;font-size:13px;font-weight:600;">📊 Diferencia de goles</td>
                  <td style="padding:10px 14px;color:#60a5fa;font-size:16px;font-weight:900;text-align:right;">${pts.diff} pts</td>
                </tr>
                <tr style="background:#1e1a35;">
                  <td style="padding:10px 14px;color:#c4b5fd;font-size:13px;font-weight:600;">✅ Ganador / Empate</td>
                  <td style="padding:10px 14px;color:#a78bfa;font-size:16px;font-weight:900;text-align:right;">${pts.win} pt</td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${poolUrl}"
                       style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:900;font-size:16px;padding:16px 44px;border-radius:14px;text-decoration:none;letter-spacing:0.5px;">
                      INGRESAR MI PRONÓSTICO →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:16px 28px 24px;border-top:1px solid #1f2937;text-align:center;">
              <p style="color:#374151;font-size:12px;margin:0;line-height:1.6;">
                Recibes este correo porque eres miembro de <strong style="color:#4b5563;">${poolName}</strong>.<br>
                PollaFutbolera &mdash; Todos los pronósticos son solo para los 90 min reglamentarios.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
