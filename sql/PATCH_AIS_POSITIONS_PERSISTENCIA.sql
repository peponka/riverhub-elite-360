-- Posiciones AIS persistidas: sobreviven a los redeploys.
-- El acumulador vivia solo en memoria, asi que cada deploy lo vaciaba y
-- tardaba horas en repoblarse (el mapa quedaba casi vacio justo despues
-- de publicar). Esta tabla es el respaldo desde el que se rehidrata al
-- arrancar.
CREATE TABLE IF NOT EXISTS public.ais_positions (
  mmsi        TEXT PRIMARY KEY,
  name        TEXT,
  lat         DOUBLE PRECISION NOT NULL,
  lon         DOUBLE PRECISION NOT NULL,
  speed       DOUBLE PRECISION,
  course      DOUBLE PRECISION,
  heading     DOUBLE PRECISION,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ais_positions_updated ON public.ais_positions(updated_at DESC);

-- Datos AIS: son publicos por naturaleza (emision abierta de los buques),
-- pero igual se cierra la tabla: el servidor escribe y lee con service_role,
-- y los clientes la consumen por /api/ais-positions, no directo.
ALTER TABLE public.ais_positions ENABLE ROW LEVEL SECURITY;

select 'tabla ais_positions creada' as ok;
