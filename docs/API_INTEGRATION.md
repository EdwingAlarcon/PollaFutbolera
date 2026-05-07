# 🌐 Integración de API de Partidos

Guía para integrar datos reales de partidos de fútbol.

## 📊 APIs Recomendadas

### 1. API-Football (Recomendada) ⭐

**Plan Gratuito**: 100 requests/día
**Documentación**: https://www.api-football.com/documentation-v3

#### Setup

```bash
npm install axios
```

Agrega a `.env.local`:
```env
FOOTBALL_API_KEY=tu-api-key-aqui
FOOTBALL_API_HOST=v3.football.api-sports.io
```

#### Ejemplo de Implementación

```typescript
// src/lib/football-api.ts
import axios from 'axios'

const footballApi = axios.create({
  baseURL: 'https://v3.football.api-sports.io',
  headers: {
    'x-rapidapi-key': process.env.FOOTBALL_API_KEY!,
    'x-rapidapi-host': process.env.FOOTBALL_API_HOST!,
  },
})

export async function getUpcomingMatches(leagueId: number, season: number) {
  try {
    const response = await footballApi.get('/fixtures', {
      params: {
        league: leagueId,
        season: season,
        next: 10, // Próximos 10 partidos
      },
    })
    
    return response.data.response
  } catch (error) {
    console.error('Error fetching matches:', error)
    return []
  }
}

export async function getMatchResult(fixtureId: number) {
  try {
    const response = await footballApi.get('/fixtures', {
      params: {
        id: fixtureId,
      },
    })
    
    const match = response.data.response[0]
    return {
      home_score: match.goals.home,
      away_score: match.goals.away,
      status: match.fixture.status.short === 'FT' ? 'finished' : 'live',
    }
  } catch (error) {
    console.error('Error fetching result:', error)
    return null
  }
}

// IDs de ligas comunes
export const LEAGUES = {
  WORLD_CUP: 1,
  CHAMPIONS_LEAGUE: 2,
  PREMIER_LEAGUE: 39,
  LA_LIGA: 140,
  SERIE_A: 135,
  BUNDESLIGA: 78,
  LIGUE_1: 61,
}
```

### 2. TheSportsDB (Gratis pero limitada)

**Plan Gratuito**: Ilimitado pero datos limitados
**Documentación**: https://www.thesportsdb.com/api.php

```typescript
// src/lib/sportsdb-api.ts
export async function getUpcomingMatches(leagueName: string) {
  const response = await fetch(
    `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${leagueId}`
  )
  const data = await response.json()
  return data.events
}
```

## 🔄 Sincronización Automática

### Cron Job para Actualizar Partidos

