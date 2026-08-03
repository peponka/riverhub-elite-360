-- ============================================================================
-- Modelo de datos para Líquidos / Barcazas tanque
-- ============================================================================
-- `liquidos_screen.dart` mostraba 6 barcazas tanque y 3 operaciones totalmente
-- inventadas (BT-001 Petrobras, BT-003 YPF, BT-005 Shell...) con capacidades,
-- niveles, temperaturas y rutas escritas a mano. Era la única pantalla de las
-- marcadas en la auditoría que además NO tenía ninguna tabla detrás: no había
-- nada que cablear, había que crear el modelo.
--
-- El diseño NO se inventó de cero: se copió lo que la pantalla ya muestra, para
-- que el modelo respalde exactamente lo que el producto promete y no haya que
-- rediseñar la UI.
--   tanque      -> nombre, tipo de casco, capacidad, nivel actual, producto,
--                  familia de producto, temperatura, estado, ruta
--   operación   -> tipo (carga/descarga/trasvasije), producto, volumen,
--                  terminal, fecha y duración
--
-- Los valores de `status`, `tank_type` y `product_type` son los EXACTOS que la
-- UI espera (traducciones dyn_key_*), para que no pase lo de otras pantallas
-- donde el español de la base no matcheaba el inglés del código.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.liquid_tanks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  -- 'Tanque doble casco' | 'Tanque simple'
  tank_type     TEXT NOT NULL DEFAULT 'Tanque simple',
  capacity_m3   NUMERIC NOT NULL DEFAULT 0,
  current_m3    NUMERIC NOT NULL DEFAULT 0,
  product       TEXT,
  -- familia usada por la UI para el color: fuel | chemical | oil | water
  product_type  TEXT NOT NULL DEFAULT 'fuel',
  temperature_c NUMERIC,
  -- 'En tránsito' | 'Fondeada' | 'Descargando' | 'Mantenimiento'
  status        TEXT NOT NULL DEFAULT 'Fondeada',
  route         TEXT,
  -- opcional: si la barcaza está registrada también en la flota
  vessel_id     UUID REFERENCES public.vessels(id) ON DELETE SET NULL,
  company_id    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.liquid_operations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_id        UUID REFERENCES public.liquid_tanks(id) ON DELETE CASCADE,
  -- 'Carga' | 'Descarga' | 'Trasvasije'
  operation_type TEXT NOT NULL,
  product        TEXT,
  volume_m3      NUMERIC NOT NULL DEFAULT 0,
  terminal       TEXT,
  -- se guarda el detalle tal cual lo muestra la pantalla (p.ej. "BT-002 → BT-005")
  detail         TEXT,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_min   INTEGER,
  company_id     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_liquid_ops_started ON public.liquid_operations(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_liquid_tanks_company ON public.liquid_tanks(company_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Mismo criterio que el resto de las tablas operativas: cada empresa ve lo
-- suyo y el superadmin ve todo. Ambas funciones ya existen en la base y son
-- SECURITY DEFINER (no recursan).
ALTER TABLE public.liquid_tanks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquid_operations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS liquid_tanks_select ON public.liquid_tanks;
CREATE POLICY liquid_tanks_select ON public.liquid_tanks
  FOR SELECT USING (public.is_superadmin() OR company_id = public.get_my_company_id());

DROP POLICY IF EXISTS liquid_tanks_write ON public.liquid_tanks;
CREATE POLICY liquid_tanks_write ON public.liquid_tanks
  FOR ALL USING (public.is_superadmin() OR company_id = public.get_my_company_id())
  WITH CHECK (public.is_superadmin() OR company_id = public.get_my_company_id());

DROP POLICY IF EXISTS liquid_ops_select ON public.liquid_operations;
CREATE POLICY liquid_ops_select ON public.liquid_operations
  FOR SELECT USING (public.is_superadmin() OR company_id = public.get_my_company_id());

DROP POLICY IF EXISTS liquid_ops_write ON public.liquid_operations;
CREATE POLICY liquid_ops_write ON public.liquid_operations
  FOR ALL USING (public.is_superadmin() OR company_id = public.get_my_company_id())
  WITH CHECK (public.is_superadmin() OR company_id = public.get_my_company_id());

NOTIFY pgrst, 'reload schema';
