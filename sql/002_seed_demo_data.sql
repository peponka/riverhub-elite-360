-- ============================================
-- FLUVIAFLEET — SEED DATA PARA DEMO
-- Schema verificado contra information_schema
-- ============================================

-- 1. COMPANY
INSERT INTO companies (id, name) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Naviera Paraguaya del Sur S.A.')
ON CONFLICT (id) DO NOTHING;

-- 2. VESSELS
INSERT INTO vessels (id, name, type, status, flag, mmsi, current_lat, current_lng, last_position_update, gross_tonnage, length, beam, draft, engine_power, fuel_capacity, company_id) VALUES
  ('b0000001-0001-4000-8000-000000000001', 'TB Paraguay 01', 'Remolcador', 'Activo', 'PY', '760001001', -25.2637, -57.5759, NOW(), 850, 42, 12, 2.8, '3200 HP', 45000, 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('b0000001-0002-4000-8000-000000000001', 'TB Asunción', 'Remolcador', 'Activo', 'PY', '760001002', -27.4533, -58.9866, NOW(), 720, 38, 11, 2.6, '2800 HP', 38000, 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('b0000001-0003-4000-8000-000000000001', 'BZ Guaraní I', 'Barcaza', 'Activo', 'PY', '760002001', -25.2700, -57.5800, NOW(), 2200, 60, 12, 3.2, NULL, NULL, 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('b0000001-0004-4000-8000-000000000001', 'BZ Guaraní II', 'Barcaza', 'Activo', 'PY', '760002002', -25.2750, -57.5850, NOW(), 2200, 60, 12, 3.2, NULL, NULL, 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('b0000001-0005-4000-8000-000000000001', 'BZ Chaco', 'Barcaza', 'Mantenimiento', 'PY', '760002003', -25.2500, -57.5600, NOW(), 1800, 55, 11, 3.0, NULL, NULL, 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('b0000001-0006-4000-8000-000000000001', 'BZ Itapúa', 'Barcaza', 'Activo', 'PY', '760002004', -27.4600, -58.9900, NOW(), 2000, 58, 12, 3.1, NULL, NULL, 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('b0000001-0007-4000-8000-000000000001', 'TB Concepción', 'Remolcador', 'Inactivo', 'PY', '760001003', -23.4000, -57.4300, NOW(), 600, 35, 10, 2.4, '2400 HP', 32000, 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('b0000001-0008-4000-8000-000000000001', 'BZ Ñeembucú', 'Barcaza', 'Activo', 'PY', '760002005', -26.8800, -58.3200, NOW(), 1900, 56, 11, 3.0, NULL, NULL, 'a1b2c3d4-0001-4000-8000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 3. CREW MEMBERS
INSERT INTO crew_members (full_name, doc_id, role, vessel_id, status, phone, company_id) VALUES
  ('Carlos Ramírez', '4521890', 'Capitán', 'b0000001-0001-4000-8000-000000000001', 'embarcado', '+595981555001', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('Miguel Ángel López', '3876221', 'Timonel', 'b0000001-0001-4000-8000-000000000001', 'embarcado', '+595981555002', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('Roberto Benítez', '5102443', 'Maquinista', 'b0000001-0001-4000-8000-000000000001', 'embarcado', '+595981555003', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('Luis Fernando Giménez', '2987654', 'Capitán', 'b0000001-0002-4000-8000-000000000001', 'embarcado', '+595981555004', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('Alejandro Villalba', '4433221', 'Timonel', 'b0000001-0002-4000-8000-000000000001', 'embarcado', '+595981555005', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('Marcos Duarte', '6019283', 'Marinero', 'b0000001-0003-4000-8000-000000000001', 'embarcado', '+595981555006', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('Oscar Paredes', '3210987', 'Maquinista', 'b0000001-0002-4000-8000-000000000001', 'embarcado', '+595981555007', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('Jorge Cáceres', '5543210', 'Marinero', 'b0000001-0004-4000-8000-000000000001', 'embarcado', '+595981555008', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('Fernando Martínez', '7890123', 'Cocinero', 'b0000001-0001-4000-8000-000000000001', 'embarcado', '+595981555009', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('Pedro Acosta', '4456789', 'Marinero', 'b0000001-0006-4000-8000-000000000001', 'franco', '+595981555010', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('Juan Ramón Escobar', '2345678', 'Capitán', 'b0000001-0007-4000-8000-000000000001', 'embarcado', '+595981555011', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('Gustavo Insfrán', '8901234', 'Maquinista', 'b0000001-0007-4000-8000-000000000001', 'embarcado', '+595981555012', 'a1b2c3d4-0001-4000-8000-000000000001');

-- 4. VOYAGES (disable triggers to avoid pg_net/FCM errors)
ALTER TABLE voyages DISABLE TRIGGER USER;
INSERT INTO voyages (voyage_number, vessel_id, origin_port, destination_port, cargo_type, cargo_weight, departure_date, eta, status, company_id, created_at) VALUES
  ('VJ-2026-001', 'b0000001-0001-4000-8000-000000000001', 'Puerto de Asunción', 'San Nicolás (AR)', 'Soja', 32000, NOW() - INTERVAL '3 days', NOW() + INTERVAL '4 days', 'en tránsito', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '3 days'),
  ('VJ-2026-002', 'b0000001-0002-4000-8000-000000000001', 'Villeta (PY)', 'Rosario (AR)', 'Clinker', 24000, NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days', 'en tránsito', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '2 days'),
  ('VJ-2026-003', 'b0000001-0001-4000-8000-000000000001', 'San Lorenzo (AR)', 'Puerto de Asunción', 'Fertilizante', 18000, NOW() - INTERVAL '15 days', NOW() - INTERVAL '8 days', 'completado', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '15 days'),
  ('VJ-2026-004', 'b0000001-0002-4000-8000-000000000001', 'Corumbá (BR)', 'Nueva Palmira (UY)', 'Mineral de Hierro', 40000, NOW() - INTERVAL '25 days', NOW() - INTERVAL '15 days', 'completado', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '25 days'),
  ('VJ-2026-005', 'b0000001-0007-4000-8000-000000000001', 'Concepción (PY)', 'Villeta (PY)', 'Madera', 8000, NOW() - INTERVAL '10 days', NOW() - INTERVAL '7 days', 'completado', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '10 days'),
  ('VJ-2026-006', 'b0000001-0001-4000-8000-000000000001', 'Nueva Palmira (UY)', 'Asunción (PY)', 'Vacío (lastre)', 0, NOW() + INTERVAL '7 days', NOW() + INTERVAL '14 days', 'pendiente', 'a1b2c3d4-0001-4000-8000-000000000001', NOW());
ALTER TABLE voyages ENABLE TRIGGER USER;

-- 5. FUEL LOGS
ALTER TABLE fuel_logs DISABLE TRIGGER USER;
INSERT INTO fuel_logs (vessel_id, log_type, quantity, unit, fuel_type, location, cost, currency, created_at, company_id) VALUES
  ('b0000001-0001-4000-8000-000000000001', 'carga', 12000, 'litros', 'Diesel Marine', 'Puerto Asunción', 14400, 'USD', NOW() - INTERVAL '1 day', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('b0000001-0001-4000-8000-000000000001', 'carga', 8500, 'litros', 'Diesel Marine', 'Formosa (AR)', 10200, 'USD', NOW() - INTERVAL '7 days', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('b0000001-0002-4000-8000-000000000001', 'carga', 15000, 'litros', 'Diesel Marine', 'Villeta (PY)', 18000, 'USD', NOW() - INTERVAL '2 days', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('b0000001-0002-4000-8000-000000000001', 'carga', 9200, 'litros', 'Diesel Marine', 'Barranqueras (AR)', 11040, 'USD', NOW() - INTERVAL '12 days', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('b0000001-0007-4000-8000-000000000001', 'carga', 6000, 'litros', 'Diesel Marine', 'Concepción (PY)', 7200, 'USD', NOW() - INTERVAL '10 days', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('b0000001-0001-4000-8000-000000000001', 'carga', 11000, 'litros', 'Diesel Marine', 'San Nicolás (AR)', 13200, 'USD', NOW() - INTERVAL '18 days', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('b0000001-0002-4000-8000-000000000001', 'carga', 7800, 'litros', 'Diesel Marine', 'Rosario (AR)', 9360, 'USD', NOW() - INTERVAL '22 days', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('b0000001-0001-4000-8000-000000000001', 'carga', 13500, 'litros', 'Diesel Marine', 'Puerto Asunción', 16200, 'USD', NOW() - INTERVAL '28 days', 'a1b2c3d4-0001-4000-8000-000000000001');
ALTER TABLE fuel_logs ENABLE TRIGGER USER;

-- 6. MAINTENANCE TASKS
ALTER TABLE maintenance_tasks DISABLE TRIGGER USER;
INSERT INTO maintenance_tasks (vessel_id, task_type, component, description, priority, status, scheduled_date, notes, company_id, created_at) VALUES
  ('b0000001-0001-4000-8000-000000000001', 'preventivo', 'Motor Principal', 'Cambio de aceite motor CAT 3512 - cada 500 horas', 'alta', 'completada', NOW() - INTERVAL '5 days', 'Completado sin novedades', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '10 days'),
  ('b0000001-0001-4000-8000-000000000001', 'correctivo', 'Hélice Estribor', 'Vibración detectada a 1200 RPM', 'crítica', 'pendiente', NOW() + INTERVAL '3 days', 'Reducir RPM hasta inspección', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '1 day'),
  ('b0000001-0002-4000-8000-000000000001', 'preventivo', 'Sistema Hidráulico', 'Revisión sistema hidráulico timón trimestral', 'media', 'en progreso', NOW() + INTERVAL '7 days', 'Mantenimiento programado', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '3 days'),
  ('b0000001-0005-4000-8000-000000000001', 'correctivo', 'Casco', 'Reparación casco - daño por contacto boya km 1420', 'crítica', 'en progreso', NOW() + INTERVAL '14 days', 'En varadero, estimado 14 días', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '7 days'),
  ('b0000001-0003-4000-8000-000000000001', 'preventivo', 'Ecosonda', 'Calibración ecosonda - lectura errática', 'baja', 'pendiente', NOW() + INTERVAL '20 days', 'Programar en próxima parada', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '2 days'),
  ('b0000001-0007-4000-8000-000000000001', 'correctivo', 'Motor Babor', 'Overhaul motor babor - 8000 horas cumplidas', 'alta', 'pendiente', NOW() + INTERVAL '10 days', 'Motor en límite operativo', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '5 days');
ALTER TABLE maintenance_tasks ENABLE TRIGGER USER;

-- 7. LOGS / BITACORA
ALTER TABLE logs DISABLE TRIGGER USER;
INSERT INTO logs (vessel_id, action_type, description, company_id, created_at) VALUES
  ('b0000001-0001-4000-8000-000000000001', 'navegación', 'Zarpe de Puerto Asunción con convoy 4+1. Calado: 2.8m', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '3 days'),
  ('b0000001-0001-4000-8000-000000000001', 'navegación', 'Paso por Confluencia km 1620. Sin novedades', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '2 days 18 hours'),
  ('b0000001-0001-4000-8000-000000000001', 'clima', 'Sudestada intensa km 1500-1480. Reducción velocidad a 4 nudos', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '2 days 6 hours'),
  ('b0000001-0001-4000-8000-000000000001', 'combustible', 'Carga 12.000 lts diesel marino en Formosa', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '2 days'),
  ('b0000001-0002-4000-8000-000000000001', 'navegación', 'Zarpe Villeta rumbo Rosario. Convoy 3+1. Carga: 24.000 tn clinker', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '2 days'),
  ('b0000001-0002-4000-8000-000000000001', 'incidente', 'Avistaje banco de arena no señalizado km 1380', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '1 day 12 hours'),
  ('b0000001-0001-4000-8000-000000000001', 'navegación', 'Cruce con convoy aguas arriba km 1350. Paso por babor', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '1 day 6 hours'),
  ('b0000001-0005-4000-8000-000000000001', 'mantenimiento', 'BZ Chaco ingresa a varadero para reparación de casco', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '7 days'),
  ('b0000001-0001-4000-8000-000000000001', 'tripulación', 'Relevo de guardia 00:00. Tim. López + Mar. Duarte', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '1 day'),
  ('b0000001-0007-4000-8000-000000000001', 'navegación', 'Llegada a Villeta con 8.000 tn madera. Sin novedades', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '7 days'),
  ('b0000001-0002-4000-8000-000000000001', 'clima', 'Niebla densa km 1200-1180. Fondeo preventivo 3 horas', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '12 hours'),
  ('b0000001-0001-4000-8000-000000000001', 'combustible', 'Consumo diario: 3.200 lts. Autonomía restante: 4 días', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '6 hours'),
  ('b0000001-0002-4000-8000-000000000001', 'navegación', 'Paso por Corrientes. Nivel del río: 4.2m (normal)', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '4 hours'),
  ('b0000001-0001-4000-8000-000000000001', 'navegación', 'Posición actual: km 1180, velocidad 6.5 nudos. ETA Rosario: 4 días', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '2 hours'),
  ('b0000001-0006-4000-8000-000000000001', 'tripulación', 'Embarque tripulante Pedro Acosta en BZ Ñeembucú - Corrientes', 'a1b2c3d4-0001-4000-8000-000000000001', NOW() - INTERVAL '1 day');
ALTER TABLE logs ENABLE TRIGGER USER;

-- 8. INVENTORY / PAÑOL
ALTER TABLE inventory_items DISABLE TRIGGER USER;
INSERT INTO inventory_items (sku, name, category, stock_current, stock_min_alert, unit_price, company_id) VALUES
  ('LUB-001', 'Aceite Motor CAT 15W-40', 'Lubricantes', 120, 40, 8.50, 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('FIL-001', 'Filtro aceite CAT 1R-0716', 'Filtros', 8, 4, 45.00, 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('CAB-001', 'Cabo de amarre 32mm', 'Cabullería', 200, 50, 12.00, 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('PIN-001', 'Pintura antifouling roja', 'Pintura', 40, 20, 35.00, 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('SEG-001', 'Chaleco salvavidas SOLAS', 'Seguridad', 24, 16, 85.00, 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('SEG-002', 'Bengalas de emergencia', 'Seguridad', 12, 6, 25.00, 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('LUB-002', 'Grasa marina Mobilgrease', 'Lubricantes', 25, 10, 18.00, 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('SOL-001', 'Electrodo soldadura 7018', 'Soldadura', 50, 20, 6.00, 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('HID-001', 'Manguera hidráulica 1/2"', 'Hidráulica', 15, 5, 22.00, 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('FIL-002', 'Filtro combustible CAT', 'Filtros', 6, 4, 52.00, 'a1b2c3d4-0001-4000-8000-000000000001');
ALTER TABLE inventory_items ENABLE TRIGGER USER;

-- 9. COMMS
ALTER TABLE comms DISABLE TRIGGER USER;
INSERT INTO comms (content, sender, channel, company_id) VALUES
  ('Convoy posición km 1180. Todo normal. Calado estable 2.8m', 'Cap. Ramírez', 'CH-16', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('Fondeo preventivo por niebla km 1200. Esperando despeje', 'Cap. Giménez', 'CH-16', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('Aviso Prefectura: restricción calado 2.5m máx tramo km 1300-1320', 'Base Asunción', 'CH-16', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('BZ Chaco: reparación casco al 60%. Estimado 7 días más', 'Jefe Mantenimiento', 'CH-16', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('Recordatorio: certificados médicos vencen el 30/05', 'RRHH', 'CH-16', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('Motor babor necesita overhaul urgente. Solicito autorización', 'Cap. Escobar', 'CH-16', 'a1b2c3d4-0001-4000-8000-000000000001');
ALTER TABLE comms ENABLE TRIGGER USER;

SELECT 'Seed data cargado ✅ — 8 vessels, 12 crew, 6 voyages, 8 fuel, 6 maintenance, 15 bitácora, 10 pañol, 6 comms' AS status;
