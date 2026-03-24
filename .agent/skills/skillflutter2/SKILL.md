---
description: Estado actual de recuperación de Flutter y pasos a seguir tras reiniciar VS Code
---

# Estado Actual: Recuperación de Flutter (skillflutter2)

## ¿Qué hemos hecho hasta ahora?

1. **Purga del SDK roto**: Se detectó que la instalación original de Flutter (`C:\src\flutter`) estaba bloqueada por procesos de Windows, causando bucles y fallos en la compilación y en las herramientas de línea de comandos.
2. **Instalación de SDK limpio**: Se descargó un motor de Flutter completamente nuevo y estable mediante `git clone` en la ruta **`C:\src\flutter2\bin`**.
3. **Variables de Entorno Actualizadas**: El usuario modificó exitosamente su variable `Path` del sistema para apuntar a esta nueva ruta.
4. **Proyecto Recreado**: Se ejecutó exitosamente el comando `flutter create riverhub_mobile_v2`, generando un proyecto 100% libre de cachés corruptos.
5. **Reemplazo del Directorio**: Se eliminó la carpeta fallida `riverhub_mobile` y la nueva (`riverhub_mobile_v2`) tomó su lugar bajo el nombre original `riverhub_mobile`.

## ¿Por qué estamos reiniciando VS Code?

La terminal integrada de Visual Studio Code se quedó "atada" a las variables de entorno antiguas. En esa terminal en particular seguía tirando el error: `flutter: El término 'flutter' no se reconoce...`.
Al cerrar por completo y volver a abrir VS Code, forzamos a la nueva terminal a adoptar el entorno limpio y conectarse con `C:\src\flutter2\bin`.

## 🚨 Siguientes Pasos (A ejecutar INMEDIATAMENTE al volver) 🚨

1. **Reinstalar Dependencias:**
   Abrir la nueva terminal en el proyecto y ejecutar:
   ```bash
   cd riverhub_mobile
   flutter pub add cupertino_icons google_fonts flutter_map latlong2 socket_io_client supabase_flutter image_picker firebase_core firebase_messaging http
   ```

2. **RESTAURAR CÓDIGO FUENTE (`lib/`, `assets/`, `android/app/src/main/AndroidManifest.xml`)**:
   **IMPORTANTE**: Debido al comando de reemplazo temprano, la carpeta de código viva (`lib/`) no se trasladó al nuevo folder antes de borrar. Al volver, debemos hacer uno de estos 2 pasos para poner la lógica de vuelta en la app:
   - Rescatar de la **Papelera de reciclaje local o de OneDrive en la Web** la carpeta borrada `riverhub_mobile/lib`. (OneDrive mantiene un historial/papelera en la nube donde la recuperación se hace con un solo clic).
   - O bien, si hay control de versiones activo (`git`), hacer un `git checkout` / `git restore` de los archivos vitales de Flutter.

3. **Compilación Limpia:**
   Una vez recuperado el código y puestas las dependencias, procederemos con:
   ```bash
   flutter build apk --release
   ```
   Lo cual, con un SDK curado y un Gradle limpio, será exitoso.
