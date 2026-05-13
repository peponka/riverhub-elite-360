-- ============================================================
-- RIVERHUB / FLUVIAFLEET — NUCLEAR RLS PATCH
-- ============================================================
-- Fecha: 13 Mayo 2026
-- Problema: Supabase email "Table publicly accessible" 
--           en proyectos nexowork y RiverHub-DB
--
-- Este script:
--   1. Habilita RLS en TODAS las tablas del schema public
--   2. Crea políticas para tablas que no tengan ninguna
--   3. NO borra políticas existentes (solo agrega donde faltan)
--   4. Es 100% IDEMPOTENTE y SEGURO
--
-- INSTRUCCIONES:
--   1. Ir a Supabase Dashboard → SQL Editor
--   2. Pegar este script COMPLETO
--   3. Ejecutar (Run)
--   4. Repetir en CADA proyecto afectado (nexowork + RiverHub-DB)
-- ============================================================

-- ═══════════════════════════════════════════════════════════════
-- PASO 1: HABILITAR RLS EN ABSOLUTAMENTE TODAS LAS TABLAS
-- ═══════════════════════════════════════════════════════════════
-- Esto es el fix principal. Supabase solo deja de alertar cuando
-- TODAS las tablas en el schema public tienen RLS habilitado.
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE
    tbl RECORD;
    enabled_count INTEGER := 0;
    already_count INTEGER := 0;
BEGIN
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '🔒 NUCLEAR RLS PATCH — 13 Mayo 2026';
    RAISE NOTICE '════════════════════════════════════════════';
    
    FOR tbl IN 
        SELECT schemaname, tablename, rowsecurity
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        IF NOT tbl.rowsecurity THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
            enabled_count := enabled_count + 1;
            RAISE NOTICE '🔒 RLS HABILITADO → %', tbl.tablename;
        ELSE
            already_count := already_count + 1;
            RAISE NOTICE '✅ RLS ya activo  → %', tbl.tablename;
        END IF;
    END LOOP;
    
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '📊 Resultado: % tablas ya tenían RLS, % tablas corregidas', already_count, enabled_count;
    RAISE NOTICE '════════════════════════════════════════════';
END $$;

