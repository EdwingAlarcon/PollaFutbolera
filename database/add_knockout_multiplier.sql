-- =============================================
-- MIGRACIÓN: Multiplicador x2 en fases eliminatorias
-- Ejecutar en Supabase SQL Editor
-- Fecha: Mayo 2026
-- =============================================

-- Actualiza la función principal para recibir el round del partido
-- y duplicar los puntos en fases eliminatorias.
CREATE OR REPLACE FUNCTION calculate_prediction_points(
    p_predicted_home INTEGER,
    p_predicted_away INTEGER,
    p_actual_home INTEGER,
    p_actual_away INTEGER,
    p_scoring_rules JSONB,
    p_match_round TEXT DEFAULT 'group'
)
RETURNS INTEGER AS $$
DECLARE
    points INTEGER := 0;
    predicted_diff INTEGER;
    actual_diff INTEGER;
    predicted_result INTEGER;
    actual_result INTEGER;
    multiplier INTEGER := 1;
BEGIN
    -- Fases eliminatorias reciben puntos dobles
    IF p_match_round IN ('round-of-32', 'round-of-16', 'quarterfinal', 'semifinal', 'final') THEN
        multiplier := 2;
    END IF;

    -- Resultado exacto
    IF p_predicted_home = p_actual_home AND p_predicted_away = p_actual_away THEN
        RETURN ((p_scoring_rules->>'exactScore')::INTEGER) * multiplier;
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

    RETURN points * multiplier;
END;
$$ LANGUAGE plpgsql;

-- Actualiza el trigger para pasar el round del partido a la función
CREATE OR REPLACE FUNCTION update_predictions_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar si el partido cambió a 'finished'
    IF NEW.status = 'finished' AND (OLD.status != 'finished' OR OLD IS NULL) THEN
        UPDATE predictions p
        SET points_earned = calculate_prediction_points(
            p.predicted_home_score,
            p.predicted_away_score,
            NEW.home_score,
            NEW.away_score,
            (SELECT scoring_rules FROM pools WHERE id = p.pool_id),
            COALESCE(NEW.round, 'group')
        ),
        updated_at = NOW()
        WHERE p.match_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
