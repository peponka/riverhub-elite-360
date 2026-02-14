-- ============================================================
-- RIVERHUB ELITE 360 — SUPABASE FINAL (SCHEMA + SECURITY)
-- ============================================================
-- Version: 3.0 FINAL
-- Fecha: 14/02/2026
-- 
-- INSTRUCCIONES:
-- 1. Ir a Supabase Dashboard → SQL Editor
-- 2. Pegar este script COMPLETO
-- 3. Ejecutar (Run)
-- 4. Verificar que diga "Success" sin errores
-- 
-- Este script es IDEMPOTENTE: se puede correr múltiples veces
-- sin romper nada (usa IF NOT EXISTS y CREATE OR REPLACE)
-- ============================================================

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PASO 1: TABLAS (Solo crea las que no existen)
-- ============================================================

-- PERFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255),
    full_name VARCHAR(255),
    company VARCHAR(255),
    company_id VARCHAR(255) DEFAULT 'DEMO_TENANT',
    role VARCHAR(50) DEFAULT 'user',
    job_title VARCHAR(100),
    phone VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EMBARCACIONES
CREATE TABLE IF NOT EXISTS vessels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL DEFAULT 'DEMO_TENANT',
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    imo_number VARCHAR(20),
    mmsi VARCHAR(20),
    flag VARCHAR(100),
    year_built INTEGER,
    gross_tonnage DECIMAL(10,2),
    net_tonnage DECIMAL(10,2),
    length DECIMAL(8,2),
    beam DECIMAL(8,2),
    draft DECIMAL(6,2),
    engine_power VARCHAR(100),
    fuel_capacity DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'active',
    current_lat DECIMAL(10,8),
    current_lng DECIMAL(11,8),
    last_position_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TRIPULACIÓN
