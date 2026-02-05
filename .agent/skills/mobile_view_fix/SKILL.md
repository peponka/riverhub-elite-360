---
name: Mobile View Content Fix
description: Solución para módulos que aparecen en negro en vista móvil/iframe pero funcionan en desktop
---

# Mobile View Content Fix - RiverHub Elite 360

## Problema

Los módulos aparecen completamente en negro en:
- Vista móvil (`mobile_preview.html` que usa iframe)
- Posiblemente en Android WebView

Pero funcionan perfectamente cuando se accede directamente a `app.html` en el navegador.

## Causa Raíz

El problema NO es CSS de visibilidad. Es un problema de **layout flexbox** y **altura de contenedores**.

Cuando un módulo está dentro de:
1. `.main-content` (que es `display: flex; flex-direction: column`)
2. `.view-section` (que por defecto no tiene altura explícita)
3. Un iframe con dimensiones fijas

El contenido normal (con `position: static`) no tiene un contenedor con altura definida, por lo que colapsa a altura 0 y no se ve.

## Solución: Position Fixed

La solución es usar `position: fixed` para el contenedor principal del contenido del módulo:

```html
<div id="view-MODULO" class="view-section" 
    style="display:none; position:relative; height:100vh; overflow:hidden;">
    
    <!-- Contenedor principal con position:fixed -->
    <div style="position:fixed; 
                top:60px; 
                left:0; 
                right:0; 
                bottom:70px; 
                background:#090e14; 
                padding:16px; 
                box-sizing:border-box; 
                font-family:'Rajdhani',sans-serif; 
                overflow-y:auto; 
                -webkit-overflow-scrolling:touch; 
                z-index:100;">
        
        <!-- TODO EL CONTENIDO DEL MÓDULO AQUÍ -->
        
    </div>
</div>
```

## Valores Clave

| Propiedad | Valor | Razón |
|-----------|-------|-------|
| `position` | `fixed` | Se posiciona relativo al viewport, no a contenedores padre |
| `top` | `60px` | Espacio para el top-bar header |
| `bottom` | `70px` | Espacio para la barra de navegación móvil |
| `z-index` | `100` | Por encima de otros elementos pero debajo de modales |
| `overflow-y` | `auto` | Permite scroll dentro del contenedor |
| `-webkit-overflow-scrolling` | `touch` | Scroll suave en iOS |

## Pasos para Aplicar a Otro Módulo

1. **Encontrar el view-section** del módulo problemático
2. **Agregar estilos inline** al div padre:
   ```css
   position:relative; height:100vh; overflow:hidden;
   ```
3. **Envolver todo el contenido** en un div con:
   ```css
   position:fixed; top:60px; left:0; right:0; bottom:70px; 
   background:#090e14; padding:16px; box-sizing:border-box; 
   overflow-y:auto; -webkit-overflow-scrolling:touch; z-index:100;
   ```
4. **Usar estilos 100% inline** - No depender de CSS externos para visibilidad

## Ejemplo Completo (Auditoría)

```html
<div id="view-auditoria" class="view-section"
    style="display:none; position:relative; height:100vh; overflow:hidden;">
    
    <div style="position:fixed; top:60px; left:0; right:0; bottom:70px; 
                background:#090e14; padding:16px; box-sizing:border-box; 
                font-family:'Rajdhani',sans-serif; overflow-y:auto; 
                -webkit-overflow-scrolling:touch; z-index:100;">
        
        <!-- HEADER -->
        <div style="margin-bottom:20px;">
            <h2 style="color:#fff; font-size:1.2rem;">
                <i class="fas fa-stethoscope" style="color:#f59e0b;"></i>
                AUDITORÍA DE SISTEMA
            </h2>
        </div>
        
        <!-- Cards, Terminal, etc. con estilos inline -->
        
    </div>
</div>
```

## Debug: Cómo Confirmar el Problema

Si un módulo aparece negro, agregar este div de debug:

```html
<div style="position:fixed; top:70px; left:0; right:0; padding:20px; 
            background:red; color:white; font-size:24px; font-weight:bold; 
            text-align:center; z-index:9999;">
    🛠️ DEBUG: MÓDULO CARGADO 🛠️
</div>
```

- **Si se ve el rojo**: El problema es layout/altura del contenido normal
- **Si NO se ve el rojo**: El problema es que el view-section nunca se muestra (revisar JavaScript de navegación)

## Archivos Modificados para Auditoría

- `public/app.html` - Líneas ~3026-3140 (view-auditoria completo)
- `public/js/global.js` - Líneas 162-179 (debug logging opcional)

## Notas Importantes

1. Esta solución usa **100% estilos inline** para máxima confiabilidad
2. El contenido NO depende de ningún CSS externo para visibilidad
3. El `z-index: 100` es suficiente para estar visible pero no bloquea modales (z-index: 9999)
4. El `-webkit-overflow-scrolling: touch` es necesario para scroll suave en iOS/Safari
