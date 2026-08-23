-- ===========================================================
-- VIABARCAZAS — PERFORMANCE INDEXES
-- Audit Issue #15: Composite indexes for common queries
-- 
-- Date: 2026-05-13
-- ===========================================================

-- INSTRUCCIONES:
-- Ejecutar en Supabase → SQL Editor → Run

-- ===========================================================
-- 1. user_profiles — lookup by user_id (auth middleware)
-- ===========================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id 
ON user_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id 
ON user_profiles(company_id);

-- ===========================================================
-- 2. vessels — tenant isolation + status queries
-- ===========================================================
CREATE INDEX IF NOT EXISTS idx_vessels_company_id 
ON vessels(company_id);

CREATE INDEX IF NOT EXISTS idx_vessels_company_status 
ON vessels(company_id, status);

-- ===========================================================
-- 3. voyages — tenant + ordering
-- ===========================================================
CREATE INDEX IF NOT EXISTS idx_voyages_company_id 
ON voyages(company_id);

CREATE INDEX IF NOT EXISTS idx_voyages_company_created 
ON voyages(company_id, created_at DESC);

-- ===========================================================
-- 4. maintenance_tasks — tenant + priority
-- ===========================================================
CREATE INDEX IF NOT EXISTS idx_maintenance_company_id 
ON maintenance_tasks(company_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_company_status 
ON maintenance_tasks(company_id, status);

-- ===========================================================
-- 5. fuel_logs — tenant + ordering
-- ===========================================================
CREATE INDEX IF NOT EXISTS idx_fuel_logs_company_id 
ON fuel_logs(company_id);

CREATE INDEX IF NOT EXISTS idx_fuel_logs_company_created 
ON fuel_logs(company_id, created_at DESC);

-- ===========================================================
-- 6. crew_members — tenant
-- ===========================================================
CREATE INDEX IF NOT EXISTS idx_crew_members_company_id 
ON crew_members(company_id);

-- ===========================================================
-- 7. inventory_items — tenant + category
-- ===========================================================
CREATE INDEX IF NOT EXISTS idx_inventory_company_id 
ON inventory_items(company_id);

-- ===========================================================
-- 8. logs — tenant + ordering + type
-- ===========================================================
CREATE INDEX IF NOT EXISTS idx_logs_company_created 
ON logs(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_logs_action_type 
ON logs(action_type);

-- ===========================================================
-- 9. comms — tenant + ordering (new RLS)
-- ===========================================================
CREATE INDEX IF NOT EXISTS idx_comms_company_id 
ON comms(company_id);

CREATE INDEX IF NOT EXISTS idx_comms_created 
ON comms(created_at DESC);

-- ===========================================================
-- 10. ais_traffic — geo lookups
-- ===========================================================
CREATE INDEX IF NOT EXISTS idx_ais_traffic_mmsi 
ON ais_traffic(mmsi);

CREATE INDEX IF NOT EXISTS idx_ais_traffic_updated 
ON ais_traffic(updated_at DESC);

-- ===========================================================
-- 11. freight_contracts — tenant + status
-- ===========================================================
CREATE INDEX IF NOT EXISTS idx_freight_contracts_company 
ON freight_contracts(company_id);

CREATE INDEX IF NOT EXISTS idx_freight_contracts_status 
ON freight_contracts(company_id, status);

-- Done! All indexes use IF NOT EXISTS so safe to re-run.
