/**
 * Mapeo de nombres de equipos en español (como están en la DB)
 * a los códigos y nombres en inglés que usa ESPN API.
 *
 * ESPN API endpoint (sin API key):
 *   https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=YYYYMMDD
 */
export const TEAM_ESPN: Record<string, { code: string; en: string }> = {
  // ── Grupo A ─────────────────────────────
  'México':               { code: 'MEX', en: 'Mexico' },
  'Sudáfrica':            { code: 'RSA', en: 'South Africa' },
  'Corea del Sur':        { code: 'KOR', en: 'South Korea' },
  'República Checa':      { code: 'CZE', en: 'Czech Republic' },
  // ── Grupo B ─────────────────────────────
  'Canadá':               { code: 'CAN', en: 'Canada' },
  'Bosnia y Herzegovina': { code: 'BIH', en: 'Bosnia and Herzegovina' },
  'Qatar':                { code: 'QAT', en: 'Qatar' },
  'Suiza':                { code: 'SUI', en: 'Switzerland' },
  // ── Grupo C ─────────────────────────────
  'Brasil':               { code: 'BRA', en: 'Brazil' },
  'Marruecos':            { code: 'MAR', en: 'Morocco' },
  'Haití':                { code: 'HAI', en: 'Haiti' },
  'Escocia':              { code: 'SCO', en: 'Scotland' },
  // ── Grupo D ─────────────────────────────
  'Estados Unidos':       { code: 'USA', en: 'USA' },
  'Paraguay':             { code: 'PAR', en: 'Paraguay' },
  'Australia':            { code: 'AUS', en: 'Australia' },
  'Turquía':              { code: 'TUR', en: 'Turkey' },
  // ── Grupo E ─────────────────────────────
  'Alemania':             { code: 'GER', en: 'Germany' },
  'Curaçao':              { code: 'CUW', en: 'Curacao' },
  'Costa de Marfil':      { code: 'CIV', en: 'Ivory Coast' },
  'Ecuador':              { code: 'ECU', en: 'Ecuador' },
  // ── Grupo F ─────────────────────────────
  'Holanda':              { code: 'NED', en: 'Netherlands' },
  'Japón':                { code: 'JPN', en: 'Japan' },
  'Suecia':               { code: 'SWE', en: 'Sweden' },
  'Túnez':                { code: 'TUN', en: 'Tunisia' },
  // ── Grupo G ─────────────────────────────
  'Bélgica':              { code: 'BEL', en: 'Belgium' },
  'Egipto':               { code: 'EGY', en: 'Egypt' },
  'Irán':                 { code: 'IRN', en: 'Iran' },
  'Nueva Zelanda':        { code: 'NZL', en: 'New Zealand' },
  // ── Grupo H ─────────────────────────────
  'España':               { code: 'ESP', en: 'Spain' },
  'Cabo Verde':           { code: 'CPV', en: 'Cape Verde' },
  'Arabia Saudita':       { code: 'KSA', en: 'Saudi Arabia' },
  'Uruguay':              { code: 'URU', en: 'Uruguay' },
  // ── Grupo I ─────────────────────────────
  'Francia':              { code: 'FRA', en: 'France' },
  'Senegal':              { code: 'SEN', en: 'Senegal' },
  'Irak':                 { code: 'IRQ', en: 'Iraq' },
  'Noruega':              { code: 'NOR', en: 'Norway' },
  // ── Grupo J ─────────────────────────────
  'Argentina':            { code: 'ARG', en: 'Argentina' },
  'Argelia':              { code: 'ALG', en: 'Algeria' },
  'Austria':              { code: 'AUT', en: 'Austria' },
  'Jordania':             { code: 'JOR', en: 'Jordan' },
  // ── Grupo K ─────────────────────────────
  'Portugal':             { code: 'POR', en: 'Portugal' },
  'DR Congo':             { code: 'COD', en: 'DR Congo' },
  'Uzbekistán':           { code: 'UZB', en: 'Uzbekistan' },
  'Colombia':             { code: 'COL', en: 'Colombia' },
  // ── Grupo L ─────────────────────────────
  'Inglaterra':           { code: 'ENG', en: 'England' },
  'Croacia':              { code: 'CRO', en: 'Croatia' },
  'Ghana':                { code: 'GHA', en: 'Ghana' },
  'Panamá':               { code: 'PAN', en: 'Panama' },
}

/**
 * Busca un partido de nuestra DB dentro de los eventos de ESPN.
 * Usa doble criterio: código de 3 letras Y nombre en inglés como fallback.
 */
export function findEspnEvent(
  events: any[],
  homeTeam: string,
  awayTeam: string,
): { event: any; home: any; away: any } | null {
  const homeInfo = TEAM_ESPN[homeTeam]
  const awayInfo = TEAM_ESPN[awayTeam]
  if (!homeInfo || !awayInfo) return null

  for (const event of events) {
    const competitors: any[] = event.competitions?.[0]?.competitors ?? []
    const home = competitors.find((c: any) => c.homeAway === 'home')
    const away = competitors.find((c: any) => c.homeAway === 'away')
    if (!home || !away) continue

    const homeCode = home.team?.abbreviation?.toUpperCase()
    const awayCode = away.team?.abbreviation?.toUpperCase()
    const homeName = home.team?.displayName?.toLowerCase()
    const awayName = away.team?.displayName?.toLowerCase()

    const homeMatch =
      homeCode === homeInfo.code ||
      homeName === homeInfo.en.toLowerCase()
    const awayMatch =
      awayCode === awayInfo.code ||
      awayName === awayInfo.en.toLowerCase()

    if (homeMatch && awayMatch) return { event, home, away }
  }
  return null
}
