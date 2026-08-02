-- ============================================================================
-- FIX: embarcaciones duplicadas en `vessels`
-- ============================================================================
-- El seed 002_seed_demo_data.sql se corrió más de una vez: la flota tenía
-- 20 filas pero solo 15 nombres únicos —
--   B/M TITAN x2, R/M CENTAURO x2, R/M HERCULES x2, TB PARAGUAY 01 x3
-- (esta última además con distinto casing: "TB Paraguay 01" / "TB PARAGUAY 01").
--
-- OJO: los duplicados NO estaban huérfanos. Antes de borrar se verificó que
-- 24 filas los referenciaban (9 crew_members, 8 fuel_logs, 4 maintenance_tasks,
-- 3 voyages). Borrarlos de una habría fallado por FK o dejado esos datos
-- colgados, así que primero se reapuntan al ejemplar que se conserva.
--
-- Criterio: se conserva la fila MÁS ANTIGUA de cada nombre (created_at, y el id
-- como desempate para que sea determinístico), comparando por
-- upper(trim(name)) para que el casing distinto cuente como el mismo barco.
-- ============================================================================

CREATE TEMP TABLE _dedupe_map ON COMMIT DROP AS
WITH ranked AS (
  SELECT id,
         upper(trim(name)) AS k,
         row_number() OVER (PARTITION BY upper(trim(name))
                            ORDER BY created_at NULLS LAST, id) AS rn
  FROM public.vessels
),
keepers AS (SELECT k, id AS keeper FROM ranked WHERE rn = 1)
SELECT r.id AS dup, ke.keeper
FROM ranked r
JOIN keepers ke USING (k)
WHERE r.rn > 1;

-- Reapuntar todo lo que colgaba de un duplicado
UPDATE public.crew_members      c SET vessel_id = m.keeper FROM _dedupe_map m WHERE c.vessel_id = m.dup;
UPDATE public.fuel_logs         f SET vessel_id = m.keeper FROM _dedupe_map m WHERE f.vessel_id = m.dup;
UPDATE public.maintenance_tasks t SET vessel_id = m.keeper FROM _dedupe_map m WHERE t.vessel_id = m.dup;
UPDATE public.voyages           v SET vessel_id = m.keeper FROM _dedupe_map m WHERE v.vessel_id = m.dup;

-- Las otras 9 tablas con FK a vessels tenían 0 referencias a duplicados, pero se
-- cubren igual por si entran datos nuevos antes de aplicar este patch.
UPDATE public.convoys              c SET tugboat_id  = m.keeper FROM _dedupe_map m WHERE c.tugboat_id  = m.dup;
UPDATE public.spare_parts          s SET vessel_id   = m.keeper FROM _dedupe_map m WHERE s.vessel_id   = m.dup;
UPDATE public.logbook_entries      l SET vessel_id   = m.keeper FROM _dedupe_map m WHERE l.vessel_id   = m.dup;
UPDATE public.incidents            i SET vessel_id   = m.keeper FROM _dedupe_map m WHERE i.vessel_id   = m.dup;
UPDATE public.documents            d SET vessel_id   = m.keeper FROM _dedupe_map m WHERE d.vessel_id   = m.dup;
UPDATE public.daily_reports        r SET vessel_id   = m.keeper FROM _dedupe_map m WHERE r.vessel_id   = m.dup;
UPDATE public.departure_checklists x SET vessel_id   = m.keeper FROM _dedupe_map m WHERE x.vessel_id   = m.dup;
UPDATE public.communications       k SET from_vessel = m.keeper FROM _dedupe_map m WHERE k.from_vessel = m.dup;
UPDATE public.communications       k SET to_vessel   = m.keeper FROM _dedupe_map m WHERE k.to_vessel   = m.dup;

-- Recién ahora se pueden borrar
DELETE FROM public.vessels WHERE id IN (SELECT dup FROM _dedupe_map);

-- Normalizar el casing del nombre para que no se vuelva a duplicar por mayúsculas
UPDATE public.vessels SET name = trim(name) WHERE name <> trim(name);
