-- Add ESPN team ID columns to matches table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/awboczsgkbigdzrvbikb/sql/new
ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_team_espn_id INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_team_espn_id INTEGER;
