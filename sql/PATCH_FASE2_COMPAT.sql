-- ============================================================
-- VIABARCAZAS — PARCHE FASE 2: TABLAS EXISTENTES
-- ============================================================
-- Fecha: 2 Mayo 2026
-- 
-- DESCUBRIMIENTO: fleet_assets, maintenance_logs y trips YA EXISTEN
-- como TABLAS reales en Supabase (no son fantasma).
-- 
-- ACCIÓN: Asegurar que tengan RLS habilitado + company_id
-- + políticas de tenant isolation.
--
-- Es IDEMPOTENTE: se puede correr múltiples veces
-- ============================================================

-- ═══════════════════════════════════════════
-- PASO 1: Asegurar company_id en tablas que podrían no tenerlo
-- ═══════════════════════════════════════════
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'fleet_assets', 'maintenance_logs', 'trips'
    ]) LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl AND table_schema = 'public') THEN
            -- Add company_id if missing
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = tbl AND column_name = 'company_id' AND table_schema = 'public'
            ) THEN
                EXECUTE format('ALTER TABLE %I ADD COLUMN company_id VARCHAR(255) DEFAULT ''DEMO_TENANT''', tbl);
                RAISE NOTICE '➕ company_id agregada a: %', tbl;
            ELSE
                RAISE NOTICE '✅ % ya tiene company_id', tbl;
            END IF;
            
            -- Enable RLS
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
            RAISE NOTICE '🔒 RLS habilitado en: %', tbl;
        ELSE
            RAISE NOTICE '⚠️  % NO existe, saltando...', tbl;
        END IF;
    END LOOP;
END $$;

-- ═══════════════════════════════════════════
-- PASO 2: Políticas RLS para fleet_assets
-- ═══════════════════════════════════════════
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fleet_assets' AND table_schema = 'public') THEN
        -- Drop old policies
        DROP POLICY IF EXISTS "tenant_select" ON fleet_assets;
        DROP POLICY IF EXISTS "tenant_insert" ON fleet_assets;
        DROP POLICY IF EXISTS "tenant_update" ON fleet_assets;
        DROP POLICY IF EXISTS "tenant_delete" ON fleet_assets;
        DROP POLICY IF EXISTS "fleet_assets_select" ON fleet_assets;
        DROP POLICY IF EXISTS "fleet_assets_insert" ON fleet_assets;
        DROP POLICY IF EXISTS "fleet_assets_update" ON fleet_assets;
        DROP POLICY IF EXISTS "fleet_assets_delete" ON fleet_assets;
        
        -- Create tenant-isolated policies
        CREATE POLICY "fa_tenant_select" ON fleet_assets FOR SELECT USING (
            company_id::TEXT = get_user_company_id() OR is_superadmin()
        );
        CREATE POLICY "fa_tenant_insert" ON fleet_assets FOR INSERT WITH CHECK (
            company_id::TEXT = get_user_company_id()
        );
        CREATE POLICY "fa_tenant_update" ON fleet_assets FOR UPDATE USING (
            company_id::TEXT = get_user_company_id() OR is_superadmin()
        );
        CREATE POLICY "fa_tenant_delete" ON fleet_assets FOR DELETE USING (
            (company_id::TEXT = get_user_company_id() AND is_admin_or_above()) 
            OR is_superadmin()
        );
        
        -- Index
        CREATE INDEX IF NOT EXISTS idx_fleet_assets_company ON fleet_assets(company_id);
        
        RAISE NOTICE '✅ fleet_assets: RLS + 4 políticas + índice';
    END IF;
END $$;

