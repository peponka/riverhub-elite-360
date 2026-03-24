---
name: n8n AI Analysis & Firebase FCM Integration
description: Documentación de la integración del Cerebro IA (Gemini) y las Notificaciones Push Nativas (FCM) a través de Firebase Admin conectados a la API de automatizaciones de RiverHub.
---

# RiverHub - Automatización Avanzada (IA + FCM Push)

Esta skill documenta la segunda fase de integraciones de automatización donde incorporamos Inteligencia Artificial Generativa y la capacidad de disparar notificaciones push nativas a la flota (Flutter) directamente desde el backend, controlable vía n8n.

## 1. El Cerebro Gemelo (Inteligencia Artificial Gemini)

Se integró `@google/genai` para procesar en masa los reportes de anomalías AIS y generar resúmenes ejecutivos directamente en el backend de node.js.

### Endpoint Creado:
**Ruta:** `GET /api/n8n/ai-analysis`  
**Autenticación:** Header `x-api-key: riverhub_n8n_2026`

**Funcionamiento Técnico:**
1. El endpoint extrae los datos combinados de:
   - Estado de tanques y estatus de toda la flota (`fleet_assets` en Supabase).
   - Coordenadas y velocidad en vivo provenientes de la antena (Memoria RAM del Backend AIS).
2. Se inyecta la información estructurada en un "System Prompt" diseñado para logística fluvial.
3. El modelo `gemini-2.5-flash` genera un resumen de la situación y formatea una respuesta alertando sobre valores bajos de combustible y demoras críticas.
4. Retorna el objeto `{"executive_summary": "..."}` para que n8n pueda parsearlo fácilmente y empujarlo hacia un Email, Slack o Telegram.

### Cómo consumirlo desde n8n:
- **Nodo HTTP Request.**
- **URL:** `http://127.0.0.1:3000/api/n8n/ai-analysis`
- **Authentication:** Añadir parámetro `Header` con nombre `x-api-key` y valor `riverhub_n8n_2026`.
- *Resultado:* El output del nodo proveerá el string del análisis listo para re-transmitir.

---

## 2. Emisor Nativo de Alertas Push (Firebase Cloud Messaging - Admin SDK)

Para evitar pagar costos de SMS o depender exclusivamente de Telegram, se integró el motor nativo de de Google Firebase para inyectar notificaciones directamente en los celulares de los tripulantes/capitanes que tienen la App Mobile (RiverHub Flutter).

Se instaló el paquete `firebase-admin` en nuestro backend express.

### ¿Cómo Funciona el Emisor Automático?
1. En `routes/n8n-automations.js`, el servicio busca el archivo de llaves maestras en formato JSON provisto por Firebase (`google-services.json`).
2. Se modificó sustancialmente el endpoint `POST /api/n8n/send-alert`.
3. Al recibir una llamada POST de n8n indicando una alerta o emergencia climática, el endpoint:
   - Consulta velozmente en la base de datos `profiles` de Supabase todos los `fcm_token` válidos (Tokens únicos por dispositivo que recolecta el Login Screen en Flutter).
   - Empaqueta el título y mensaje.
   - Envía el paquete usando `admin.messaging().sendMulticast(message)`.
4. Todos los teléfonos de la flota de RiverHub vibrarán automáticamente recibiendo el aviso (sea de bajante crítica, accidente, etc.).

### Prevención de Crasheos
Se implementó un try-catch envolviendo la inicialización de Firebase Admin. Si la llave `google-services.json` no existe en la ruta del servidor porque estamos en ambiente de desarrollo, la API imprime un Warning (`⚠️ No se encontró google-services.json para FCM`) pero **no genera un crash loop**, permitiendo que todos los demás módulos de RiverHub sigan online sin verse afectados.

---

## 3. Comandos Esenciales de Control (PM2)
Con estos avances, tanto RiverHub como n8n quedaron convertidos en Daemons, procesos controlados en segundo plano que se auto-recuperan de fallas.

```bash
# Ver el panel de monitorización
npx pm2 status

# Reiniciar la API (Necesario después de cambios de código en Node)
npx pm2 restart riverhub

# Ver los logs en vivo (Útil para revisar si Firebase tiró error)
npx pm2 logs riverhub
```
