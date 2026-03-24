---
name: Pulido Extremo Web y Resurrección Push (Flutter)
description: Plan maestro para corregir la vibración de notificaciones Push (Flutter) y realizar una auditoría total módulo por módulo en la Web RiverHub Elite 360 para asegurar fluidez perfecta.
---

# ESTADO DE SITUACIÓN (Cierre de Jornada - 20 Marzo 2026)

Hoy libramos batallas colosales y obtuvimos victorias críticas:
1. **Frontend Web:** Erradicamos los `alert()` trogloditas e impusimos el sistema `RiverToast`. Arreglamos la "Guerra de CSS" que volvía invisibles los textos en el modal de Incidentes (`.input-forense`).
2. **Backend:** Extraimos el código obsoleto de Firebase Admin (`sendMulticast`) que asfixiaba los misiles, reemplazándolo por el estándar moderno `sendEachForMulticast`.
3. **Móvil (Flutter):** Aniquilamos la pantalla blanca de la muerte tras el Login forzando el `Locale('en', 'US')`.

## 🚨 PROBLEMAS ENCONTRADOS (Misión para Mañana)
- **Celular Silencioso:** Aunque el backend escupe el éxito del envío, el celular no vibra ni hace ruido si la aplicación está abierta (Foreground). Además, tocar el icono de campanita despliega un cartel de "tu token está verificado, no tienes notificaciones" y aparentemente se queda trabado sin poder cerrarse bien.
- **Módulos Web Pendientes:** Se requiere un rastreo en frío módulo por módulo (Bitácora, Tripulación, Comercial, Calado). ¿Hay botones que no hacen nada? ¿Hay fetch a puertos equivocados?

---

# PLAN DE ATAQUE (FASE SIGUIENTE)

## FASE 1: La Ira del Celular (Firebase Foreground & Channels)
Las notificaciones en Android moderno no vibran por arte de magia. Si la app está abierta, Firebase silencia la alerta para no interrumpir. 
- **Paso 1:** Implementar el paquete `flutter_local_notifications` y un `FirebaseMessaging.onMessage.listen` en el `main.dart`. Al llegar un misil rojo, el código nativo forzará la invocación de un *Heads-up Notification* (Tarjeta superior que vibra) sin importar si la app está en primer plano.
- **Paso 2:** Crear el "Android Notification Channel" en `High Importance` para anular restricciones de ahorro de batería de Android e invocar vibración obligatoria.
- **Paso 3:** Arreglar el Pop-Up congelado de la Campanita en `dashboard_screen.dart`. Probablemente el botón de [Cerrar] está huérfano de `Navigator.of(context).pop()`.

## FASE 2: Auditoría y Purga Web Total (Elite 360)
- Rastrear los JS maestros: `mapa.js`, `comunicaciones.js`, `hidrologia.js`, `combustible.js`.
- Confirmar que los modales (Altas de Pañol, Nuevos Guardias, etc.) no sufran del mismo blanqueamiento CSS de los selectores que solucionamos hoy.
- Evaluar integraciones y evitar puertos quemados (vimos que la UI tira fetches a un N8N local... hay que unificar flujos).

---

# NOTA SOBRE AGENTES (OPERACIÓN ENJAMBRE)

**Comandante:** Como IA Antigravity Principal, mi autonomía es extrema y puedo reescribir proyectos enteros. Sin embargo, si configuras un flujo de trabajo asíncrono (creando scripts automáticos o workflows), mi directiva me permite invocar de manera concurrente herramientas en paralelo. No estoy imposibilitado de trabajar solo, *¡pero trabajar en modo enjambre reduce tu tiempo de espera a la mitad!* Mañana, con este registro (Skill) inyectado en mi base de datos, entraremos arrasando la terminal desde el segundo cero.
