---
name: The Vault - Flutter Supreme Fix & Zero Crash Architecture
description: Documento maestro inquebrantable de cómo se solucionó definitivamente el crasheo nativo de Firebase al inicio y el "Database error saving new user" en el registro de Supabase. Creado el 14 de Marzo 2026 tras 2 horas de depuración extrema.
---

# 🛡️ THE VAULT: Flutter Supreme Fix & Zero Crash Architecture

**Fecha de la Gran Victoria:** 14 de Marzo de 2026.
**El Problema Original:** La app crasheaba apenas se abría en Android (Fatal Signal 11) por inicialización corrupta de Firebase. Y al intentar registrar un usuario, Supabase devolvía un muro rojo: `{"code":"unexpected_failure","message":"Database error saving new user"}`.

Esta skill existe para garantizar que **JAMÁS MÁS** se pierdan 2 horas solucionando este flujo en la app móvil. Si en el futuro algo se rompe en el Login o las Notificaciones Push, **ESTE ES EL ÚNICO MANUAL QUE DEBE SEGUIRSE AL PIE DE LA LETRA**.

## 🚀 CÓMO SE ARREGLÓ (La Tríada Perfecta)

El fallo no era uno, eran tres sistemas cruzados bloqueándose mutuamente. Aquí está la arquitectura de la salvación:

### 1. El Error del "Fatal Signal" de Firebase (El Crasheo)
**Causa:** `FirebaseMessaging.instance.getToken()` se estaba llamando en `main.dart` ANTES de que la UI existiera o el usuario estuviese logueado, colapsando la memoria nativa. E incluso a veces faltaba `Firebase.initializeApp()`.
**La Solución Mágica:**
- Inicializar Firebase en `main.dart` *aisladamente* en un bloque `try-catch`, y **remover** toda lógica de permisos o tokens de la pantalla de Login y de Main.
- Trasladar la petición de permisos y el `getToken()` EXCLUSIVAMENTE a `dashboard_screen.dart` dentro del método `_secureFcmTokenUpdate()`, asegurando que solo se dispara cuando el `session.user` de Supabase es válido y confirmado.

### 2. El Muro de Supabase ("Database error saving new user")
**Causa:** El viejo trigger (Disparador) en la Base de Datos que copiaba a los usuarios desde `auth.users` hacia la tabla pública `profiles` era ciego. Intentaba insertar `cuentas UUID` en columnas `VARCHAR`, y buscaba columnas como `first_name` que NO EXISTÍAN en la tabla en producción (solo existía `full_name`). Al chocar los esquemas de datos, la BD escupía el error de "unexpected_failure" a la app, impidiendo la creación del usuario.
**La Solución Mágica (Código SQL Inquebrantable):**
Toda la base de datos se curó ejecutando este exacto bloque en el *SQL Editor* de Supabase. Este código lee la realidad de las columnas (`VARCHAR`, `full_name`) y previene cualquier choque.

```sql
-- 1. Asegurar la columna del token sin destruir nada
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- 2. Limpiar el desastre anterior rigurosamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 3. Crear el flujo perfecto y nativo adaptado a VARCHAR y full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  default_company_id VARCHAR := '4af26be7-00f9-4f26-aebf-dc9b611e0822'; -- ID RiverHub Global
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company, company_id, role, fcm_token, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'company', 'RiverHub Global'),
    COALESCE(NEW.raw_user_meta_data->>'company_id', default_company_id),
    COALESCE(NEW.raw_user_meta_data->>'role', 'tripulante'),
    NULL, NOW(), NOW()
  );
  RETURN NEW;
END;
$$;

-- 4. Anclar el trigger al registro
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. La Sincronización del Cerebro (El Bug del FCM Perdido)
**Causa:** Aún obteniendo el Token en el celular, la aplicación no podía guardarlo en Supabase porque usaba `upsert` ciego, lo que violaba políticas de RLS, o porque Firebase no lo actualizaba si el Token no cambiaba en memoria de caché.
**La Solución:**
- Creamos un botón tipo `CupertinoButton` en el icono de la campana en `dashboard_screen.dart`.
- Al presionarlo, dispara explícitamente `UPDATE profiles SET fcm_token = token WHERE id = session.id` y arroja una alerta de confirmación visual en pantalla: `"Cerebro Conectado"`.
- Desde N8N (o el script `test_push.js` usando `firebase-admin`), se puede enviar notificaciones directo a ese Token.

---
## 🏆 Conclusión Inamovible
Si la App Móvil vuelve a trabarse en registro o crash nativo de FCM:
**SE PROHÍBEN PARCHES.** Se debe consultar esta skill, revisar que el SQL en Supabase sea EXACTO a la tabla `profiles`, que el `initializeApp` esté en `main.dart`, y que el `getToken` ocurra en el `Dashboard`. Todo esto se demostró efectivo y en producción en esta fecha.
