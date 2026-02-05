-- ============================================
-- RIVERHUB - CONFIGURACIÓN COMPLETA SUPABASE (MULTI-TENANT SAAS)
-- ============================================
-- Versión: 2.0 (SaaS Edition)
-- Fecha: 30/01/2026
-- ============================================

-- PASO 1: Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; 

-- ============================================
-- 0. PERFILES DE USUARIO (Base del Sistema)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255),
    full_name VARCHAR(255),
    company VARCHAR(255),         -- Nombre visible de la empresa
    company_id VARCHAR(255),      -- ID del Tenant (clave para filtrar datos)
    role VARCHAR(50) DEFAULT 'user', -- 'superadmin', 'admin', 'user', 'crew'
    job_title VARCHAR(100),
    phone VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLAS PRINCIPALES (Con Soporte Multi-Tenant)
-- ============================================

-- 1. EMBARCACIONES
CREATE TABLE IF NOT EXISTS vessels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL, -- TENANT ID
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

-- 2. TRIPULACIÓN
CREATE TABLE IF NOT EXISTS crew_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL, -- TENANT ID
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

-- 3. CLIENTES / NAVIERAS
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL, -- TENANT ID
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

-- 4. VIAJES
CREATE TABLE IF NOT EXISTS voyages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL, -- TENANT ID
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

-- 5. CONVOYES
CREATE TABLE IF NOT EXISTS convoys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL, -- TENANT ID
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

-- 6. COMBUSTIBLE
CREATE TABLE IF NOT EXISTS fuel_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL, -- TENANT ID
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

-- 7. MANTENIMIENTO
CREATE TABLE IF NOT EXISTS maintenance_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL, -- TENANT ID
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

-- 8. PAÑOL
CREATE TABLE IF NOT EXISTS spare_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL, -- TENANT ID
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

-- 9. BITÁCORA DIGITAL
CREATE TABLE IF NOT EXISTS logbook_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL, -- TENANT ID
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

-- 10. COMUNICACIONES
CREATE TABLE IF NOT EXISTS communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL, -- TENANT ID
    channel VARCHAR(50),
    from_vessel UUID REFERENCES vessels(id) ON DELETE SET NULL,
    to_vessel UUID REFERENCES vessels(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'normal',
    status VARCHAR(50) DEFAULT 'sent',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. COTIZACIONES
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(255) NOT NULL, -- TENANT ID
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

-- ============================================
-- ÍNDICES (Performance + Unique per Tenant)
-- ============================================

CREATE INDEX idx_vessels_company ON vessels(company_id);
CREATE INDEX idx_crew_company ON crew_members(company_id);
CREATE INDEX idx_voyages_company ON voyages(company_id);

-- Restricciones de unicidad por empresa (para no mezclar números de viaje/convoy)
-- ALTER TABLE voyages ADD CONSTRAINT uq_voyage_company UNIQUE (voyage_number, company_id);
-- ALTER TABLE convoys ADD CONSTRAINT uq_convoy_company UNIQUE (convoy_code, company_id);

-- ============================================
-- POLÍTICAS DE SEGURIDAD (RLS) - SAAS CORE
-- ============================================

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE voyages ENABLE ROW LEVEL SECURITY;
ALTER TABLE convoys ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE logbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

-- 1. PERFILES: Usuarios ven su propio perfil
CREATE POLICY "Users can see own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- 2. POLÍTICA GENÉRICA SAAS (Aplicar a todas las tablas de datos)
-- "Un usuario solo ve filas donde company_id coincide con el company_id de su perfil"

-- Nota: Esta función helper simplifica las políticas
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS VARCHAR AS $$
    SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Vessels
CREATE POLICY "Tenant Isolation" ON vessels
    FOR ALL USING (company_id = get_user_company_id());

-- Crew
CREATE POLICY "Tenant Isolation" ON crew_members
    FOR ALL USING (company_id = get_user_company_id());

-- Clients
CREATE POLICY "Tenant Isolation" ON clients
    FOR ALL USING (company_id = get_user_company_id());

-- Voyages
CREATE POLICY "Tenant Isolation" ON voyages
    FOR ALL USING (company_id = get_user_company_id());

-- Convoys
CREATE POLICY "Tenant Isolation" ON convoys
    FOR ALL USING (company_id = get_user_company_id());

-- Fuel
CREATE POLICY "Tenant Isolation" ON fuel_logs
    FOR ALL USING (company_id = get_user_company_id());

-- Maintenance
CREATE POLICY "Tenant Isolation" ON maintenance_tasks
    FOR ALL USING (company_id = get_user_company_id());

-- Spare Parts
CREATE POLICY "Tenant Isolation" ON spare_parts
    FOR ALL USING (company_id = get_user_company_id());

-- Logbook
CREATE POLICY "Tenant Isolation" ON logbook_entries
    FOR ALL USING (company_id = get_user_company_id());

-- Communications
CREATE POLICY "Tenant Isolation" ON communications
    FOR ALL USING (company_id = get_user_company_id());

-- Quotations
CREATE POLICY "Tenant Isolation" ON quotations
    FOR ALL USING (company_id = get_user_company_id());

-- ============================================
-- TRIGGER AUTOMÁTICO DE PERFIL
-- Crea un perfil automáticamente al registrarse
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company, company_id, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    'Empresa Pendiente', -- Default
    'DEMO_TENANT',       -- Default Tenant
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger (si tienes permisos de superuser en Supabase)
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- FINCONFIGURACIÓN
-- ============================================
