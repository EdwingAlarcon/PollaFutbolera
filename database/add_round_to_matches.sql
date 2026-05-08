-- ============================================================
-- MIGRACIÓN: Columna 'round' en matches + RLS para admin
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

-- 1. Agregar columna round con valor por defecto 'group'
ALTER TABLE matches ADD COLUMN IF NOT EXISTS round VARCHAR(30) DEFAULT 'group';

-- 2. Asegurar que todos los partidos existentes tienen round = 'group'
UPDATE matches
SET round = 'group'
WHERE tournament_id = 'world-cup-2026'
  AND (round IS NULL OR round = 'group');

-- 3. Corregir política RLS de matches para permitir que el admin
--    pueda INSERT/UPDATE/DELETE partidos desde el cliente
--    (la policy original usaba USING(false) que bloqueaba todo)
DROP POLICY IF EXISTS "Only admins can modify matches" ON matches;

CREATE POLICY "Admins can modify matches"
    ON matches FOR ALL
    USING (
        auth.email() = ANY(ARRAY['bdp.usf@gmail.com'])
    )
    WITH CHECK (
        auth.email() = ANY(ARRAY['bdp.usf@gmail.com'])
    );

-- Verificar
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'matches' AND column_name = 'round';
