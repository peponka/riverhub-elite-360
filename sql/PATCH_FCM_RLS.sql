-- ============================================================
-- RIVERHUB ELITE 360 - PARCHE RLS PARA N8N (FCM TOKENS)
-- ============================================================
-- Este script crea una función que se salta las restricciones
-- de Row Level Security (RLS) para poder leer los FCM Tokens 
-- de todos los usuarios desde el Backend (usando Anon Key).
--
-- Instrucciones:
-- 1. Copia todo este código.
-- 2. Ve al Dashboard de Supabase -> SQL Editor.
-- 3. Pega el código y dale a "Run".
-- ============================================================

CREATE OR REPLACE FUNCTION get_all_fcm_tokens()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(fcm_token)
    INTO result
    FROM profiles
    WHERE fcm_token IS NOT NULL AND fcm_token != '';
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
