-- ===========================================================
-- FLUVIAFLEET — COMMS TABLE RLS FIX
-- Audit Issue #7: comms table had open policies (USING true)
-- allowing any authenticated user to read/write all companies
-- 
-- Date: 2026-05-13
-- ===========================================================

-- INSTRUCCIONES:
-- 1. Ir a Supabase Dashboard → SQL Editor
-- 2. Pegar este script COMPLETO
-- 3. Ejecutar (Run)

-- ===========================================================
-- STEP 1: Drop the insecure open policies
-- ===========================================================
DROP POLICY IF EXISTS "comms_select" ON comms;
DROP POLICY IF EXISTS "comms_insert" ON comms;
DROP POLICY IF EXISTS "comms_update" ON comms;
DROP POLICY IF EXISTS "comms_delete" ON comms;

-- ===========================================================
-- STEP 2: Ensure RLS is enabled
-- ===========================================================
ALTER TABLE comms ENABLE ROW LEVEL SECURITY;

-- ===========================================================
-- STEP 3: Add company_id column if missing
-- ===========================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'comms' AND column_name = 'company_id'
    ) THEN
        ALTER TABLE comms ADD COLUMN company_id TEXT;
    END IF;
END $$;

-- ===========================================================
-- STEP 4: Create tenant-isolated policies
-- ===========================================================

-- Helper function (create only if not exists)
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT company_id::TEXT FROM user_profiles WHERE user_id = auth.uid()),
    (SELECT company_id::TEXT FROM profiles WHERE id = auth.uid()),
    ''
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function for superadmin check
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'superadmin'
  ) OR EXISTS(
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- SELECT: only own company or superadmin
CREATE POLICY "comms_tenant_select" ON comms
FOR SELECT USING (
    company_id::TEXT = get_user_company_id()
    OR company_id IS NULL  -- Allow legacy messages without company_id
    OR is_superadmin()
);

-- INSERT: only own company
CREATE POLICY "comms_tenant_insert" ON comms
FOR INSERT WITH CHECK (
    company_id::TEXT = get_user_company_id()
    OR company_id IS NULL  -- Allow inserting without company_id (legacy compat)
);

-- UPDATE: only own company or superadmin
CREATE POLICY "comms_tenant_update" ON comms
FOR UPDATE USING (
    company_id::TEXT = get_user_company_id()
    OR is_superadmin()
);

-- DELETE: only superadmin
CREATE POLICY "comms_tenant_delete" ON comms
FOR DELETE USING (
    is_superadmin()
);

-- ===========================================================
-- STEP 5: Verify
-- ===========================================================
SELECT 
    policyname,
    cmd,
    qual::text AS using_clause,
    with_check::text AS check_clause
FROM pg_policies
WHERE tablename = 'comms'
ORDER BY policyname;

-- Done! The comms table is now tenant-isolated.
