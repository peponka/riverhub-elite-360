---
name: Web Cleanup Mastery & RiverToast Integration
description: Instrucciones definitivas y registro de la Fase de Limpieza Web (Frontend). Erradicación de diálogos nativos (alert, confirm, prompt) a favor de RiverToast, optimización visual Dark Theme, y modernización interactiva de Tracking/Mapas.
---

# RiverHub Elite 360 - The Great Web Cleanup (Post-Mobile Launch)

Este Skill documenta la victoria final sobre las interfaces web obsoletas del portal. La regla fundamental a partir de Marzo de 2026 para cualquier código en el dashboard web es: **CERO NATIVO**.

## 1. La Ley del `RiverToast` (El fin de alert/confirm/prompt)
*Bajo ninguna circunstancia* se deben usar los comandos bloqueantes nativos del navegador. Arruinan la inmersión del tema oscuro y detienen el hilo de ejecución (UX pobre).

### Tabla de Reemplazos Obligatoria:

| Viejo Código (🚫 PROHIBIDO) | Nuevo Código (✅ ELITE 360) |
| :--- | :--- |
| `alert("Cambios guardados");` | `RiverToast.success("Cambios guardados exitosamente.", "Éxito");` |
| `alert("Error de red");` | `RiverToast.error("Error conectando con Supabase.", "Fallo de Red");` |
| `confirm("¿Desea borrar esto?");` | *Depende del flujo*. Si la acción es crítica y reversible, ejecuta el borrado directamente e informa con `RiverToast.warning("Borrando recurso...", "Removido", "fas fa-trash");` Si requiere cuidado extremo, crear un Modal HTML persnalizado. NUNCA usar `confirm()`. |
| `prompt("Ingrese valor:");` | Reemplazar por inputs en el DOM o autogeneración (ej: `Math.random()` para IDs) seguidos de un `RiverToast.info("ID auto-generado: " + id, "Sistema");` |

### Parámetros de RiverToast:
`RiverToast.método(mensaje, tituloOpcional, iconoFasOpcional)`
- Métodos disponibles: `.success`, `.error`, `.warning`, `.info`

---

## 2. Interactividad Viva (Mapas y Tracking)

Durante la limpieza, descubrimos que existía código CSS/HTML "maqueta" que aparentaba funcionar pero no lo hacía.

**A. Filtros de Búsqueda Activos (Search Bars)**
Ya no basta con poner el `<input placeholder="Buscar...">`. 
Si existe una barra de búsqueda, **debe** filtrar elementos del DOM usando un `input.addEventListener('input', ...)` interconectado a la lista (como se hizo en `tracking.js` y `mapa.js`). 
- Ejemplo de implementación limpia: Convertir la entrada a `.toLowerCase()`, iterar cartas/divs `.shipment-card` e impactar su `style.display = 'none' | ''`.

**B. Feedback Real en Interacciones Complejas (Botones Virtuales)**
Para funciones que aparentan accionar maquinaria (ej: Generar PDFs firmados digitalmente, inicializar Inteligencia Artificial), se inyectó `RiverToast`.
*Ejemplo:* Al hacer click en `NEURAL_BRIDGE` (mapa.js), el usuario experimenta una notificación: *"Inicializando conexión con Neural_Bridge (Gemini IA). Analizando entorno..."*

---

## 3. Interfaces de Administración y Backoffice

Se revisaron y purgaron los módulos administrativos de más alto rango:
- `commercial.js` (Órdenes de Servicio)
- `backoffice.js` (Panel General)
- `admin-cliente.js` (Suscripciones, Roles de Tenants)
- `admin-dashboard.js` (Vista de Facturación y Acceso Global)

**Regla de Oro en Dashboards:** Si vas a suspender a un usuario, no uses ventanas emergentes que frenen la web. Simplemente cambia el estado en base de datos, repinta la tarjeta roja (`#ef4444`) y lanza un `RiverToast.info("Cliente suspendido", "Backoffice", "fas fa-ban");`.

*Si alguien en el futuro reporta que el "Navegador se bloquea al hacer click", busca un `alert` o `confirm` perdido.*

---
**Fecha de Certificación:** 17 de Marzo de 2026.
**Estado Operativo:** Frontend Limpio, Consistente, Elite.
