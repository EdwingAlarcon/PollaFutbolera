-- ============================================================
-- TRIGGER: crear perfil automáticamente al confirmar email
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

-- Función que se ejecuta con privilegios elevados (bypasea RLS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING; -- Evita error si ya existe
  RETURN NEW;
END;
$$;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear trigger que se dispara al confirmar el email (o al crear si no hay verificación)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- Asegurarse que la política RLS permite INSERT al propio user
-- (por si el trigger no alcanza en algún edge case)
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Permitir que los miembros de una polla vean los perfiles de otros miembros
DROP POLICY IF EXISTS "Pool members can read other members" ON public.users;
CREATE POLICY "Pool members can read other members"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pool_members pm1
      JOIN pool_members pm2 ON pm1.pool_id = pm2.pool_id
      WHERE pm1.user_id = auth.uid()
        AND pm2.user_id = users.id
    )
  );
