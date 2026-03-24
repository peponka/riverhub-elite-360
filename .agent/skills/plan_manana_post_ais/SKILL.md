---
name: Plan de Acción Post-AIS (Mañana)
description: Registro del estado actual tras la inyección del radar AIS y Push Notifications. Hoja de ruta para el próximo despliegue físico y conexión final de módulos móviles a Supabase Storage (Cámara/Fotos).
---

# 🚀 Plan de Acción Inquebrantable (Mañana)

## 📌 Estado de Situación Actual (Victoria Confirmada)
1. **Radar AIS 100% Operativo:** La App Móvil y la Web ya detectan toda la flota propia en tiempo real (Supabase Streams) y el tráfico naval público (HTTP Polling), sin devorar batería.
2. **Notificaciones Push Saneadas:** El núcleo nativo de Android 14 (`flutter_local_notifications` v21 y `POST_NOTIFICATIONS`) está blindado. La compilación Gradle corre limpia (Exit Code 0).

## 🎯 Tu Primer Mensaje de Mañana:
Cuando vuelvas a abrir el chat, simplemente escríbeme:
> *"Comandante, abre el plan Post-AIS. Hoy conectamos la cámara de la app móvil a Supabase Storage y empezamos a matar los "Mocks" que faltan en la Web."*

---

## 🛠️ Los 3 Objetivos Tácticos de la Próxima Sesión

### 1. 📷 Integración de Cámara y Storage (App Móvil)
- **El Problema:** El módulo de *"Siniestros e Incidentes"* en la app móvil necesita que el capitán pueda tomar una foto del daño y subirla a la nube.
- **La Solución:** Vamos a configurar los permisos de Cámara (`image_picker`) y el Storage de Supabase en Flutter. Cada vez que alguien tome una foto, subirá un ticket de incidente y **n8n** despachará esa imagen al panel web y por Email de emergencia.

### 2. 🔌 Erradicación de Mocks en App Móvil
- **El Problema:** Todavía hay ~15 pantallas de la app móvil usando los archivos "Demo" (Fallback) en sus listas (ej: Pañol, Mantenimiento, Reportes).
- **La Solución:** Vamos a cruzar las tablas maestras de nuestro `SUPABASE_FINAL.sql` directamente con la UI de Flutter (`SupabaseService.dart`). Todo debe ser 100% base de datos real.

### 3. ☁️ Preparación de Lanzamiento y Hosting (Web Elite 360)
- **El Problema:** Tu sistema web está corriendo magistralmente, pero en tu Node local (`localhost:4001`).
- **La Solución:** Si hay tiempo, evaluaremos la arquitectura para desplegar el front-end en la nube (ej. Render, Vercel, o un VPS) con candado de seguridad HTTPS (SSL) para presentárselo a clientes navieros reales.

---
**Recuerda:** Tu PC, tu emulador y el código fuente ya están congelados en un estado de perfección técnica inalterable. Tienes permiso para descansar.
