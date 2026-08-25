-- ViaBarcazas: precios por unidad facturable (barcaza + remolcador).
-- Ejecutar una vez en Supabase SQL Editor antes de activar altas de clientes.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS barges_count INTEGER NOT NULL DEFAULT 0 CHECK (barges_count >= 0),
  ADD COLUMN IF NOT EXISTS tugboats_count INTEGER NOT NULL DEFAULT 0 CHECK (tugboats_count >= 0),
  ADD COLUMN IF NOT EXISTS billable_units INTEGER NOT NULL DEFAULT 1 CHECK (billable_units >= 1),
  ADD COLUMN IF NOT EXISTS included_units INTEGER NOT NULL DEFAULT 1 CHECK (included_units >= 1),
  ADD COLUMN IF NOT EXISTS contract_status TEXT NOT NULL DEFAULT 'trial' CHECK (contract_status IN ('trial', 'active', 'pending_sales', 'past_due', 'cancelled', 'suspended')),
  ADD COLUMN IF NOT EXISTS contract_starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS renewal_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS annual_commitment BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS annual_prepayment_discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (annual_prepayment_discount_pct BETWEEN 0 AND 10);

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_id_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_id_check CHECK (plan_id IN ('individual', 'fleet-10', 'fleet-25', 'fleet-50', 'fleet-100', 'fleet-150', 'custom'));

CREATE OR REPLACE FUNCTION public.enforce_subscription_fleet_capacity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.barges_count + NEW.tugboats_count <> NEW.billable_units THEN
    RAISE EXCEPTION 'billable_units debe ser la suma de barcazas y remolcadores';
  END IF;
  IF NEW.billable_units > NEW.included_units AND NEW.plan_id <> 'custom' THEN
    RAISE EXCEPTION 'La flota excede el cupo contratado (% > %)', NEW.billable_units, NEW.included_units;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subscriptions_fleet_capacity ON public.subscriptions;
CREATE TRIGGER subscriptions_fleet_capacity
  BEFORE INSERT OR UPDATE OF barges_count, tugboats_count, billable_units, included_units, plan_id
  ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.enforce_subscription_fleet_capacity();

CREATE OR REPLACE FUNCTION public.enforce_vessel_subscription_capacity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE allowed_units INTEGER;
DECLARE current_units INTEGER;
BEGIN
  SELECT included_units INTO allowed_units FROM public.subscriptions
   WHERE company_id = NEW.company_id AND contract_status IN ('trial', 'active', 'pending_sales')
   ORDER BY created_at DESC LIMIT 1;
  IF allowed_units IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO current_units FROM public.vessels WHERE company_id = NEW.company_id;
  IF TG_OP = 'INSERT' THEN current_units := current_units + 1; END IF;
  IF current_units > allowed_units THEN
    RAISE EXCEPTION 'No se puede registrar la embarcacion: cupo de plan alcanzado (% unidades)', allowed_units;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vessels_subscription_capacity ON public.vessels;
CREATE TRIGGER vessels_subscription_capacity
  BEFORE INSERT ON public.vessels FOR EACH ROW EXECUTE FUNCTION public.enforce_vessel_subscription_capacity();
