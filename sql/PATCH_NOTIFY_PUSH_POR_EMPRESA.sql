-- ============================================================================
-- Las notificaciones push iban a TODOS los usuarios, de todas las empresas
-- ============================================================================
-- Los 3 triggers que disparan push (cambio de estado de buque, viaje nuevo,
-- alerta) llamaban a notify_push con p_user_id = NULL, y la Edge Function
-- interpretaba eso como "broadcast a todos los tokens registrados".
--
-- Con un solo tenant no se notaba. Con varias empresas usando la app, cada
-- una recibiria notificaciones de barcos, viajes y alertas ajenas — fuga de
-- informacion operativa entre clientes, ademas del ruido.
--
-- Ahora notify_push acepta p_company_id y cada trigger le pasa el company_id
-- del recurso que disparo el evento. La Edge Function resuelve destinatarios
-- asi: usuarios de esa empresa + superadmins (que supervisan toda la flota).
-- Si p_company_id viene NULL se mantiene el broadcast, para avisos globales
-- reales.
--
-- OJO con el modelo de datos: la pertenencia a empresa vive en
-- user_profiles.company_id, pero el token FCM vive en profiles.fcm_token.
-- Son dos tablas distintas que se cruzan por user_profiles.user_id = profiles.id.
-- (profiles.company_id existe pero tiene valores que NO cruzan con
-- vessels/voyages/logs — no usarlo para esto.)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_push(
  p_type text,
  p_title text,
  p_body text,
  p_user_id uuid DEFAULT NULL::uuid,
  p_company_id text DEFAULT NULL::text
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_url  text;
  v_key  text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'net') THEN
    RETURN;
  END IF;

  SELECT decrypted_secret INTO v_url  FROM vault.decrypted_secrets WHERE name = 'push_supabase_url';
  SELECT decrypted_secret INTO v_key  FROM vault.decrypted_secrets WHERE name = 'push_service_role_key';
  IF v_url IS NULL OR v_key IS NULL THEN
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_url || '/functions/v1/send-fcm',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object(
      'type', p_type,
      'title', p_title,
      'body', p_body,
      'user_id', p_user_id,
      'company_id', p_company_id
    )
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_push fallo (no bloqueante): %', SQLERRM;
END;
$function$;

-- ── Triggers: pasar el company_id del recurso que disparo el evento ────────

CREATE OR REPLACE FUNCTION public.trigger_vessel_status_change()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM notify_push(
      'vessel_status',
      COALESCE(NEW.name, 'Embarcacion') || ' cambio estado',
      COALESCE(NEW.name, 'Embarcacion') || ' cambio a: ' || NEW.status,
      NULL,
      NEW.company_id::text
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_new_voyage()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
AS $function$
BEGIN
  PERFORM notify_push('voyage', 'Nuevo Viaje Iniciado', 'Viaje registrado', NULL, NEW.company_id::text);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_alert_notification()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.action_type = 'alert' THEN
    PERFORM notify_push('alert', 'Alerta en Fluvia',
      COALESCE(NEW.description, 'Nueva alerta registrada'), NULL, NEW.company_id::text);
  END IF;
  RETURN NEW;
END;
$function$;
