-- ViaBarcazas - geofences piloto para los principales nodos de la Hidrovia.
-- Run once in Supabase SQL Editor after EMERGENCY_ENABLE_RLS_ALL_PUBLIC.sql.
-- These are operational starting circles, not legal navigation boundaries.

DO $$
DECLARE
  company RECORD;
  zone RECORD;
BEGIN
  FOR company IN
    SELECT DISTINCT company_id
    FROM (
      SELECT COALESCE(company_id, 'DEMO_TENANT')::TEXT AS company_id FROM vessels
      UNION
      SELECT 'DEMO_TENANT'::TEXT
    ) AS companies
  LOOP
    FOR zone IN
      SELECT * FROM (VALUES
        ('Puerto de Asuncion', -25.2803::NUMERIC, -57.6365::NUMERIC, 4000::INTEGER),
        ('Terminales de Villeta', -25.5086::NUMERIC, -57.5570::NUMERIC, 5000::INTEGER),
        ('Puerto de Concepcion', -23.3996::NUMERIC, -57.4320::NUMERIC, 4000::INTEGER),
        ('Puerto de Pilar', -26.8674::NUMERIC, -58.2960::NUMERIC, 5000::INTEGER),
        ('Puerto de Rosario', -32.9442::NUMERIC, -60.6505::NUMERIC, 6000::INTEGER),
        ('Nueva Palmira', -33.8756::NUMERIC, -58.4192::NUMERIC, 6000::INTEGER)
      ) AS zones(name, lat, lon, radius_meters)
    LOOP
      INSERT INTO geofences (
        company_id, name, description, geom_type, coordinates,
        alert_on_enter, alert_on_exit, is_active, color
      )
      SELECT
        company.company_id,
        zone.name,
        'Zona piloto de control operativo. Ajustar radio y reglas con la autoridad nautica.',
        'circle',
        jsonb_build_object(
          'center', jsonb_build_object('lat', zone.lat, 'lng', zone.lon),
          'radiusMeters', zone.radius_meters
        ),
        true, false, true, '#ff7043'
      WHERE NOT EXISTS (
        SELECT 1 FROM geofences
        WHERE company_id::TEXT = company.company_id
          AND name = zone.name
      );
    END LOOP;
  END LOOP;
END $$;

-- Check the created zones.
SELECT company_id, name, geom_type, coordinates, alert_on_enter, alert_on_exit
FROM geofences
WHERE name IN (
  'Puerto de Asuncion', 'Terminales de Villeta', 'Puerto de Concepcion',
  'Puerto de Pilar', 'Puerto de Rosario', 'Nueva Palmira'
)
ORDER BY company_id, name;
