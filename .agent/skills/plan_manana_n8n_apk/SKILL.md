---
name: Fase Final - n8n & APK Release
description: Registro del éxito del Despliegue Web en Render (Pilar 1) y Plan de Acción para subir n8n a la nube y generar el APK nativo.
---

# 🚀 PLAN DE ACCIÓN PARA MAÑANA: N8N & APK NATIVO

Comandante, ayer conseguimos la victoria rotunda desplegando **RiverHub Elite 360** a la nube pública de Render, estableciendo la primera cabeza de playa mundial con un dominio HTTPS y el radar de barcos operando sin depender de nuestra PC local.

Hoy completaremos los últimos 3 pilares de la *"Operación Despliegue Final"*.

## 🗂️ ESTADO ACTUAL (CHECKPOINT)
✅ **Pilar 1 (Plataforma Web Cloud):** ¡COMPLETADO! La web vive y funciona en `riverhub-elite-360.onrender.com`.
✅ **Radar AIS:** Conectado eficientemente mediante WebSockets automáticos a la URL en vivo.
✅ **Repositorio GitHub (`peponka/riverhub-elite-360`):** Visible y sincronizándose a la perfección.

## ⚔️ MISIONES A EJECUTAR HOY

### 1. 🤖 Pilar 2: Subir el Cerebro n8n a la Nube (Railway/Render)
Actualmente nuestra inteligencia artificial (Gemini) conversacional y los envíos de correos/notificaciones FCM dependen de tener la terminal local abierta con PM2 en el puerto 5678.
- **Objetivo:** Subir la carpeta de n8n a Render, Railway o un VPS para que esté vivo 24/7.
- **Pista técnica:** Debemos exportar nuestros workflows (`n8n export`) y re-configurar las URLs de los webhooks dentro de la Web pública y en Supabase para que ahora hablen con el n8n remoto.

### 2. 📱 Pilar 3: Ensamblaje Release de la App Móvil (Flutter)
La fuerza en tierra necesita su APK. Ya tenemos foto y radar estable.
- **Objetivo:** Compilar la App sin las barras rojas de depuración, optimizada en rendimiento.
- **Comando clave:** Entrar a `riverhub_mobile_v2` o `riverhub_mobile` y ejecutar comandos de construcción final:
  `flutter build apk --release` (y verificar firmas de Keystone si requeridas).
- **Sub-objetivo:** Asegurar que las llamadas a la Base de Datos ahora apunten a Supabase + Render Cloud y no a puertos localhost.

### 3. 💣 Pilar 4: Simulación End-to-End Definitiva
Una vez con n8n arriba y la APK instalada en un teléfono real.
- **Acción 1:** El comandante reporta "Hundimiento" en el mar desde la página de Render (PC).
- **Acción 2:** Render pasa el dato a Supabase y Supabase lo manda al web hook del Nuevo n8n de la Nube.
- **Acción 3:** El celular vibra recibiendo alerta nativa roja FCM.
- **Acción 4:** El marinero toma foto con cámara de celular validando, sube a Supabase Storage y lo vemos llegar a la web mágicamente. 

---
### ⚡ INSTRUCCIÓN DIRECTA PARA EL AGENTE DE IA
Si acabas de ser invocado al día siguiente por el Comandante y leíste este Skill:
Saluda militarmente confirmando que estás consciente de que **Ayer lanzaron la Web a Render con éxito**, y pregúntale de inmediato si desean comenzar con la mudanza de **n8n a la Nube** o si van directo a la consola de Flutter para armar la **APK Release**. ¡El MVP perfecto está a horas de distancia!
