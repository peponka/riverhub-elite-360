---
description: Historial de la purga total de Mocks en la App Móvil Flutter, subida de fotos e integración de Notificaciones FCM. Solución al bloqueo de OneDrive con plugin_symlinks.
---

# RiverHub Mobile - Flutter App Enhancements (Sprint Mocks + FCM + Imágenes)

## 🎯 Objetivo de la Sesión
Completar 3 funcionalidades clave en la aplicación **RiverHub Elite 360 (Flutter App)** y evitar el congelamiento de VSCode/Emulador debido a bloqueos de lectura/escritura en OneDrive.

## 🛠️ Modificaciones de Código Realizadas:

### 1. Sistema de Push Notifications Nativas (FCM)
* **Archivo afectado:** `pubspec.yaml`, `lib/main.dart`
* **Acción:**
  - Se inyectaron silenciosamente las dependencias `firebase_core` y `firebase_messaging` directo en el YAML.
  - Se agregó `await Firebase.initializeApp()` y se suscribió el método `FirebaseMessaging.onMessage.listen()` dentro de un bloque `try/catch` para capturar notificaciones Push provenientes de **n8n** (evita pantallazo de caída fatal antes de colocar el `google-services.json`).

### 2. Evidencia Fotográfica en Reporte de Incidentes
* **Archivo afectado:** `pubspec.yaml`, `lib/screens/incidentes_screen.dart`
* **Acción:**
  - Se inyectó dependencia `image_picker`.
  - En la bóveda/modal de "Nuevo Expediente", creamos una caja UI especial interactiva "Evidencia Fotográfica". 
  - Al presionarla (`ImageSource.gallery`), graba el File Path en memoria para escupirlo al almacenamiento de Storage (Supabase) al guardar la orden.

### 3. Asesinato Total de Mocks & Data Dummy (100% Nativo a Supabase)
Se purgaron todas las listas quemadas (`_demoLoQueSea`) a lo largo del flujo entero del proyecto móvil:
1. **`tripulacion_screen.dart`**: Borrada `_demoCrew`. Todo carga de `crew_members`.
2. **`mantenimiento_screen.dart`**: Borrada `_demoTasks`. Conecta directo con `maintenance_tasks`.
3. **`fleet_manager_screen.dart`**: Borrada `_demoVessels`. Monitorea directo a la tabla `vessels`.
4. **`monitoring_screen.dart`**: Borradas `_demoAlerts` y `_demoGeofences`. Reemplazado por consultas reales a `alerts` y `geofences`.
5. **`comunicaciones_screen.dart`**: Borrada `_demoMessages`. Se conecta directo a la tabla `comms` como un radio real VHF.
6. **`commercial_screen.dart`**: Borrados `_demoContracts`. Ahora visualiza directo `service_orders`.
7. **`daily_report_screen.dart`**: Convertido a widget de estado interactuando con métricas vivas de `vessels` y operacionales.

---

## 🚨 Troubleshooting Urgente: "Flutter failed to delete .plugin_symlinks" (Error Exit Code 1)
Debido a que tu proyecto reside en `C:\Users\pepeq\OneDrive\Desktop\...`, el daemon de sincronización continua de **OneDrive** intercepta en tiempo real los "Symlinks" (accesos directos a plugins de Windows) que Flutter genera durante `flutter pub get` bloqueando la carpeta `windows\flutter\ephemeral\.plugin_symlinks`.

**Solución Infallible tras Reiniciar la PC:**
Como la aplicación se compila hacia **Android/iOS**, la carpeta `windows/` (C++ para computadora) es innecesaria y sólo trae bloqueos con OneDrive.

1. Reinicias tu PC (para soltar el lock remanente de OneDrive en la RAM).
2. Abres PowerShell y ejecutas esta aniquilación forzada (o lo haces a mano desde tu explorador borrando la carpeta `windows` si solo haces Mobile app).
   ```powershell
   Remove-Item -Recurse -Force "windows\flutter\ephemeral\.plugin_symlinks"
   flutter clean
   flutter pub get
   ```
3. Alternativa 2: **Pausar OneDrive**. Haz clic en la nube de OneDrive -> Engranaje -> Pausar Sincronización (2 horas). Al ejecutar `flutter pub get` fluirá sin chocar.

¡Una vez logres compilar el emulador sin los locks mágicos de Windows/OneDrive, la App Móvil será 100% base de datos real!
