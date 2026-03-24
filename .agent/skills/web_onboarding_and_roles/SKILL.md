---
name: Web Onboarding, Roles & n8n Email Prep
description: Progreso del 16 de Marzo 2026. Desarrollo de Landing Page, Onboarding autónomo conectado a Supabase, RBAC (Sistema de Roles) real, y preparación de Webhooks para n8n.
---

# Resumen de lo logrado hoy (16 de Marzo)
El módulo web RiverHub Elite 360 ha pasado de ser un sistema cerrado a un SaaS comercial funcional.

1. **Landing Page y Onboarding (`public/index.html`):**
   - Se creó una web de marketing premium.
   - El formulario "Registrar Mi Empresa" interactúa directamente con Supabase Auth.
   - Crea el usuario, le asigna el rol `admin` en la tabla `profiles` y lo loguea automáticamente, llevándolo a la pasarela de pagos.

2. **Pasarela de Pago Simulada (`billing.js`):**
   - Integrada dentro de la "Consola del Admin".
   - Flujo de suscripción con Tarjeta/Transferencia que inyecta en la tabla `payments`.

3. **Sistema RBAC (Roles de Seguridad en `auth.js`):**
   - `superadmin`: Ve todo (incluido Backoffice Master).
   - `admin`: Ve su empresa y la facturación, pero no el panel global.
   - `operator`: (Capitanes/Armadores). Tienen bloqueada la visibilidad de facturación, bases de datos y consolas de pago.
   - `viewer`: Accesos hiper-restringidos (solo mapas e hidrología).

4. **Webhooks para n8n:**
   - La plataforma web ahora dispara alertas silenciosas a la API de n8n (vía `/api/n8n/webhook`) cuando:
     - Una empresa nueva se registra (`NEW_COMPANY_REGISTRATION`).
     - Se paga una suscripción (`PAYMENT_COMPLETED`).

# Problema Actual Limitante
Al intentar configurar los emails, descubrimos que el servidor local de **n8n estaba apagado/congelado** (Error `ERR_CONNECTION_REFUSED` en el puerto 5678). Los comandos para levantarlo por terminal estaban tardando o fallando.

# Siguiente Paso a Ejecutar
Cuando el usuario regrese, la prioridad es encender n8n y armar el flujo de correos automáticos.

**Para el Agente:** 
Lee este documento y prepara los comandos para reiniciar/revisar el estado de n8n, preferiblemente usando `pm2` si está disponible, o ejecutando `node start-n8n.js`. Luego, guía al usuario para importar el flujo JSON de correos de bienvenida en la interfaz de n8n.
