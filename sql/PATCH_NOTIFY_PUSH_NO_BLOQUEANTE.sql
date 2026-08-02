-- ============================================================================
-- FIX: crear un viaje y cambiar el estado de una embarcación fallaban
-- ============================================================================
-- `notify_push()` llama a `net.http_post(...)` (extensión pg_net) para disparar
-- la Edge Function send-fcm. **pg_net NO está instalada en este proyecto**, así
-- que la llamada aborta con:
--     ERROR 3F000: schema "net" does not exist
--
-- Como la función se ejecuta dentro de triggers, el error se propaga y hace
-- fallar la operación entera. Verificado en producción:
--   • INSERT en `voyages`            → FALLA  (trigger on_new_voyage)
--   • UPDATE de `vessels.status`     → FALLA  (trigger on_vessel_status)
--   • INSERT en `logs`               → funciona (ese trigger es condicional)
--
-- O sea: hoy no se puede registrar un viaje nuevo ni marcar un barco en
-- mantenimiento desde la app.
--
-- Criterio del fix: una notificación que no se puede enviar NUNCA debe voltear
-- la transacción de negocio. Se envuelve el envío en un bloque de excepción, y
-- además se chequea que el schema `net` exista antes de intentar. Cuando se
-- instale pg_net y se carguen los settings, el push vuelve a funcionar solo,
-- sin tener que tocar esta función de nuevo.
--
-- NOTA: esto arregla el bloqueo, NO hace que los push lleguen. Para eso falta
-- instalar pg_net + configurar app.settings.* (y aparte, la columna fcm_token
-- que lee send-fcm está en `profiles`, no en `user_profiles`, que es donde la
-- escribe la app Flutter).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_push(
  p_type text, p_title text, p_body text, p_user_id uuid DEFAULT NULL::uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_url  text;
  v_key  text;
BEGIN
  -- Si pg_net no está instalada, no hay forma de mandar el push: se sale en
  -- silencio en vez de reventar la operación que disparó el trigger.
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'net') THEN
    RETURN;
  END IF;

  -- current_setting() sin el segundo argumento explota si el setting no existe.
  v_url := current_setting('app.settings.supabase_url', true);
  v_key := current_setting('app.settings.service_role_key', true);
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
      'user_id', p_user_id
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Red caída, función caída, timeout: se registra y se sigue.
  RAISE WARNING 'notify_push falló (no bloqueante): %', SQLERRM;
END;
$function$;
