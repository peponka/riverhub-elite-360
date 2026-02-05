-- COPIA Y PEGA ESTO EN EL EDITOR SQL DE SUPABASE --

-- 1. Crear tabla de CLIENTES (Empresas/Tenants)
create table public.clients (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  plan text default 'BASIC',
  users_count int default 0,
  status text default 'active', -- active, warning, suspended
  country_zone text default 'PY', -- PY, ARG, BRA, BOL
  roles_config text default 'Admin'
);

-- 2. Habilitar RLS (Seguridad) - Opcional para dev rápido, pero recomendado
alter table public.clients enable row level security;

-- 3. Política de acceso TOTAL (para que funcione sin login complejo por ahora)
create policy "Public Access"
  on public.clients
  for all
  using (true)
  with check (true);

-- 4. Insertar Datos de Ejemplo (Para que no esté vacío)
insert into public.clients (name, plan, users_count, status, country_zone, roles_config)
values
  ('Cargill SACI', 'ENTERPRISE', 12, 'active', 'PY', 'Admin,Ops,Captain'),
  ('Naviera Chaco', 'CORP', 8, 'active', 'ARG', 'Admin,Viewer'),
  ('LDC Paraguay', 'PREMIUM', 5, 'active', 'PY', 'Ops,Viewer'),
  ('Imperial Shipping', 'BASIC', 2, 'warning', 'BRA', 'Captain');
