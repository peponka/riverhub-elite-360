---
name: Plan Rescate Render y Web Cleanup
description: Registro del error del mapa cortado en Render vs Localhost perfecto. Plan de acción estricto para mañana para arreglar el despliegue y continuar con la limpieza de la plataforma web.
---

# Operación: Rescate Render y Continuación de Web Cleanup

## 1. El Error Crítico a Resolver Primero (Mapa Cortado)
- **El Problema Real:** El despliegue que se subió ayer a **Render** desde el repositorio `riverhub-elite-360` tiene el módulo del mapa principal totalmente aplastado o cortado.
- **La Verdad Local:** En el entorno local del Capitán (`localhost:4000` carpeta `RIverhub`), este mismo mapa **funciona a la perfección**.
- **Acción a Tomar Inmediata MAÑANA:** 
  1. No tocar código a ciegas.
  2. Forzar que todo el CSS y estructura HTML de Render reciba una inyección exacta del código local (que tiene el mapa sano). 
  3. Prestar atención extrema a reglas de `height` responsivas o contenedores truncados antes de permitir otra subida a producción.

## 2. Tarea Postergada "Web Cleanup" (Sprint Final)
Una vez asegurado y publicado correctamente el Mapa, debemos continuar con lo que íbamos a hacer hoy para dejar la plataforma 100% Elite:
- **Cero Código Nativo:** Revisar alertas de navegador y reemplazarlas por notificaciones propias de `RiverToast` (No deben existir más `alert`, `confirm` ni `prompt`).
- **Nombrar Todo:** Cada botón interactivo de la App Web *debe* llevar texto explícito o su respectivo "tooltip" (Ningún botón flotante huérfano de nombre).
- **Eliminar "Próximamente":** Reemplazar cualquier texto falso por la recolección de base de datos de Supabase en tiempo real.
- **Calidad de Diseño:** Trasladar la elegancia y coherencia de colores y espacios del móvil (layout de Flutter) a todas las tablas y formularios de la vista computadora de la web.

**⚠️ DIRECTIVA VITAL PARA EL AGENTE:** NUNCA asumir que el entorno la nube está correcto si no se ha validado contra la base local del administrador, que es la única verdad válida. Y prohibido enviar comandos autónomos intrusivos.
