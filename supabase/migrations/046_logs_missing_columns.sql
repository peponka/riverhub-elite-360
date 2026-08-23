-- Fix: public.logs is missing columns that public/viabarcazas.js (and viabarcazas-en.js) already
-- assume exist when inserting/reading Incidentes, Bitacora Digital and Calado readings.
-- Without these, PostgREST rejects the INSERT ("column not found"), which the frontend
-- swallows silently (no error check on that code path) -- looks like "no funciona".
alter table public.logs
    add column if not exists title text,
    add column if not exists vessel_name text,
    add column if not exists details jsonb;
