---
name: Flutter Local Notifications v21 Ultimate Crash Fix
description: Registro definitivo de la victoria sobre la librería flutter_local_notifications v21.0.0+. Documenta cómo resolver el "Exit Code 1" de Gradle (Desugaring), el Error de Compilación Dart de argumentos posicionales, y el fatal "Native Crash" de Android al lanzar la APK en teléfonos físicos.
---

# 🚨 flutter_local_notifications v21.0.0+ (La Bestia Negra de Android)

Este documento registra la épica resolución de una cascada de errores destructivos (desde compiladores Dart, hasta bloqueos silenciosos de Gradle y muertes súbitas en teléfonos físicos) desatados por la purga de paquetes y actualización silente de `flutter_local_notifications` a la versión `v21.0.0+`. 

Si alguna vez este plugin vuelve a romper la app o tira "Exit Code 1", **ESTE ES EL PROTOCOLO EXACTO.**

---

## 💀 Nivel 1: El Escudo de Dart (Errores Linter en `main.dart`)
**El Síntoma:** `Too many positional arguments: 0 allowed, but X found.` en el comando `flutter analyze`.

**La Causa:** En la versión v21.0.0+, los creadores del plugin eliminaron el soporte para enviar argumentos por "orden" (posicionales) en sus métodos principales, forzando a que ahora todos sean nombrados estrictamente.

**La Solución:** Cambiar toda invocación a sintaxis de `key: value`.
1. **En la Inicialización (`.initialize()`):**
```dart
// ANTES (Crasheaba): 
await flutterLocalNotificationsPlugin.initialize(initializationSettings);

// DESPUÉS (Correcto):
await flutterLocalNotificationsPlugin.initialize(
  settings: initializationSettings,
);
```

2. **En la Visualización (`.show()`):**
```dart
// ANTES (Crasheaba):
flutterLocalNotificationsPlugin.show(
  notification.hashCode,
  notification.title,
  notification.body,
  NotificationDetails(...)
);

// DESPUÉS (Correcto):
flutterLocalNotificationsPlugin.show(
  id: notification.hashCode,
  title: notification.title,
  body: notification.body,
  notificationDetails: NotificationDetails(...)
);
```

---

## 💀 Nivel 2: El Candado Invisible de Android (Error de Gradle Exit Code 1)
**El Síntoma:** El comando `flutter build apk` falla tras ~40 segundos. La terminal de Visual Studio Code solo arroja "Exit Code 1", pero si extraemos el log completo por detrás dice:
`Dependency ':flutter_local_notifications' requires desugar_jdk_libs version to be 2.1.4 or above for :app...`

**La Causa:** El plugin moderno requiere librerías internas de Java 17 ("Core Library Desugaring" superior a 2.1.4). Si la app de Gradle no tiene esto activado, aborta la construcción automáticamente.

**La Solución:** Inyectar las banderas de compatibilidad profunda en Gradle.
Ir a `android/app/build.gradle.kts` (o `build.gradle` clásico) e incorporar:
```kotlin
android {
    compileOptions {
        isCoreLibraryDesugaringEnabled = true  // <-- 1) Habilitar Desugaring Nativo
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("androidx.multidex:multidex:2.0.1")
    // 2) Levantar la librería obligatoria a v2.1.5 (Nunca menor a 2.1.4)
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")
}
```

---

## 💀 Nivel 3: El "Native Crash" Letal en Teléfonos Físicos Reales (Muerte al Inicio)
**El Síntoma:** La APK compila con éxito y se instala en el Redmi/Xiaomi/Samsung. Al tocar el ícono de "Riverhub", salta una ventana instantánea del sistema operativo: *"Sistema Android Ahora: Error de aplicación. Riverhub falló debido a problemas propios"*. Jamás abre ni pantalla blanca.

**La Causa (x2 combinadas):**
1. **El Orden de Arranque:** El código Dart intentaba crear un canal de notificaciones en Android (`.createNotificationChannel(channel)`) **ANTES** de hacer el bind seguro de Contextos con `.initialize()`. Al despertar Android e intentar usar recursos en el vacío, la Máquina Virtual de Java detectaba un `NullPointerException` fulminante, cerrando la app por seguridad.
2. **Permisos Huérfanos:** Android 13/14 exigen estrictamente el permiso `POST_NOTIFICATIONS`.

**La Solución Estricta:**
1. En `AndroidManifest.xml` (Ruta: `android/app/src/main/AndroidManifest.xml`) debe existir:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

2. El Orden Maestro en `main.dart` **JAMÁS DEBE ALTERARSE:**
```dart
// PASO 1 ABSOLUTO: Inicializar primero las configs para crear un Context Nativo válido.
await flutterLocalNotificationsPlugin.initialize(
  settings: initializationSettings,
);

// PASO 2 POSTERIOR: Ya podemos tocar la placa de metal base del Sistema Operativo canalizando la info.
await flutterLocalNotificationsPlugin
  .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
  ?.createNotificationChannel(channel);
```

---

## 🧹 Comando de Lavado Universal (Panic Button)
Si alguna de estas dependencias bloquea a Windows por procesos fantasmas, correr esto libera la computadora:
```powershell
taskkill /F /IM java.exe
taskkill /F /IM gradle.exe
flutter clean
flutter pub get
flutter build apk
```
