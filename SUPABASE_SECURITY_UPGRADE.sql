-- ============================================
-- RIVERHUB - SECURITY UPGRADE (RLS + ROLES)
-- ============================================
-- Version: 2.2 (Auto-Migración + Security)
-- Fecha: 13/02/2026
-- FIX: Agrega company_id a tablas que no lo tienen
-- FIX: Explicit ::TEXT casts para evitar uuid/varchar mismatch
-- ============================================

-- ============================================
-- PASO 0: MIGRACIÓN - Agregar company_id donde falte
-- ============================================
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'vessels', 'crew_members', 'clients', 'voyages', 'convoys',
        'fuel_logs', 'maintenance_tasks', 'spare_parts', 
        'logbook_entries', 'communications', 'quotations'
    ]) LOOP
        -- Solo si la tabla existe
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl AND table_schema = 'public') THEN
            -- Agregar company_id si no existe
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = tbl AND column_name = 'company_id' AND table_schema = 'public'
            ) THEN
                EXECUTE format('ALTER TABLE %I ADD COLUMN company_id VARCHAR(255) DEFAULT ''DEMO_TENANT''', tbl);
                RAISE NOTICE '➕ Columna company_id AGREGADA a: %', tbl;
            ELSE
                RAISE NOTICE '✅ company_id ya existe en: %', tbl;
            END IF;
        ELSE
            RAISE NOTICE '⚠️ Tabla no existe (saltando): %', tbl;
        END IF;
    END LOOP;
END $$;

-- ============================================
-- PASO 1: Funciones Helper de Seguridad
-- ============================================

CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS TEXT AS $$
    SELECT company_id::TEXT FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
    SELECT role::TEXT FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS(
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role::TEXT = 'superadmin'
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin_or_above()
RETURNS BOOLEAN AS $$
    SELECT EXISTS(
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role::TEXT IN ('superadmin', 'admin')
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- PASO 2: Habilitar RLS + Limpiar políticas viejas
-- ============================================
DO $$
DECLARE
    tbl TEXT;
    pol RECORD;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'profiles', 'vessels', 'crew_members', 'clients', 'voyages', 'convoys',
        'fuel_logs', 'maintenance_tasks', 'spare_parts', 
        'logbook_entries', 'communications', 'quotations'
    ]) LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl AND table_schema = 'public') THEN
            -- Habilitar RLS
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
            
            -- Drop ALL existing policies
            FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = tbl AND schemaname = 'public' LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, tbl);
            END LOOP;
            
            RAISE NOTICE '🔒 RLS habilitado y limpiado: %', tbl;
        END IF;
    END LOOP;
END $$;

-- ============================================
-- PASO 3: Políticas de PROFILES
-- ============================================

CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_select_superadmin" ON profiles
    FOR SELECT USING (is_superadmin());

CREATE POLICY "profiles_select_company" ON profiles
    FOR SELECT USING (
        company_id::TEXT = get_user_company_id() 
        AND get_user_role() = 'admin'
    );

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert_self" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_superadmin" ON profiles
    FOR UPDATE USING (is_superadmin());

-- ============================================
-- PASO 4: Políticas para Tablas de Datos
-- Solo aplica a tablas que EXISTEN y TIENEN company_id
-- ============================================
DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'vessels', 'crew_members', 'clients', 'voyages', 'convoys',
        'fuel_logs', 'maintenance_tasks', 'spare_parts', 
        'logbook_entries', 'communications', 'quotations'
    ]) LOOP
        -- Verificar que la tabla existe Y tiene company_id
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = tbl AND column_name = 'company_id' AND table_schema = 'public'
        ) THEN
            
            EXECUTE format(
                'CREATE POLICY "tenant_select" ON %I FOR SELECT USING (
                    company_id::TEXT = get_user_company_id() OR is_superadmin()
                )', tbl
            );
            
            EXECUTE format(
                'CREATE POLICY "tenant_insert" ON %I FOR INSERT WITH CHECK (
                    company_id::TEXT = get_user_company_id()
                )', tbl
            );
            
            EXECUTE format(
                'CREATE POLICY "tenant_update" ON %I FOR UPDATE USING (
                    company_id::TEXT = get_user_company_id() OR is_superadmin()
                )', tbl
            );
            
            EXECUTE format(
                'CREATE POLICY "tenant_delete" ON %I FOR DELETE USING (
                    (company_id::TEXT = get_user_company_id() AND is_admin_or_above()) 
                    OR is_superadmin()
                )', tbl
            );
            
            RAISE NOTICE '✅ Políticas creadas para: %', tbl;
        ELSE
            RAISE NOTICE '⚠️ Saltando % (sin columna company_id)', tbl;
        END IF;
    END LOOP;
END $$;

-- ============================================
-- PASO 5: Trigger para Auto-Crear Perfil
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, company, company_id, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario Nuevo'),
        COALESCE(NEW.raw_user_meta_data->>'company', 'Empresa Pendiente'),
        COALESCE(
            NULLIF(UPPER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'company', ''), ' ', '_')), ''),
            'PENDING_' || SUBSTRING(NEW.id::TEXT, 1, 8)
        ),
        'user'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PASO 6: Tabla de Auditoría
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    company_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_company ON audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Limpiar policies de audit_log si existen
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'audit_log' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON audit_log', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "audit_select_admin" ON audit_log
    FOR SELECT USING (
        is_superadmin() 
        OR (is_admin_or_above() AND company_id::TEXT = get_user_company_id())
    );

CREATE POLICY "audit_insert_any" ON audit_log
    FOR INSERT WITH CHECK (true);

-- ============================================
-- PASO 7: Índices de Performance
-- ============================================
DO $$
DECLARE
    tbl TEXT;
    idx_name TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'vessels', 'crew_members', 'clients', 'voyages', 'convoys',
        'fuel_logs', 'maintenance_tasks', 'spare_parts', 
        'logbook_entries', 'communications', 'quotations'
    ]) LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = tbl AND column_name = 'company_id' AND table_schema = 'public'
        ) THEN
            idx_name := 'idx_' || tbl || '_company';
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = idx_name) THEN
                EXECUTE format('CREATE INDEX %I ON %I(company_id)', idx_name, tbl);
            END IF;
        END IF;
    END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company_id);

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
DO $$ 
BEGIN 
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SECURITY UPGRADE COMPLETADO';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 Columnas company_id verificadas/agregadas';
    RAISE NOTICE '� Políticas RLS aplicadas con ::TEXT casts';
    RAISE NOTICE '� Trigger de auto-perfil activado';
    RAISE NOTICE '📝 Tabla de auditoría creada';
    RAISE NOTICE '⚡ Índices de performance agregados';
    RAISE NOTICE '========================================';
END $$;
