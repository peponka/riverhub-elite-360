-- ============================================
-- RIVERHUB MULTI-TENANCY (COMPATIBLE)
-- Ejecutar en Supabase SQL Editor - Sin RLS
-- ============================================

-- 1. COMPANIES TABLE (use TEXT id for compatibility)
CREATE TABLE IF NOT EXISTS companies (
    id TEXT DEFAULT gen_random_uuid()::TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'barcaza';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS max_vessels INTEGER DEFAULT 1;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- 2. USER PROFILES
CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT DEFAULT gen_random_uuid()::TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id TEXT,
    role TEXT DEFAULT 'admin',
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. ADD company_id (TEXT) TO ALL TABLES
DO $$ BEGIN
    ALTER TABLE vessels ADD COLUMN company_id TEXT; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TABLE voyages ADD COLUMN company_id TEXT; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TABLE logs ADD COLUMN company_id TEXT; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TABLE crew_members ADD COLUMN company_id TEXT; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TABLE fuel_logs ADD COLUMN company_id TEXT; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TABLE maintenance_tasks ADD COLUMN company_id TEXT; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TABLE inventory_items ADD COLUMN company_id TEXT; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TABLE comms ADD COLUMN company_id TEXT; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 4. CREATE DEFAULT COMPANY
INSERT INTO companies (name, plan, max_vessels) 
VALUES ('RiverHub Admin', 'ilimitado', 9999)
ON CONFLICT DO NOTHING;

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_user ON user_profiles(user_id);

-- 6. HELPER FUNCTIONS (cast to TEXT for compatibility)
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS TEXT AS $$
  SELECT company_id::TEXT FROM user_profiles WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'superadmin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 7. RLS POLICIES
ALTER TABLE vessels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vessels_select" ON vessels;
DROP POLICY IF EXISTS "vessels_insert" ON vessels;
DROP POLICY IF EXISTS "vessels_update" ON vessels;
CREATE POLICY "vessels_select" ON vessels FOR SELECT USING (is_superadmin() OR company_id::TEXT = get_my_company_id());
CREATE POLICY "vessels_insert" ON vessels FOR INSERT WITH CHECK (true);
CREATE POLICY "vessels_update" ON vessels FOR UPDATE USING (is_superadmin() OR company_id::TEXT = get_my_company_id());

ALTER TABLE voyages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "voyages_select" ON voyages;
DROP POLICY IF EXISTS "voyages_insert" ON voyages;
CREATE POLICY "voyages_select" ON voyages FOR SELECT USING (is_superadmin() OR company_id::TEXT = get_my_company_id());
CREATE POLICY "voyages_insert" ON voyages FOR INSERT WITH CHECK (true);

ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "logs_select" ON logs;
DROP POLICY IF EXISTS "logs_insert" ON logs;
CREATE POLICY "logs_select" ON logs FOR SELECT USING (is_superadmin() OR company_id::TEXT = get_my_company_id());
CREATE POLICY "logs_insert" ON logs FOR INSERT WITH CHECK (true);

ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crew_select" ON crew_members;
DROP POLICY IF EXISTS "crew_insert" ON crew_members;
CREATE POLICY "crew_select" ON crew_members FOR SELECT USING (is_superadmin() OR company_id::TEXT = get_my_company_id());
CREATE POLICY "crew_insert" ON crew_members FOR INSERT WITH CHECK (true);

ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fuel_select" ON fuel_logs;
DROP POLICY IF EXISTS "fuel_insert" ON fuel_logs;
CREATE POLICY "fuel_select" ON fuel_logs FOR SELECT USING (is_superadmin() OR company_id::TEXT = get_my_company_id());
CREATE POLICY "fuel_insert" ON fuel_logs FOR INSERT WITH CHECK (true);

ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "maint_select" ON maintenance_tasks;
DROP POLICY IF EXISTS "maint_insert" ON maintenance_tasks;
CREATE POLICY "maint_select" ON maintenance_tasks FOR SELECT USING (is_superadmin() OR company_id::TEXT = get_my_company_id());
CREATE POLICY "maint_insert" ON maintenance_tasks FOR INSERT WITH CHECK (true);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inv_select" ON inventory_items;
DROP POLICY IF EXISTS "inv_insert" ON inventory_items;
CREATE POLICY "inv_select" ON inventory_items FOR SELECT USING (is_superadmin() OR company_id::TEXT = get_my_company_id());
CREATE POLICY "inv_insert" ON inventory_items FOR INSERT WITH CHECK (true);

ALTER TABLE comms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comms_select" ON comms;
DROP POLICY IF EXISTS "comms_insert" ON comms;
CREATE POLICY "comms_select" ON comms FOR SELECT USING (is_superadmin() OR company_id::TEXT = get_my_company_id());
CREATE POLICY "comms_insert" ON comms FOR INSERT WITH CHECK (true);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "companies_select" ON companies;
CREATE POLICY "companies_select" ON companies FOR SELECT USING (true);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "profiles_insert" ON user_profiles;
CREATE POLICY "profiles_select" ON user_profiles FOR SELECT USING (is_superadmin() OR user_id = auth.uid());
CREATE POLICY "profiles_insert" ON user_profiles FOR INSERT WITH CHECK (true);

-- 8. ASSIGN SUPERADMIN
DO $$
DECLARE
    admin_cid TEXT;
    uid UUID;
BEGIN
    SELECT id INTO admin_cid FROM companies WHERE name = 'RiverHub Admin' LIMIT 1;
    SELECT id INTO uid FROM auth.users LIMIT 1;
    
    INSERT INTO user_profiles (user_id, company_id, role, full_name)
    VALUES (uid, admin_cid, 'superadmin', 'Administrador')
    ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin', company_id = admin_cid;
    
    UPDATE vessels SET company_id = admin_cid WHERE company_id IS NULL;
    UPDATE voyages SET company_id = admin_cid WHERE company_id IS NULL;
    UPDATE logs SET company_id = admin_cid WHERE company_id IS NULL;
    UPDATE crew_members SET company_id = admin_cid WHERE company_id IS NULL;
    UPDATE fuel_logs SET company_id = admin_cid WHERE company_id IS NULL;
    UPDATE maintenance_tasks SET company_id = admin_cid WHERE company_id IS NULL;
    UPDATE inventory_items SET company_id = admin_cid WHERE company_id IS NULL;
    UPDATE comms SET company_id = admin_cid WHERE company_id IS NULL;
END $$;
