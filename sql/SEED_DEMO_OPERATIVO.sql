-- ============================================================================
-- SEED DEMO OPERATIVO — para que ninguna pantalla quede vacía en la demo
-- ============================================================================
-- Estas tablas estaban en 0 filas, así que Incidentes, Cotizaciones, Clientes,
-- Documentos y Alertas se veían vacías aunque el código funcionaba bien.
--
-- IMPORTANTE — esto NO es lo mismo que los datos hardcodeados de la UI:
-- son filas REALES en la base que pasan por el mismo código, las mismas
-- políticas RLS y las mismas pantallas que usaría un cliente. Se pueden
-- editar y borrar desde la app. Sirven para demostrar que la feature anda.
--
-- Los valores de `status` y `severity` NO son arbitrarios: la UI compara
-- contra strings traducidos exactos —
--   incidentes: status 'ABIERTO'/'CERRADO', severity 'ALTA'/'MEDIA'/'BAJA'
--   (ver incidentes_screen.dart:485 y los contadores de la línea 445)
-- Con otros valores (p.ej. 'open'/'high') las tarjetas salen en gris y los
-- KPIs cuentan 0.
--
-- Todos los ids arrancan con 'dddddddd' para poder identificarlos y borrarlos:
--   DELETE FROM <tabla> WHERE id::text LIKE 'dddddddd%';
-- ============================================================================

