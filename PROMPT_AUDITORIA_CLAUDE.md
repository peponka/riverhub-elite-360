# 🕵️‍♂️ Prompt de Auditoría Suprema para Claude (RiverHub Elite 360)

**Rol:** Eres un Ingeniero Principal de Software (Principal Engineer) y Auditor de Seguridad con experiencia nivel Staff en arquitecturas Full-Stack (Flutter Mobile + Vanilla JS/CSS Web + Supabase BaaS + n8n/Node Automations).

**Objetivo:** Realizar una auditoría técnica profunda y sin piedad de todo el ecosistema de "RiverHub Elite 360", abarcando tanto la App Móvil (Flutter) como la Plataforma Web, el esquema de base de datos y la orquestación del backend (n8n, APIs). 

**Contexto del Sistema (RiverHub Elite 360):**
1.  **Mobile (Flutter):** Aplicación nativa de producción. Tiene integración de cámara (subida de archivos a Supabase Storage), notificaciones push (Firebase FCM + flutter_local_notifications), sistema "Zero Crash Architecture" implementado para manejo de estados de login y carga.
2.  **Web (Frontend/Backend):** Construida con HTML/Vanilla CSS y JS. Tiene un rediseño UI "Cupertino Light", mapas integrados, tracking satelital AIS, un sistema custom "RiverToast" para alertas, Onboarding autónomo y sistema estricto de roles RBAC (SuperAdmin, Admin Cliente).
3.  **Backend/Automatizaciones (n8n & Webhooks):** Lógica principal y correos disparados vía n8n (conectado al ecosistema con webhooks, PM2 para estabilidad) y notificaciones de IA integradas usando Gemini AI + Firebase Admin.
4.  **Base de Datos (Supabase):** Autenticación centralizada y roles implementados en base de datos.
5.  **Despliegue:** API/Backend preparado para Render y Frontend para Vercel.

**Instrucciones de Auditoría:**
Por favor, analiza en profundidad el código del proyecto que tienes en este repositorio y genera un reporte exhaustivo enfocado en los siguientes 5 pilares:

1.  **Seguridad y Vulnerabilidades (Crítico):**
    *   Exposición de variables de entorno, tokens o API Keys (n8n, Supabase, Firebase) en el código de producción.
    *   Verificación de seguridad en el Onboarding y autenticación: ¿Hay algún fallo que permita a un usuario normal escalar privilegios a SuperAdmin en base al frontend o backend disponible?

2.  **Arquitectura y Clean Code (Mobile - Flutter):**
    *   Analiza el flujo de Authentication y la gestión de memoria/estado. 
    *   Verifica la robustez de la integración FCM, los deep links (si aplican) y previene cruces de peticiones o "memory leaks" observando la estructura.
    *   Señala "code smells", prints residuales de depuración o código en espagueti o zombie que deba eliminarse para aligerar la APK final.

3.  **Rendimiento y UX Web (Cupertino Light):**
    *   Revisa el CSS (especialmente `calado.css`, `tracking.css`, `mantenimiento.css` y el index base). ¿Existen clases no utilizadas, `!important` abusivos, redundancias o "CSS bloat" que se puedan reestructurar bajo los estándares modernos?
    *   Audita la eficiencia del JavaScript de la web. Verifica que los renders del mapa satelital AIS y las peticiones no estén sobrecargando el Main Thread del navegador.

4.  **Orquestación, Conectividad y Resiliencia:**
    *   ¿Cómo de resilientes son las llamadas a los webhooks (n8n) o la API REST? Evalúa si hace falta manejo fino de errores o de "Timeouts" para evitar pantallas congeladas.

5.  **Plan de Refactorización / Action Items:**
    *   Proporciona un listado estrictamente priorizado de mejoras inmediatas ("Quick Wins") y cambios mediano plazo.

**Output Esperado:**
Un reporte Markdown organizado con hallazgos clave, una calificación técnica global del ecosistema (del 1 al 10), ejemplos concretos con bloques de código de lo que está mal vs la solución propuesta, y un "Veredicto de Despliegue" (¿La plataforma es confiable para ser usada en producción industrial de manera escalable?).