-- ═══════════════════════════════════════════
-- PASO 3: Políticas RLS para maintenance_logs
-- ═══════════════════════════════════════════
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_logs' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "tenant_select" ON maintenance_logs;
        DROP POLICY IF EXISTS "tenant_insert" ON maintenance_logs;
        DROP POLICY IF EXISTS "tenant_update" ON maintenance_logs;
        DROP POLICY IF EXISTS "tenant_delete" ON maintenance_logs;
        DROP POLICY IF EXISTS "ml_tenant_select" ON maintenance_logs;
        DROP POLICY IF EXISTS "ml_tenant_insert" ON maintenance_logs;
        DROP POLICY IF EXISTS "ml_tenant_update" ON maintenance_logs;
        DROP POLICY IF EXISTS "ml_tenant_delete" ON maintenance_logs;
        
        CREATE POLICY "ml_tenant_select" ON maintenance_logs FOR SELECT USING (
            company_id::TEXT = get_user_company_id() OR is_superadmin()
        );
        CREATE POLICY "ml_tenant_insert" ON maintenance_logs FOR INSERT WITH CHECK (
            company_id::TEXT = get_user_company_id()
        );
        CREATE POLICY "ml_tenant_update" ON maintenance_logs FOR UPDATE USING (
            company_id::TEXT = get_user_company_id() OR is_superadmin()
        );
        CREATE POLICY "ml_tenant_delete" ON maintenance_logs FOR DELETE USING (
            (company_id::TEXT = get_user_company_id() AND is_admin_or_above()) 
            OR is_superadmin()
        );
        
        CREATE INDEX IF NOT EXISTS idx_maintenance_logs_company ON maintenance_logs(company_id);
        
        RAISE NOTICE '✅ maintenance_logs: RLS + 4 políticas + índice';
    END IF;
END $$;

-- ═══════════════════════════════════════════
-- PASO 4: Políticas RLS para trips
-- ═══════════════════════════════════════════
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trips' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "tenant_select" ON trips;
        DROP POLICY IF EXISTS "tenant_insert" ON trips;
        DROP POLICY IF EXISTS "tenant_update" ON trips;
        DROP POLICY IF EXISTS "tenant_delete" ON trips;
        DROP POLICY IF EXISTS "trips_tenant_select" ON trips;
        DROP POLICY IF EXISTS "trips_tenant_insert" ON trips;
        DROP POLICY IF EXISTS "trips_tenant_update" ON trips;
        DROP POLICY IF EXISTS "trips_tenant_delete" ON trips;
        
        CREATE POLICY "trips_tenant_select" ON trips FOR SELECT USING (
            company_id::TEXT = get_user_company_id() OR is_superadmin()
        );
        CREATE POLICY "trips_tenant_insert" ON trips FOR INSERT WITH CHECK (
            company_id::TEXT = get_user_company_id()
        );
        CREATE POLICY "trips_tenant_update" ON trips FOR UPDATE USING (
            company_id::TEXT = get_user_company_id() OR is_superadmin()
        );
        CREATE POLICY "trips_tenant_delete" ON trips FOR DELETE USING (
            (company_id::TEXT = get_user_company_id() AND is_admin_or_above()) 
            OR is_superadmin()
        );
        
        CREATE INDEX IF NOT EXISTS idx_trips_company ON trips(company_id);
        
        RAISE NOTICE '✅ trips: RLS + 4 políticas + índice';
    END IF;
END $$;

-- ═══════════════════════════════════════════
-- VERIFICACIÓN FINAL
-- ═══════════════════════════════════════════
DO $$
DECLARE
    tbl TEXT;
    tbl_exists BOOLEAN;
    has_rls BOOLEAN;
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '📋 FASE 2 — AUDITORÍA DE TABLAS LEGACY';
    RAISE NOTICE '════════════════════════════════════════════';
    
    FOR tbl IN SELECT unnest(ARRAY['fleet_assets', 'maintenance_logs', 'trips']) LOOP
        SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = tbl AND table_schema = 'public') INTO tbl_exists;
        
        IF tbl_exists THEN
            SELECT rowsecurity INTO has_rls FROM pg_tables WHERE tablename = tbl AND schemaname = 'public';
            SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = tbl AND schemaname = 'public';
            RAISE NOTICE '✅ % → Existe | RLS: % | Políticas: %', tbl, has_rls, policy_count;
        ELSE
            RAISE NOTICE '❌ % → NO existe en la base de datos', tbl;
        END IF;
    END LOOP;
    
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '✅ FASE 2 COMPLETA — Tablas legacy aseguradas';
    RAISE NOTICE '════════════════════════════════════════════';
END $$;
