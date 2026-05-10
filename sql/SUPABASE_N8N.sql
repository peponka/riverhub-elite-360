-- ============================================
-- RIVERHUB ELITE 360 — n8n Automation Tables
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Historial de posiciones AIS (para n8n log-positions)
CREATE TABLE IF NOT EXISTS ais_position_log (
    id BIGSERIAL PRIMARY KEY,
    mmsi BIGINT NOT NULL,
    ship_name TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    speed DOUBLE PRECISION DEFAULT 0,
    course DOUBLE PRECISION DEFAULT 0,
    heading DOUBLE PRECISION DEFAULT 0,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_ais_log_mmsi ON ais_position_log(mmsi);
CREATE INDEX IF NOT EXISTS idx_ais_log_time ON ais_position_log(logged_at DESC);

-- 2. Alertas del sistema (para n8n send-alert)
CREATE TABLE IF NOT EXISTS system_alerts (
    id BIGSERIAL PRIMARY KEY,
    type TEXT DEFAULT 'general',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    vessel_name TEXT,
    source TEXT DEFAULT 'system',
    metadata JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON system_alerts(read) WHERE read = false;

-- 3. RLS Policies (permitir acceso público para n8n)
ALTER TABLE ais_position_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Permitir todo para usuarios autenticados y anon (para n8n via API key)
CREATE POLICY "Allow all on ais_position_log" ON ais_position_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on system_alerts" ON system_alerts FOR ALL USING (true) WITH CHECK (true);

-- 4. Auto-cleanup: Borrar posiciones AIS mayores a 30 días (opcional)
-- Ejecutar manualmente o con pg_cron si está disponible
-- DELETE FROM ais_position_log WHERE logged_at < NOW() - INTERVAL '30 days';

SELECT 'n8n Automation Tables created successfully!' AS status;
