-- ============================================================
-- FASE ELIMINATORIA — MUNDIAL 2026
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================
-- ⚠️  INSTRUCCIONES:
--   1. Ejecutar DESPUÉS de que terminen los grupos (≈29 jun 2026)
--   2. Los equipos están como "1° Grupo X" / "2° Grupo Y" —
--      reemplazarlos con los nombres reales ANTES de ejecutar,
--      o actualizarlos desde el Panel Admin después.
--   3. Los horarios son UTC. Ajustar si FIFA confirma cambios.
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- RONDA DE 32 (16 partidos) — 1 al 4 de julio 2026
-- ════════════════════════════════════════════════════════════
INSERT INTO matches (tournament_id, home_team, away_team, match_date, status, round) VALUES

-- Julio 1
('world-cup-2026', '1° Grupo A', '2° Grupo B', '2026-07-01 18:00:00+00', 'scheduled', 'round-of-32'),
('world-cup-2026', '1° Grupo C', '2° Grupo D', '2026-07-01 22:00:00+00', 'scheduled', 'round-of-32'),
('world-cup-2026', '1° Grupo E', '2° Grupo F', '2026-07-02 01:00:00+00', 'scheduled', 'round-of-32'),
('world-cup-2026', '1° Grupo G', '2° Grupo H', '2026-07-02 04:00:00+00', 'scheduled', 'round-of-32'),

-- Julio 2
('world-cup-2026', '1° Grupo B', '2° Grupo A', '2026-07-02 18:00:00+00', 'scheduled', 'round-of-32'),
('world-cup-2026', '1° Grupo D', '2° Grupo C', '2026-07-02 22:00:00+00', 'scheduled', 'round-of-32'),
('world-cup-2026', '1° Grupo F', '2° Grupo E', '2026-07-03 01:00:00+00', 'scheduled', 'round-of-32'),
('world-cup-2026', '1° Grupo H', '2° Grupo G', '2026-07-03 04:00:00+00', 'scheduled', 'round-of-32'),

-- Julio 3
('world-cup-2026', '1° Grupo I',  '2° Grupo J',  '2026-07-03 18:00:00+00', 'scheduled', 'round-of-32'),
('world-cup-2026', '1° Grupo K',  '2° Grupo L',  '2026-07-03 22:00:00+00', 'scheduled', 'round-of-32'),
('world-cup-2026', '3° Grupos A/B/C/D', '3° Grupos E/F/G/H', '2026-07-04 01:00:00+00', 'scheduled', 'round-of-32'),
('world-cup-2026', '3° Grupos I/J/K/L', '3° Mejor restante', '2026-07-04 04:00:00+00', 'scheduled', 'round-of-32'),

-- Julio 4
('world-cup-2026', '1° Grupo J', '2° Grupo I',  '2026-07-04 18:00:00+00', 'scheduled', 'round-of-32'),
('world-cup-2026', '1° Grupo L', '2° Grupo K',  '2026-07-04 22:00:00+00', 'scheduled', 'round-of-32'),
('world-cup-2026', '3° Grupo A/B', '3° Grupo C/D', '2026-07-05 01:00:00+00', 'scheduled', 'round-of-32'),
('world-cup-2026', '3° Grupo E/F', '3° Grupo G/H', '2026-07-05 04:00:00+00', 'scheduled', 'round-of-32'),

-- ════════════════════════════════════════════════════════════
-- OCTAVOS DE FINAL (8 partidos) — 6 al 9 de julio 2026
-- ════════════════════════════════════════════════════════════

-- Julio 6
('world-cup-2026', 'Ganador R32-1', 'Ganador R32-2', '2026-07-06 18:00:00+00', 'scheduled', 'round-of-16'),
('world-cup-2026', 'Ganador R32-3', 'Ganador R32-4', '2026-07-06 22:00:00+00', 'scheduled', 'round-of-16'),

-- Julio 7
('world-cup-2026', 'Ganador R32-5', 'Ganador R32-6', '2026-07-07 18:00:00+00', 'scheduled', 'round-of-16'),
('world-cup-2026', 'Ganador R32-7', 'Ganador R32-8', '2026-07-07 22:00:00+00', 'scheduled', 'round-of-16'),

-- Julio 8
('world-cup-2026', 'Ganador R32-9',  'Ganador R32-10', '2026-07-08 18:00:00+00', 'scheduled', 'round-of-16'),
('world-cup-2026', 'Ganador R32-11', 'Ganador R32-12', '2026-07-08 22:00:00+00', 'scheduled', 'round-of-16'),

-- Julio 9
('world-cup-2026', 'Ganador R32-13', 'Ganador R32-14', '2026-07-09 18:00:00+00', 'scheduled', 'round-of-16'),
('world-cup-2026', 'Ganador R32-15', 'Ganador R32-16', '2026-07-09 22:00:00+00', 'scheduled', 'round-of-16'),

-- ════════════════════════════════════════════════════════════
-- CUARTOS DE FINAL (4 partidos) — 11 y 12 de julio 2026
-- ════════════════════════════════════════════════════════════

-- Julio 11
('world-cup-2026', 'Ganador Oct-1', 'Ganador Oct-2', '2026-07-11 18:00:00+00', 'scheduled', 'quarterfinal'),
('world-cup-2026', 'Ganador Oct-3', 'Ganador Oct-4', '2026-07-11 22:00:00+00', 'scheduled', 'quarterfinal'),

-- Julio 12
('world-cup-2026', 'Ganador Oct-5', 'Ganador Oct-6', '2026-07-12 18:00:00+00', 'scheduled', 'quarterfinal'),
('world-cup-2026', 'Ganador Oct-7', 'Ganador Oct-8', '2026-07-12 22:00:00+00', 'scheduled', 'quarterfinal'),

-- ════════════════════════════════════════════════════════════
-- SEMIFINALES (2 partidos) — 15 y 16 de julio 2026
-- ════════════════════════════════════════════════════════════
('world-cup-2026', 'Ganador CF-1', 'Ganador CF-2', '2026-07-15 22:00:00+00', 'scheduled', 'semifinal'),
('world-cup-2026', 'Ganador CF-3', 'Ganador CF-4', '2026-07-16 22:00:00+00', 'scheduled', 'semifinal'),

-- ════════════════════════════════════════════════════════════
-- TERCER LUGAR — 18 de julio 2026
-- ════════════════════════════════════════════════════════════
('world-cup-2026', 'Perdedor SF-1', 'Perdedor SF-2', '2026-07-18 18:00:00+00', 'scheduled', 'third-place'),

-- ════════════════════════════════════════════════════════════
-- FINAL — 19 de julio 2026
-- ════════════════════════════════════════════════════════════
('world-cup-2026', 'Ganador SF-1', 'Ganador SF-2', '2026-07-19 22:00:00+00', 'scheduled', 'final');

-- ============================================================
-- PASO FINAL: actualizar nombres de equipos reales
-- Ejemplo (reemplazar con los equipos que clasifiquen):
--   UPDATE matches SET home_team = 'Argentina', away_team = 'Francia'
--   WHERE tournament_id = 'world-cup-2026' AND round = 'final';
-- ============================================================

SELECT round, COUNT(*) as partidos
FROM matches
WHERE tournament_id = 'world-cup-2026'
GROUP BY round
ORDER BY MIN(match_date);
