-- ViaBarcazas: cierra las tablas internas de automatizacion n8n.
-- Ejecutar una sola vez en Supabase SQL Editor despues de publicar el backend.
-- El service_role del servidor conserva el acceso; anon y clientes directos no.

BEGIN;

-- Alertas futuras pueden pertenecer a una empresa. Las existentes quedan
-- globales (company_id NULL) para preservar su historial visible.
ALTER TABLE public.system_alerts
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_system_alerts_company_created
    ON public.system_alerts(company_id, created_at DESC);

ALTER TABLE public.ais_position_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Remove every legacy public policy, regardless of its historical name.
DO $$
DECLARE
    table_name TEXT;
    policy_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY['ais_position_log', 'system_alerts'] LOOP
        FOR policy_name IN
            SELECT policyname
            FROM pg_policies
            WHERE schemaname = 'public' AND tablename = table_name
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
        END LOOP;
    END LOOP;
END $$;

-- Both tables are internal automation data. With RLS on and no policy,
-- browser roles cannot read or write them. The backend filters company alerts
-- before returning them through /api/system-alerts; n8n uses service_role.

COMMIT;

SELECT 'n8n automation RLS applied' AS status;
