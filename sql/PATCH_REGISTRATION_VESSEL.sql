-- ViaBarcazas: guarda la primera embarcacion opcional del alta.
-- Ejecutar una vez despues de PATCH_MULTI_TENANT_SIGNUP.sql.

ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS registry_port TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_viabarcazas_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  metadata JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  new_company_id TEXT;
  company_name TEXT := NULLIF(BTRIM(metadata->>'company'), '');
  full_name TEXT := NULLIF(BTRIM(metadata->>'full_name'), '');
  country_code TEXT := NULLIF(BTRIM(metadata->>'country'), '');
  operation_name TEXT := NULLIF(BTRIM(metadata->>'operation'), '');
  fleet_data JSONB := COALESCE(metadata->'fleet', '{}'::jsonb);
  vessel_data JSONB := COALESCE(metadata->'first_vessel', '{}'::jsonb);
  fleet_tugs_count INTEGER := CASE WHEN (fleet_data->>'tugs') ~ '^[0-9]+$' THEN (fleet_data->>'tugs')::INTEGER ELSE 0 END;
  fleet_barges_count INTEGER := CASE WHEN (fleet_data->>'barges') ~ '^[0-9]+$' THEN (fleet_data->>'barges')::INTEGER ELSE 0 END;
  fleet_tankers_count INTEGER := CASE WHEN (fleet_data->>'tankers') ~ '^[0-9]+$' THEN (fleet_data->>'tankers')::INTEGER ELSE 0 END;
  vessel_registration TEXT := NULLIF(BTRIM(vessel_data->>'registration'), '');
BEGIN
  IF company_name IS NULL THEN
    company_name := COALESCE(NULLIF(SPLIT_PART(NEW.email, '@', 1), ''), 'Nueva empresa');
  END IF;

  INSERT INTO public.companies (
    name, country, operation, fleet_tugs, fleet_barges, fleet_tankers,
    plan, max_vessels, active, trial_ends_at, subscription_status
  ) VALUES (
    company_name, country_code, operation_name,
    GREATEST(fleet_tugs_count, 0), GREATEST(fleet_barges_count, 0), GREATEST(fleet_tankers_count, 0),
    'trial', GREATEST(fleet_tugs_count + fleet_barges_count + fleet_tankers_count, 1),
    true, NOW() + INTERVAL '14 days', 'trialing'
  ) RETURNING id INTO new_company_id;

  INSERT INTO public.user_profiles (user_id, company_id, role, full_name)
  VALUES (NEW.id, new_company_id, 'admin', COALESCE(full_name, SPLIT_PART(NEW.email, '@', 1)))
  ON CONFLICT (user_id) DO UPDATE SET
    company_id = EXCLUDED.company_id, role = 'admin', full_name = EXCLUDED.full_name;

  IF vessel_registration IS NOT NULL THEN
    INSERT INTO public.vessels (
      company_id, name, registration_number, type, flag, registry_port, mmsi, status
    ) VALUES (
      new_company_id,
      COALESCE(NULLIF(BTRIM(vessel_data->>'name'), ''), vessel_registration),
      vessel_registration,
      NULLIF(BTRIM(vessel_data->>'type'), ''),
      NULLIF(BTRIM(vessel_data->>'flag'), ''),
      NULLIF(BTRIM(vessel_data->>'port'), ''),
      NULLIF(BTRIM(vessel_data->>'identifiers'), ''),
      'active'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_viabarcazas ON auth.users;
CREATE TRIGGER on_auth_user_created_viabarcazas
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_viabarcazas_user();
