-- ═══════════════════════════════════════════════════════════
-- PATCH: Restrict get_all_fcm_tokens to service_role only
-- ViaBarcazas Security Fix 2.1
-- ═══════════════════════════════════════════════════════════
-- PROBLEM: SECURITY DEFINER function exposes ALL user FCM tokens
-- to any role (including anon), bypassing RLS entirely.
-- FIX: Revoke execute from anon/authenticated, grant only to service_role.

REVOKE EXECUTE ON FUNCTION get_all_fcm_tokens() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION get_all_fcm_tokens() TO service_role;

-- Verify the change:
-- SELECT grantee, privilege_type FROM information_schema.routine_privileges 
-- WHERE routine_name = 'get_all_fcm_tokens';
