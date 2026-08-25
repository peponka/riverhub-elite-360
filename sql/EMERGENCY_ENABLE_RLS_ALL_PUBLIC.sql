-- EMERGENCY RLS FIX
-- Run this once in Supabase SQL Editor for each affected project.
-- It is idempotent: enabling RLS again does not change existing policies.
-- Tables without an existing policy become deny-by-default, which is safe.

DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
  END LOOP;
END $$;

-- Verification: this query must return zero rows after the block above.
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;
