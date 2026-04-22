-- ============================================================
-- Fluvia: SQL Triggers for Automatic Push Notifications
-- Execute in Supabase SQL Editor
-- ============================================================

-- 1. Function to call the send-fcm Edge Function
CREATE OR REPLACE FUNCTION notify_push(
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-fcm',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'type', p_type,
      'title', p_title,
      'body', p_body,
      'user_id', p_user_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger: Alert on new log with action_type = 'alert'
CREATE OR REPLACE FUNCTION trigger_alert_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.action_type = 'alert' THEN
    PERFORM notify_push(
      'alert',
      '⚠️ Alerta en Fluvia',
      COALESCE(NEW.description, 'Nueva alerta registrada'),
      NULL -- Broadcast to all users
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_alert_log ON logs;
CREATE TRIGGER on_alert_log
  AFTER INSERT ON logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_alert_notification();

-- 3. Trigger: Vessel status changed
CREATE OR REPLACE FUNCTION trigger_vessel_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM notify_push(
      'vessel_status',
      '🚢 ' || COALESCE(NEW.name, NEW.vessel_name, 'Embarcación') || ' — Estado',
      COALESCE(NEW.name, NEW.vessel_name, 'Embarcación') || ' cambió a: ' || NEW.status,
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vessel_status ON vessels;
CREATE TRIGGER on_vessel_status
  AFTER UPDATE ON vessels
  FOR EACH ROW
  EXECUTE FUNCTION trigger_vessel_status_change();

-- 4. Trigger: New voyage started
CREATE OR REPLACE FUNCTION trigger_new_voyage()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM notify_push(
    'voyage',
    '📍 Nuevo Viaje Iniciado',
    'Viaje #' || NEW.id || ' registrado',
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_voyage ON voyages;
CREATE TRIGGER on_new_voyage
  AFTER INSERT ON voyages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_voyage();

-- 5. Trigger: Fuel record (high consumption alert)
CREATE OR REPLACE FUNCTION trigger_fuel_alert()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.liters > 5000) THEN
    PERFORM notify_push(
      'fuel_alert',
      '⛽ Consumo Alto de Combustible',
      'Registro de ' || NEW.liters || ' litros detectado',
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_fuel_high ON fuel_logs;
CREATE TRIGGER on_fuel_high
  AFTER INSERT ON fuel_logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_fuel_alert();
