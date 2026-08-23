-- ViaBarcazas: aislamiento real por empresa.
-- Ejecutar despues de PATCH_MULTI_TENANT_SIGNUP.sql.
-- Es idempotente: se puede volver a ejecutar.

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT company_id::TEXT
  FROM public.user_profiles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id = auth.uid() AND role = 'superadmin'
  )
$$;

DO $$
DECLARE
  table_name TEXT;
  policy_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'vessels', 'voyages', 'logs', 'crew_members', 'fuel_logs',
    'maintenance_tasks', 'inventory_items', 'comms'
  ] LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

      -- Remove legacy policies, including permissive WITH CHECK (true) policies.
      FOR policy_name IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = table_name
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
      END LOOP;

      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL USING (public.is_superadmin() OR company_id::TEXT = public.get_my_company_id()) WITH CHECK (public.is_superadmin() OR company_id::TEXT = public.get_my_company_id())',
        table_name || '_tenant_only', table_name
      );
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS companies_select ON public.companies;
DROP POLICY IF EXISTS companies_tenant_only ON public.companies;
CREATE POLICY companies_tenant_only ON public.companies
  FOR SELECT USING (public.is_superadmin() OR id::TEXT = public.get_my_company_id());

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select ON public.user_profiles;
DROP POLICY IF EXISTS profiles_insert ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_self_only ON public.user_profiles;
CREATE POLICY user_profiles_self_only ON public.user_profiles
  FOR SELECT USING (public.is_superadmin() OR user_id = auth.uid());

DO $$
BEGIN
  RAISE NOTICE 'ViaBarcazas: aislamiento por empresa activo para cuentas y datos operativos.';
END $$;