-- ═══════════════════════════════════════════════════════════════
-- PASO 2: CREAR POLÍTICAS DE SEGURIDAD DONDE FALTEN
-- ═══════════════════════════════════════════════════════════════
-- Para cada tabla con RLS pero SIN políticas, creamos una
-- política segura por defecto:
--   - SELECT: solo usuarios autenticados
--   - INSERT/UPDATE/DELETE: bloqueado
--
-- Las tablas que YA tienen políticas NO se tocan.
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE
    tbl RECORD;
    policy_count INTEGER;
    patched_count INTEGER := 0;
    has_company_id BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '📋 PASO 2: Verificando políticas existentes';
    RAISE NOTICE '════════════════════════════════════════════';
    
    FOR tbl IN 
        SELECT tablename
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        -- Count existing policies
        SELECT COUNT(*) INTO policy_count 
        FROM pg_policies 
        WHERE tablename = tbl.tablename AND schemaname = 'public';
        
        IF policy_count = 0 THEN
            -- Check if table has company_id column
            SELECT EXISTS(
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = tbl.tablename 
                AND column_name = 'company_id' 
                AND table_schema = 'public'
            ) INTO has_company_id;
            
            IF has_company_id THEN
                -- Table with company_id: tenant-isolated policies
                -- Try get_my_company_id first (multitenancy.sql), fallback to get_user_company_id
                BEGIN
                    EXECUTE format(
                        'CREATE POLICY "safe_select_%1$s" ON public.%1$I FOR SELECT USING (
                            company_id::TEXT = get_my_company_id() OR is_superadmin()
                        )', tbl.tablename
                    );
                    EXECUTE format(
                        'CREATE POLICY "safe_insert_%1$s" ON public.%1$I FOR INSERT WITH CHECK (
                            company_id::TEXT = get_my_company_id()
                        )', tbl.tablename
                    );
                    EXECUTE format(
                        'CREATE POLICY "safe_update_%1$s" ON public.%1$I FOR UPDATE USING (
                            company_id::TEXT = get_my_company_id() OR is_superadmin()
                        )', tbl.tablename
                    );
                    EXECUTE format(
                        'CREATE POLICY "safe_delete_%1$s" ON public.%1$I FOR DELETE USING (
                            is_superadmin()
                        )', tbl.tablename
                    );
                    RAISE NOTICE '🛡️  % → 4 políticas tenant-isolated creadas', tbl.tablename;
                EXCEPTION WHEN undefined_function THEN
                    -- Fallback: use get_user_company_id
                    EXECUTE format(
                        'CREATE POLICY "safe_select_%1$s" ON public.%1$I FOR SELECT USING (
                            company_id::TEXT = get_user_company_id() OR is_superadmin()
                        )', tbl.tablename
                    );
                    EXECUTE format(
                        'CREATE POLICY "safe_insert_%1$s" ON public.%1$I FOR INSERT WITH CHECK (
                            company_id::TEXT = get_user_company_id()
                        )', tbl.tablename
                    );
                    EXECUTE format(
                        'CREATE POLICY "safe_update_%1$s" ON public.%1$I FOR UPDATE USING (
                            company_id::TEXT = get_user_company_id() OR is_superadmin()
                        )', tbl.tablename
                    );
                    EXECUTE format(
                        'CREATE POLICY "safe_delete_%1$s" ON public.%1$I FOR DELETE USING (
                            is_superadmin()
                        )', tbl.tablename
                    );
                    RAISE NOTICE '🛡️  % → 4 políticas tenant-isolated creadas (fallback)', tbl.tablename;
                END;
            ELSE
                -- Table without company_id: authenticated-only read, deny write
                EXECUTE format(
                    'CREATE POLICY "safe_select_%1$s" ON public.%1$I FOR SELECT USING (auth.uid() IS NOT NULL)', 
                    tbl.tablename
                );
                EXECUTE format(
                    'CREATE POLICY "safe_deny_insert_%1$s" ON public.%1$I FOR INSERT WITH CHECK (false)', 
                    tbl.tablename
                );
                EXECUTE format(
                    'CREATE POLICY "safe_deny_update_%1$s" ON public.%1$I FOR UPDATE USING (false)', 
                    tbl.tablename
                );
                EXECUTE format(
                    'CREATE POLICY "safe_deny_delete_%1$s" ON public.%1$I FOR DELETE USING (false)', 
                    tbl.tablename
                );
                RAISE NOTICE '🔐 % → 4 políticas auth-only creadas (sin company_id)', tbl.tablename;
            END IF;
            
            patched_count := patched_count + 1;
        ELSE
            RAISE NOTICE '✅ % → ya tiene % políticas', tbl.tablename, policy_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '📊 % tablas recibieron políticas nuevas', patched_count;
    RAISE NOTICE '════════════════════════════════════════════';
END $$;

-- ═══════════════════════════════════════════════════════════════
-- PASO 3: VERIFICACIÓN FINAL — REPORTE COMPLETO
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE
    tbl RECORD;
    policy_count INTEGER;
    total_tables INTEGER := 0;
    total_secure INTEGER := 0;
    total_insecure INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔══════════════════════════════════════════════════╗';
    RAISE NOTICE '║     REPORTE FINAL DE SEGURIDAD RLS              ║';
    RAISE NOTICE '╠══════════════════════════════════════════════════╣';
    
    FOR tbl IN 
        SELECT tablename, rowsecurity
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        total_tables := total_tables + 1;
        
        SELECT COUNT(*) INTO policy_count 
        FROM pg_policies 
        WHERE tablename = tbl.tablename AND schemaname = 'public';
        
        IF tbl.rowsecurity AND policy_count > 0 THEN
            total_secure := total_secure + 1;
            RAISE NOTICE '║ ✅ %-30s RLS:ON  Policies:%  ║', tbl.tablename, policy_count;
        ELSIF tbl.rowsecurity THEN
            total_insecure := total_insecure + 1;
            RAISE NOTICE '║ ⚠️  %-30s RLS:ON  Policies:0  ║', tbl.tablename;
        ELSE
            total_insecure := total_insecure + 1;
            RAISE NOTICE '║ 🔴 %-30s RLS:OFF             ║', tbl.tablename;
        END IF;
    END LOOP;
    
    RAISE NOTICE '╠══════════════════════════════════════════════════╣';
    RAISE NOTICE '║ Total: % tablas | ✅ Seguras: % | ⚠️ Revisar: %     ║', total_tables, total_secure, total_insecure;
    RAISE NOTICE '╚══════════════════════════════════════════════════╝';
    
    IF total_insecure = 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 TODAS las tablas están protegidas con RLS + políticas';
        RAISE NOTICE '   El alerta de Supabase debería desaparecer al refrescar.';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  Quedan % tablas sin políticas. Revisar manualmente.', total_insecure;
    END IF;
END $$;
