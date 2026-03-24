---
name: App Movil Final Phase Context
description: Contexto Final App Móvil y n8n: Detalles, Funcionalidad Real y Continuación
---

# Fase Final RiverHub: Movilidad + Automatización (El Eslabón Perdido)

Este documento es el cerebro táctico para retomar operaciones. Resume exactamente el punto de encaje entre la bestia operativa web (terminada) y la aplicación móvil de las tripulaciones que construiremos/terminaremos.

## 🎯 EL GRAN OBJETIVO
Conectar el terreno (los marineros en el río) con el comando central (dashboard) sin fricciones, usando el celular como herramienta de supervivencia y reporte en tiempo real.

## 📱 FRENTE DE BATALLA 1: Aplicación Móvil (Flutter)

### 1-A. Cámara y Archivos (Storage)
- **Status actual:** Los módulos en la app móvil son funcionales en datos base, pero los formularios de "Reporte de Incidente" o "Nueva Orden de Mantenimiento" carecen de la dimensión más importante en alta mar: **La foto del problema.**
- **Misión de Mañana:**
  1. Instalar/Configurar `image_picker` (cámara/galería) en la app Flutter.
  2. Activar un "Bucket" seguro en Supabase Storage llamado `informes_flota`.
  3. Al enviar un reporte, la app debe hacer un upload binario del `.jpg`, obtener la URL pública firmada y guardarla en el registro SQL del incidente.
  4. Modificar el dashboard web para que pinte la foto cuando un analista abra el incidente.

### 1-B. Firebase Cloud Messaging (FCM) - Las Notificaciones Push
- **Status actual:** El agente n8n tiene el cerebro para saber cuándo las cosas van mal, pero carece de "voz" directa hacia el bolsillo del Capitán. Hay un bloqueo técnico con el `google-services.json` frenando la compilación.
- **Misión de Mañana:**
  1. Resolver el conflicto de rutas Gradle/Firebase en el emulador Android.
  2. Hacer que al abrir la app móvil, esta solicite permisos y guarde su número de Token Único en la tabla `profiles` de Supabase.
  3. Crear el endpoint en el backend (`app.js`) usando `firebase-admin` para disparar el mensaje directo al celular del capitán.

---

## 🤖 FRENTE DE BATALLA 2: El Cerebro Automatizado (n8n + AI)

### 2-A. Neural Bridge: Escaneo Preventivo
- **Status actual:** En el mapa recién pusimos el botón *NEURAL_BRIDGE* con ese toast de éxito, pero la IA aún no analiza.
- **Misión de Mañana:** 
  1. Conectar una ruta en n8n que use un nodo de **Google Gemini**.
  2. Hacer que Gemini lea las últimas 10 posiciones AIS + la Meteorología (API que hicimos) de un barco.
  3. Gemini debe devolver un riesgo del 1 al 10 en base al viento y el calado del río.
  4. Si Gemini dice "Riesgo Alto", n8n dispara instantáneamente una notificación Push al celular del capitán usando la conexión FCM creada en el Frente 1. (El famoso Círculo Cerrado).

### 2-B. Webhooks de Cierre Operativo
- **Misión:** Si el capital pulsa "Mantenimiento Resuelto" en la app y sube la foto de las herramientas limpias, un Webhook le avisa a n8n para que mande el PDF de "Ok de Salida" por email al puerto de destino.

---

## 🚀 CÓMO REACTIVAR ESTE PROTOCOLO

Para invocar todo este esquema en la próxima sesión, el Comandante debe escribir cualquiera de estas frases:

> *"Continuar"*
> *"Inicia la app móvil final"*
> *"Usa tu skill **appmovilfinal** y avanza"*

El agente leerá este `SKILL.md` e inmediatamente:
1. Levantará el Emulador Android.
2. Irá directo al código de Flutter a atacar la Cámara.
3. Informará "Sistemas en Verde" y pedirá luz verde para codificar la primera vista.
