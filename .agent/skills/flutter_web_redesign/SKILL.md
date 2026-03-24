---
description: Guía para el rediseño Flutter Cupertino de la web RiverHub - Sidebar con colores individuales y tema light iOS
---

# RiverHub Web → Flutter Cupertino Redesign

## Estado Actual (9 Mar 2026)
La web de RiverHub fue rediseñada para parecerse a la app móvil Flutter. Se implementó un diseño **híbrido**:
- **Sidebar**: Dark `#0A0E1A` (replica el `AppDrawer` de Flutter)
- **Dashboard/Contenido**: Light `#F2F2F7` (replica el `CupertinoThemeData`)

### ✅ Completado
1. **Sidebar dark** con fondo `#0A0E1A` como el drawer de Flutter
2. **Íconos con colores individuales** por módulo (en cuadrados redondeados 8px con 15% opacidad)
3. **Section headers** (`PRINCIPAL`, `OPERATIVA DIARIA`, etc.) en gris `#475569`, 10px, bold, uppercase
4. **Chevron `›`** a la derecha de cada item
5. **Avatar usuario** con gradiente cyan→azul
6. **Dashboard light** con cards blancas, border-radius 24px, sombras suaves
7. **KPI cards** estilo `_buildMetricCard` de Flutter
8. **Top bar** translúcido como `CupertinoNavigationBar`
9. **Login screen** estilo iOS light

### 🔄 Pendiente para mañana
1. **Páginas de módulos internos** — Necesitan mejor diseño (Gestión Comercial, Combustible, etc.)
2. **Algunos módulos aparecen oscuros** — El `flutter-override.css` tiene overrides pero algunos módulos tienen sus propios CSS
3. **Pulir detalles** — Badges, botones, formularios dentro de módulos

## Archivos Clave Modificados

### CSS
| Archivo | Propósito |
|---------|-----------|
| `public/css/global.css` (líneas ~819-860) | **Íconos con colores individuales** por nav-ID (#nav-dashboard, etc.) |
| `public/css/flutter-override.css` | Override principal: tema light iOS, sidebar dark, cards blancas |
| `public/css/material-tokens.css` | Tokens de diseño base (no modificado en esta sesión) |

### JavaScript
| Archivo | Propósito |
|---------|-----------|
| `public/js/modules/auth.js` | Llama a `_applyFlutterSidebarColors()` después del login |
| `public/app.html` (inline script línea ~156) | Script inline que inyecta colores de sidebar vía JS como backup |

### HTML
| Archivo | Propósito |
|---------|-----------|
| `public/app.html` (línea ~146) | Incluye `flutter-override.css?v=FLUTTER_V3_POLISH` |

## Colores Flutter por Módulo

```
OPERACIONES:
  Dashboard:      #3B82F6 (Azul)
  Mapa:           #00E5FF (Cyan)
  Flota:          #00E5FF (Cyan)
  Combustible:    #8B5CF6 (Púrpura)
  Calado:         #3B82F6 (Azul)
  Hidrología:     #06B6D4 (Teal)
  Convoyes:       #10B981 (Verde)
  Load Master:    #F59E0B (Ámbar)
  Tracking:       #EF4444 (Rojo)

LOGÍSTICA:
  Viajes:         #F97316 (Naranja)
  Cotizador:      #10B981 (Verde)
  Comercial:      #8B5CF6 (Púrpura)
  Docs:           #3B82F6 (Azul)

MANTENIMIENTO:
  Mantenimiento:  #F59E0B (Ámbar)
  Pañol:          #06B6D4 (Teal)
  Incidentes:     #EF4444 (Rojo)

TRIPULACIÓN:
  Tripulación:    #10B981 (Verde)
  Comunicaciones: #00E5FF (Cyan)
  Bitácora:       #F97316 (Naranja)

SISTEMA:
  Billing:        #3B82F6 (Azul)
  Auditoría:      #64748B (Gris)
  Admin:          #8B5CF6 (Púrpura)
  Backoffice:     #EF4444 (Rojo)
```

## Cómo Levantar el Servidor

```bash
cd c:\Users\pepeq\OneDrive\Desktop\RIverhub
node app.js
# Server arranca en puerto 3000
# Abrir: http://localhost:3000/app.html
```

Si el puerto 3000 está ocupado:
```bash
set PORT=9090
node app.js
```

O usar el server simple sin dependencias:
```bash
node serve.js
# Server en puerto 9090
```

## Problemas Conocidos

### Caching del navegador
- Siempre usar **Ctrl+F5** para hard reload
- Si no funciona, cerrar pestaña y abrir una nueva
- Los archivos CSS tienen cache-busters: `?v=FLUTTER_V3_POLISH`

### OneDrive Locks
- Si `node app.js` se cierra inmediatamente, puede ser un lock de OneDrive
- Solución: esperar unos segundos y reintentar
- Alternativa: copiar el proyecto fuera de OneDrive

### Íconos del sidebar
- Los colores se aplican en DOS lugares (redundancia):
  1. `global.css` — reglas CSS `#nav-xxx i { color: ... }`
  2. `app.html` inline script — JS que aplica colors vía `setAttribute('style')`
- Si uno falla, el otro debería funcionar

## Referencia Flutter

### Archivos de la app móvil consultados:
- `riverhub_mobile/lib/main.dart` — CupertinoThemeData (Brightness.light, activeBlue, systemGroupedBackground)
- `riverhub_mobile/lib/widgets/app_drawer.dart` — Drawer con fondo #0A0E1A, _buildDrawerItem
- `riverhub_mobile/lib/screens/dashboard_screen.dart` — _buildMetricCard, CupertinoNavigationBar
- `riverhub_mobile/lib/screens/login_screen.dart` — CupertinoTextField, CupertinoButton
