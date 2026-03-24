---
name: Flutter FCM, Camera Setup & Build Fix
description: Documentación de los hitos logrados en la Fase Final de la Aplicación Móvil RiverHub (Flutter). Integración de image_picker (Cámara/Galería), resolución de bloqueo FCM (google-services.json) y preparación del entorno para despliegue y notificaciones n8n/Gemini.
---

# Fase Final Móvil: Setup de Cámara y Resolución de Firebase/FCM

Este documento detalla los logros alcanzados hasta el momento para que el Comandante pueda reiniciar el IDE y continuar con el trabajo pesado (Restart to Update).

## 1. Frente 1: Evidencia Fotográfica (Cámara y Supabase Storage)

**Objetivo:** Permitir que los capitanes tomen fotografías directas de incidentes y averías impactando estas instantáneamente.

**Logros:**
- Se integró una UI nativa mediante un `CupertinoActionSheet` en el módulo de **Incidentes** (`lib/screens/incidentes_screen.dart`).
- En lugar de abrir forzadamente la galería, el usuario ahora puede elegir entre:
  - **Tomar Foto** (`ImageSource.camera`) para capturas en tiempo real.
  - **Elegir de Galería** (`ImageSource.gallery`) para fotos guardadas.
- La foto, al seleccionarse, pasa como binario al bucket `documents` en Supabase Storage (ruta `incidents/`). Una vez confirmada, el payload con la URL pública se guarda para visualización en el escritorio web o n8n.

## 2. Frente 2: Resolviendo Notificaciones y FCM Token 

**Objetivo:** Levantar nuevamente el sistema nativo de Firebase Cloud Messaging y cerciorarse de que un APK compile sin frenos, guardando el Token en Supabase.

**Logros:**
- Analizamos el entorno de `android/build.gradle.kts` y `settings.gradle.kts`. La configuración de Google Services para la API FCM está en perfecto orden y la app compila vía `flutter build apk` sin atascarse (Exit Code: 0 confirmado).
- El proceso de Guardar el **FCM Token** hacia Supabase se ha blindado de manera inteligente: 
  - Al ingresar a `DashboardScreen`, el método `_secureFcmTokenUpdate()` requiere los permisos (`alert`, `badge`, `sound`) a nivel nativo.
  - Automáticamente inyecta/actualiza `fcm_token` en la tabla `profiles` vinculada al Auth Profile local. 
  - En caso positivo, arroja una alerta exclusiva "Cerebro Conectado", cerrando el loop.

## 3. Frente 3: Testeo Relámpago y Siguiente Paso

- Hemos lanzado manualmente `test_push.js` para asegurar que el `firebase-admin` en el backend cuenta con los credenciales `json` requeridos para empujar el String al celular.

### INSTRUCCIONES POST-REINICIO

1. Iniciar la base de datos local y/o Node.js Backend con Firebase Admin y PM2 activados.
2. Iniciar el Emulador Android o dispositivo físico, correr el build completo con `flutter run`.
3. Validar el cruce: *N8n -> Llamada a Gemini AI -> Disparo al Endpoint de Alerta -> Push Android*.
4. Si hubiese crasheos inesperados en el runtime nativo por dependencias incompatibles de MultiDex, aplicar `multiDexEnabled true` en `app/build.gradle.kts`.
