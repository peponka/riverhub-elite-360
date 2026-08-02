-- ============================================================================
-- FIX: la web y la app móvil mostraban flotas DISTINTAS
-- ============================================================================
-- Conviven tres tablas de flota:
--   vessels      (15) → app Flutter, panel admin, y 13 FKs (viajes, consumos,
--                       tripulación, mantenimiento, incidentes...) → CANÓNICA
--   assets        (8) → a esta apunta alerts.vessel_id
--   fleet_assets  (6) → SOLO la SPA web (public/app.html)
--
-- Resultado: en el celular se veían 15 embarcaciones y en la web 6. Es lo único
-- de la deuda de esquema que un inversor puede notar en vivo comparando las dos
-- pantallas.
--
-- Por qué sincronizar en vez de apuntar la SPA a `vessels`: la tarjeta de la SPA
-- muestra velocidad y nivel de tanque (`ais_speed`, `tank_status`), columnas que
-- `vessels` no tiene. Repuntar habría dejado las 15 tarjetas en "0.0 kts" y
-- tanque 0% — peor que el problema original. `fleet_assets` no tiene ninguna FK
-- apuntándole (verificado), así que se puede regenerar sin arrastrar nada.
--
-- ESTO NO ELIMINA LA DEUDA: siguen siendo tres tablas. Lo correcto a futuro es
-- consolidar en una sola y que `fleet_assets` pase a ser una vista.
-- ============================================================================

-- 1) Normalizar los estados, que venían mezclados en dos idiomas
--    ('active' 7, 'Activo' 6, 'Mantenimiento' 1, 'Inactivo' 1).
--    Verificado antes: ningún código filtra vessels por el string exacto
--    (el único `.eq('status','active')` del repo es sobre `trips`).
UPDATE public.vessels
SET status = CASE
  WHEN lower(trim(status)) IN ('active','activo')        THEN 'Activo'
  WHEN lower(trim(status)) IN ('maintenance','mantenimiento') THEN 'Mantenimiento'
  WHEN lower(trim(status)) IN ('inactive','inactivo')    THEN 'Inactivo'
  ELSE status
END
WHERE status IS NOT NULL;

-- 2) Regenerar fleet_assets como espejo de vessels.
--    La telemetría (velocidad/tanque) es de DEMO, pero se deriva del mmsi para
--    que sea ESTABLE entre recargas — el código de la SPA la randomizaba en
--    cada render, así que los valores bailaban al refrescar.
DELETE FROM public.fleet_assets;

INSERT INTO public.fleet_assets (name, type, flag, capacity, status, ais_speed, tank_status, mmsi, company_id)
SELECT
  v.name,
  COALESCE(v.type, 'Embarcación'),
  COALESCE(v.flag, 'Paraguay (PY)'),
  COALESCE(v.fuel_capacity, 1800),
  v.status,
  -- mmsi es varchar, así que se usa hashtext() en vez de módulo aritmético.
  CASE WHEN v.status IN ('Mantenimiento','Inactivo') THEN 0.0
       ELSE round((6.5 + ((abs(hashtext(v.mmsi)) % 40) / 10.0))::numeric, 1)
  END,
  CASE WHEN v.status IN ('Mantenimiento','Inactivo') THEN (10 + (abs(hashtext(v.mmsi)) % 25))
       ELSE (25 + (abs(hashtext(v.mmsi)) % 70))
  END,
  v.mmsi,
  v.company_id
FROM public.vessels v;
