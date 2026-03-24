---
name: Flutter App Enhancements & APK Troubleshooting (flutter3)
description: Guía de integración de Cámara, Subida de Archivos, Push Notifications (FCM) y resolución profunda de errores críticos de compilación APK y conexión de red en RiverHub Mobile.
---

# RiverHub Mobile V2 (Flutter 3) - Guía de Implementación y Recuperación

Esta skill documenta las optimizaciones clave del desarrollo de la aplicación RiverHub Mobile V2, recopilando la configuración avanzada nativa y la resolución definitiva a los bloqueos de compilación del `app-release.apk`.

## 1. Troubleshooting de Compilación y APK (Errores Comunes y Soluciones)

### 1.1 El infierno de OneDrive y Bloqueos de Build
**Error:** Al ejecutar `flutter build apk` o `flutter run`, el proceso se cuelga eternamente en "Resolving dependencies", "Running Gradle task" o arroja errores de permisos / "File in use by another process".
**Causa:** Microsoft OneDrive está sincronizando constantemente la carpeta del proyecto, bloqueando miles de archivos temporales que genera Flutter/Gradle en la subcarpeta `build/` o `.dart_tool/`. 

**🟢 Solución Definitiva:**
Antes de volver a compilar, hay que matar a OneDrive y limpiar todo el caché que dejó corrupto.
```powershell
# 1. Matar OneDrive
taskkill /F /IM OneDrive.exe

# 2. Borrar carpetas cacheadas corruptas
Remove-Item -Recurse -Force .dart_tool
Remove-Item -Recurse -Force build
Remove-Item -Recurse -Force android/.gradle
Remove-Item -Recurse -Force android/build

# 3. Limpiar Flutter
flutter clean
flutter pub get

# 4. Volver a intentar la compilación
flutter build apk
```

### 1.2 Socket.io y Data Realtime en APK Físico (Mapa Gris)
**Error:** En el emulador de Android Studio, la App conecta con la BD y el Mapa AIS funciona bien. Al instalar el APK compilado en el celular real, el sistema queda cargando o el mapa muestra "0 Barcos".
**Causa:** El código de `map_screen.dart` estaba apuntando a `127.0.0.1` o `10.0.2.2`. Un celular físico real no tiene idea de quién es `localhost` (para el celular, localhost es él mismo, no la PC). 

**🟢 Solución Definitiva:**
1. Obtener la IP local IPv4 real de la PC servidora (ej. `192.168.100.62`).
2. Actualizar la variable de conexión al host en los archivos `.dart`.
3. Validar permisos en `android/app/src/main/AndroidManifest.xml`:
```xml
<!-- Fundamental para conexiones locales que no tienen HTTPS -->
<uses-permission android:name="android.permission.INTERNET"/>
<application
    android:usesCleartextTraffic="true" 
    ...>
```

---

## 2. Superpoderes Nativos en Flutter (Optimizaciones Implementadas)

### 2.1 Módulo de Bitácora Interactiva (Cámara y Storage)
Se reemplazaron los inputs básicos de la bitácora por un motor nativo capaz de tomar fotos como evidencia de incidentes.
* **Paquetes Usados:** `image_picker` (cámara celular) y nativos de la nube `supabase_flutter`.
* **Mecánica:** En `bitacora_screen.dart`, se implementó un `CupertinoModalPopup` mostrando opciones de **Cámara** y **Galería**. 
* **Upload Automático:** Al tomar la foto, el cliente genera un `UUID` y sube un binario comprimido directamente a un bucket Storage en Supabase.
* **Tolerancia a Fallos:** Si la foto falla al subir o la tabla `logs` aún no tiene la columna `image_url` aprovisionada, el sistema igual guarda silenciosamente el texto del registro original para no truncar la operativa del usuario en altamar (Modo de degradado elegante).

### 2.2 Integración Core de Notificaciones Push (FCM)
Firebase Cloud Messaging (FCM) ha sido orquestado en las capas inferiores del proyecto de la siguiente manera:
* **Paquetes Usados:** `firebase_core`, `firebase_messaging`.
* **Init:** En `main.dart`, `Firebase.initializeApp()` arranca en el árbol principal, abriendo puertos pasivos para capturar objetos tipo `RemoteMessage`.
* **Cosecha de Tokens (SignIn):** Las notificaciones Push requieren saber *a qué celular exacto* enviar el mensaje de n8n o tu Panel. Para ello, en `login_screen.dart`, el método asíncrono `_signIn()` y `_signInWithGoogle()` extraen en tiempo real con `FirebaseMessaging.instance.getToken()` el código encriptado de notificaciones de ese usuario y lo actualizan directo en su fila de la tabla `profiles` (columna `fcm_token`). 

> **Acción Futura Pendiente:** Para habilitar el FCM en Android definitivo, se debe registrar la aplicación temporal en Firebase Console y alojar el credential tree file `google-services.json` que da la plataforma web directamente dentro del directorio `android/app/` de este proyecto de Flutter.
