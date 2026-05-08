-- ============================================================
-- PARTIDOS OFICIALES - FASE DE GRUPOS MUNDIAL 2026
-- Fuente: FIFA / Wikipedia (diciembre 2025)
-- tournament_id: 'world-cup-2026'
-- Horarios en UTC
-- ============================================================
-- EJECUTAR EN: Supabase → SQL Editor
-- ============================================================

INSERT INTO matches (tournament_id, home_team, away_team, match_date, status) VALUES

-- ══════════════════════════════════════════════
-- GRUPO A: México, Sudáfrica, Corea del Sur, República Checa
-- ══════════════════════════════════════════════
-- Jornada 1
('world-cup-2026', 'México',           'Sudáfrica',        '2026-06-11 19:00:00+00', 'scheduled'),
('world-cup-2026', 'Corea del Sur',    'República Checa',  '2026-06-12 02:00:00+00', 'scheduled'),
-- Jornada 2
('world-cup-2026', 'República Checa',  'Sudáfrica',        '2026-06-18 16:00:00+00', 'scheduled'),
('world-cup-2026', 'México',           'Corea del Sur',    '2026-06-19 01:00:00+00', 'scheduled'),
-- Jornada 3 (simultáneos)
('world-cup-2026', 'República Checa',  'México',           '2026-06-25 01:00:00+00', 'scheduled'),
('world-cup-2026', 'Sudáfrica',        'Corea del Sur',    '2026-06-25 01:00:00+00', 'scheduled'),

-- ══════════════════════════════════════════════
-- GRUPO B: Canadá, Bosnia y Herzegovina, Qatar, Suiza
-- ══════════════════════════════════════════════
-- Jornada 1
('world-cup-2026', 'Canadá',              'Bosnia y Herzegovina', '2026-06-12 19:00:00+00', 'scheduled'),
('world-cup-2026', 'Qatar',               'Suiza',                '2026-06-13 19:00:00+00', 'scheduled'),
-- Jornada 2
('world-cup-2026', 'Suiza',               'Bosnia y Herzegovina', '2026-06-18 19:00:00+00', 'scheduled'),
('world-cup-2026', 'Canadá',              'Qatar',                '2026-06-18 22:00:00+00', 'scheduled'),
-- Jornada 3 (simultáneos)
('world-cup-2026', 'Suiza',               'Canadá',               '2026-06-24 19:00:00+00', 'scheduled'),
('world-cup-2026', 'Bosnia y Herzegovina','Qatar',                 '2026-06-24 19:00:00+00', 'scheduled'),

-- ══════════════════════════════════════════════
-- GRUPO C: Brasil, Marruecos, Haití, Escocia
-- ══════════════════════════════════════════════
-- Jornada 1
('world-cup-2026', 'Brasil',    'Marruecos', '2026-06-13 22:00:00+00', 'scheduled'),
('world-cup-2026', 'Haití',     'Escocia',   '2026-06-14 01:00:00+00', 'scheduled'),
-- Jornada 2
('world-cup-2026', 'Escocia',   'Marruecos', '2026-06-19 22:00:00+00', 'scheduled'),
('world-cup-2026', 'Brasil',    'Haití',     '2026-06-20 00:30:00+00', 'scheduled'),
-- Jornada 3 (simultáneos)
('world-cup-2026', 'Escocia',   'Brasil',    '2026-06-24 22:00:00+00', 'scheduled'),
('world-cup-2026', 'Marruecos', 'Haití',     '2026-06-24 22:00:00+00', 'scheduled'),

-- ══════════════════════════════════════════════
-- GRUPO D: Estados Unidos, Paraguay, Australia, Turquía
-- ══════════════════════════════════════════════
-- Jornada 1
('world-cup-2026', 'Estados Unidos', 'Paraguay',  '2026-06-13 01:00:00+00', 'scheduled'),
('world-cup-2026', 'Australia',      'Turquía',   '2026-06-14 04:00:00+00', 'scheduled'),
-- Jornada 2
('world-cup-2026', 'Estados Unidos', 'Australia', '2026-06-19 19:00:00+00', 'scheduled'),
('world-cup-2026', 'Turquía',        'Paraguay',  '2026-06-20 03:00:00+00', 'scheduled'),
-- Jornada 3 (simultáneos)
('world-cup-2026', 'Turquía',        'Estados Unidos', '2026-06-26 02:00:00+00', 'scheduled'),
('world-cup-2026', 'Australia',      'Paraguay',       '2026-06-26 02:00:00+00', 'scheduled'),

