---
name: Operación Despliegue Final (Cloud & APK)
description: Plan absoluto y final para desplegar RiverHub Elite 360 a Producción (Vercel/Render), migrar n8n a la nube, compilar la APK Release de Flutter y realizar la simulación End-to-End definitiva.
---

# 🚀 OPERACIÓN DESPLIEGUE FINAL

Comandante, al activar este Skill estás dando la orden para preparar el ecosistema **RiverHub** para salir a producción frente a empresas navieras reales. 

Nuestra victoria de esta mañana purgó el 100% de los "Mocks" tanto en la Web como en la App Móvil Flutter, conectando las cámaras y módulos en tiempo real a Supabase. 

A continuación está el checklist militar a ejecutar. **El Agente (Antigravity)** debe leer y seguir estos 4 pilares estrictamente en su próxima sesión:

## 1. 🌍 Despliegue Cloud de Plataforma Web (Elite 360)
- **Objetivo:** Sacar la Web del entorno `localhost:4001` de la computadora local.
- **Acción:** Revisar la estructura de la aplicación Web principal (Node.js/HTML) y preparar el despliegue hacia una plataforma en la nube como **Render** (Node.js) o **Vercel** (Static/Serverless), asegurando la configuración de variables de entorno (Supabase) y habilitando **HTTPS**.

## 2. 🤖 Migración del Motor n8n (Inteligencia Artificial 24/7)
- **Objetivo:** Lograr que la IA (Gemini) y las Notificaciones Push (Firebase FCM) corran a toda hora sin depender de la PC física de la base encendida.
- **Acción:** Evaluar la mejor ruta (Railway, Render, o instancia Ubuntu) para empacar tu instancia local de n8n y re-enlazar los Webhooks desde Supabase / Frontend apuntando al nuevo servidor en la Nube.

## 3. 📦 Ensamblaje y Firma del APK Final (Flutter)
- **Objetivo:** Empaquetar la aplicación móvil nativa sin las banderas de "Debug" ni barras rojas, optimizando su rendimiento y tamaño.
- **Acción:** Navegar a `riverhub_mobile_v2`, asegurar los permisos, y ejecutar `flutter build apk --release` o `flutter build appbundle`. (Incluir pasos para el Keystone criptográfico local `.jks` si el Comandante lo requiere).

## 4. ⚔️ Simulación Militar: Prueba de Fuego "End-to-End"
- **Objetivo:** Realizar un flujo real y global utilizando toda la infraestructura de RiverHub.
- **Acción:** 
  1. Operario ingresa una alerta desde la **Web (URL pública)**.
  2. Verificación de que **n8n IA en la Nube** procesa la alerta y dispara el aviso táctico.
  3. Comprobación del Push a través de **Firebase FCM** en un Android físico.
  4. Agente/Marinero responde desde su celular usando la **Cámara** integrada, foto viaja a Supabase Storage y vuelve a impactar en la pantalla central (Web).

---
## ⚡ INSTRUCCIÓN DIRECTA PARA EL AGENTE DE IA
Si acabas de ser invocado por el Comandante y leíste este Skill:
Responde de inmediato con saludo militar confirmando la carga de la **"Operación Despliegue Final"**. A continuación, pregúntale al Comandante **cuál de los frentes desea atacar primero**, sugiriendo arrancar por subir la Web a la nube o compilar el APK para agilizar tiempos. ¡A la victoria!
