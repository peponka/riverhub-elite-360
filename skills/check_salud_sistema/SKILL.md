---
name: check_salud_sistema
description: Realiza un chequeo rápido del estado de los archivos vitales y la configuración de RiverHub.
---

# Skill: Chequeo de Salud del Sistema (RiverHub System Health)

Esta habilidad permite a Antigravity verificar rápidamente que el entorno de desarrollo esté sano y listo para operar.

## Pasos de Ejecución

1.  **Verificar Estructura de Directorios:**
    *   Comprobar que existan las carpetas críticas: `public`, `public/js`, `public/css`, `public/imaganes`.
    *   Verificar existencia de `config.json`.

2.  **Verificar Archivos Críticos de Lógica:**
    *   `public/js/app.js` (Core)
    *   `public/js/services/supabase.js` (Conexión DB)
    *   `public/js/modules/auth.js` (Seguridad)
    *   `public/js/modules/tripulacion.js` (Módulo Crítico)

3.  **Verificar Configuración de Entorno:**
    *   Leer `config.json` y verificar si las API Keys (OpenAI, AIS) están vacías o configuradas.
    *   Advertir si falta alguna key importante.

4.  **Reporte Final:**
    *   Generar un resumen en Markdown indicando: "🟢 SANO" o "🔴 ATENCIÓN" para cada punto.
