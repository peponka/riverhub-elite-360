-- compliance_documents: permisos, certificados y habilitaciones por embarcación
create table if not exists compliance_documents (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies(id) on delete cascade,
  vessel_name   text not null,
  document_type text not null,
  authority     text not null,          -- ANNP, Prefectura, COMAR, DINAC, Otro
  document_number text,
  issued_date   date,
  expiry_date   date,
  status        text default 'valid',   -- valid, expiring, expired, pending
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table compliance_documents enable row level security;

create policy "company_read_docs"  on compliance_documents for select using (company_id = (select company_id from user_profiles where user_id = auth.uid()));
create policy "company_insert_docs" on compliance_documents for insert with check (company_id = (select company_id from user_profiles where user_id = auth.uid()));
create policy "company_delete_docs" on compliance_documents for delete using (company_id = (select company_id from user_profiles where user_id = auth.uid()));

-- Auto-update status based on expiry_date
create or replace function update_compliance_status()
returns trigger language plpgsql as $$
begin
  if new.expiry_date is not null then
    if new.expiry_date < current_date then
      new.status := 'expired';
    elsif new.expiry_date <= current_date + interval '60 days' then
      new.status := 'expiring';
    else
      new.status := 'valid';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_compliance_status
  before insert or update on compliance_documents
  for each row execute function update_compliance_status();

-- compliance_inspections: registro de inspecciones técnicas
create table if not exists compliance_inspections (
  id                   uuid primary key default gen_random_uuid(),
  company_id           uuid not null references companies(id) on delete cascade,
  vessel_name          text not null,
  inspection_type      text not null,
  authority            text,
  inspection_date      date not null,
  result               text default 'approved',  -- approved, conditional, failed, scheduled
  next_inspection_date date,
  notes                text,
  created_at           timestamptz default now()
);

alter table compliance_inspections enable row level security;

create policy "company_read_insp"   on compliance_inspections for select using (company_id = (select company_id from user_profiles where user_id = auth.uid()));
create policy "company_insert_insp" on compliance_inspections for insert with check (company_id = (select company_id from user_profiles where user_id = auth.uid()));
create policy "company_delete_insp" on compliance_inspections for delete using (company_id = (select company_id from user_profiles where user_id = auth.uid()));

-- Add currency column to freight_contracts if not exists
alter table freight_contracts add column if not exists currency text default 'USD';

-- Indexes for performance
create index if not exists idx_compliance_docs_company on compliance_documents(company_id);
create index if not exists idx_compliance_docs_expiry  on compliance_documents(expiry_date);
create index if not exists idx_compliance_insp_company on compliance_inspections(company_id);
