-- ============================================
-- SCRIPT DE MIGRACIÓN Y REPARACIÓN (SAAS)
-- ============================================
-- Ejecutar este script si recibes el error "column company_id does not exist"
-- Este script agrega la columna faltante a las tablas que ya existían.
-- ============================================

-- 1. Función para agregar columna de forma segura
DO $$
BEGIN
    -- TABLA: VESSEL
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'vessels' AND column_name = 'company_id') THEN
        ALTER TABLE vessels ADD COLUMN company_id VARCHAR(255) DEFAULT 'DEMO_TENANT';
    END IF;

    -- TABLA: CREW_MEMBERS
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'crew_members' AND column_name = 'company_id') THEN
        ALTER TABLE crew_members ADD COLUMN company_id VARCHAR(255) DEFAULT 'DEMO_TENANT';
    END IF;

    -- TABLA: CLIENTS
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'company_id') THEN
        ALTER TABLE clients ADD COLUMN company_id VARCHAR(255) DEFAULT 'DEMO_TENANT';
    END IF;

    -- TABLA: VOYAGES
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'voyages' AND column_name = 'company_id') THEN
        ALTER TABLE voyages ADD COLUMN company_id VARCHAR(255) DEFAULT 'DEMO_TENANT';
    END IF;

    -- TABLA: CONVOYS
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'convoys' AND column_name = 'company_id') THEN
        ALTER TABLE convoys ADD COLUMN company_id VARCHAR(255) DEFAULT 'DEMO_TENANT';
    END IF;

    -- TABLA: FUEL_LOGS
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'fuel_logs' AND column_name = 'company_id') THEN
        ALTER TABLE fuel_logs ADD COLUMN company_id VARCHAR(255) DEFAULT 'DEMO_TENANT';
    END IF;
    
    -- TABLA: MAINTENANCE_TASKS
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_tasks' AND column_name = 'company_id') THEN
        ALTER TABLE maintenance_tasks ADD COLUMN company_id VARCHAR(255) DEFAULT 'DEMO_TENANT';
    END IF;

    -- TABLA: SPARE_PARTS
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'spare_parts' AND column_name = 'company_id') THEN
        ALTER TABLE spare_parts ADD COLUMN company_id VARCHAR(255) DEFAULT 'DEMO_TENANT';
    END IF;

    -- TABLA: COMMUNICATIONS
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'communications' AND column_name = 'company_id') THEN
        ALTER TABLE communications ADD COLUMN company_id VARCHAR(255) DEFAULT 'DEMO_TENANT';
    END IF;

    -- TABLA: QUOTATIONS
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'company_id') THEN
        ALTER TABLE quotations ADD COLUMN company_id VARCHAR(255) DEFAULT 'DEMO_TENANT';
    END IF;

    -- TABLA: LOGBOOK_ENTRIES
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'logbook_entries' AND column_name = 'company_id') THEN
        ALTER TABLE logbook_entries ADD COLUMN company_id VARCHAR(255) DEFAULT 'DEMO_TENANT';
    END IF;

END $$;

-- 2. Asegurarse de que la función helper exista
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS VARCHAR AS $$
    SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- 3. (Re)intentar aplicar las políticas (Drop primero para evitar errores de duplicado)
DROP POLICY IF EXISTS "Tenant Isolation Vessels" ON vessels;
CREATE POLICY "Tenant Isolation Vessels" ON vessels FOR ALL USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Tenant Isolation Crew" ON crew_members;
CREATE POLICY "Tenant Isolation Crew" ON crew_members FOR ALL USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Tenant Isolation Clients" ON clients;
CREATE POLICY "Tenant Isolation Clients" ON clients FOR ALL USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Tenant Isolation Voyages" ON voyages;
CREATE POLICY "Tenant Isolation Voyages" ON voyages FOR ALL USING (company_id = get_user_company_id());

-- Mensaje de éxito visible en logs
DO $$ BEGIN RAISE NOTICE '✅ Migración Completada Exitosamente'; END $$;
