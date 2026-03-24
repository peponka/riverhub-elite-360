---
name: App Movil Perfecta (Final y Sin Errores)
description: Registro de todos mis errores de terminal y Base de Datos del 18 de Marzo. Paso final para exportar el APK perfecto de RiverHub Mobile para la demostración.
---

# 🚀 MASTER PLAN: App Móvil Perfecta (Fase Definitiva)

Este documento es el recordatorio definitivo para que **bajo ninguna circunstancia** yo (el Agente) vuelva a cometer los mismos errores o atascar la computadora del Comandante. Mañana se debe entregar la aplicación impecable y lista para demostración.

## ❌ Mis Errores (Lo que NO DEBO HACER NUNCA MÁS)

1. **Dejar colgados scripts de Node:** Ejecuté comandos `fetch` y `supabase` sin usar `process.exit(0)` en los bloques `finally`. Esto dejó conexiones de red abiertas en Windows, atascando la computadora durante más de una hora con comandos ocultos y errores nativos `async.c`.
2. **Ignorar las reglas de seguridad (RLS) de Supabase:** Me volví loco buscando por qué la ruta `/api/n8n/send-alert` del servidor no encontraba el FCM Token en la base de datos. Fue porque el servidor usa la `SUPABASE_ANON_KEY`, la cual **está bloqueada por RLS** y no puede leer la columna `fcm_token` de otros usuarios.
3. **Pelear con codificaciones de PowerShell:** Intenté hacer comandos complejos de `adb logcat | grep` y fallaron porque PowerShell redirecciona la salida de texto en formato `UTF-16LE`. Esto rompía la lectura de logs.
4. **Hacer que el usuario navegue en terminales cerradas:** Traté de explicar comandos de terminal en Android Studio cuando la interfaz visual de Supabase era la respuesta rápida y directa, generando más de 30 minutos de frustración innecesarios.

## ✅ Soluciones Ya Aplicadas en el Código

1. **Resolución total de MultiDex:** Tuve que modificar el archivo Android nativo (`app/build.gradle.kts`) inyectando `multiDexEnabled = true` y su librería `androidx.multidex` al final del archivo. **Esto es lo que solucionó el "error del APK último"** e hizo que la aplicación lograra compilar sin crashear al inicio.
2. **Disparo Firebase Comprobado:** Inyectamos el Token real en `test_push.js` y el celular vibró y mostró la notificación exitosamente. La comunicación Google-Android está 100% verificada.

## 🎯 OBJETIVO DE MAÑANA (El Pasillo Final)

* **Generación del APK Final:** No debemos tocar mucho más la configuración nativa. Compilaremos directamente `flutter build apk --release`.
* **Cero Scripts de Consola Fantasmas:** Si hay que testear la base de datos o el backend, se usará curl simple o se indicará desde la web directamente. No más `node -e`.
* **Parcheo del Servidor (Opcional pero recomendado):** Para que las automatizaciones de N8N funcionen sin que tú me copies el token a mano, mañana deberé arreglar el Backend de RiverHub inyectando la `SUPABASE_SERVICE_ROLE_KEY` o crear una función `SECURITY DEFINER` en SQL para que el backend pueda saltarse el RLS y leer los tokens de los celulares automáticamente.
* **Módulo Listo:** Limpiar cualquier consola de depuración y dejar un `.apk` impecable para instalar en cualquier teléfono y lucirlo en la reunión.

**PALABRA DE CÓDIGO:** A partir de ahora, si nombras la skill `appmovil_perfecta`, sabré exactamente cómo actuar.
