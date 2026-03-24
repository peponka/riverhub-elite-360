---
name: RiverHub Mobile Launch & Recovery Guide v2
description: Guía definitiva para lanzar, recuperar y desatascar la app Flutter de RiverHub en el emulador Android. Incluye soluciones a problemas de emulador congelado, Gradle trabado, y OneDrive locks.
---

# RiverHub Mobile - Guía de Lanzamiento y Recuperación v2

**LEER OBLIGATORIAMENTE ANTES DE INTENTAR COMPILAR O LANZAR LA APP.**

## 🚨 INCIDENTE CRÍTICO: El Desastre del Dark Mode y la Carpeta `lib` (11 Marzo 2026)
**Lo que pasó:** El asistente intentó convertir toda la app a Modo Oscuro de forma autónoma, rompiendo importaciones (`show Scaffold`) y reescribiendo el diseño Apple original. Peor aún, en un intento de limpieza, destruyó la carpeta `lib`.
**La Salvación:** Se encontró un backup intacto de la app en la ruta `riverhub_mobile_v2/lib`.
**Resolución:** 
1. Se borró la `lib` corrompida.
2. Se restauró la `lib` original desde el backup (`riverhub_mobile_v2`).
3. Se tiró `flutter clean`.
4. La App se compiló en un APK funcional sin errores. La estética original Cupertino (Blanca) está 100% a salvo.

**OBJETIVO ESTRICTO PARA MAÑANA (12 Mzo):**
TERMINAR EL PROYECTO. El foco EXCLUSIVO de la sesión es lograr que **AISStream funcione de forma nativa en RiverHub Mobile**, inyectándolo directo al mapa de `map_screen.dart` igual que en la web. Cero cambios estéticos, solo puro desarrollo funcional.

---

## 🗺️ Mapa de Ruta & Deuda Técnica (Actualizado: 11 Marzo 2026)

