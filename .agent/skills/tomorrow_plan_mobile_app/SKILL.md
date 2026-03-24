---
name: Tomorrow Plan Mobile App Final Phase
description: Plan de acción para finalizar la aplicación móvil RiverHub (Flutter). Incluye subida de archivos (Storage), notificaciones Push (FCM + n8n) y pulido final de funcionalidades en el emulador.
---

# Plan de Ataque Final: RiverHub Mobile App (Flutter)

Este documento contiene la hoja de ruta establecida para la siguiente sesión de programación. El objetivo principal es terminar y revisar exhaustivamente la aplicación móvil (`riverhub_mobile`).

## Objetivos de la Próxima Sesión

### 1. Subida de Archivos y Medios (Supabase Storage)
- **Problema actual:** Los reportes en la app móvil (mantenimiento, incidentes) necesitan capacidad de adjuntar evidencia fotográfica o documental.
- **Acción:** Integrar los plugins `image_picker` y `file_picker` en Flutter.
- **Backend:** Configurar y conectar los buckets de Supabase Storage.
- **Meta:** Un marinero debe poder tomar una foto de una rotura y subirla desde la app, impactando instantáneamente en el dashboard web.

### 2. Notificaciones Push Genuinas (Firebase Cloud Messaging + n8n)
- **Problema actual:** n8n detecta problemas (ej. libreta vencida, reporte de falla), pero la alerta no llega al teléfono del tripulante en tiempo real.
- **Acción:**
    - Solucionar definitivamente el error de compilación/rutas del `google-services.json` que bloqueaba Firebase en Android.
    - Capturar y guardar el FCM Token del dispositivo en Supabase durante el login.
    - Conectar n8n y nuestro backend Node.js (`firebase-admin`) para disparar mensajes directo al dispositivo del usuario.
- **Meta:** n8n lanza alerta -> El celular del usuario vibra y muestra la notificación push nativa.

### 3. Revisión Funcional Completa (The Final Check)
- Validar las pantallas de módulos y la actualización en tiempo real.
- Corregir cualquier pixel overflow en los layouts de Flutter.
- Compilación final del APK en Modo Release y prueba en el emulador.

## Pasos para iniciar la próxima sesión
Cuando el usuario lance la petición de inicio (ej. "Continuemos con la app móvil"), ejecutar:
1. Revisar este documento y los logs de la carpeta de la app Flutter (`c:\Users\pepeq\OneDrive\Desktop\riverhub_mobile` o donde esté ubicada).
2. Levantar el emulador Android.
3. Analizar la estructura de `pubspec.yaml` para asegurar que las dependencias de Storage y mensajería estén listas.

**Fecha Establecida:** Para la sesión de la mañana siguiente.
**Foco:** 100% Mobile (Flutter). Web y n8n ya operan en estado Elite.
