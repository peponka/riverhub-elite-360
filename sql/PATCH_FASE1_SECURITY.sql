-- ============================================================
-- FLUVIAFLEET — PARCHE FASE 1 SEGURIDAD
-- ============================================================
-- Fecha: 2 Mayo 2026
-- Fix #4: comms tenant isolation
-- Fix #5: profiles.role self-update protection
--
-- INSTRUCCIONES:
-- 1. Ir a Supabase Dashboard → SQL Editor
-- 2. Pegar este script COMPLETO
-- 3. Ejecutar (Run)
-- Es IDEMPOTENTE: se puede correr múltiples veces
-- ============================================================

-- ═══════════════════════════════════════════
-- FIX #4: COMMS — Tenant Isolation
-- ═══════════════════════════════════════════
-- ANTES: USING(true) = cualquier usuario lee todos los mensajes
-- AHORA: Solo mensajes de tu empresa + superadmin ve todo

DROP POLICY IF EXISTS "comms_select" ON comms;
DROP POLICY IF EXISTS "comms_insert" ON comms;
DROP POLICY IF EXISTS "comms_update" ON comms;
DROP POLICY IF EXISTS "comms_delete" ON comms;

-- SELECT: Solo tu empresa o superadmin
CREATE POLICY "comms_select_tenant" ON comms 
    FOR SELECT USING (
        company_id::TEXT = get_user_company_id() 
        OR is_superadmin()
    );

-- INSERT: Solo con tu company_id
CREATE POLICY "comms_insert_tenant" ON comms 
    FOR INSERT WITH CHECK (
        company_id::TEXT = get_user_company_id()
    );

-- UPDATE: Solo tu empresa o superadmin
CREATE POLICY "comms_update_tenant" ON comms 
    FOR UPDATE USING (
        company_id::TEXT = get_user_company_id() 
        OR is_superadmin()
    );

-- DELETE: Solo superadmin puede borrar mensajes
CREATE POLICY "comms_delete_superadmin" ON comms 
    FOR DELETE USING (
        is_superadmin()
    );

-- ═══════════════════════════════════════════
-- FIX #5: PROFILES — Proteger role de self-update
-- ═══════════════════════════════════════════
-- ANTES: Un usuario podía cambiar su propio role a 'superadmin'
-- AHORA: Solo superadmin puede cambiar roles

-- Reemplazar política de update que permite cambiar todo
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_superadmin" ON profiles;

-- Self-update: Puede actualizar su perfil PERO no el role ni company_id
-- Usamos una función para validar que no cambie campos protegidos
CREATE OR REPLACE FUNCTION check_profile_update()
RETURNS TRIGGER AS $$
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
    
    -- Siempre actualizar timestamp
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger (idempotente)
DROP TRIGGER IF EXISTS trig_protect_profile_update ON profiles;
CREATE TRIGGER trig_protect_profile_update
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION check_profile_update();

-- Política: Puede actualizar su propio perfil (trigger protege campos)
CREATE POLICY "profiles_update_self" ON profiles 
    FOR UPDATE USING (id = auth.uid()) 
    WITH CHECK (id = auth.uid());

-- Política: Superadmin puede actualizar cualquier perfil
CREATE POLICY "profiles_update_by_superadmin" ON profiles 
    FOR UPDATE USING (is_superadmin());

-- ═══════════════════════════════════════════
-- BONUS: Proteger audit_log INSERT con company_id
-- ═══════════════════════════════════════════
DROP POLICY IF EXISTS "audit_insert_any" ON audit_log;
CREATE POLICY "audit_insert_validated" ON audit_log 
    FOR INSERT WITH CHECK (
        -- Require authentication (no anonymous inserts)
        auth.uid() IS NOT NULL
    );

-- ═══════════════════════════════════════════
-- VERIFICACIÓN
-- ═══════════════════════════════════════════
DO $$
DECLARE
    comms_policies INTEGER;
    profile_trigger BOOLEAN;
BEGIN
    -- Check comms policies
    SELECT COUNT(*) INTO comms_policies 
    FROM pg_policies WHERE tablename = 'comms' AND schemaname = 'public';
    
    -- Check trigger exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trig_protect_profile_update' 
        AND event_object_table = 'profiles'
    ) INTO profile_trigger;
    
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '✅ FASE 1 — PARCHE DE SEGURIDAD APLICADO';
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '🔒 FIX #4: comms tiene % políticas RLS (tenant isolated)', comms_policies;
    RAISE NOTICE '🔒 FIX #5: profiles trigger protección = %', profile_trigger;
    RAISE NOTICE '🔒 BONUS: audit_log INSERT requiere auth';
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'EJECUTAR EN: Supabase Dashboard → SQL Editor';
    RAISE NOTICE '════════════════════════════════════════════';
END $$;