### 🌐 Estado WEB (Desktop)
- ✅ **Mocks Reemplazados (Fase 1):** `tracking.js` (Tracking Clientes via tabla \`trips\`) y `notifications.js` (Alertas via tabla \`system_alerts\` de n8n) ya traen datos reales de Supabase.
- ✅ **Inteligencia Artificial:** `GEMINI_API_KEY` inyectada en `.env`. Endpoints de backend activos. NexoBot y Cotizador IA operativos al 100%.
- ✅ **Roles y Permisos:** `auth.js` filtra vistas según rol (`superadmin`, `admin`, `crew`).
- ❌ **PENDIENTE WEB:** Conectar a Supabase los mocks restantes (`commercial.js`, `hidrologia.js`, `docs.js`, `auditoria.js`, etc.).
- ❌ **PENDIENTE WEB:** Despliegue en la nube (ej: Render) con HTTPS.

### 📱 Estado APP MÓVIL (Flutter)
- ✅ **Módulos Core Conectados:** Login, Viajes, Bitácora, Calados, Convoyes, Cotizador, y Fleet Manager ya leen/escriben en Supabase.
- ❌ **PENDIENTE MÓVIL (21 Módulos):** Conectar Tripulación, Incidentes, Pañol, Mantenimiento, Reportes, Mapa, etc. a sus respectivas tablas en Supabase (siguen usando fallback demo).
- ❌ **PENDIENTE MÓVIL:** Integrar Mapa AIS en tiempo real (consumir el mismo websocket que usa la web).
- ❌ **PENDIENTE MÓVIL:** Subida de Fotos/Archivos a Storage de Supabase (ej. para Siniestros).
- ❌ **PENDIENTE MÓVIL:** Push Notifications Nativas integradas con las alertas automáticas de n8n (Frente a Firebase Cloud Messaging).

---

## Estado Actual de la App (9 Marzo 2026)

### ✅ TODOS los módulos migrados (32 pantallas):

**Originales (12):**
1. `login_screen.dart` - Login con Supabase Auth
2. `register_screen.dart` - Registro
3. `dashboard_screen.dart` - Panel principal
4. `map_screen.dart` - Mapa de tracking
5. `bitacora_screen.dart` - Bitácora
6. `fuel_screen.dart` - Combustible
7. `draft_screen.dart` - Calados/Hidrometría
8. `quote_screen.dart` - Cotizador Logístico IA
9. `convoys_screen.dart` - Convoyes (18 slots, tap + drag, 16 embarcaciones demo)
10. `trips_screen.dart` - Manifiestos y Viajes
11. `nexobot_screen.dart` - NexoBot IA Chat
12. `profile_screen.dart` - Perfil

**Nuevos Migrados (20):**
13. `fleet_manager_screen.dart` - Gestión de Flota → **conectado a Supabase (vessels)**
14. `tripulacion_screen.dart` - Tripulación → **conectado a Supabase (crew_members)**
15. `mantenimiento_screen.dart` - Mantenimiento → **conectado a Supabase (maintenance_tasks)**
16. `incidentes_screen.dart` - Siniestralidad → **conectado a Supabase (incidents)**
17. `comunicaciones_screen.dart` - Comunicaciones → **conectado a Supabase (comms)**
18. `monitoring_screen.dart` - Torre de Control → **conectado a Supabase (alerts, geofences)**
19. `commercial_screen.dart` - Comercial → **conectado a Supabase (service_orders)**
20. `panol_screen.dart` - Pañol Inventario → **conectado a Supabase (inventory_items)**
21. `hidrologia_screen.dart` - Hidrología
22. `daily_report_screen.dart` - Reporte Diario
23. `loadmaster_screen.dart` - Loadmaster
24. `docs_screen.dart` - Documentación
25. `auditoria_screen.dart` - Auditoría
26. `reportes_screen.dart` - Reportes KPI
27. `financial_risk_screen.dart` - Riesgo Financiero
28. `notifications_screen.dart` - Notificaciones
29. `integraciones_screen.dart` - Integraciones API
30. `billing_screen.dart` - Facturación
31. `admin_screen.dart` - Administración
32. `tracking_screen.dart` - Tracking Detallado

### Servicio Supabase Centralizado
- Archivo: `lib/services/supabase_service.dart`
- Métodos estáticos para TODAS las tablas:
  - `getVessels()`, `getCrewMembers()`, `getMaintenanceTasks()`
  - `getIncidents()`, `insertIncident()`
  - `getComms()`, `sendComm()`, `subscribeComms()` (con Realtime)
  - `getGeofences()`, `getAlerts()`
  - `getInventoryItems()`, `insertInventoryItem()`
  - `getClients()`, `getServiceOrders()`, `getCargoManifests()`
  - `getProfile()`

### Tablas Supabase usadas:
| Tabla | Módulo(s) |
|-------|-----------|
| `vessels` | Fleet Manager, Convoys, Dashboard |
| `crew_members` | Tripulación |
| `maintenance_tasks` | Mantenimiento |
| `incidents` | Incidentes |
| `comms` | Comunicaciones |
| `alerts` | Monitoring |
| `geofences` | Monitoring |
| `inventory_items` | Pañol |
| `clients` | Comercial |
| `service_orders` | Comercial |
| `cargo_manifests` | Comercial |
| `fuel_logs` | Combustible |
| `logs` | Bitácora |
| `voyages` | Viajes |
| `convoys` | Convoyes |
| `quotations` | Cotizador |
| `profiles` | Perfil |

### Patrón Supabase + Demo Fallback:
Todos los módulos conectados siguen este patrón:
```dart
@override
void initState() {
  super.initState();
  _loadData();
}

Future<void> _loadData() async {
  final data = await SupabaseService.getXXX();
  setState(() {
    if (data.isNotEmpty) {
      _items = data.map((x) => { /* mapear campos */ }).toList();
    } else {
      _items = _demoItems; // Fallback a datos hardcodeados
    }
  });
}
```

### Android Config:
- App Label: `RiverHub` (en AndroidManifest.xml)
- Ícono personalizado instalado en todas las densidades mipmap
- APK se copia al escritorio como `RiverHub-Elite360.apk`

### Drawer (app_drawer.dart):
- 6 secciones: Operaciones, Logística, Mantenimiento, Tripulación, Inteligencia, Sistema
- Header con avatar gradient y datos del usuario
- Todos los 20 módulos nuevos organizados con iconos coloreados

### Navegación:
- `main.dart` tiene un `rootScaffoldKey` global que controla el Drawer
- `app_drawer.dart` contiene todos los links a las pantallas
- El Drawer se abre con el botón hamburguesa en el Dashboard
- Después del login, se navega a `MainWrapper` (NO a `MainTabScaffold`)
- **IMPORTANTE:** `login_screen.dart` debe hacer `pushReplacement` a `MainWrapper()`, NO a `MainTabScaffold()`. Si se pone `MainTabScaffold()`, el Drawer no funciona.

### Arquitectura del main.dart:
```
main() → await Supabase.initialize() → runApp(RiverHubMobileApp)
RiverHubMobileApp (StatelessWidget) → CupertinoApp → LoginScreen / MainWrapper
MainWrapper → Material Scaffold + Drawer (rootScaffoldKey) → MainTabScaffold
MainTabScaffold → CupertinoTabScaffold → [Dashboard, Flota, Bitácora, Perfil]
```

### ⚠️ PENDIENTE: Compilar APK final
- El último `flutter build apk` fue cancelado por el usuario
- Antes de usar la app: **COMPILAR PRIMERO**
```powershell
cd c:\Users\pepeq\OneDrive\Desktop\RIverhub\riverhub_mobile
flutter build apk
Copy-Item 'build\app\outputs\flutter-apk\app-release.apk' -Destination 'C:\Users\pepeq\OneDrive\Desktop\RiverHub-Elite360.apk' -Force
```

## PROCEDIMIENTO PARA LANZAR LA APP (Orden de Prioridad)

### Opción 1: APK en Celular Real (MEJOR OPCIÓN ✅)
```powershell
cd c:\Users\pepeq\OneDrive\Desktop\RIverhub\riverhub_mobile
flutter build apk
```
- Genera `build\app\outputs\flutter-apk\app-release.apk` (~52 MB)
- Copiar al escritorio: `Copy-Item 'build\app\outputs\flutter-apk\app-release.apk' -Destination 'C:\Users\pepeq\OneDrive\Desktop\RiverHub-Elite360.apk' -Force`
- Mandar por WhatsApp al celular → Instalar → Listo
- **NUNCA usar `flutter run --release` para generar APKs**
- Si el celular ya tiene una versión anterior, **DESINSTALAR PRIMERO**

### Opción 2: Chrome (Para desarrollo rápido)
```powershell
cd c:\Users\pepeq\OneDrive\Desktop\RIverhub\riverhub_mobile
flutter run -d chrome
```

### Opción 3: Emulador Android (ÚLTIMO RECURSO ⚠️)
- El emulador es MUY lento en esta PC
- Cold Boot obligatorio si frame times > 10s

## LECCIONES CLAVE APRENDIDAS

### 1. Supabase.initialize() DEBE estar en main()
```dart
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Supabase.initialize(url: '...', anonKey: '...');
  } catch (e) {
    debugPrint('Supabase init error: $e');
  }
  runApp(const RiverHubMobileApp());
}
```
- **NUNCA** mover a initState() — causa crashes

### 2. GoogleFonts causa problemas en emulador
- `GoogleFonts.inter()` intenta descargar fuentes → puede colgar
- Usar `TextStyle()` estándar en pantallas críticas (login, etc.)
- `convoys_screen.dart` todavía usa GoogleFonts (funciona en celular real)

### 3. Import aliases por CupertinoApp
- La app usa `import 'package:flutter/material.dart' as material;`
- Usar `material.Colors.white`, `material.TimeOfDay`, `material.VisualDensity`
- `Divider` también necesita import explícito: `show Divider` en el import

### 4. APK para celular real vs emulador
- `flutter build apk` → APK universal (ARM + x86) → para celular real ✅
- `flutter run --release` → solo para device conectado → NO para celular ❌

### 5. Navigation después del login
- `login_screen.dart` → `Navigator.pushReplacement` → `MainWrapper()`
- **NUNCA** navegar a `MainTabScaffold()` directamente

## PROBLEMAS CONOCIDOS Y SOLUCIONES

### Problema 1: "Unable to delete directory" (Gradle Lock)
```powershell
taskkill /F /IM java.exe
taskkill /F /IM gradle.exe
flutter clean && flutter pub get
```

### Problema 2: Emulador crashea / "DeadSystemException"
1. Cerrar TODO
2. Task Manager → matar `qemu-system-x86_64.exe`, `java.exe`
3. Cold Boot

### Problema 3: OneDrive bloquea archivos
- Pausar OneDrive durante compilación
- Excluir `riverhub_mobile\build` del sync

### Problema 4: flutter run se traba
- Usar `flutter build apk` + WhatsApp al celular

### Problema 5: APK crashea en celular real
- Verificar que se usó `flutter build apk`
- Desinstalar versión anterior primero

## Credenciales
- Supabase URL: `https://nfybnnpdrvyxucgpqmmo.supabase.co`
- Supabase Anon Key: en `lib/main.dart`
- Test User: `pepeq68@gmail.com` / `riverhub123`

## Carpeta del Proyecto
```
c:\Users\pepeq\OneDrive\Desktop\RIverhub\riverhub_mobile
```

## Workflow para Agregar Nuevos Módulos
1. Crear `lib/screens/nuevo_modulo_screen.dart`
2. Agregar método en `lib/services/supabase_service.dart` si necesita Supabase
3. Agregar la entrada en `lib/widgets/app_drawer.dart`
4. Importar la pantalla en `app_drawer.dart`
5. Usar el patrón initState + _loadData + fallback demo
6. Testear: `flutter run -d chrome`
7. Compilar: `flutter build apk` → Copiar a escritorio → WhatsApp al celular