-- ══════════════════════════════════════════════
-- GRUPO E: Alemania, Curaçao, Costa de Marfil, Ecuador
-- ══════════════════════════════════════════════
-- Jornada 1
('world-cup-2026', 'Alemania',       'Curaçao',        '2026-06-14 17:00:00+00', 'scheduled'),
('world-cup-2026', 'Costa de Marfil','Ecuador',        '2026-06-14 23:00:00+00', 'scheduled'),
-- Jornada 2
('world-cup-2026', 'Alemania',       'Costa de Marfil','2026-06-20 20:00:00+00', 'scheduled'),
('world-cup-2026', 'Ecuador',        'Curaçao',        '2026-06-21 00:00:00+00', 'scheduled'),
-- Jornada 3 (simultáneos)
('world-cup-2026', 'Curaçao',        'Costa de Marfil','2026-06-25 20:00:00+00', 'scheduled'),
('world-cup-2026', 'Ecuador',        'Alemania',       '2026-06-25 20:00:00+00', 'scheduled'),

-- ══════════════════════════════════════════════
-- GRUPO F: Holanda, Japón, Suecia, Túnez
-- ══════════════════════════════════════════════
-- Jornada 1
('world-cup-2026', 'Holanda', 'Japón',  '2026-06-14 20:00:00+00', 'scheduled'),
('world-cup-2026', 'Suecia',  'Túnez',  '2026-06-15 02:00:00+00', 'scheduled'),
-- Jornada 2
('world-cup-2026', 'Holanda', 'Suecia', '2026-06-20 17:00:00+00', 'scheduled'),
('world-cup-2026', 'Túnez',   'Japón',  '2026-06-21 04:00:00+00', 'scheduled'),
-- Jornada 3 (simultáneos)
('world-cup-2026', 'Japón',   'Suecia', '2026-06-25 23:00:00+00', 'scheduled'),
('world-cup-2026', 'Túnez',   'Holanda','2026-06-25 23:00:00+00', 'scheduled'),

-- ══════════════════════════════════════════════
-- GRUPO G: Bélgica, Egipto, Irán, Nueva Zelanda
-- ══════════════════════════════════════════════
-- Jornada 1
('world-cup-2026', 'Bélgica',      'Egipto',       '2026-06-15 19:00:00+00', 'scheduled'),
('world-cup-2026', 'Irán',         'Nueva Zelanda', '2026-06-16 01:00:00+00', 'scheduled'),
-- Jornada 2
('world-cup-2026', 'Bélgica',      'Irán',          '2026-06-21 19:00:00+00', 'scheduled'),
('world-cup-2026', 'Nueva Zelanda','Egipto',         '2026-06-22 01:00:00+00', 'scheduled'),
-- Jornada 3 (simultáneos)
('world-cup-2026', 'Egipto',       'Irán',          '2026-06-27 03:00:00+00', 'scheduled'),
('world-cup-2026', 'Nueva Zelanda','Bélgica',        '2026-06-27 03:00:00+00', 'scheduled'),

-- ══════════════════════════════════════════════
-- GRUPO H: España, Cabo Verde, Arabia Saudita, Uruguay
-- ══════════════════════════════════════════════
-- Jornada 1
('world-cup-2026', 'España',        'Cabo Verde',     '2026-06-15 16:00:00+00', 'scheduled'),
('world-cup-2026', 'Arabia Saudita','Uruguay',         '2026-06-15 22:00:00+00', 'scheduled'),
-- Jornada 2
('world-cup-2026', 'España',        'Arabia Saudita', '2026-06-21 16:00:00+00', 'scheduled'),
('world-cup-2026', 'Uruguay',       'Cabo Verde',     '2026-06-21 22:00:00+00', 'scheduled'),
-- Jornada 3 (simultáneos)
('world-cup-2026', 'Cabo Verde',    'Arabia Saudita', '2026-06-27 00:00:00+00', 'scheduled'),
('world-cup-2026', 'Uruguay',       'España',         '2026-06-27 00:00:00+00', 'scheduled'),

