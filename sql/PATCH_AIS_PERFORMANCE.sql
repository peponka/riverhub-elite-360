-- ============================================
-- PATCH_AIS_PERFORMANCE.sql
-- Índices para escalar la tabla AIS a millones de filas
-- Correr en Supabase SQL Editor
-- ============================================

-- Índice principal: empresa + barco + tiempo (la consulta más frecuente)
CREATE INDEX IF NOT EXISTS idx_ais_positions_company_vessel_time
    ON ais_positions(company_id, vessel_id, timestamp DESC);

-- Índice por empresa + tiempo (para vistas de mapa general)
CREATE INDEX IF NOT EXISTS idx_ais_positions_company_time
    ON ais_positions(company_id, timestamp DESC);

-- Índice por barco + tiempo (para historial de un barco específico)
CREATE INDEX IF NOT EXISTS idx_ais_positions_vessel_time
    ON ais_positions(vessel_id, timestamp DESC);

-- Índice por MMSI (para cruzar con datos AISStream)
CREATE INDEX IF NOT EXISTS idx_ais_positions_mmsi
    ON ais_positions(mmsi);

-- Embarcaciones por empresa (consulta más frecuente del sistema)
CREATE INDEX IF NOT EXISTS idx_vessels_company_status
    ON vessels(company_id, status);

-- Viajes por empresa y fecha
CREATE INDEX IF NOT EXISTS idx_voyages_company_date
    ON voyages(company_id, created_at DESC);

-- Alertas por empresa y estado
CREATE INDEX IF NOT EXISTS idx_alerts_company_status
    ON alerts(company_id, status, created_at DESC);

-- Mantenimiento por barco y estado
CREATE INDEX IF NOT EXISTS idx_maintenance_vessel_status
    ON maintenance_tasks(vessel_id, status, due_date);

-- Combustible por barco y fecha (usado en fuel-optimize)
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vessel_date
    ON fuel_logs(vessel_id, created_at DESC);

-- AI Insights por empresa y tipo (acumulación de moat)
CREATE INDEX IF NOT EXISTS idx_ai_insights_company_type
    ON ai_insights(company_id, type, created_at DESC);

-- ============================================
-- ESTRATEGIA TIME-SERIES PARA AIS (opcional, para 10M+ filas)
-- Descomentar y ejecutar cuando la tabla supere 1M registros:
-- ============================================
/*
-- Particionado mensual de ais_positions
-- PASO 1: Renombrar tabla original
ALTER TABLE ais_positions RENAME TO ais_positions_old;

-- PASO 2: Crear tabla particionada
CREATE TABLE ais_positions (
    id          UUID DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL,
    vessel_id   UUID,
    mmsi        TEXT,
    lat         FLOAT,
    lon         FLOAT,
    speed       FLOAT,
    course      FLOAT,
    heading     INT,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT now(),
    raw         JSONB
) PARTITION BY RANGE (timestamp);

-- PASO 3: Crear particiones por mes (ejemplo: 2026)
CREATE TABLE ais_positions_2026_01 PARTITION OF ais_positions
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE ais_positions_2026_06 PARTITION OF ais_positions
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
-- (repetir para cada mes necesario)

-- PASO 4: Migrar datos
INSERT INTO ais_positions SELECT * FROM ais_positions_old;
DROP TABLE ais_positions_old;
*/
