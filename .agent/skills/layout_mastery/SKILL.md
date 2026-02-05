---
name: Layout Mastery & Elite 360 Grid Standards
description: Guía definitiva para corregir y prevenir errores de layout en RiverHub (Elite 360), enfocada en Grids, manejo de Sidebar y Cards. Úsalo para evitar iteraciones infinitas en CSS.
---

# Layout Mastery: RiverHub Elite 360

Este skill encapsula las lecciones aprendidas al arreglar "Módulos de Flota" y layouts principales. Siempre que debas ajustar una vista principal (`view-section`) o una rejilla de tarjetas (`grid`), consulta esta guía PRIMERO.

## 1. Regla de Oro del Contenedor Principal (The Container Width Rule)

**PROBLEMA**: El contenido se desborda horizontalmente o aparece un scroll horizontal innecesario.
**CAUSA**: El sidebar (`left: 260px`) empuja el contenido, y si el contenedor tiene `width: 100%`, el ancho total real es `100% + 260px`.
**SOLUCIÓN**: Calcular explícitamente el ancho restando el sidebar.

```css
#view-unique-id {
    position: fixed;
    top: 0;
    left: 260px; /* Ancho del Sidebar */
    right: 0;
    bottom: 0;
    /* LA REGLA CLAVE: */
    width: calc(100vw - 260px); 
    box-sizing: border-box; /* Fundamental */
    overflow-x: hidden;
    overflow-y: auto;
}
```

## 2. Estrategia de Grid (Rejillas)

**PROBLEMA**: Las tarjetas se cortan, no entran las que el usuario quiere (ej. "filas de 3"), o quedan espacios vacios extraños.

### Opción A: Filas Estrictas (Lo que el usuario suele pedir)
Si el usuario pide "Que se vean 3 tarjetas" o "Filas de 2":
NO USES `auto-fit` ni `minmax` con valores pixelados grandes. Usa fracciones puras.

```css
/* Para exactamente 3 columnas */
grid-template-columns: repeat(3, 1fr); 
gap: 20px;
```

### Opción B: Diseño Responsivo (Solo si el usuario no especificó cantidad fija)
```css
grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
```

## 3. Diseño de Tarjetas "Elite" (Compact vs Wide)

**PROBLEMA**: La tarjeta es demasiado ancha y rompe la rejilla de 3 columnas, o demasiado alta y se ve vacía.

### Formato Cuadrado/Compacto (Ideal para 3-4 columnas)
Para que entren 3 tarjetas en una pantalla estándar, los datos internos deben apilarse verticalmente (Stacked) para reducir el ancho requerido.

```html
<!-- Estructura Vertical -->
<div class="card-body">
   <div class="header">Icon + Title</div>
   <div class="stats-grid" style="grid-template-columns: 1fr;"> <!-- 1 SOLA COLUMNA -->
      <div class="stat-item">Velocidad</div>
      <div class="stat-item">Tanque</div>
   </div>
</div>
```

### Formato Ancho (Ideal para 2 columnas)
Si la rejilla es de 2 columnas, usa el espacio horizontal.

```html
<!-- Estructura Horizontal -->
<div class="stats-grid" style="grid-template-columns: 1fr 1fr;"> <!-- 2 COLUMNAS LADO A LADO -->
   <div class="stat-item">Velocidad</div>
   <div class="stat-item">Tanque</div>
</div>
```

## 4. Checklist Rápido de Verificación

Antes de confirmar un cambio de layout al usuario:
1. [ ] ¿Tiene el contenedor `width: calc(100vw - 260px)`?
2. [ ] ¿Tiene el contenedor `box-sizing: border-box`?
3. [ ] Si es Grid fijo (`repeat(3, 1fr)`), ¿Las tarjetas tienen padding reducido (ej. 15px) para caber?
4. [ ] ¿He eliminado márgenes negativos o anchos fijos en px que puedan causar overflow?

---
**Uso**: Ejecuta `view_file` en este SKILL antes de tocar CSS crítico de layout o grids en `app.html` o módulos CSS.
