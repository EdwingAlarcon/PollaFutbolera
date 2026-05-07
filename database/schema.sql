-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA: users (perfiles de usuario)
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- =============================================
-- TABLA: pools (pollas/ligas privadas)
-- =============================================
CREATE TABLE pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    invite_code VARCHAR(10) UNIQUE NOT NULL,
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tournament_id VARCHAR(50) NOT NULL,
    scoring_rules JSONB DEFAULT '{
        "exactScore": 5,
        "correctDifference": 3,
        "correctResult": 1
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_pools_invite_code ON pools(invite_code);
CREATE INDEX idx_pools_admin ON pools(admin_id);
CREATE INDEX idx_pools_tournament ON pools(tournament_id);

-- Función para generar código de invitación único
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-generar invite_code
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
        NEW.invite_code := generate_invite_code();
        -- Verificar que sea único
        WHILE EXISTS (SELECT 1 FROM pools WHERE invite_code = NEW.invite_code) LOOP
            NEW.invite_code := generate_invite_code();
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invite_code
BEFORE INSERT ON pools
FOR EACH ROW
EXECUTE FUNCTION set_invite_code();

-- =============================================
-- TABLA: pool_members (membresías a pollas)
-- =============================================
CREATE TABLE pool_members (
    pool_id UUID NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY(pool_id, user_id)
);

-- Índices
CREATE INDEX idx_pool_members_user ON pool_members(user_id);
CREATE INDEX idx_pool_members_pool ON pool_members(pool_id);

-- =============================================
-- TABLA: matches (partidos)
-- =============================================
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id VARCHAR(50) NOT NULL,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
    external_api_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_external_api ON matches(external_api_id);

-- =============================================
-- TABLA: predictions (predicciones)
-- =============================================
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    pool_id UUID NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
    predicted_home_score INTEGER NOT NULL CHECK (predicted_home_score >= 0),
    predicted_away_score INTEGER NOT NULL CHECK (predicted_away_score >= 0),
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, match_id, pool_id)
);

-- Índices
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_predictions_pool ON predictions(pool_id);
CREATE INDEX idx_predictions_points ON predictions(points_earned DESC);

-- =============================================
-- FUNCIÓN: Calcular puntos de predicción
-- =============================================
CREATE OR REPLACE FUNCTION calculate_prediction_points(
    p_predicted_home INTEGER,
    p_predicted_away INTEGER,
    p_actual_home INTEGER,
    p_actual_away INTEGER,
    p_scoring_rules JSONB
)
RETURNS INTEGER AS $$
DECLARE
    points INTEGER := 0;
    predicted_diff INTEGER;
    actual_diff INTEGER;
    predicted_result INTEGER;
    actual_result INTEGER;
BEGIN
    -- Resultado exacto
    IF p_predicted_home = p_actual_home AND p_predicted_away = p_actual_away THEN
        RETURN (p_scoring_rules->>'exactScore')::INTEGER;
    END IF;

    -- Diferencia de goles
    predicted_diff := p_predicted_home - p_predicted_away;
    actual_diff := p_actual_home - p_actual_away;

    -- Diferencia correcta
    IF predicted_diff = actual_diff AND actual_diff != 0 THEN
        points := points + (p_scoring_rules->>'correctDifference')::INTEGER;
    END IF;

    -- Resultado correcto (ganador/empate)
    predicted_result := SIGN(predicted_diff);
    actual_result := SIGN(actual_diff);

    IF predicted_result = actual_result THEN
        points := points + (p_scoring_rules->>'correctResult')::INTEGER;
    END IF;

    RETURN points;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Actualizar puntos cuando un partido termina
-- =============================================
CREATE OR REPLACE FUNCTION update_predictions_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar si el partido cambió a 'finished'
    IF NEW.status = 'finished' AND (OLD.status != 'finished' OR OLD IS NULL) THEN
        -- Actualizar todas las predicciones para este partido
        UPDATE predictions p
        SET points_earned = calculate_prediction_points(
            p.predicted_home_score,
            p.predicted_away_score,
            NEW.home_score,
            NEW.away_score,
            (SELECT scoring_rules FROM pools WHERE id = p.pool_id)
        ),
        updated_at = NOW()
        WHERE p.match_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_predictions_points
