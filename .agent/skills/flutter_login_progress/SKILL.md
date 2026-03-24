---
name: Flutter Login Progress & Recovery
description: Instrucciones para recuperar el entorno de Flutter cuando se congela por un lock y progreso del Login Screen del proyecto RiverHub Mobile.
---

# Estado Actual del Login en Flutter y Pruebas Push (Para continuar)

## 📌 El Problema Principal (Crasheo Crítico)
La aplicación `riverhub_mobile_v2` está presentando los siguientes comportamientos anómalos:
1. **Bypass del Login:** La app entra de forma directa al panel principal o dashboard evadiendo la pantalla de login.
2. **Crash al Intentar Loguearse:** Si el usuario, estando adentro, navega al Perfil, le da a "Cerrar Sesión", e intenta ingresar limpiamente sus credenciales en la pantalla de Login, la aplicación sufre un **Fatal Native Crash** y se cierra forzosamente mostrando un error del sistema Android.

## 🎯 Objetivos Inmediatos (Primera acción de la siguiente sesión)
1. **Forzar la pantalla de Login:** Asegurarnos de que la aplicación SIEMPRE pida iniciar sesión.
2. **Solucionar el Crash:** Analizar en profundidad por qué se está colgando tras apretar "Iniciar Sesión".
3. **Disparar Notificación N8N (La Meta Final):** Una vez que el Login deje de crashear y guarde el Token en Supabase, debemos correr el test en n8n y corroborar que el celular vibre con el mensaje Push.

## 🔑 Comando Clave para iniciar la próxima sesión
Mañana, apenas empieces, dime esto:
> **"abre y lee tu skill Flutter Login Progress & Recovery. Empieza a solucionar el problema del crash en el login para que me pida iniciar sesión siempre y no se rompa."**

## 🛠 Historial Técnico Reciente
- Se modificó el `pubspec.yaml` para reconectar Firebase `firebase_core` y `firebase_messaging`.
- Se introdujo un `google-services.json` nuevo modificando el `package_name` a `com.example.riverhub_mobile_v2` .
- Las llamadas a `FirebaseMessaging.instance.getToken()` fueron activadas pero crashean en el logueo real.
