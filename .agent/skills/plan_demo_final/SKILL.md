---
name: Plan Demo Final (Ecosistema RiverHub)
description: Plan de acción exacto para mañana. Validar notificaciones Push (N8N -> Celular) y realizar el primer recorrido End-to-End (Web -> N8N -> Mobile) de todo el ecosistema.
---

# 🚀 PLAN DE BATALLA (Día de la Demo Final)

Este documento contiene los pasos exactos para mañana, partiendo del éxito total en la compilación de la **App Móvil Perfecta** (55.3MB) y el **Parche del Backend (FCM RLS bypass)** logrado ayer. 

El objetivo de mañana es conectar los tres puntos del triángulo del ecosistema RiverHub Elite 360: **La Web, el Cerebro IA (n8n) y el Celular**.

## 🎯 OBJETIVOS PRINCIPALES

### 1. 📡 Prueba de Fuego: Push Notifications Vía n8n
- **Verificar Supabase:** Confirmar que al loguearte en la app móvil, la tabla `profiles` está guardando exitosamente un texto kilométrico en la columna `fcm_token`.
- **Verificar Parche SQL:** Validar que el script `PATCH_FCM_RLS.sql` que creamos ayer fue pegado y ejecutado con éxito en el SQL Editor por el Comandante.
- **Disparo End-to-End:** Usar n8n (o un endpoint rápido) para disparar una alerta crítica (`/api/n8n/send-alert`) y comprobar que el celular, con la app cerrada o en el bolsillo, **vibra y recibe la notificación**.

### 2. 🧹 Remate del Frontend Web (RiverToast Elite)
- Inspeccionar si queda algún horrible y prehistórico `alert()` o `confirm()` nativo de JavaScript en los módulos más recientes (como Pañol o Flota).
- Reemplazar cualquier rastro por el flamante **RiverToast** para que la Web brille con estética de software hiper-premium.
- Revisar que el Dark/Light Mode no tenga botones invisibles.

### 3. 🎬 Ensayo General (Demo Flujo Completo)
1. **La Web:** El Operador visualiza el Mapa AIS y detecta bajo nivel de combustible en un empujador. Envía un reporte al sistema.
2. **El Cerebro (n8n/Gemini):** Analiza el reporte, lo clasifica como "Urgente" y dispara un Webhook a RiverHub.
3. **El Celular (App Flutter):** El Capitán recibe la **Push Notification**, abre la app, ingresa al módulo de Incidentes, usa la **Cámara** para sacar foto del medidor, y lo sube.
4. **La Victoria:** Todo el equipo ve instantáneamente el reporte, con foto incluida, reflejado en el portal Web en tiempo real. 

## 🛡️ REGLAS ESTRICTAS PARA EL AGENTE
- **Prohibido:** No usar comandos extraños con PowerShell que cuelguen la máquina. Todo se resuelve modificando código directamente o guiando al Comandante de forma quirúrgica.
- **Enfoque Visual:** Si se cambia diseño en la Web, debe cumplir el estándar *Premium HSL / Glassmorphism*. Nada de minimalismo vago.
- **Prioridad #1:** Si la App Móvil reporta cualquier error nuevo al probarla mañana, la solución de arregla acá y NO tocando la ofuscación en Release.

**PALABRA DE CÓDIGO:** Cuando el Comandante invoque "activa Plan Demo Final", sabremos por dónde empezar exactamente.