AFTER INSERT OR UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION update_predictions_points();

-- =============================================
-- FUNCIÓN: Prevenir predicciones después del inicio
-- =============================================
CREATE OR REPLACE FUNCTION prevent_late_predictions()
RETURNS TRIGGER AS $$
DECLARE
    match_date TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT m.match_date INTO match_date
    FROM matches m
    WHERE m.id = NEW.match_id;

    IF match_date <= NOW() THEN
        RAISE EXCEPTION 'No se pueden crear predicciones después del inicio del partido';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_late_predictions
BEFORE INSERT OR UPDATE ON predictions
FOR EACH ROW
EXECUTE FUNCTION prevent_late_predictions();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can view all profiles"
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Políticas para pools
CREATE POLICY "Anyone can view pools"
    ON pools FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create pools"
    ON pools FOR INSERT
    WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admins can update own pools"
    ON pools FOR UPDATE
    USING (auth.uid() = admin_id);

CREATE POLICY "Admins can delete own pools"
    ON pools FOR DELETE
    USING (auth.uid() = admin_id);

-- Políticas para pool_members
CREATE POLICY "Anyone can view pool members"
    ON pool_members FOR SELECT
    USING (true);

CREATE POLICY "Users can join pools"
    ON pool_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave pools"
    ON pool_members FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para matches
CREATE POLICY "Anyone can view matches"
    ON matches FOR SELECT
    USING (true);

-- Solo administradores pueden modificar partidos (para futuras features)
CREATE POLICY "Only admins can modify matches"
    ON matches FOR ALL
    USING (false); -- Por ahora bloqueado, se puede modificar después

-- Políticas para predictions
CREATE POLICY "Users can view predictions in their pools"
    ON predictions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pool_members pm
            WHERE pm.pool_id = predictions.pool_id
            AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own predictions"
    ON predictions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM pool_members pm
            WHERE pm.pool_id = predictions.pool_id
            AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own predictions before match starts"
    ON predictions FOR UPDATE
    USING (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = predictions.match_id
            AND m.match_date > NOW()
        )
    );

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista: Ranking de una polla
CREATE OR REPLACE VIEW pool_rankings AS
SELECT
    p.pool_id,
    p.user_id,
    u.username,
    u.avatar_url,
    SUM(p.points_earned) as total_points,
    COUNT(p.id) as predictions_count,
    COUNT(CASE WHEN p.points_earned > 0 THEN 1 END) as correct_predictions
FROM predictions p
JOIN users u ON p.user_id = u.id
GROUP BY p.pool_id, p.user_id, u.username, u.avatar_url
ORDER BY p.pool_id, total_points DESC;

-- =============================================
-- DATOS DE EJEMPLO (Opcional para testing)
-- =============================================

-- Insertar partidos de ejemplo (Mundial 2026)
INSERT INTO matches (tournament_id, home_team, away_team, match_date, status) VALUES
('world-cup-2026', 'Argentina', 'Brasil', '2026-06-15 20:00:00+00', 'scheduled'),
('world-cup-2026', 'España', 'Alemania', '2026-06-16 16:00:00+00', 'scheduled'),
('world-cup-2026', 'Francia', 'Inglaterra', '2026-06-16 20:00:00+00', 'scheduled'),
('world-cup-2026', 'Portugal', 'Italia', '2026-06-17 16:00:00+00', 'scheduled'),
('world-cup-2026', 'Holanda', 'Bélgica', '2026-06-17 20:00:00+00', 'scheduled');

-- Comentarios
COMMENT ON TABLE users IS 'Perfiles de usuarios de la aplicación';
COMMENT ON TABLE pools IS 'Pollas/ligas privadas creadas por usuarios';
COMMENT ON TABLE pool_members IS 'Relación muchos-a-muchos entre usuarios y pollas';
COMMENT ON TABLE matches IS 'Partidos de fútbol de diferentes torneos';
COMMENT ON TABLE predictions IS 'Predicciones de usuarios para partidos específicos';