-- ══════════════════════════════════════════════
-- GRUPO I: Francia, Senegal, Irak, Noruega
-- ══════════════════════════════════════════════
-- Jornada 1
('world-cup-2026', 'Francia',  'Senegal', '2026-06-16 19:00:00+00', 'scheduled'),
('world-cup-2026', 'Irak',     'Noruega', '2026-06-16 22:00:00+00', 'scheduled'),
-- Jornada 2
('world-cup-2026', 'Francia',  'Irak',    '2026-06-22 21:00:00+00', 'scheduled'),
('world-cup-2026', 'Noruega',  'Senegal', '2026-06-23 00:00:00+00', 'scheduled'),
-- Jornada 3 (simultáneos)
('world-cup-2026', 'Noruega',  'Francia', '2026-06-26 19:00:00+00', 'scheduled'),
('world-cup-2026', 'Senegal',  'Irak',    '2026-06-26 19:00:00+00', 'scheduled'),

-- ══════════════════════════════════════════════
-- GRUPO J: Argentina, Argelia, Austria, Jordania
-- ══════════════════════════════════════════════
-- Jornada 1
('world-cup-2026', 'Argentina', 'Argelia',  '2026-06-17 01:00:00+00', 'scheduled'),
('world-cup-2026', 'Austria',   'Jordania', '2026-06-17 04:00:00+00', 'scheduled'),
-- Jornada 2
('world-cup-2026', 'Argentina', 'Austria',  '2026-06-22 17:00:00+00', 'scheduled'),
('world-cup-2026', 'Jordania',  'Argelia',  '2026-06-23 03:00:00+00', 'scheduled'),
-- Jornada 3 (simultáneos)
('world-cup-2026', 'Argelia',   'Austria',  '2026-06-28 02:00:00+00', 'scheduled'),
('world-cup-2026', 'Jordania',  'Argentina','2026-06-28 02:00:00+00', 'scheduled'),

-- ══════════════════════════════════════════════
-- GRUPO K: Portugal, DR Congo, Uzbekistán, Colombia
-- ══════════════════════════════════════════════
-- Jornada 1
('world-cup-2026', 'Portugal',    'DR Congo',    '2026-06-17 17:00:00+00', 'scheduled'),
('world-cup-2026', 'Uzbekistán',  'Colombia',    '2026-06-18 02:00:00+00', 'scheduled'),
-- Jornada 2
('world-cup-2026', 'Portugal',    'Uzbekistán',  '2026-06-23 17:00:00+00', 'scheduled'),
('world-cup-2026', 'Colombia',    'DR Congo',    '2026-06-24 02:00:00+00', 'scheduled'),
-- Jornada 3 (simultáneos)
('world-cup-2026', 'Colombia',    'Portugal',    '2026-06-27 23:30:00+00', 'scheduled'),
('world-cup-2026', 'DR Congo',    'Uzbekistán',  '2026-06-27 23:30:00+00', 'scheduled'),

-- ══════════════════════════════════════════════
-- GRUPO L: Inglaterra, Croacia, Ghana, Panamá
-- ══════════════════════════════════════════════
-- Jornada 1
('world-cup-2026', 'Inglaterra', 'Croacia', '2026-06-17 20:00:00+00', 'scheduled'),
('world-cup-2026', 'Ghana',      'Panamá',  '2026-06-17 23:00:00+00', 'scheduled'),
-- Jornada 2
('world-cup-2026', 'Inglaterra', 'Ghana',   '2026-06-23 20:00:00+00', 'scheduled'),
('world-cup-2026', 'Panamá',     'Croacia', '2026-06-23 23:00:00+00', 'scheduled'),
-- Jornada 3 (simultáneos)
('world-cup-2026', 'Panamá',     'Inglaterra', '2026-06-27 21:00:00+00', 'scheduled'),
('world-cup-2026', 'Croacia',    'Ghana',      '2026-06-27 21:00:00+00', 'scheduled');

-- ============================================================
-- Verificar inserción
-- ============================================================
SELECT tournament_id, COUNT(*) as total_partidos
FROM matches
WHERE tournament_id = 'world-cup-2026'
GROUP BY tournament_id;
