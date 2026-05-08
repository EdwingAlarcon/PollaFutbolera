-- Agrega columna de premios a la tabla pools
-- Ejecutar en Supabase SQL Editor

ALTER TABLE pools
  ADD COLUMN IF NOT EXISTS prizes JSONB DEFAULT NULL;

-- Ejemplo de estructura esperada en prizes:
-- [
--   { "position": "🥇 1er Lugar", "prize": "$50.000" },
--   { "position": "🥈 2do Lugar", "prize": "$20.000" },
--   { "position": "🥉 3er Lugar", "prize": "$10.000" }
-- ]
