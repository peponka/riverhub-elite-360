-- ViaBarcazas: Leads table for contact form submissions
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  empresa TEXT NOT NULL,
  pais TEXT NOT NULL,
  flota TEXT NOT NULL,
  email TEXT NOT NULL,
  mensaje TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'nuevo'
);

-- RLS: Only service role can insert/read
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.leads
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Index for querying by date
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