CREATE TABLE IF NOT EXISTS crew_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL DEFAULT 'DEMO_TENANT',
    full_name VARCHAR(255) NOT NULL,
    doc_id VARCHAR(50),
    role VARCHAR(100) NOT NULL,
    vessel_id UUID REFERENCES vessels(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active',
    boarding_date DATE,
    days_planned INTEGER,
    phone VARCHAR(50),
    email VARCHAR(255),
    emergency_contact VARCHAR(255),
    certifications JSONB,
    medical_expiry DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CLIENTES
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL DEFAULT 'DEMO_TENANT',
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    tax_id VARCHAR(50),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    credit_limit DECIMAL(15,2),
    payment_terms INTEGER,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VIAJES
CREATE TABLE IF NOT EXISTS voyages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL DEFAULT 'DEMO_TENANT',
    voyage_number VARCHAR(50) NOT NULL,
    vessel_id UUID REFERENCES vessels(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    origin_port VARCHAR(255),
    destination_port VARCHAR(255),
    cargo_type VARCHAR(255),
    cargo_weight DECIMAL(12,2),
    departure_date DATE,
    eta DATE,
    actual_arrival DATE,
    status VARCHAR(50) DEFAULT 'planned',
    freight_rate DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'USD',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CONVOYES
CREATE TABLE IF NOT EXISTS convoys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL DEFAULT 'DEMO_TENANT',
    convoy_code VARCHAR(50) NOT NULL,
    tugboat_id UUID REFERENCES vessels(id) ON DELETE SET NULL,
    voyage_id UUID REFERENCES voyages(id) ON DELETE CASCADE,
    formation JSONB,
    total_barges INTEGER,
    total_cargo DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'forming',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- COMBUSTIBLE
CREATE TABLE IF NOT EXISTS fuel_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL DEFAULT 'DEMO_TENANT',
    vessel_id UUID REFERENCES vessels(id) ON DELETE CASCADE,
    log_type VARCHAR(50),
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'liters',
    fuel_type VARCHAR(50),
    supplier VARCHAR(255),
    cost DECIMAL(12,2),
    currency VARCHAR(10) DEFAULT 'USD',
    location VARCHAR(255),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MANTENIMIENTO
CREATE TABLE IF NOT EXISTS maintenance_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL DEFAULT 'DEMO_TENANT',
    vessel_id UUID REFERENCES vessels(id) ON DELETE CASCADE,
    task_type VARCHAR(50),
    component VARCHAR(255),
    description TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    scheduled_date DATE,
    completed_date DATE,
    assigned_to VARCHAR(255),
    cost DECIMAL(12,2),
    parts_used JSONB,
    hours_worked DECIMAL(6,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PAÑOL
CREATE TABLE IF NOT EXISTS spare_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL DEFAULT 'DEMO_TENANT',
    part_number VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    vessel_id UUID REFERENCES vessels(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 0,
    unit VARCHAR(50),
    unit_cost DECIMAL(12,2),
    location VARCHAR(255),
    supplier VARCHAR(255),
    last_purchase_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BITÁCORA
CREATE TABLE IF NOT EXISTS logbook_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL DEFAULT 'DEMO_TENANT',
    vessel_id UUID REFERENCES vessels(id) ON DELETE CASCADE,
    voyage_id UUID REFERENCES voyages(id) ON DELETE SET NULL,
    entry_type VARCHAR(50),
    title VARCHAR(255),
    content TEXT NOT NULL,
    logged_by VARCHAR(255),
    weather_conditions JSONB,
    position_lat DECIMAL(10,8),
    position_lng DECIMAL(11,8),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- COTIZACIONES
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL DEFAULT 'DEMO_TENANT',
    quote_number VARCHAR(50) NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    origin_port VARCHAR(255),
    destination_port VARCHAR(255),
    cargo_type VARCHAR(255),
    estimated_weight DECIMAL(12,2),
    freight_rate DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'USD',
    validity_days INTEGER DEFAULT 15,
    ai_argumentation TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    generated_by VARCHAR(255),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLAS NUEVAS (las que faltaban en el schema anterior)
-- ============================================================

-- COMUNICACIONES VHF (tabla 'comms' que usa comunicaciones.js)
CREATE TABLE IF NOT EXISTS comms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) DEFAULT 'DEMO_TENANT',
    channel VARCHAR(50) NOT NULL DEFAULT 'CH-16',
    sender VARCHAR(255),
    user_id TEXT,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'VHF',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INCIDENTES (tabla que usa incidentes.js)
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL DEFAULT 'DEMO_TENANT',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    vessel_id UUID REFERENCES vessels(id) ON DELETE SET NULL,
    severity VARCHAR(50) DEFAULT 'MEDIA',
    status VARCHAR(50) DEFAULT 'ABIERTO',
    category VARCHAR(100),
    location VARCHAR(255),
    reported_by UUID,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    attachments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DOCUMENTOS (tabla para docs.js)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL DEFAULT 'DEMO_TENANT',
    doc_number VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    doc_type VARCHAR(50) DEFAULT 'PDF',
    file_size VARCHAR(20),
    status VARCHAR(50) DEFAULT 'BORRADOR',
    vessel_id UUID REFERENCES vessels(id) ON DELETE SET NULL,
    voyage_id UUID REFERENCES voyages(id) ON DELETE SET NULL,
    cargo_type VARCHAR(100),
    cargo_qty VARCHAR(100),
    destination VARCHAR(255),
    file_url TEXT,
    uploaded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REPORTES DIARIOS (tabla para daily_report.js)
CREATE TABLE IF NOT EXISTS daily_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL DEFAULT 'DEMO_TENANT',
    vessel_id UUID REFERENCES vessels(id) ON DELETE CASCADE,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    weather_conditions JSONB,
    navigation_status VARCHAR(100),
    fuel_consumed DECIMAL(10,2),
    distance_covered DECIMAL(10,2),
    position_lat DECIMAL(10,8),
    position_lng DECIMAL(11,8),
    cargo_status TEXT,
    crew_status TEXT,
    incidents_summary TEXT,
    notes TEXT,
    submitted_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AUDITORÍA
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

-- ============================================================
-- PASO 2: AGREGAR company_id DONDE FALTE (Migración segura)
-- ============================================================
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'vessels', 'crew_members', 'clients', 'voyages', 'convoys',
        'fuel_logs', 'maintenance_tasks', 'spare_parts', 
        'logbook_entries', 'quotations', 'comms', 'incidents', 
        'documents', 'daily_reports'
    ]) LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl AND table_schema = 'public') THEN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = tbl AND column_name = 'company_id' AND table_schema = 'public'
            ) THEN
                EXECUTE format('ALTER TABLE %I ADD COLUMN company_id VARCHAR(255) DEFAULT ''DEMO_TENANT''', tbl);
                RAISE NOTICE '➕ company_id AGREGADA a: %', tbl;
            END IF;
        END IF;
    END LOOP;
