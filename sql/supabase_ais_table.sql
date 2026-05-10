-- AIS Traffic table for live vessel tracking
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ais_traffic (
    mmsi TEXT PRIMARY KEY,
    ship_name TEXT DEFAULT 'UNKNOWN',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    course DOUBLE PRECISION,
    heading INTEGER,
    message_type TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast map queries
CREATE INDEX IF NOT EXISTS idx_ais_traffic_updated ON ais_traffic(updated_at);
CREATE INDEX IF NOT EXISTS idx_ais_traffic_position ON ais_traffic(latitude, longitude);

-- Enable RLS but allow anon read
ALTER TABLE ais_traffic ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON ais_traffic
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON ais_traffic
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON ais_traffic
    FOR UPDATE USING (true);
