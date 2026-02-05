---
description: Guía para restaurar y mantener el módulo de Gestión de Flota (Elite 360) usando el método de aislamiento "Nuclear".
---

# Gestión de Flota - Restauración "Nuclear" (Elite 360)

Este skill documenta el proceso exacto para garantizar que el módulo de Gestión de Flota se visualice correctamente, evitando conflictos con el sistema legado (`global.js`, particulas, `admin.js`, etc.).

## 1. El Problema Común
El sistema antiguo tiene scripts que fuerzan `style="display:none"` en las vistas o inyectan contenido que rompe el diseño. Si ves una pantalla negra o el menú no responde, usa esta solución.

## 2. La Solución: Aislamiento Total

### A. Estructura HTML Única
No uses el ID `view-admin`. Ese ID está "quemado" en el código viejo. Usa un ID único y nuevo:
**ID:** `view-fleet-unique`

### B. CSS de "Fuerza Bruta"
El contenedor debe tener estilos inline (o en un bloque `<style>` interno) que fuercen su visualización por encima de todo:

```css
#view-fleet-unique {
    display: none; /* Se activa con JS */
    position: fixed;
    top: 0;
    left: 260px; /* Ancho del sidebar */
    right: 0;
    bottom: 0;
    z-index: 99999; /* Por encima de cualquier modal o error */
    background-color: #060b10 !important;
    overflow-y: auto;
}

/* RESPONSIVE MÓVIL (CRÍTICO) */
@media (max-width: 768px) {
    #view-fleet-unique {
        left: 0 !important;
        padding: 15px !important;
    }
}
```

### C. Navegación Independiente
El botón del menú **NO** debe depender de `global.js`. Debe tener su propio `onclick` directo:

```html
<a href="#" id="nav-fleet-reboot" onclick="
    event.preventDefault();
    event.stopPropagation();
    // 1. Ocultar todo lo demás
    document.querySelectorAll('.view-section').forEach(el => el.style.display='none');
    // 2. FORZAR mostrar nuestra vista
    const v = document.getElementById('view-fleet-unique');
    v.style.display='block';
    v.style.opacity='1';
    v.style.visibility='visible';
    // 3. Activar menú
    document.querySelectorAll('.menu a').forEach(a => a.classList.remove('active'));
    this.classList.add('active');
    return false;
">
    <i class="fas fa-ship"></i> Gestión de Flota
</a>
```

## 3. Lista de Verificación de Recuperación
Si el módulo falla de nuevo:
1. [ ] Verificar que el ID sea `view-fleet-unique`.
2. [ ] Verificar que el botón del menú apunte a ese ID.
3. [ ] Confirmar que el `z-index` sea 99999.
4. [ ] Revisar que la etiqueta `<style>` dentro del div esté bien cerrada.
