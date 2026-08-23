-- ============================================================================
-- FIX: recursión infinita (42P17) en las políticas RLS de user_profiles
-- ============================================================================
-- Las políticas `profiles_select` y `profiles_update` hacían:
--
--   (user_id = auth.uid()) OR EXISTS (
--     SELECT 1 FROM user_profiles up
--     WHERE up.user_id = auth.uid() AND up.role = 'superadmin')
--
-- Ese EXISTS consulta user_profiles DENTRO de una política sobre user_profiles
-- → Postgres corta con "42P17: infinite recursion detected in policy for
-- relation user_profiles".
--
-- Efecto medido antes del fix: CUALQUIER lectura de user_profiles desde un
-- cliente fallaba — anónimo, usuario logueado, e incluso el propio superadmin
-- leyendo su propia fila. Solo el backend con service key (que saltea RLS)
-- funcionaba. Eso rompía:
--   • login del panel superadmin  → authRoutes.js:27 no podía leer el rol y
--     devolvía siempre 403 "Acceso denegado" (panel inaccesible)
--   • app_drawer.dart:51          → drawer lateral, visible en toda la app
--   • pre_zarpe_screen.dart:344   → company_id + full_name
--   • contratos_screen.dart:377   → contratos (móvil)
--   • main.dart:153               → alta del token FCM (push notifications)
--   • admin-contratos-viabarcazas.html / admin-compliance-viabarcazas.html (web)
--
-- La solución correcta ya estaba escrita en la base: `is_superadmin()`, que es
-- STABLE SECURITY DEFINER y por lo tanto NO dispara RLS al consultar la tabla.
-- Es el mismo patrón que ya usa la política `rls_up_select` con
-- `get_my_company_id()` — esa nunca recursó. Acá simplemente se reemplaza la
-- subconsulta inline por esa función.
-- ============================================================================

DROP POLICY IF EXISTS profiles_select ON public.user_profiles;
CREATE POLICY profiles_select ON public.user_profiles
  FOR SELECT
  USING (user_id = auth.uid() OR public.is_superadmin());

DROP POLICY IF EXISTS profiles_update ON public.user_profiles;
CREATE POLICY profiles_update ON public.user_profiles
  FOR UPDATE
  USING (user_id = auth.uid() OR public.is_superadmin());

NOTIFY pgrst, 'reload schema';
