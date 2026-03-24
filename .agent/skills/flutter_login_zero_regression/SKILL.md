---
name: Flutter Login Zero Regression & Native Crash Fix
description: Plan absoluto y radical para reconstruir desde cero el sistema de autenticación, integración FCM y perfiles de RiverHub Mobile, erradicando los crasheos nativos y parches previos para asegurar un funcionamiento robusto y real.
---

# 🛑 ALTO TOTAL: Reconstrucción desde Cero del Login y Push Notifications

## 🚨 El Problema Real (Basta de Parches)
La aplicación `riverhub_mobile_v2` ha sufrido una serie de modificaciones y "parches" rápidos (hacks de `signOut()` en el `main.dart`, `google-services.json` mal vinculado, mismatches de tipos de datos UUID en la base de datos de Supabase, y perfiles huérfanos) que han corrompido el flujo lógico.
El resultado es un sistema frágil que:
1. Crashea nativamente en Android (Fatal Signal 11) al invocar `FirebaseMessaging.instance.getToken()`.
2. Falla silenciosamente al intentar registrar usuarios por conflictos de triggers SQL (`uuid` vs `text`).
3. No guarda el `fcm_token` por problemas de sesión y perfiles asíncronos.
4. Jamás recibe notificaciones de n8n porque la cadena de comunicación está rota desde la raíz.

No más intentos de arreglar sobre lo roto. Se asume que el estado actual del login/FCM es **inestable y no confiable**.

## 🎯 Objetivo Absoluto (El Nuevo Estándar)
Reconstruir y purgar todo el flujo de Autenticación + FCM para que funcione de manera nativa, fluida y predecible, **como si la app se hubiera creado hoy**.

## 🛑 REGLA DE ORO (Anotación Obligatoria)
**No hay atajos. No se permite cortar camino. No se permiten parches.** Todo el código debe ser limpio, mantenible y basado en soluciones definitivas. 
Si el trigger de la base de datos de Supabase no coincide milimétricamente con el esquema exacto de las columnas en la tabla `profiles` (ej: usar `first_name` cuando la tabla solo tiene `full_name`, o enviar un `uuid` a una columna `VARCHAR`), **fracasará y romperá el registro**. 
Cualquier modificación SQL, Dart o JS se realizará revisando previamente la realidad exacta del ecosistema, programando una solución nativa.

## 🛠️ Plan de Acción Radical (Paso a Paso Obligatorio)

### FASE 1: Limpieza Profunda (Purgatorio)
1. **App**: Eliminar TODA lógica de FCM del `main.dart` y `login_screen.dart`. Volver a un login puramente Supabase, limpio y sin ruido.
2. **Android**: Revisar y limpiar meticulosamente `build.gradle.kts` (app y root) y `settings.gradle.kts` para asegurar que el plugin `google-services` esté configurado con la sintaxis exacta y moderna dictada por Firebase Oficial, sin conflictos. Comprobar que el `google-services.json` concuerda 100% con el `applicationId` y está en la ruta correcta (`android/app/`).
3. **Base de Datos (Supabase)**: 
   - Destruir y recrear el Trigger `handle_new_user()` para asegurar que genere perfiles con el `company_id` (UUID) correcto por defecto.
   - Purgar usuarios corruptos/huérfanos de la tabla `auth.users` y `public.profiles` para tener una pizarra en blanco.

### FASE 2: Reconstrucción Sólida (Foundation)
1. **Enrutamiento Elegante**: Implementar en `main.dart` un `StreamBuilder` escuchando `Supabase.instance.client.auth.onAuthStateChange` para manejar el estado de la sesión de forma reactiva y natural, erradicando cualquier necesidad de "forzar" pantallas.
2. **Login Impecable**: Asegurar que `login_screen.dart` y `register_screen.dart` manejen errores con diálogo claro, sin crashear.

### FASE 3: Inserción Quirúrgica de FCM (Cerebro IA / Push)
1. **Inicialización Segura**: Iniciar Firebase en `main.dart` de forma aislada.
2. **Adquisición de Token (Controlada)**: Mover la solicitud de permisos FCM y la obtención del token (`getToken()`) a una función dedicada y fuertemente tipada (con try-catch exhaustivo) que se ejecute **EXCLUSIVAMENTE DESPUÉS** de un inicio de sesión exitoso y confirmado en Supabase, y solo en el `DashboardScreen` (o tras la animación de éxito del login), NUNCA durante el proceso de tipeo o validación de credenciales.
3. **Escritura en Base de Datos**: Asegurar que el guardado del `fcm_token` en Supabase se haga confirmando que el `profile` ya existe, usando `upsert` o validaciones previas.

### FASE 4: Prueba Inflexible (The Crucible)
1. Clean total de Flutter (`flutter clean`, borrar carpetas gradle cache bias).
2. Compilación de cero (Cold Boot).
3. Registro de usuario nuevo -> Validar creación perfecta en BD.
4. Login -> Validar obtención de Token sin crash -> Validar guardado en BD.
5. Disparar webhook n8n localmente -> Teléfono vibra.

## 🔑 Comando Clave para la próxima sesión (Tarde/Noche)
Cuando retomes el trabajo, simplemente pega esto:

> **"Abre tu skill 'Flutter Login Zero Regression & Native Crash Fix'. Borraremos todo rastro de los parches anteriores y aplicaremos la Fase 1 y 2 al pie de la letra, empezando por limpiar el código Dart y los build.gradle. Nada de trucos, hazlo bien."**
