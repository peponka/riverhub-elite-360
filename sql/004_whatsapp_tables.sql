-- whatsapp_contacts: números configurados por empresa
-- Cada contacto activa su API key una sola vez con CallMeBot:
--   Mandar "I allow callmebot to send me messages" a +34 644 64 55 30 via WhatsApp
--   CallMeBot responde con el apikey personal. Guardar ese key aquí.
create table if not exists whatsapp_contacts (
  id                 uuid primary key default gen_random_uuid(),
  company_id         text not null,
  name               text not null,
  phone              text not null,          -- formato: +595981234567
  role               text,                   -- Ej: "Capitán", "Gerente de Operaciones"
  alert_types        text[] default '{}',   -- ['draft_alert','compliance_expiry','maintenance_overdue','new_contract']
  callmebot_api_key  text,                  -- API key personal de CallMeBot (NULL = no activado)
  active             boolean default true,
  created_at         timestamptz default now()
);

alter table whatsapp_contacts enable row level security;

create policy "wa_contacts_read" on whatsapp_contacts
  for select using (company_id = (select company_id from user_profiles where user_id = auth.uid()));
create policy "wa_contacts_insert" on whatsapp_contacts
  for insert with check (company_id = (select company_id from user_profiles where user_id = auth.uid()));
create policy "wa_contacts_delete" on whatsapp_contacts
  for delete using (company_id = (select company_id from user_profiles where user_id = auth.uid()));

-- Si ya existe la tabla (migraciones previas), agregar la columna sola:
alter table whatsapp_contacts
  add column if not exists callmebot_api_key text;

-- whatsapp_log: historial de mensajes enviados
create table if not exists whatsapp_log (
  id            uuid primary key default gen_random_uuid(),
  company_id    text not null,
  to_number     text not null,
  message       text not null,
  alert_type    text,
  status        text default 'sent',   -- sent, failed
  error_message text,
  created_at    timestamptz default now()
);

alter table whatsapp_log enable row level security;

create policy "wa_log_read" on whatsapp_log
  for select using (company_id = (select company_id from user_profiles where user_id = auth.uid()));
create policy "wa_log_insert" on whatsapp_log
  for insert with check (true); -- el backend inserta con service key

create index if not exists idx_wa_contacts_company on whatsapp_contacts(company_id);
create index if not exists idx_wa_log_company on whatsapp_log(company_id);
create index if not exists idx_wa_log_created on whatsapp_log(created_at desc);
