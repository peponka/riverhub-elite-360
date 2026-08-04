-- ============================================================================
-- Fix: trig_protect_profile_update rompia CUALQUIER UPDATE a profiles
-- ============================================================================
-- Encontrado el 4/8/2026 mientras se depuraba por que el fcm_token nunca se
-- actualizaba. El trigger de seguridad que evita que un usuario no-superadmin
-- se autoescale el `role` o migre de `company_id` (logica correcta y
-- necesaria, no se toca) tenia ademas una linea `NEW.updated_at := NOW();`
-- pero la tabla `profiles` NO tiene columna `updated_at` (a diferencia de
-- otras tablas del proyecto que si la tienen).
--
-- Resultado: TODO update a `profiles` -- no solo fcm_token, cualquiera --
-- fallaba con 42703 "record new has no field updated_at". Probablemente
-- llevaba roto un buen tiempo sin que nadie lo notara porque supabase-js no
-- siempre expone estos errores de forma visible en la UI.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_profile_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Si NO es superadmin, no puede cambiar role ni company_id
    IF NOT is_superadmin() THEN
        -- Preservar role original (no puede escalarse)
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            NEW.role := OLD.role;
            RAISE WARNING 'SECURITY: Role change blocked for non-superadmin user %', OLD.id;
        END IF;
        -- Preservar company_id (no puede migrar entre tenants)
        IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
            NEW.company_id := OLD.company_id;
            RAISE WARNING 'SECURITY: company_id change blocked for user %', OLD.id;
        END IF;
    END IF;

    -- 'profiles' no tiene columna updated_at. La linea que la seteaba se saco.
    RETURN NEW;
END;
$function$;
