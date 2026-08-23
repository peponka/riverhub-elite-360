-- ===========================================================
-- VIABARCAZAS — PRE-ZARPE CHECKLIST TABLE
-- Feature: Digital pre-departure checklist
-- Date: 2026-05-13
-- ===========================================================

CREATE TABLE IF NOT EXISTS departure_checklists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id TEXT NOT NULL,
    vessel_id UUID REFERENCES vessels(id),
    vessel_name TEXT NOT NULL,
    
    -- Captain who signed
    captain_name TEXT NOT NULL,
    captain_user_id UUID REFERENCES auth.users(id),
    
    -- Voyage info
    destination TEXT,
    estimated_departure TIMESTAMPTZ,
    cargo_description TEXT,
    cargo_tons NUMERIC(10,2) DEFAULT 0,
    
    -- Checklist sections (JSON arrays of checked items)
    crew_checks JSONB DEFAULT '[]',
    fuel_checks JSONB DEFAULT '[]',
    navigation_checks JSONB DEFAULT '[]',
    safety_checks JSONB DEFAULT '[]',
    documentation_checks JSONB DEFAULT '[]',
    communication_checks JSONB DEFAULT '[]',
    weather_checks JSONB DEFAULT '[]',
    
    -- Summary
    total_items INTEGER DEFAULT 0,
    checked_items INTEGER DEFAULT 0,
    observations TEXT,
    
    -- Status
    status TEXT DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'rejected')),
    signed_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Digital signature (base64 or captain confirmation)
    digital_signature TEXT
);

-- RLS
ALTER TABLE departure_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dc_tenant_select" ON departure_checklists
FOR SELECT USING (
    company_id::TEXT = get_user_company_id()
    OR is_superadmin()
);

CREATE POLICY "dc_tenant_insert" ON departure_checklists
FOR INSERT WITH CHECK (
    company_id::TEXT = get_user_company_id()
    OR company_id IS NOT NULL
);

CREATE POLICY "dc_tenant_update" ON departure_checklists
FOR UPDATE USING (
    company_id::TEXT = get_user_company_id()
    OR is_superadmin()
);

CREATE POLICY "dc_tenant_delete" ON departure_checklists
FOR DELETE USING (
    is_superadmin()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dc_company ON departure_checklists(company_id);
CREATE INDEX IF NOT EXISTS idx_dc_vessel ON departure_checklists(vessel_name);
CREATE INDEX IF NOT EXISTS idx_dc_created ON departure_checklists(created_at DESC);
