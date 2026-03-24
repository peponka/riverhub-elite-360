---
name: n8n Email Workflow Manual Setup
description: Instrucciones manuales para probar el flujo de correos a n8n sin colgar la terminal.
---

# Estado Actual (16 de Marzo 2026)

1. **n8n ya está corriendo** perfectamente en el navegador. Las credenciales SMTP están configuradas y no hay errores (triángulos rojos).
2. **El Servidor RiverHub (backend) está APAGADO**. Cada vez que intento encenderlo con un comando automático, tu editor cancela la acción y nos congelamos.

# QUÉ DEBES HACER MANUALMENTE EN ESTE INSTANTE

Por favor, no me pidas que envíe comandos. Haz lo siguiente tú mismo con el teclado y el mouse:

1. **Abre una terminal nueva** en tu Visual Studio Code (el símbolo `+` en la zona de terminales abajo a la derecha).
2. En esa terminal, escribe:
   `node app.js`
   y presiona **Enter**.
   *(Debería decirte que el servidor se inició en el puerto 3000 o 3003).*
3. Ve a tu navegador y entra a tu propia página: `http://localhost:3000` (o `3003` si fue ese).
4. Dale clic al botón de **"Registrar Mi Empresa"**.
5. Completa el formulario con tu correo electrónico real (`pepeq68@gmail.com`) y confirma.
6. ¡Inmediatamente después, vuelve a la pestaña de n8n! Verás que entran los datos y te llegará el correo a tu cuenta de Gmail.

# Qué debes decirme cuando reinicies el chat

Abre un chat nuevo y pégame exclusivamente esto:

> "Hola, leé el skill 'n8n Email Workflow Setup'. Ya prendí 'node app.js' manualmente a mano, probé registrar una empresa en mi web, y vi cómo n8n recibía el webhook en verde y me mandaba el correo. Ya está confirmado que los correos funcionan perfecto. Sigamos con el próximo paso del proyecto."
