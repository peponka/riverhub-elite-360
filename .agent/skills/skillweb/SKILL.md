---
name: RiverHub Web Module Review & Enhancements (Elite 360)
description: Guía de los próximos pasos para revisar los módulos de la aplicación web RiverHub Elite 360, arreglar botones faltantes, completar funcionalidades y mejorar interfaces. Creado post-fase de notificaciones n8n/Firebase y App Móvil.
---

# RiverHub - Revisión de Módulos Web (Elite 360)

## Contexto y Estado Actual (14 Marzo 2026 - Sprint Final)
1. **App Móvil (Flutter):** Hemos finalizado con un 95% de éxito la construcción de la app, su sistema interactivo y la integración (sin caídas ni crasheos) a Supabase y N8N Firebase FCM. El login está sellado al nivel de "The Vault".
2. **n8n + Gemini IA + Firebase Push:** La notificación por webhook funciona directamente de forma bidireccional.
3. **AIS Stream:** Mapa y seguimiento de Flota en vivo asomando por completo la información hacia el cliente (IA).

## TAREA MAESTRA "Operación Limpieza Web" (El último 15%)
El usuario ha dictaminado que la App Móvil y N8N están en Pausa / Congeladas. La orden directiva **MÁS IMPORTANTE** al volver a conectarse es realizar la finalización web ("Web Cleanup") pantalla por pantalla para tener la plataforma en un 100% de presentación "Elite". 

### Tareas Exigidas para el SPRINT AL VOLVER:
1. **Revisión Quirúrgica de Botones e Iconos Sin Nombre:**
   Ningún botón en RiverHub Elite 360 puede quedar como "solo un icono". Absolutamente todos los botones en todos los módulos (`Calados`, `Incidentes`, `Pañol`, `Cotizador`, `Tripulación`) DEBEN poseer:
   - Texto explícito al lado del icono o
   - Un `Tooltip` claro al pasar el mouse.
2. **Erradicación de "Placeholders":**
   Revisar cualquier modal, diálogo, cuadro de texto falso o botón que muestre "Próximamente" (Ej: ver manifiestos, adjuntar comprobante) y CREAR su funcionalidad correspondiente real (que guarde o lea en Supabase).
3. **Formularios como la App:**
   Los formularios internos y el diseño de la plataforma Web deben reflejar e invocar las mismas columnas que el móvil. Asegurar fluidez visual (Cupertino/Glassmorphism Elite) en las tablas de `admin-dashboard`.
4. **Subida al Servidor Final:**
   Una vez que el usuario declare terminados al 100% los módulos revisados durante el *Cleanup*, la orden final será subirlos/desplegarlos y asegurar que todo persista.

### 📝 Cómo debe comportarse el Agente "Antigravity"
1. Entrar sin preguntar cosas de la App (porque ya está culminada).
2. Preguntar: "¿Qué módulo web limpiamos y perfeccionamos hoy para la presentación?".
3. Modificar `CSS` y `JS` por módulo individual (haciendo uso del "Clean Code" puro, sin romper otros).
4. Informar finalización del Módulo X y pasar al Módulo Y, hasta que el usuario determine el despliegue al Servidor.
