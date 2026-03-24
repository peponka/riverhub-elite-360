---
name: RiverHub Mobile Setup & Troubleshooting
description: Guía definitiva paso a paso de cómo configurar, compilar y solucionar los errores de conexión de la app móvil RiverHub (Flutter) con Supabase en el emulador de Android.
---

# RiverHub Mobile - Guía de Supervivencia y Errores Comunes

Este documento documenta todos los obstáculos superados al intentar levantar la aplicación móvil en un emulador Android y conectarla con Supabase. **LEER ANTES DE EMPEZAR UNA NUEVA SESIÓN.**

## 1. Problema: "Target of URI doesn't exist" (Paquetes faltantes)
Si el código muestra errores rojos en los `import` (ej. `supabase_flutter`), significa que faltan dependencias.
**Solución:** 
1. Asegurarse de estar en la carpeta de la app: `cd c:\Users\pepeq\OneDrive\Desktop\RIverhub\riverhub_mobile`
2. Correr: `flutter pub get`
3. Si el error persiste específicamente con Supabase: `flutter pub add supabase_flutter`

## 2. Problema: Error de compilación "No pubspec.yaml file found"
Al intentar correr `flutter run` o `flutter pub get` aparece este error en rojo.
**Solución:** Estás en la carpeta equivocada (probablemente en la raíz del proyecto web). 
Siempre que uses comandos de Flutter, debes entrar primero a la carpeta móvil:
```cmd
cd riverhub_mobile
flutter run
```

## 3. Problema: "System UI isn't responding" en el Emulador
Al compilar la app por primera vez (`assembleDebug`), el emulador (Pixel) se congela y saca un cartel blanco.
**Solución:** Es normal por falta temporal de RAM durante la compilación pesada. **NUNCA darle a Close App**. Siempre seleccionar la opción **"Wait"**.

## 4. Problema crítico: "Failed host lookup: nfybnpdrtvyxucgpqmmo.supabase.co" (SocketException)
La app compila y abre perfectamente en el celular, pero al apretar "Iniciar Sesión" lanza un error de acceso ("Failed host lookup").
**Causa:** Android bloquea el acceso a internet de las apps por defecto si no se le especifica lo contrario. Además, la URL de Supabase puede tener un error tipográfico.
**Soluciones aplicadas (YA RESUELTOS):**
- **Permiso de Internet:** Se inyectó `<uses-permission android:name="android.permission.INTERNET" />` dentro del archivo `android/app/src/main/AndroidManifest.xml`.
- **Paquete HTTP:** Se corrió `flutter pub add http`.
- **Corrección de URL:** Se corrigió el typo de la URL en `lib/main.dart` (de `nfybn...pdrTv...` a `nfybn...npdrv...`).

## 5. Problema: Cambio de clave por "localhost" (Bucle de recuperación)
Al enviar un link de "Recuperar contraseña" desde Supabase, el correo redirige a `localhost:3000`, una página que no carga, por lo que es imposible cambiar la clave.
**Solución Definitiva (Forzar Clave por SQL):**
En lugar de usar el correo, cambiar la contraseña a la fuerza usando el **SQL Editor** dentro del panel web de Supabase:
1. Ir a Supabase -> SQL Editor -> New Query.
2. Pegar este código (cambiando el email y la clave deseada):
```sql
UPDATE auth.users
SET encrypted_password = crypt('riverhub123', gen_salt('bf'))
WHERE email = 'pepeq68@gmail.com';
```
3. Darle a **Run**. El cambio es instantáneo y se puede usar en la app móvil inmediatamente.

## 6. Siguientes Pasos (Roadmap de UI)
Lo próximo a desarrollar en la pantalla de Login (Cupertino Design):
- [ ] Botón "Iniciar sesión con Google" (OAuth de Supabase).
- [ ] Botón/Pantalla de "Registro de Nuevo Usuario" nativo.
- [ ] Botón modal de "Olvidé mi contraseña" (Trigger de reseteo).
