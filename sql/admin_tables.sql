-- ============================================================
-- FluviaFleet — Tablas de Admin (ejecutar en Supabase SQL editor)
-- ============================================================

-- Tabla de audit log para acciones de administradores
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id            BIGSERIAL PRIMARY KEY,
  actor_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  entity_type   TEXT,
  entity_id     TEXT,
  details       JSONB,
  company_id    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON admin_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_company ON admin_audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log(created_at DESC);

-- RLS: solo superadmin puede leer/escribir audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "superadmin_audit_all" ON admin_audit_log;
CREATE POLICY "superadmin_audit_all" ON admin_audit_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  );

-- Tabla de notificaciones en-app
CREATE TABLE IF NOT EXISTS notifications (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT DEFAULT 'info',
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_notifs" ON notifications;
CREATE POLICY "users_own_notifs" ON notifications
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "superadmin_all_notifs" ON notifications;
CREATE POLICY "superadmin_all_notifs" ON notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  );

-- Columna updated_at en user_profiles si no existe
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- Columna updated_at en companies si no existe
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
