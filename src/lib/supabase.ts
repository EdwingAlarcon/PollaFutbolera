import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export type User = {
  id: string
  username: string
  email: string
  avatar_url?: string
  created_at: string
}

export type Pool = {
  id: string
  name: string
  invite_code: string
  admin_id: string
  tournament_id: string
  scoring_rules: ScoringRules
  created_at: string
}

export type ScoringRules = {
  exactScore: number
  correctDifference: number
  correctResult: number
}

export type Match = {
  id: string
  tournament_id: string
  home_team: string
  away_team: string
  match_date: string
  home_score?: number
  away_score?: number
  status: 'scheduled' | 'live' | 'finished'
}

export type Prediction = {
  id: string
  user_id: string
  match_id: string
  pool_id: string
  predicted_home_score: number
  predicted_away_score: number
  points_earned: number
  created_at: string
}