-- ── CLIENTES ────────────────────────────────────────────────────────────────
INSERT INTO public.clients (id, name, type, tax_id, contact_person, email, phone, city, country, credit_limit, payment_terms, status, company_id)
VALUES
 ('dddddddd-0000-4000-8000-000000000101','Cargill Paraguay S.A.','Exportador','80012345-6','María Benítez','mbenitez@cargill-py.com','+595 21 620 100','Asunción','Paraguay',250000,30,'activo','a1b2c3d4-0001-4000-8000-000000000001'),
 ('dddddddd-0000-4000-8000-000000000102','ADM Paraguay','Exportador','80023456-7','Rodrigo Franco','rfranco@adm-py.com','+595 21 445 320','Villeta','Paraguay',180000,45,'activo','a1b2c3d4-0001-4000-8000-000000000001'),
 ('dddddddd-0000-4000-8000-000000000103','Petropar','Combustibles','80034567-8','Luis Ayala','layala@petropar.gov.py','+595 21 217 000','Asunción','Paraguay',400000,15,'activo','a1b2c3d4-0001-4000-8000-000000000001'),
 ('dddddddd-0000-4000-8000-000000000104','Louis Dreyfus Company','Exportador','80045678-9','Ana Villalba','avillalba@ldc.com','+595 21 663 400','San Antonio','Paraguay',300000,30,'activo','a1b2c3d4-0001-4000-8000-000000000001'),
 ('dddddddd-0000-4000-8000-000000000105','Terminal Occidental','Terminal Portuaria','80056789-0','Carlos Duarte','cduarte@toccidental.py','+595 21 330 880','Villeta','Paraguay',120000,60,'prospecto','a1b2c3d4-0001-4000-8000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ── COTIZACIONES ────────────────────────────────────────────────────────────
INSERT INTO public.quotations (id, quote_number, client_id, origin_port, destination_port, cargo_type, estimated_weight, freight_rate, currency, validity_days, status, generated_by, company_id)
VALUES
 ('dddddddd-0000-4000-8000-000000000201','COT-2026-0148','dddddddd-0000-4000-8000-000000000101','Terminal Villeta','Nueva Palmira','Soja a granel',12500,28.50,'USD',15,'enviada','operaciones','a1b2c3d4-0001-4000-8000-000000000001'),
 ('dddddddd-0000-4000-8000-000000000202','COT-2026-0149','dddddddd-0000-4000-8000-000000000102','Puerto Concepción','Rosario','Maíz',9800,31.00,'USD',10,'aceptada','operaciones','a1b2c3d4-0001-4000-8000-000000000001'),
 ('dddddddd-0000-4000-8000-000000000203','COT-2026-0150','dddddddd-0000-4000-8000-000000000103','San Lorenzo','Asunción','Gas Oil',4200,42.75,'USD',7,'enviada','operaciones','a1b2c3d4-0001-4000-8000-000000000001'),
 ('dddddddd-0000-4000-8000-000000000204','COT-2026-0151','dddddddd-0000-4000-8000-000000000104','Terminal Villeta','Nueva Palmira','Harina de soja',11000,29.90,'USD',15,'draft','operaciones','a1b2c3d4-0001-4000-8000-000000000001'),
 ('dddddddd-0000-4000-8000-000000000205','COT-2026-0152','dddddddd-0000-4000-8000-000000000101','Puerto Asunción','San Lorenzo','Contenedores',3200,55.00,'USD',20,'rechazada','operaciones','a1b2c3d4-0001-4000-8000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ── INCIDENTES ──────────────────────────────────────────────────────────────
-- vessel_id y company_id se toman de barcos REALES de la flota (post-dedupe),
-- para que cada incidente cuelgue de una embarcación que existe.
INSERT INTO public.incidents (id, company_id, title, description, vessel_id, severity, status, category, location)
SELECT x.id, v.company_id, x.title, x.description, v.id, x.severity, x.status, x.category, x.location
FROM (VALUES
 ('dddddddd-0000-4000-8000-000000000301'::uuid,'Falla en motor auxiliar N°2','Pérdida de presión de aceite detectada durante navegación. Se opera con motor principal mientras se coordina repuesto.','ALTA','ABIERTO','Mecánica','Km 245 - Río Paraguay',1),
 ('dddddddd-0000-4000-8000-000000000302'::uuid,'Demora por baja profundidad','Espera de 6 horas en paso crítico por bajante. Calado disponible 8.9 pies.','MEDIA','ABIERTO','Navegación','Paso Remanso',2),
 ('dddddddd-0000-4000-8000-000000000303'::uuid,'Derrame menor de combustible','Derrame de aprox. 15 litros durante trasvase en muelle. Contenido con barrera absorbente, sin llegar al agua.','ALTA','CERRADO','Ambiental','Terminal Villeta',3),
 ('dddddddd-0000-4000-8000-000000000304'::uuid,'Chaleco salvavidas vencidos','Inspección detecta 4 chalecos con certificación vencida. Reemplazados el mismo día.','BAJA','CERRADO','Seguridad','Puerto Asunción',4),
 ('dddddddd-0000-4000-8000-000000000305'::uuid,'Avería en sistema de amarre','Cabo de amarre de proa con desgaste severo, riesgo de rotura. Pendiente reemplazo.','MEDIA','ABIERTO','Mecánica','Km 180 - Río Paraná',5)
) AS x(id,title,description,severity,status,category,location,rn)
JOIN (SELECT id, company_id, row_number() OVER (ORDER BY created_at NULLS LAST, id) rn FROM public.vessels) v ON v.rn = x.rn
ON CONFLICT (id) DO NOTHING;

-- ── ALERTAS ─────────────────────────────────────────────────────────────────
-- OJO: alerts.vessel_id NO apunta a `vessels` sino a `assets` (hay tres tablas
-- de flota en paralelo: vessels=15, assets=8, fleet_assets=6). Insertar con un
-- id de `vessels` acá falla con 23503.
INSERT INTO public.alerts (id, vessel_id, rule_type, description, severity, is_read, alert_type, company_id)
SELECT x.id, a.id, x.rule_type, x.description, x.severity, x.is_read, x.alert_type, a.company_id
FROM (VALUES
 ('dddddddd-0000-4000-8000-000000000401'::uuid,'geofence','Embarcación salió del área operativa autorizada','ALTA',false,'geofence',1),
 ('dddddddd-0000-4000-8000-000000000402'::uuid,'fuel','Consumo 18% por encima del promedio histórico de la ruta','MEDIA',false,'consumo',2),
 ('dddddddd-0000-4000-8000-000000000403'::uuid,'maintenance','Mantenimiento programado vence en 5 días','MEDIA',true,'mantenimiento',3),
 ('dddddddd-0000-4000-8000-000000000404'::uuid,'hydrology','Bajante pronosticada en tramo de ruta: calado mínimo 8.5 pies','ALTA',false,'hidrologia',4)
) AS x(id,rule_type,description,severity,is_read,alert_type,rn)
JOIN (SELECT id, company_id, row_number() OVER (ORDER BY created_at NULLS LAST, id) rn FROM public.assets) a ON a.rn = x.rn
ON CONFLICT (id) DO NOTHING;

-- ── DOCUMENTOS ──────────────────────────────────────────────────────────────
INSERT INTO public.documents (id, company_id, doc_number, title, doc_type, file_size, status, vessel_id, cargo_type, cargo_qty, destination)
SELECT x.id, v.company_id, x.doc_number, x.title, x.doc_type, x.file_size, x.status, v.id, x.cargo_type, x.cargo_qty, x.destination
FROM (VALUES
 ('dddddddd-0000-4000-8000-000000000501'::uuid,'BL-2026-0312','Conocimiento de Embarque - Soja','Bill of Lading','245 KB','vigente','Soja a granel','12.500 TN','Nueva Palmira',1),
 ('dddddddd-0000-4000-8000-000000000502'::uuid,'CERT-2026-0088','Certificado de Navegabilidad','Certificado','1.2 MB','vigente','—','—','—',2),
 ('dddddddd-0000-4000-8000-000000000503'::uuid,'MAN-2026-0451','Manifiesto de Carga','Manifiesto','380 KB','vigente','Maíz','9.800 TN','Rosario',3),
 ('dddddddd-0000-4000-8000-000000000504'::uuid,'POL-2026-0021','Póliza de Seguro de Casco','Seguro','2.1 MB','por vencer','—','—','—',4)
) AS x(id,doc_number,title,doc_type,file_size,status,cargo_type,cargo_qty,destination,rn)
JOIN (SELECT id, company_id, row_number() OVER (ORDER BY created_at NULLS LAST, id) rn FROM public.vessels) v ON v.rn = x.rn
ON CONFLICT (id) DO NOTHING;

-- ── LLEGADAS REALES EN VIAJES COMPLETADOS ───────────────────────────────────
-- Los 7 viajes tenían `eta` pero ninguno `actual_arrival`, así que el KPI de
-- puntualidad (OTP) del dashboard no se podía calcular. Se cargan llegadas
-- reales SOLO en los viajes ya completados: 2 dentro de ETA y 1 demorado, para
-- que el OTP salga de una cuenta de verdad (voyages con actual_arrival <= eta)
-- y no de un número escrito a mano.
-- OJO: `eta` y `actual_arrival` son de tipo DATE, no timestamp. Sumar/restar
-- horas se trunca al día, así que un "+9 horas" caía el MISMO día y contaba
-- como puntual → el OTP daba 100%, que no es creíble. Se usan días enteros.
WITH completados AS (
  SELECT id, eta, row_number() OVER (ORDER BY created_at NULLS LAST, id) rn
  FROM public.voyages
  WHERE status = 'completado' AND eta IS NOT NULL
)
UPDATE public.voyages v
SET actual_arrival = CASE c.rn
      WHEN 1 THEN c.eta - 1          -- llegó un día antes
      WHEN 2 THEN c.eta              -- llegó justo en fecha
      ELSE c.eta + 2                 -- demorado 2 días
    END
FROM completados c
WHERE v.id = c.id;

-- ── LECTURAS DE CALADO ──────────────────────────────────────────────────────
-- `readings` estaba vacía, así que el KPI "CALADO MÍNIMO" del dashboard no
-- tenía de dónde salir (estaba fijo en 10.2 en el HTML). Se cargan lecturas
-- por embarcación en pies, que es la unidad que muestra la UI.
INSERT INTO public.readings (id, vessel_id, draft_value, location_name, notes)
SELECT x.id, v.id, x.draft, x.loc, x.notes
FROM (VALUES
 ('dddddddd-0000-4000-8000-000000000601'::uuid,10.4,'Paso Remanso','Lectura de salida',1),
 ('dddddddd-0000-4000-8000-000000000602'::uuid, 9.8,'Km 245 - Río Paraguay','Bajante moderada',2),
 ('dddddddd-0000-4000-8000-000000000603'::uuid,11.2,'Terminal Villeta','Calado en muelle',3),
 ('dddddddd-0000-4000-8000-000000000604'::uuid,10.1,'Paso Itá Pirú','Control de tránsito',4),
 ('dddddddd-0000-4000-8000-000000000605'::uuid, 9.6,'Km 180 - Río Paraná','Punto más restrictivo de la ruta',5)
) AS x(id,draft,loc,notes,rn)
JOIN (SELECT id, row_number() OVER (ORDER BY created_at NULLS LAST, id) rn FROM public.vessels) v ON v.rn = x.rn
ON CONFLICT (id) DO NOTHING;
