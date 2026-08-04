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

-- Viaje y alerta ademas se enriquecen con el contexto real del evento: antes
-- decian solo "Nuevo Viaje Iniciado" / "Viaje registrado", que no le sirve a
-- nadie sin abrir la app. Ahora:
--   "Nuevo viaje V-001" / "B/M TITAN: Rosario -> Asuncion - Soja (5.000 t)"
--   "Alerta: B/M TITAN" / "Nivel de combustible critico: 8%"
-- Todos los campos son opcionales: si falta la ruta o la carga, el mensaje se
-- arma igual con lo que haya (probado con viajes sin puertos ni cargo_type).

CREATE OR REPLACE FUNCTION public.trigger_new_voyage()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE
  v_vessel text;
  v_titulo text;
  v_cuerpo text;
  v_peso   text;
BEGIN
  SELECT name INTO v_vessel FROM vessels WHERE id = NEW.vessel_id;

  v_titulo := 'Nuevo viaje' || COALESCE(' ' || NEW.voyage_number, '');
  v_cuerpo := COALESCE(v_vessel, 'Embarcacion sin asignar');

  IF NEW.origin_port IS NOT NULL OR NEW.destination_port IS NOT NULL THEN
    v_cuerpo := v_cuerpo || ': ' || COALESCE(NEW.origin_port, '?') || ' -> ' || COALESCE(NEW.destination_port, '?');
  END IF;

  IF NEW.cargo_type IS NOT NULL THEN
    v_cuerpo := v_cuerpo || ' - ' || NEW.cargo_type;
    IF NEW.cargo_weight IS NOT NULL AND NEW.cargo_weight > 0 THEN
      -- El locale de la base agrupa con coma (5,000) y en espanol eso se lee
      -- como "5 toneladas". Se fuerza el punto como separador de miles.
      v_peso := replace(to_char(NEW.cargo_weight, 'FM999G999G999'), ',', '.');
      v_cuerpo := v_cuerpo || ' (' || v_peso || ' t)';
    END IF;
  END IF;

  PERFORM notify_push('voyage', v_titulo, v_cuerpo, NULL, NEW.company_id::text);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_alert_notification()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE
  v_vessel text;
  v_titulo text;
BEGIN
  IF NEW.action_type = 'alert' THEN
    SELECT name INTO v_vessel FROM vessels WHERE id = NEW.vessel_id;
    v_titulo := 'Alerta' || COALESCE(': ' || v_vessel, ' en Fluvia');
    PERFORM notify_push('alert', v_titulo,
      COALESCE(NEW.description, 'Nueva alerta registrada'), NULL, NEW.company_id::text);
  END IF;
  RETURN NEW;
END;
$function$;
