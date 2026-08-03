-- ============================================================================
-- Datos operativos de Líquidos / Barcazas tanque
-- ============================================================================
-- Filas REALES en la base (no valores fijos en el código): se pueden editar y
-- borrar, y pasan por las mismas políticas RLS que el resto.
-- Los ids arrancan con 'dddddddd' para poder limpiarlos:
--   DELETE FROM liquid_operations WHERE id::text LIKE 'dddddddd%';
--   DELETE FROM liquid_tanks      WHERE id::text LIKE 'dddddddd%';
--
-- Los valores de status / tank_type / product_type son los EXACTOS que espera
-- la UI ('En tránsito', 'Tanque doble casco', 'fuel'...).
-- company_id se toma de la empresa que concentra la flota real.
-- ============================================================================

INSERT INTO public.liquid_tanks
  (id, name, tank_type, capacity_m3, current_m3, product, product_type, temperature_c, status, route, company_id)
VALUES
 ('dddddddd-0000-4000-8000-000000000701','BT-001 Petrobras','Tanque doble casco',2200,1804,'Gas Oil','fuel',23,'En tránsito','ASU → ROE','a1b2c3d4-0001-4000-8000-000000000001'),
 ('dddddddd-0000-4000-8000-000000000702','BT-002 Copetrol','Tanque simple',1800,810,'Metanol','chemical',19,'Fondeada','Rosario','a1b2c3d4-0001-4000-8000-000000000001'),
 ('dddddddd-0000-4000-8000-000000000703','BT-003 YPF','Tanque doble casco',2500,2375,'Crudo','oil',28,'En tránsito','CDB → BHI','a1b2c3d4-0001-4000-8000-000000000001'),
 ('dddddddd-0000-4000-8000-000000000704','BT-004 Axion','Tanque simple',1500,180,'Nafta','fuel',21,'Descargando','San Lorenzo','a1b2c3d4-0001-4000-8000-000000000001'),
 ('dddddddd-0000-4000-8000-000000000705','BT-005 Shell','Tanque doble casco',2000,1200,'Aceite Veg.','water',25,'En tránsito','VCO → SLO','a1b2c3d4-0001-4000-8000-000000000001'),
 ('dddddddd-0000-4000-8000-000000000706','BT-006 Reserva','Tanque simple',1200,0,'Gas Oil','fuel',0,'Mantenimiento','Astillero ASU','a1b2c3d4-0001-4000-8000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.liquid_operations
  (id, tank_id, operation_type, product, volume_m3, terminal, detail, started_at, duration_min, company_id)
VALUES
 ('dddddddd-0000-4000-8000-000000000801','dddddddd-0000-4000-8000-000000000704','Descarga','Nafta',1320,'Terminal San Lorenzo','BT-004 Axion', now() - interval '2 days', 405,'a1b2c3d4-0001-4000-8000-000000000001'),
 ('dddddddd-0000-4000-8000-000000000802','dddddddd-0000-4000-8000-000000000701','Carga','Gas Oil',1804,'PETROPAR Asunción','BT-001 Petrobras', now() - interval '3 days', 500,'a1b2c3d4-0001-4000-8000-000000000001'),
 ('dddddddd-0000-4000-8000-000000000803','dddddddd-0000-4000-8000-000000000702','Trasvasije','Aceite Vegetal',400,'Zona fondeo Rosario','BT-002 → BT-005', now() - interval '3 days', 190,'a1b2c3d4-0001-4000-8000-000000000001'),
 ('dddddddd-0000-4000-8000-000000000804','dddddddd-0000-4000-8000-000000000703','Carga','Crudo',2375,'Terminal Campana','BT-003 YPF', now() - interval '5 days', 620,'a1b2c3d4-0001-4000-8000-000000000001'),
 ('dddddddd-0000-4000-8000-000000000805','dddddddd-0000-4000-8000-000000000705','Descarga','Aceite Veg.',800,'Terminal Villeta','BT-005 Shell', now() - interval '6 days', 265,'a1b2c3d4-0001-4000-8000-000000000001')
ON CONFLICT (id) DO NOTHING;
