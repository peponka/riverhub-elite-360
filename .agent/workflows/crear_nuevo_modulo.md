---
description: Crear un Nuevo Módulo desde Cero (Guía Maestra)
---

# Pasos para Crear un Nuevo Módulo (Ej. "Modulo X")

Sigue estos pasos estrictamente para garantizar que el nuevo módulo funcione y se vea perfecto en Elite 360.

1.  **Definir Estructura HTML (`app.html`)**:
    *   Busca el contenedor principal `<div class="container">` y añade una nueva sección oculta:
    ```html
    <div id="view-modulo-x" class="view-section" style="display:none;">
        <div class="modulo-x-container">
            <!-- Header -->
            <div class="modulo-x-header">
                <h2>TITULO DEL MODULO</h2>
            </div>
            <!-- Body -->
            <div class="modulo-x-grid">
                <!-- Paneles aquí -->
            </div>
        </div>
    </div>
    ```

2.  **Crear Estilos CSS (`public/css/modules/modulo-x.css`)**:
    *   Usa siempre `write_to_file` con `Overwrite: true` para comenzar limpio.
    *   **Reglas de Oro Elite 360**:
        *   Fondo: `#090e14`
        *   Paneles: `#0f1621` con borde `#1f2937`
        *   Fuente: `'Rajdhani', sans-serif`
        *   Layout: Usa `display: grid` o `flex` para todo.

3.  **Crear Lógica JS (`public/js/modules/modulo-x.js`)**:
    *   Estructura básica del módulo:
    ```javascript
    const ModuloXModule = (() => {
        const init = () => {
            console.log("Modulo X Iniciado");
            // Lógica aquí
        };
        return { init };
    })();
    ```

4.  **Vincular en `app.html`**:
    *   Añade el `<link rel="stylesheet" href="css/modules/modulo-x.css">` en el `<head>`.
    *   Añade el `<script src="js/modules/modulo-x.js"></script>` al final del `<body>`.

5.  **Añadir Botón en Sidebar**:
    *   Busca la Sidebar en `app.html` y añade el botón con `onclick="showView('view-modulo-x')"`.
