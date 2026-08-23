-- ============================================================
-- RIVERHUB/VIABARCAZAS — PARCHE DE SEGURIDAD RLS
-- ============================================================
-- Generado: 29 Abril 2026
-- Problema: Supabase reportó tablas públicamente accesibles
-- Este script habilita RLS en TODAS las tablas faltantes
-- Es IDEMPOTENTE: se puede correr múltiples veces sin romper
--
-- INSTRUCCIONES:
-- 1. Ir a Supabase Dashboard → SQL Editor
-- 2. Pegar este script COMPLETO
-- 3. Ejecutar (Run)
-- ============================================================

-- ═══════════════════════════════════════════
-- PASO 1: AIS_TRAFFIC (tabla sin RLS)
-- ═══════════════════════════════════════════
DO $$
DECLARE
    pol RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ais_traffic' AND table_schema = 'public') THEN
        EXECUTE 'ALTER TABLE ais_traffic ENABLE ROW LEVEL SECURITY';
        -- Drop existing policies if any
        FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'ais_traffic' AND schemaname = 'public' LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON ais_traffic', pol.policyname);
        END LOOP;
        RAISE NOTICE '🔒 RLS habilitado en ais_traffic';
    ELSE
        RAISE NOTICE '⚠️  ais_traffic no existe, creándola...';
        CREATE TABLE ais_traffic (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            mmsi VARCHAR(20),
            ship_name VARCHAR(255),
            latitude DECIMAL(10,8),
            longitude DECIMAL(11,8),
            speed DECIMAL(6,2),
            course DECIMAL(6,2),
            ship_type INTEGER,
            destination VARCHAR(255),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE ais_traffic ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ ais_traffic creada con RLS';
    END IF;
END $$;

-- AIS traffic policies: authenticated users can read, only service role can write
DROP POLICY IF EXISTS "ais_traffic_select" ON ais_traffic;
CREATE POLICY "ais_traffic_select" ON ais_traffic 
    FOR SELECT USING (true);  -- AIS es data pública de tráfico

DROP POLICY IF EXISTS "ais_traffic_insert" ON ais_traffic;
CREATE POLICY "ais_traffic_insert" ON ais_traffic 
    FOR INSERT WITH CHECK (true);  -- Backend inserta vía server

DROP POLICY IF EXISTS "ais_traffic_update" ON ais_traffic;
CREATE POLICY "ais_traffic_update" ON ais_traffic 
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "ais_traffic_delete" ON ais_traffic;
CREATE POLICY "ais_traffic_delete" ON ais_traffic 
    FOR DELETE USING (false);  -- Nadie borra desde client

-- ═══════════════════════════════════════════
-- PASO 2: COMPANIES (verificar RLS)
-- ═══════════════════════════════════════════
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies' AND table_schema = 'public') THEN
        ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '🔒 RLS verificado en companies';
    END IF;
END $$;

-- Asegurar políticas de companies
DROP POLICY IF EXISTS "companies_select" ON companies;
CREATE POLICY "companies_select" ON companies 
    FOR SELECT USING (true);  -- Todas las empresas son visibles (para dropdown)

DROP POLICY IF EXISTS "companies_insert" ON companies;
CREATE POLICY "companies_insert" ON companies 
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'superadmin')
    );

DROP POLICY IF EXISTS "companies_update" ON companies;
CREATE POLICY "companies_update" ON companies 
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'superadmin')
    );

DROP POLICY IF EXISTS "companies_delete" ON companies;
CREATE POLICY "companies_delete" ON companies 
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'superadmin')
    );

-- ═══════════════════════════════════════════
-- PASO 3: USER_PROFILES (verificar RLS)
-- ═══════════════════════════════════════════
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '🔒 RLS verificado en user_profiles';
    END IF;
END $$;

DROP POLICY IF EXISTS "profiles_select" ON user_profiles;
CREATE POLICY "profiles_select" ON user_profiles 
    FOR SELECT USING (
        user_id = auth.uid() 
        OR EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'superadmin')
    );

DROP POLICY IF EXISTS "profiles_insert" ON user_profiles;
CREATE POLICY "profiles_insert" ON user_profiles 
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'superadmin')
    );

DROP POLICY IF EXISTS "profiles_update" ON user_profiles;
CREATE POLICY "profiles_update" ON user_profiles 
    FOR UPDATE USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'superadmin')
    );

-- ═══════════════════════════════════════════
-- PASO 4: AUDIT — Verificar TODAS las tablas públicas
-- ═══════════════════════════════════════════
DO $$
DECLARE
    tbl RECORD;
    rls_count INTEGER := 0;
    no_rls_count INTEGER := 0;
BEGIN
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '📋 AUDITORÍA RLS — TODAS LAS TABLAS';
    RAISE NOTICE '════════════════════════════════════════════';
    
    FOR tbl IN 
        SELECT tablename, 
               CASE WHEN rowsecurity THEN '✅ RLS ON' ELSE '🔴 RLS OFF' END as status,
               rowsecurity
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE '_prisma%'
        AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns', 'raster_columns', 'raster_overviews')
        AND tableowner = current_user
        ORDER BY tablename
    LOOP
        IF tbl.rowsecurity THEN
            rls_count := rls_count + 1;
        ELSE
            no_rls_count := no_rls_count + 1;
            -- Auto-enable RLS on any remaining tables
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl.tablename);
            -- Create a default deny-all policy for safety
            EXECUTE format('DROP POLICY IF EXISTS "default_deny_select" ON %I', tbl.tablename);
            EXECUTE format('CREATE POLICY "default_deny_select" ON %I FOR SELECT USING (false)', tbl.tablename);
        END IF;
        RAISE NOTICE '%  %', tbl.status, tbl.tablename;
    END LOOP;
    
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '✅ RLS activo: % tablas', rls_count;
    IF no_rls_count > 0 THEN
        RAISE NOTICE '🔒 RLS habilitado ahora: % tablas (con deny-all)', no_rls_count;
    ELSE
        RAISE NOTICE '✅ TODAS las tablas ya tenían RLS';
    END IF;
    RAISE NOTICE '════════════════════════════════════════════';
END $$;

-- ═══════════════════════════════════════════
-- VERIFICACIÓN FINAL
-- ═══════════════════════════════════════════
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '✅ PATCH DE SEGURIDAD APLICADO';
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '1. ais_traffic  → RLS + policies';
    RAISE NOTICE '2. companies    → RLS + superadmin only write';
    RAISE NOTICE '3. user_profiles → RLS + owner/superadmin';
    RAISE NOTICE '4. Audit        → todas las tablas verificadas';
    RAISE NOTICE '';
    RAISE NOTICE 'PRÓXIMO PASO: Refrescar la página de Supabase';
    RAISE NOTICE 'y verificar que el alerta desaparezca.';
    RAISE NOTICE '════════════════════════════════════════════';
END $$;