```typescript
// src/app/api/cron/update-matches/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUpcomingMatches } from '@/lib/football-api'

export async function GET(request: NextRequest) {
  // Verificar token de autorización (para Vercel Cron)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Obtener partidos de la API
    const matches = await getUpcomingMatches(1, 2026) // Mundial 2026
    
    // Insertar en Supabase
    for (const match of matches) {
      await supabase.from('matches').upsert({
        external_api_id: match.fixture.id.toString(),
        tournament_id: 'world-cup-2026',
        home_team: match.teams.home.name,
        away_team: match.teams.away.name,
        match_date: match.fixture.date,
        status: 'scheduled',
      })
    }

    return NextResponse.json({ success: true, count: matches.length })
  } catch (error) {
    console.error('Error updating matches:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

### Configurar Cron en Vercel

Crea `vercel.json` en la raíz:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-matches",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/update-results",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Agrega a `.env.local`:
```env
CRON_SECRET=tu-secreto-aleatorio-aqui
```

### Actualizar Resultados Automáticamente

```typescript
// src/app/api/cron/update-results/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getMatchResult } from '@/lib/football-api'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Obtener partidos que están en progreso o por finalizar
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .in('status', ['scheduled', 'live'])
      .lte('match_date', new Date().toISOString())
    
    if (!matches) return NextResponse.json({ success: true, count: 0 })

    let updated = 0
    
    for (const match of matches) {
      if (!match.external_api_id) continue
      
      const result = await getMatchResult(parseInt(match.external_api_id))
      
      if (result) {
        await supabase
          .from('matches')
          .update({
            home_score: result.home_score,
            away_score: result.away_score,
            status: result.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', match.id)
        
        updated++
      }
      
      // Rate limiting: esperar 1 segundo entre requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return NextResponse.json({ success: true, updated })
  } catch (error) {
    console.error('Error updating results:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

## 💾 Cache para Optimizar Requests

```typescript
// src/lib/cache.ts
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export function getCached<T>(key: string): T | null {
  const cached = cache.get(key)
  
  if (!cached) return null
  
  const age = Date.now() - cached.timestamp
  
  if (age > CACHE_DURATION) {
    cache.delete(key)
    return null
  }
  
  return cached.data as T
}

export function setCache(key: string, data: any) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  })
}

// Uso
import { getCached, setCache } from '@/lib/cache'

export async function getMatchesWithCache(leagueId: number) {
  const cacheKey = `matches-${leagueId}`
  
  // Intentar obtener del cache
  const cached = getCached(cacheKey)
  if (cached) return cached
  
  // Si no está en cache, fetch de la API
  const matches = await getUpcomingMatches(leagueId, 2026)
  
  // Guardar en cache
  setCache(cacheKey, matches)
  
  return matches
}
```

## 📝 Mapeo de Datos

```typescript
// src/lib/mappers.ts
import { Match } from '@/lib/supabase'

export function mapApiMatchToDb(apiMatch: any): Partial<Match> {
  return {
    external_api_id: apiMatch.fixture.id.toString(),
    tournament_id: getTournamentId(apiMatch.league.id),
    home_team: apiMatch.teams.home.name,
    away_team: apiMatch.teams.away.name,
    match_date: apiMatch.fixture.date,
    home_score: apiMatch.goals.home,
    away_score: apiMatch.goals.away,
    status: mapStatus(apiMatch.fixture.status.short),
  }
}

function mapStatus(apiStatus: string): 'scheduled' | 'live' | 'finished' {
  const statusMap: Record<string, 'scheduled' | 'live' | 'finished'> = {
    'NS': 'scheduled',    // Not Started
    'TBD': 'scheduled',   // To Be Defined
    '1H': 'live',         // First Half
    'HT': 'live',         // Half Time
    '2H': 'live',         // Second Half
    'ET': 'live',         // Extra Time
    'P': 'live',          // Penalty
    'FT': 'finished',     // Full Time
    'AET': 'finished',    // After Extra Time
    'PEN': 'finished',    // Finished on Penalties
  }
  
  return statusMap[apiStatus] || 'scheduled'
}

function getTournamentId(leagueId: number): string {
  const tournamentMap: Record<number, string> = {
    1: 'world-cup-2026',
    2: 'champions-league',
    39: 'premier-league',
    140: 'la-liga',
  }
  
  return tournamentMap[leagueId] || 'other'
}
```

## 🎯 Ejemplo Completo: Componente de Partidos

```typescript
// src/app/pool/[id]/matches/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase, type Match } from '@/lib/supabase'

export default function MatchesPage({ params }: { params: { id: string } }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMatches()
    
    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('matches-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          console.log('Match updated:', payload)
          loadMatches() // Recargar
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true })
      .gte('match_date', new Date().toISOString())
      .limit(10)

    if (data) setMatches(data)
    setLoading(false)
  }

  if (loading) return <div>Cargando partidos...</div>

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <div key={match.id} className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <p className="font-semibold">{match.home_team}</p>
              {match.home_score !== null && (
                <p className="text-2xl font-bold">{match.home_score}</p>
              )}
            </div>
            
            <div className="text-center px-4">
              <p className="text-sm text-gray-600">VS</p>
              <p className="text-xs text-gray-500">
                {new Date(match.match_date).toLocaleString('es', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            
            <div className="flex-1 text-right">
              <p className="font-semibold">{match.away_team}</p>
              {match.away_score !== null && (
                <p className="text-2xl font-bold">{match.away_score}</p>
              )}
            </div>
          </div>
          
          <div className="mt-2">
            {match.status === 'scheduled' && (
              <button className="w-full bg-green-600 text-white py-2 rounded">
                Hacer Predicción
              </button>
            )}
            {match.status === 'live' && (
              <p className="text-center text-red-600 font-bold">🔴 EN VIVO</p>
            )}
            {match.status === 'finished' && (
              <p className="text-center text-gray-600">Finalizado</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
```

## 💡 Tips de Optimización

1. **Cache agresivo**: Guarda respuestas de la API por 5-10 minutos
2. **Rate limiting**: No excedas los límites de tu plan
3. **Webhooks**: Si la API lo soporta, usa webhooks en vez de polling
4. **Fallback**: Ten datos de respaldo si la API falla
5. **Monitoring**: Usa servicios como Sentry para detectar errores

## 📊 Monitoreo de Uso

```typescript
// src/lib/api-monitor.ts
export async function logApiCall(endpoint: string, success: boolean) {
  await supabase.from('api_logs').insert({
    endpoint,
    success,
    timestamp: new Date().toISOString(),
  })
}

// Uso
try {
  const matches = await getUpcomingMatches(1, 2026)
  await logApiCall('get-matches', true)
} catch (error) {
  await logApiCall('get-matches', false)
}
```

---

**¡Con esto tu app tendrá datos reales de partidos! ⚽**
