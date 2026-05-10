# Auditoría Técnica — Fluvia / RiverHub Elite 360

**Fecha:** 2026-04-22
**Auditor:** Senior Technical Review (Claude Code)
**Base:** Análisis directo del código fuente

---

## Índice

1. [Seguridad](#1-seguridad)
2. [Performance](#2-performance)
3. [UX / UI](#3-ux--ui)
4. [Calidad de Código](#4-calidad-de-código)
5. [Push Notifications](#5-push-notifications)
6. [Producción / Play Store](#6-producción--play-store)
7. [Bugs de Datos](#7-bugs-de-datos)
8. [Próximos Pasos](#8-próximos-pasos-recomendados)
9. [Resumen Ejecutivo](#9-resumen-ejecutivo)

---

## 1. Seguridad

### 🔴 [P0] Escalada de privilegios automática a superadmin

**Archivo:** `public/fluvia.js:60-75`

```js
// Si el usuario no tiene perfil → se crea como superadmin
sb.from('user_profiles').insert({
    user_id: user.id,
    company_id: cid,
    role: 'superadmin',   // ← cualquier nuevo signup
    full_name: 'Administrador'
})
currentUserRole = 'superadmin';
```

Cualquier usuario que se registre y no tenga fila en `user_profiles` queda automáticamente como `superadmin`. Si RLS no bloquea el INSERT para el usuario corriente, es escalada de privilegios completa.

**Fix:** Mover la creación de perfiles a una Edge Function con service-role key. Nunca asignar `superadmin` por defecto — usar `viewer` o `crew`.

---

### 🔴 [P0] Secrets vivos en el repositorio

**Archivos:** `render.yaml:12-17`, `config.json:2`, `firebase-service-account.json`, `.agent/skills/n8n_automation/SKILL.md:196`

```yaml
# render.yaml — visible en git history
SUPABASE_ANON_KEY=REDACTED_SUPABASE_ANON_KEY
AIS_API_KEY=REDACTED_AIS_KEY_1
```

```json
// config.json — segunda clave AIS distinta
"ais_key": "REDACTED_AIS_KEY_2"
```

Hay **dos claves AIS distintas** en el repo. También hay una clave Gemini (`AIzaSy...`) en la skill de automatización. Si `firebase-service-account.json` contiene la clave privada real de Firebase Admin, cualquier persona con acceso de lectura al repo puede emitir tokens FCM arbitrarios.

**Fix inmediato:**
1. Rotar TODAS las claves ahora mismo
2. Purgar historial con `git-filter-repo` o BFG Repo Cleaner
3. Usar `render.yaml` con `sync: false` y Secret Groups para los valores en producción

---

### 🔴 [P0] XSS almacenado en ~50+ sitios de innerHTML

**Archivo:** `public/fluvia.js` — prácticamente cada loader

```js
// fluvia.js:225 — nombre de buque sin escapar
row.innerHTML = `<td>${v.name}</td><td>${v.type}</td>...`;

// fluvia.js:648 — el más peligroso: respuesta de IA inyectada como HTML
chat.innerHTML += `<div>...${answer.replace(/\n/g,'<br>')}...</div>`;
```

Sitios afectados confirmados: `fluvia.js:152, 225, 290, 305, 325, 337, 352, 367, 375, 383, 391, 463, 571, 577, 634, 648, 927, 951, 999, 1019`.

Cualquier buque en AIS con nombre `<img src=x onerror=alert(1)>` ejecuta JS en todos los navegadores del tenant. Un usuario autenticado puede guardar XSS en `logs.description` o `vessels.name` y se dispara para todos en la empresa. El chat del Copiloto inyecta la respuesta de la IA como HTML crudo — máximo riesgo porque el modelo puede reflejar input de usuario.

**Fix:**
```js
// Agregar helper al inicio de fluvia.js
function esc(str) {
    const d = document.createElement('div');
    d.textContent = str ?? '';
    return d.innerHTML;
}
// Usar: `<td>${esc(v.name)}</td>` en lugar de `<td>${v.name}</td>`
```

---

### 🔴 [P0] Control de roles completamente client-side

**Archivo:** `public/fluvia.js:550-554, 601-625`

```js
// Panel admin protegido solo por variable JS local
function checkAdminAccess() {
    if (currentUserRole === 'superadmin') {
        document.getElementById('nav-admin').style.display = 'flex';
    }
}

// Admin crea usuario desde el browser con clave pública
sb.auth.signUp({ email, password })
sb.from('user_profiles').insert({ role: 'admin', ... }) // rol elegido por el cliente
```

Cualquier usuario puede abrir DevTools, ejecutar `currentUserRole='superadmin'` y acceder al panel. La creación de usuarios con rol arbitrario ocurre con la anon key desde el browser. RLS es el único control — y si falla en una sola tabla, el sistema queda comprometido.

**Fix:** Mover `signUp` + asignación de rol a una Edge Function que valide que el caller tiene rol `superadmin` en la DB antes de proceder.

---

### 🔴 [P0] Edge Function send-fcm sin validación de autenticación

**Archivo:** `supabase/functions/send-fcm/index.ts:11, 32`

```ts
// No hay validación del JWT entrante
const { type, title, body, user_id, data } = await req.json();

// Si user_id es null → broadcast a TODOS los dispositivos
const { data: profiles } = await supabase
    .from('user_profiles')
    .select('fcm_token, user_id')
    .not('fcm_token', 'is', null);
```

Si `verify_jwt` está en `false` en `config.toml`, cualquier persona en internet puede hacer un POST y disparar pushes a todos los dispositivos de todos los usuarios.

**Fix:** Verificar que `verify_jwt: true` en `supabase/config.toml`. Agregar check de rol admin en el path de broadcast.

---

### 🔴 [P0] Flujo de pago falso colecta datos de tarjeta en el DOM

**Archivo:** `public/fluvia.js:517-547`

```js
async function processPayment(plan, price) {
    // Lee número de tarjeta, CVV, vencimiento del DOM
    const cardNum = document.getElementById('card-number').value;
    const cvv = document.getElementById('card-cvv').value;
    // ...
    setTimeout(function() {
        // Simula éxito — no hay cargo real
        document.getElementById('modal-body').innerHTML = '...Pago Exitoso!...';
    }, 2000);
}
```

Se recolectan datos de tarjeta en inputs del DOM y se simula éxito con un timeout. Si llega a usuarios reales: **PCI-DSS non-compliant**. La tarjeta nunca debe tocar tu servidor o tu DOM.

**Fix:** Reemplazar con Stripe Checkout o MercadoPago Checkout Pro (hosted page). La tarjeta la maneja el PSP, nunca tu frontend.

---

### 🟡 [P1] URLs de imágenes de bitácora son públicas permanentemente

**Archivo:** `riverhub_mobile_v2/lib/screens/bitacora_screen.dart:122-123`

```dart
final publicUrl = supabase.storage.from('documents').getPublicUrl(path);
```

Cualquier foto subida a bitácora (documentos de carga, incidentes, tripulación) queda accesible para siempre via URL pública predecible.

**Fix:** Usar `createSignedUrl` con expiración de 1-24h según el caso de uso.

---

### 🟡 [P1] Supabase Realtime sin filtro de company_id

**Archivo:** `public/fluvia.js:158-162`

```js
sb.channel('notif-logs').on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'logs' },
    callback
)
```

Sin `filter: 'company_id=eq.<uuid>'`, si Supabase broadcast precede al RLS filtering, logs de otros tenants pueden aparecer en el feed de notificaciones del usuario.

**Fix:** `{ event: 'INSERT', schema: 'public', table: 'logs', filter: \`company_id=eq.${currentCompanyId}\` }`

---

### 🟡 [P1] `sb.auth.currentUser` no existe en supabase-js v2

**Archivo:** `public/fluvia.js:662`

```js
const userName = sb.auth.currentUser?.email || 'Capitan';
// currentUser no es una propiedad síncrona en supabase-js v2
// → userName siempre vale 'Capitan'
```

**Fix:** `const { data: { user } } = await sb.auth.getUser(); const userName = user?.email || 'Capitan';`

---

### 🟡 [P1] Múltiples configuraciones de Supabase sin fuente única de verdad

El mismo URL + anon key está hardcodeado en:

| Archivo | Línea |
|---------|-------|
| `public/fluvia.js` | 2-4 |
| `public/js/config.js` | 47 |
| `riverhub_mobile/lib/main.dart` | 84-87 |
| `render.yaml` | 12-17 |

Rotar un secret requiere editar 4+ archivos **más** un redeploy de App Store.

---

### 🟢 [Mejora] GPS updates solo validados por RLS

**Archivo:** `gps_tracker_service.dart:81-88`

Un usuario que conozca el `vessel_id` de otro tenant puede spoofear su posición GPS si las policies de RLS en `vessels` no validan `company_id`. Confirmar que RLS en UPDATE de `vessels` exige `vessel_id IN (SELECT id FROM vessels WHERE company_id = (SELECT company_id FROM user_profiles WHERE user_id = auth.uid()))`.

---

## 2. Performance

### 🔴 [P0] `setState` cada segundo reconstruye todo el dashboard

**Archivo:** `dashboard_screen.dart:61-64`

```dart
_syncTimer = Timer.periodic(Duration(seconds: 1), (t) {
    if (mounted) setState(() => _syncSeconds++);
});
```

Fuerza un rebuild completo del árbol de widgets (KPI cards, vessel list, activity feed, ~40+ widgets) cada segundo. En Android gama baja esto pega la CPU al 2-3% solo para un texto contador.

**Fix:**
```dart
final _syncNotifier = ValueNotifier<int>(0);

// En build():
ValueListenableBuilder<int>(
    valueListenable: _syncNotifier,
    builder: (_, val, __) => Text('Hace ${val}s'),
)

// El timer solo actualiza el notifier:
Timer.periodic(Duration(seconds: 1), (_) => _syncNotifier.value++);
```

---

### 🟡 [P1] Timers e intervalos no se limpian en logout

**Archivo:** `public/fluvia.js:167, 414, 158-162`

```js
setInterval(..., 1000);              // sync counter — nunca se limpia
setInterval(loadAISTraffic, 30000);  // AIS poll — persiste post-logout
// Realtime channel — no se unsubscribe en doLogout()
```

Después del logout: el intervalo de sync sigue ejecutando, el AIS poll sigue llamando a la API con sesión inválida, la suscripción realtime del usuario anterior sigue recibiendo INSERTs.

**Fix:** En `doLogout()` agregar `clearInterval(syncTimer)`, `clearInterval(aisTimer)`, `notifChannel.unsubscribe()`.

---

### 🟡 [P1] TextEditingController leaks en modales

**Archivos:** `bitacora_screen.dart:71`, `mantenimiento_screen.dart:136-137`, `fuel_screen.dart:164-165`

```dart
// Patrón repetido en 3+ screens — controllers nunca se disponen
final textController = TextEditingController();
// Se muestra el modal, el usuario cierra
// textController.dispose() → nunca llamado
```

Cada apertura del modal filtra un controller. En sesiones largas de operación esto acumula cientos de objetos.

**Fix:** Declarar los controllers como campos del `State`, inicializar en `initState`, disponer en `dispose`.

---

### 🟡 [P1] Queries secuenciales que deberían ser paralelas

**Archivo:** `public/fluvia.js:828-833` (reportes), `fluvia.js:809-820` (hidrología)

```js
// Secuencial → 4× round-trip
const vessels = await sb.from('vessels').select('*');
const vCount  = await sb.from('voyages').select('id', { count: 'exact' });
const liters  = await sb.from('fuel_logs').select('liters');
const logs    = await sb.from('logs').select('id', { count: 'exact' });
```

Cuatro queries independientes ejecutadas en serie. `Promise.all` reduce el tiempo de carga de reportes ~4×.

---

### 🟡 [P1] `.select('*')` sin filtro de columnas en mobile

**Archivo:** `dashboard_screen.dart:89` y múltiples screens

```dart
supabase.from('vessels').select('*')  // ~30 columnas por vessel en datos móviles
```

Seleccionar solo los campos necesarios (`id, name, type, status, current_lat, current_lng, destination`) puede reducir el payload al 20-30% del actual.

---

### 🟡 [P1] Markers AIS se acumulan sin límite

**Archivo:** `public/fluvia.js:404`

`aisMarkers = {}` crece linealmente con los MMSIs únicos vistos. Los markers de buques que abandonaron el feed nunca se eliminan del mapa ni del objeto. En sesiones de 24h esto acumula cientos de elementos Leaflet en el DOM.

---

### 🟡 [P1] Drawer auto-reabre después de pop

**Archivo:** `app_drawer.dart:220-228`

```dart
Navigator.push(ctx, MaterialPageRoute(builder: ...)).then((_) {
    Future.delayed(Duration(milliseconds: 200), () => openDrawer());
});
```

200ms después de que el usuario cierre cualquier pantalla, el drawer se abre automáticamente. El usuario queda "atrapado": abrir pantalla → cerrar → drawer se abre de nuevo. Si cierra rápido múltiples veces, acumula callbacks diferidos.

**Fix:** Eliminar el `.then()` con `openDrawer()`. El drawer no debe abrirse sin acción explícita del usuario.

---

### 🟢 [Mejora] Indexes faltantes (inferidos por patrones de acceso)

Columnas filtradas frecuentemente sin índice confirmado:

| Tabla | Columnas | Usado en |
|-------|----------|----------|
| `logs` | `(action_type, created_at DESC)` | bitácora, dashboard, notificaciones |
| `logs` | `(company_id, created_at DESC)` | scan multi-tenant |
| `vessels` | `(company_id, status)` | prácticamente cada loader |
| `fuel_logs` | `(vessel_id, logged_at DESC)` | fuel screen |
| `user_profiles` | `(user_id)` | cada flujo de auth |
| `user_profiles` | `fcm_token WHERE fcm_token IS NOT NULL` | edge function broadcast scan |

---

## 3. UX / UI

### 🔴 [P0] KPIs fabricados con datos falsos en producción

**Archivos:** `fluvia.js:222, 255-256, 859` | `dashboard_screen.dart:437` | `fuel_screen.dart:82` | `tracking_screen.dart:96-112`

```js
// fluvia.js:222 — velocidad y combustible son Math.random()
speed: Math.random() * 15,
fuel:  Math.random() * 100

// fluvia.js:859 — gráfico de actividad = 30 días de números random
data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 5))
```

```dart
// dashboard_screen.dart:437 — velocidad derivada del índice de lista
(idx * 1.3 + 4.5).toStringAsFixed(1)  // "KN"

// fuel_screen.dart:82 — eficiencia derivada de la longitud del UUID
_currentEfficiency = 70 + (vesselId.toString().length % 25);
```

Datos inventados en un dashboard operacional de gestión de flotas son inaceptables. Los operadores pueden tomar decisiones basadas en velocidades y eficiencias que no existen.

**Fix:** Reemplazar con datos reales de la DB o mostrar `"— Sin datos"` hasta que existan.

---

### 🟡 [P1] Dos sistemas de navegación en conflicto (mobile)

El app tiene un `CupertinoTabScaffold` con 4 tabs fijos (`main.dart:189`) **y** un drawer con 27+ destinos. Se desincronarizan: el usuario navega desde el drawer a `FuelScreen` mientras el tab activo sigue siendo "Panel". No hay estado compartido que determine cuál es la pantalla "activa".

---

### 🟢 [Mejora] Design system fragmentado — widgets duplicados en cada screen

`lib/widgets/fluvia_widgets.dart` existe pero no se usa. Cada pantalla reimplementa sus propios `_kpiCard`, `_sectionTitle`, `_infoCard`, etc. `CupertinoNavigationBar` se replica en cada screen. Consolidar en widgets compartidos reduce mantenimiento y garantiza coherencia visual.

---

### 🟢 [Mejora] 6 KPIs en el dashboard móvil

Los 6 KPIs (vessels activos, viajes, alertas, combustible, crew, carga) son razonables para el dominio. El problema actual no es la cantidad sino que 4 de los 6 muestran valores fabricados. Con datos reales, la densidad es justificable para un operador de flota. Evaluar reducir a 4 en la v1 para mejorar legibilidad en Android pequeño.

---

## 4. Calidad de Código

### 🔴 [P0] Modal submit handler tiene state leak entre modales

**Archivo:** `public/fluvia.js:485-596`

```js
// Cada modal sobreescribe onclick sin limpiar el anterior
document.getElementById('modal-submit').onclick = function() { /* lógica del modal A */ }
// Si el usuario abre modal B sin guardar A, el onclick de A queda activo
```

`openNewCompanyModal` (línea 596) no resetea el handler. Secuencia de pasos para reproducir el bug: abrir "Nueva Empresa" → cancelar → abrir "Agregar Item de Pañol" → el click de submit ejecuta el handler de "Nueva Empresa". Bug de datos silencioso.

**Fix:** Al abrir cada modal: `document.getElementById('modal-submit').onclick = null;` antes de asignar el nuevo handler.

---

### 🟡 [P1] Lógica de normalización de status duplicada 8+ veces

```js
// fluvia.js — idéntico en al menos 8 lugares en JS y Dart
s === 'en viaje' || s === 'active' || s === 'navegando' || s === 'en_viaje'
```

**Fix:**
```js
// fluvia.js — agregar una vez
const isVesselActive = (s) =>
    ['en viaje', 'active', 'navegando', 'en_viaje'].includes(s?.toLowerCase() ?? '');
```

```dart
// lib/utils/vessel_status.dart
bool isVesselActive(String? s) =>
    ['en viaje', 'active', 'navegando', 'en_viaje'].contains(s?.toLowerCase());
```

---

### 🟡 [P1] Imports de `main.dart` en todas las screens para `rootScaffoldKey`

**Archivos:** `dashboard_screen.dart:10`, `bitacora_screen.dart:7`, `map_screen.dart:10`...

```dart
import '../main.dart';  // acoplamiento circular — solo para acceder al drawer
```

**Fix:** Crear `lib/utils/keys.dart` con `final rootScaffoldKey = GlobalKey<ScaffoldState>();` y eliminar el import de `main.dart` en las screens.

---

### 🟡 [P1] Globals en `window` — `var` top-level sin módulo

`fluvia.js` usa `var map`, `var currentUserRole`, `var currentCompanyId`, `var aisMarkers`, `var hidroChart`, `var dashSyncTimer`, `var fleetChart`, `var fuelChart`, `var activityChart`... todos como globals en `window`. Un typo en cualquier función puede corromper el estado global.

**Fix:** Agregar `type="module"` al script tag, convertir los `var` en `const`/`let` de módulo.

---

### 🟡 [P1] Screens acceden a Supabase directamente, bypasando `SupabaseService`

`bitacora_screen.dart:56, 122`, `map_screen.dart:67-73`, `dashboard_screen.dart:89, 97, 136, 146, 156, 163` — todas llaman `Supabase.instance.client.from(...)` directamente, ignorando `lib/services/supabase_service.dart`. Caching, retries, auth-refresh y soporte offline son imposibles de implementar uniformemente con este patrón.

---

### 🟢 [Mejora] Dead code: `loadDashboardExtras` (líneas 658-771)

Función de ~110 líneas que duplica `loadDashboard` (weather, hydro, vessels, logs) pero nunca se llama desde el router. Eliminar.

---

### 🟢 [Mejora] 10 exporters son 70 líneas de boilerplate puro

**Archivo:** `fluvia.js:1128-1199`

`exportFleet`, `exportViajes`, `exportBitacora`... — idénticos excepto por tabla y columnas.

```js
// Reemplazar los 10 por:
function exportTable(source, columns, mapRow) { /* lógica genérica */ }
const exportFleet   = () => exportTable('vessels',  ['...'], (v) => [...]);
const exportViajes  = () => exportTable('voyages',  ['...'], (v) => [...]);
```

---

### 🟢 [Mejora] Fetch de Weather y Hidrología duplicado 4 veces

Weather (Open-Meteo): `fluvia.js:261, 673, 1072` y `dashboard_screen.dart:116`.
Hydro (flood-api): `fluvia.js:690, 778, 795, 813`.

Factorizar en `fetchWeather(lat, lon)` y `fetchHydroStation(stationId)`.

---

## 5. Push Notifications

### 🟡 [P1] Token FCM no se guarda en fresh installs

**Archivo:** `main.dart:93`

```dart
// main() corre antes de cualquier auth — currentUser es siempre null
await _saveFcmToken();  // → no hace nada en primera instalación
```

**Fix:** Llamar `_saveFcmToken()` dentro del listener de `Supabase.instance.client.auth.onAuthStateChange`, no en `main()`.

---

### 🟡 [P1] Tokens FCM inválidos (UNREGISTERED) no se limpian de la DB

**Archivo:** `supabase/functions/send-fcm/index.ts` — no existe lógica de limpieza

Cuando un token es inválido (app desinstalada), FCM retorna `404` o `UNREGISTERED`. La edge function no elimina esos tokens. Con el tiempo, el broadcast a 100 usuarios activos termina enviando a 1000 tokens muertos → más lento y más errores.

**Fix:**
```ts
// En el allSettled loop:
if (r.status === 'fulfilled' && !r.value.ok) {
    const body = await r.value.json();
    if (body.error?.status === 'UNREGISTERED') {
        await supabase.from('user_profiles')
            .update({ fcm_token: null })
            .eq('user_id', userId);
    }
}
```

---

### 🟡 [P1] "sent" inflado — se cuentan Promises fulfilled, no HTTP 200

**Archivo:** `supabase/functions/send-fcm/index.ts:82`

```ts
// Un HTTP 401/403 de FCM es Promise fulfilled → se cuenta como enviado
const sent = results.filter((r) => r.status === "fulfilled").length;
```

**Fix:** `const sent = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;`

---

### 🟡 [P1] Sin rate-limiting para broadcast masivo

**Archivo:** `send-fcm/index.ts:53-80`

Con 10.000 tokens, `Promise.allSettled` dispara 10.000 requests HTTP simultáneos a FCM → rate limits → 429s silenciosos.

**Fix:** Procesar en chunks:
```ts
const CHUNK_SIZE = 200;
for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
    const chunk = tokens.slice(i, i + CHUNK_SIZE);
    await Promise.allSettled(chunk.map(sendToToken));
}
```

---

### 🟢 [Mejora] JWT de Google re-firmado en cada invocación

**Archivo:** `send-fcm/index.ts:95-131`

El JWT para FCM se genera con `crypto.subtle` en cada push (validez 1h). Cachear a nivel módulo y regenerar solo cuando esté por expirar → reduce latencia y CPU significativamente en alto volumen.

---

## 6. Producción / Play Store

### 🔴 [P0] Package name `com.example.riverhub_mobile_v2` no es apto para producción

Google Play **rechaza automáticamente** apps con `com.example.*`. Cambiar a `com.fluvia.app` o `com.riverhub.fluvia` en:

- `android/app/build.gradle` — `applicationId`
- `google-services.json` — `package_name`
- Firebase Console — agregar nueva app con el nuevo package name
- Supabase deep links (si los hay)

Este cambio invalida el keystore actual vinculado al package name anterior — generar un nuevo keystore de producción.

---

### 🔴 [P0] Verificar keystore de producción

Confirmar que el APK final se firma con un keystore de producción (NO `debug.keystore`). El keystore y su contraseña deben estar en un lugar seguro — si se pierden, es imposible actualizar la app en Play Store.

---

### 🟡 [P1] APK de 53MB — razonable pero mejorable

Para publicar en Play Store:
- Usar **Android App Bundle** (`.aab`): `flutter build appbundle --release` → Play genera APKs optimizados por dispositivo (~20MB)
- Alternativamente: `flutter build apk --split-per-abi` → APKs separados por arquitectura (~18-22MB c/u)

---

### 🟡 [P1] GPS en background en iOS requiere configuración adicional

**Archivo:** `gps_tracker_service.dart:23-56`

El tracker actualiza cada 15 segundos. En iOS, `whileInUse` location permission se pausa en background ~30s. Para tracking real de buques se necesita:
- `always` permission en `Info.plist`
- `UIBackgroundModes: [location]` en `Info.plist`

Sin esto el tracking se corta silenciosamente en iOS.

---

### 🟢 [Mejora] Archivos de debug en el repositorio

Deben agregarse a `.gitignore` y purgarse del historial:

```
flutter_error.log, adb_logs.txt, crash.log, error.log, flutter_log.txt,
server_log.txt, firebase-service-account.json, fcm_output.json,
fcm_debug.log, token_fcm.txt, auth_test.json, db_out.json,
insert_error.json, RESCATE_FINAL.json, rpc_out.json, schema.json,
push_fuerza.bat, start_ais.bat, start_system.bat, secure_git_purge.bat
```

---

## 7. Bugs de Datos

| # | Archivo | Línea | Bug |
|---|---------|-------|-----|
| 1 | `fluvia.js` | 850 | `fuelByDay[day] = liters` sobreescribe en lugar de sumar → totales diarios incorrectos |
| 2 | `fluvia.js` | 859 | Gráfico de actividad usa `Math.random()` → datos completamente falsos |
| 3 | `fluvia.js` | 924 | `progress = (now-created)/(eta-created)` → divide-by-zero si `eta === created` |
| 4 | `fluvia.js` | 783 | Índice hardcodeado `vals[7]` asume longitud fija de respuesta de API meteo |
| 5 | `fluvia.js` | 1003 | `if(!vessels[vn])` guarda solo el primer reading, no el más reciente |
| 6 | `dashboard_screen.dart` | 137 | Combustible total limitado a `.limit(50)` → undercount si hay >50 registros |
| 7 | `dashboard_screen.dart` | 97 | Alertas limitadas a `.limit(10)` → máximo reportado es 10 |
| 8 | `dashboard_screen.dart` | 164 | Crew count limitado a `.limit(100)` |
| 9 | `dashboard_screen.dart` | 437 | Velocidad = `(idx * 1.3 + 4.5)` KN — derivada del índice de lista |
| 10 | `fuel_screen.dart` | 82 | Eficiencia = `70 + (vesselId.toString().length % 25)` → inventada |
| 11 | `tracking_screen.dart` | 101-109 | Progress = tiempo transcurrido, no distancia GPS recorrida |
| 12 | `send-fcm/index.ts` | 82 | "sent" inflado: cuenta Promises fulfilled, no respuestas HTTP 200 |

---

## 8. Próximos Pasos Recomendados

### Semana 1 — P0 (bloquean cualquier release comercial)

- [ ] **Rotar todas las credenciales** expuestas en git + purgar historial con `git-filter-repo`
- [ ] **Fixear escalada superadmin** — mover INSERT de `user_profiles` a Edge Function con service-role key
- [ ] **Eliminar los ~50 `innerHTML` con datos de usuario** — agregar función `esc()` y reemplazar sistemáticamente
- [ ] **Cambiar package name** a `com.fluvia.app` y reconfigurar Firebase + keystore
- [ ] **Verificar `verify_jwt: true`** en `supabase/config.toml` para `send-fcm`
- [ ] **Eliminar flujo de pago falso** o integrar Stripe/MercadoPago Checkout

### Semana 2 — P1 (crítico para UX operacional)

- [ ] Reemplazar todos los KPIs falsos (`Math.random()`, índices) con datos reales o placeholder `"—"`
- [ ] Fixear guardado de token FCM — moverlo a `onAuthStateChange`
- [ ] Agregar limpieza de tokens UNREGISTERED en edge function
- [ ] Agregar cleanup en logout: `clearInterval`, `channel.unsubscribe()`
- [ ] Fixear `TextEditingController` leaks en bitácora/fuel/mantenimiento
- [ ] Eliminar auto-reopen del drawer después de pop
- [ ] Agregar `filter: company_id` a suscripción realtime

### Semana 3 — P2 (deuda técnica)

- [ ] Centralizar status normalization en un helper (`isVesselActive`)
- [ ] `Promise.all` en todas las queries independientes (reportes, hidrología)
- [ ] `ValueNotifier` para el timer de sync del dashboard
- [ ] Crear `lib/utils/keys.dart` y desacoplar screens de `main.dart`
- [ ] Mover `loadDashboardExtras` a dead code → eliminar
- [ ] `select('id, name, type, status, ...')` en lugar de `select('*')` en mobile
- [ ] Agregar logs de debug al `.gitignore`

### Decisiones arquitecturales (Q3 2026)

- **SPA monolítico:** 1.200 líneas en un solo `fluvia.js` son manejables hoy. A los ~200 usuarios concurrentes o cuando el equipo crezca, migrar a Vue 3 / Svelte con bundling real. No urgente, pero es deuda técnica real.
- **Patrón repositorio en Flutter:** Centralizar todos los accesos a Supabase en `SupabaseService` para poder agregar caching, retry logic y soporte offline de manera uniforme.
- **Tests:** No existe cobertura de tests más allá del counter test de Flutter template. Para un sistema de gestión de flotas, al menos los queries críticos de `SupabaseService` deberían tener integration tests contra una DB de staging.

---

## 9. Resumen Ejecutivo

| Severidad | Cantidad | Ejemplos clave |
|-----------|----------|----------------|
| 🔴 P0 — Bloquean release | **7** | Auto-superadmin, XSS masivo, secrets en repo, pago falso, package name, modal state leak, KPIs falsos |
| 🟡 P1/P2 — Crítico para producción | **18** | Memory leaks, timer issues, token FCM, rate limiting, queries ineficientes, drawer buggy |
| 🟢 Mejoras de calidad | **12** | DRY, indexes, select('*'), design system consolidation |

**El proyecto tiene una base sólida.** La arquitectura Supabase + FCM + Flutter es correcta para el dominio, el design system es coherente, y las funcionalidades core están implementadas. Los problemas P0 son todos solucionables en 1-2 semanas sin refactorizar la arquitectura.

El mayor riesgo inmediato es la combinación de **XSS masivo + credentials en repo + auto-superadmin**. Si el repo es público o si se da acceso a terceros antes de fixear estos tres puntos, el sistema puede comprometerse completamente.

---

*Generado con Claude Code — 2026-04-22*
