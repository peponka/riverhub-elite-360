-- CREACIÓN DE TABLA fleet_assets
-- Ejecuta esto en el SQL Editor de Supabase
create table fleet_assets (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,               -- Nombre de la embarcación
  type text not null,               -- Tipo (Remolcador, Barcaza, etc.)
  flag text,                        -- Bandera (Paraguay, Argentina, etc.)
  capacity numeric,                 -- Capacidad en Toneladas/Litros
  status text default 'OPERATIVO',  -- Estado: OPERATIVO, MANTENIMIENTO, FUERA DE SERVICIO
  ais_speed numeric default 0.0,    -- Velocidad actual (simulada o real)
  tank_status numeric default 0,    -- Nivel de tanque (0-100)
  mmsi text                         -- Identificador AIS (opcional para futuro)
);

-- HABILITAR RLS (Seguridad)
alter table fleet_assets enable row level security;

-- POLÍTICA DE ACCESO (Permitir todo a usuarios autenticados)
-- Nota: En producción podrías querer restringir 'insert' solo a admins.
create policy "Usuarios pueden ver flota"
on fleet_assets for select
to authenticated
using (true);

create policy "Usuarios pueden agregar activos"
on fleet_assets for insert
to authenticated
with check (true);

create policy "Usuarios pueden editar activos"
on fleet_assets for update
to authenticated
using (true);

-- OPCIONAL: DATOS DE PRUEBA INICIALES
insert into fleet_assets (name, type, flag, status, ais_speed, tank_status)
values 
('TB PARAGUAY 01', 'Remolcador de Empuje', 'Paraguay (PY)', 'EN TRANSITO', 8.5, 69),
('R/M HERCULES', 'Remolcador de Empuje', 'Argentina (AR)', 'OPERATIVO', 9.2, 83),
('R/M CENTAURO', 'Remolcador de Empuje', 'Paraguay (PY)', 'EN TRANSITO', 7.8, 21),
('R/M ORION STAR', 'Remolcador de Empuje', 'Bolivia (BO)', 'MANTENIMIENTO', 0.0, 23);
