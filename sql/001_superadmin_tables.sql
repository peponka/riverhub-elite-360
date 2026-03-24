-- ============================================
-- RIVERHUB ELITE 360 — SUPERADMIN MIGRATION
-- Ejecutar en Supabase SQL Editor (Dashboard > SQL)
-- Fecha: 16/03/2026
-- ============================================

-- 1. ACTUALIZAR TABLA PROFILES (agregar columnas si no existen)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'operator' 
  CHECK (role IN ('superadmin', 'admin', 'operator', 'viewer', 'pending', 'user'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- 2. TABLA DE SUSCRIPCIONES
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('solist', 'squad', 'expansion', 'admiral')),
  status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'suspended')),
  max_vessels INT DEFAULT 1,
  max_users INT DEFAULT 1,
  price_usd DECIMAL(10,2),
  billing_cycle TEXT DEFAULT 'monthly',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  payment_gateway TEXT, -- 'dlocal', 'stripe', 'mercadopago'
  gateway_customer_id TEXT,
  gateway_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE PAGOS / TRANSACCIONES
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  gateway TEXT NOT NULL,
  gateway_payment_id TEXT,
  gateway_response JSONB,
  invoice_number TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 5. RLS POLICIES PARA SUPERADMIN
-- SuperAdmin puede ver todo
DROP POLICY IF EXISTS "SuperAdmin full access companies" ON companies;
CREATE POLICY "SuperAdmin full access companies" ON companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "SuperAdmin full access subscriptions" ON subscriptions;
CREATE POLICY "SuperAdmin full access subscriptions" ON subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "SuperAdmin full access payments" ON payments;
CREATE POLICY "SuperAdmin full access payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

-- 6. PROMOVER TU PROPIO USUARIO A SUPERADMIN (Reemplazar email)
-- UPDATE profiles SET role = 'superadmin' WHERE email = 'TU_EMAIL@AQUI.COM';

SELECT 'Migration Complete ✅' AS status;