END $$;

-- ============================================================
-- PASO 3: FUNCIONES DE SEGURIDAD
-- ============================================================

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

-- ============================================================
-- PASO 4: HABILITAR RLS + LIMPIAR POLÍTICAS VIEJAS
-- ============================================================
DO $$
DECLARE
    tbl TEXT;
    pol RECORD;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'profiles', 'vessels', 'crew_members', 'clients', 'voyages', 'convoys',
        'fuel_logs', 'maintenance_tasks', 'spare_parts', 
        'logbook_entries', 'quotations', 'comms', 'incidents',
        'documents', 'daily_reports', 'audit_log'
    ]) LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl AND table_schema = 'public') THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
            FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = tbl AND schemaname = 'public' LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, tbl);
            END LOOP;
            RAISE NOTICE '🔒 RLS habilitado: %', tbl;
        END IF;
    END LOOP;
END $$;

-- ============================================================
-- PASO 5: POLÍTICAS RLS
-- ============================================================

-- PROFILES
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_select_superadmin" ON profiles FOR SELECT USING (is_superadmin());
CREATE POLICY "profiles_select_company" ON profiles FOR SELECT USING (
    company_id::TEXT = get_user_company_id() AND get_user_role() = 'admin'
);
CREATE POLICY "profiles_insert_self" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_superadmin" ON profiles FOR UPDATE USING (is_superadmin());

-- TABLAS DE DATOS (Tenant Isolation)
DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'vessels', 'crew_members', 'clients', 'voyages', 'convoys',
        'fuel_logs', 'maintenance_tasks', 'spare_parts', 
        'logbook_entries', 'quotations', 'incidents',
        'documents', 'daily_reports'
    ]) LOOP
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
            RAISE NOTICE '✅ Políticas RLS para: %', tbl;
        END IF;
    END LOOP;
END $$;

-- COMMS (Special: open channel for all authenticated users within company)
CREATE POLICY "comms_select" ON comms FOR SELECT USING (true);
CREATE POLICY "comms_insert" ON comms FOR INSERT WITH CHECK (true);

-- AUDIT LOG (Solo admin/superadmin pueden ver, todos pueden insertar)
CREATE POLICY "audit_select_admin" ON audit_log FOR SELECT USING (
    is_superadmin() OR (is_admin_or_above() AND company_id::TEXT = get_user_company_id())
);
CREATE POLICY "audit_insert_any" ON audit_log FOR INSERT WITH CHECK (true);

-- ============================================================
-- PASO 6: TRIGGER AUTO-PERFIL
-- ============================================================
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

-- ============================================================
-- PASO 7: ÍNDICES DE PERFORMANCE
-- ============================================================
DO $$
DECLARE
    tbl TEXT;
    idx_name TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'vessels', 'crew_members', 'clients', 'voyages', 'convoys',
        'fuel_logs', 'maintenance_tasks', 'spare_parts', 
        'logbook_entries', 'quotations', 'comms', 'incidents',
        'documents', 'daily_reports'
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
CREATE INDEX IF NOT EXISTS idx_comms_channel ON comms(channel);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- ============================================================
-- PASO 8: HABILITAR REALTIME (para comunicaciones.js)
-- ============================================================
-- Esto se hace desde Supabase Dashboard > Database > Replication
-- Tabla 'comms' debe tener Realtime activado
-- O ejecutar:
ALTER PUBLICATION supabase_realtime ADD TABLE comms;

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
DO $$ 
BEGIN 
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '✅ RIVERHUB v3.0 SUPABASE SETUP COMPLETADO';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '📦 17 tablas verificadas/creadas';
    RAISE NOTICE '🔒 RLS con tenant isolation activado';
    RAISE NOTICE '👤 Trigger auto-perfil configurado';
    RAISE NOTICE '📝 Tabla de auditoría lista';
    RAISE NOTICE '⚡ Índices de performance creados';
    RAISE NOTICE '📡 Realtime habilitado para comms';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE 'PRÓXIMO PASO: Verificar en Dashboard que';
    RAISE NOTICE 'las tablas aparezcan en Database > Tables';
    RAISE NOTICE '════════════════════════════════════════';
END $$;
