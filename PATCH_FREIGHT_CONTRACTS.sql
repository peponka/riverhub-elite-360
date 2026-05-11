-- ======================================================
-- FluviaFleet: Freight Contracts Table
-- Execute in Supabase SQL Editor
-- ======================================================

-- Drop existing if re-running
DROP TABLE IF EXISTS freight_contracts;

CREATE TABLE freight_contracts (
  id TEXT DEFAULT gen_random_uuid()::TEXT PRIMARY KEY,
  client TEXT NOT NULL,
  route TEXT NOT NULL,
  product TEXT NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'COA Anual',
  status TEXT NOT NULL DEFAULT 'active',
  volume_total INTEGER NOT NULL DEFAULT 0,
  volume_used INTEGER NOT NULL DEFAULT 0,
  rate_per_ton NUMERIC(10,2) NOT NULL DEFAULT 0,
  expiration_date DATE,
  company_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE freight_contracts ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as other tables)
DROP POLICY IF EXISTS "contracts_select" ON freight_contracts;
DROP POLICY IF EXISTS "contracts_insert" ON freight_contracts;
DROP POLICY IF EXISTS "contracts_update" ON freight_contracts;
DROP POLICY IF EXISTS "contracts_delete" ON freight_contracts;

CREATE POLICY "contracts_select" ON freight_contracts FOR SELECT USING (is_superadmin() OR company_id::TEXT = get_my_company_id());
CREATE POLICY "contracts_insert" ON freight_contracts FOR INSERT WITH CHECK (true);
CREATE POLICY "contracts_update" ON freight_contracts FOR UPDATE USING (is_superadmin() OR company_id::TEXT = get_my_company_id());
CREATE POLICY "contracts_delete" ON freight_contracts FOR DELETE USING (is_superadmin() OR company_id::TEXT = get_my_company_id());

-- Seed demo data (uses first company)
DO $$
DECLARE
  cid TEXT;
BEGIN
  SELECT id INTO cid FROM companies LIMIT 1;
  IF cid IS NULL THEN RETURN; END IF;

  INSERT INTO freight_contracts (client, route, product, contract_type, status, volume_total, volume_used, rate_per_ton, expiration_date, company_id) VALUES
    ('Cargill S.A.', 'Rosario → Asunción', 'Soja', 'COA Anual', 'active', 84000, 61200, 28.5, '2026-12-31', cid),
    ('ADM Paraguay', 'Concepción → San Lorenzo', 'Maíz', 'Semestral', 'active', 48000, 32400, 24.2, '2026-06-30', cid),
    ('PETROPAR', 'Montevideo → Asunción', 'Gas Oil', 'COA Anual', 'expires', 36000, 33800, 42.8, '2026-06-15', cid),
    ('Bunge Ltd.', 'Rosario → Nueva Palmira', 'Harina de Soja', 'Trimestral', 'active', 24000, 18000, 22.0, '2026-09-30', cid),
    ('Louis Dreyfus', 'Barranqueras → Rosario', 'Girasol', 'Spot', 'renewing', 12000, 12000, 35.0, '2026-05-10', cid),
    ('Viterra', 'San Lorenzo → Bahía Blanca', 'Trigo', 'Semestral', 'active', 60000, 22000, 26.8, '2026-12-31', cid);
END $$;
