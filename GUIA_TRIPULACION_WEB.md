# GUÍA RÁPIDA - USO DE TRIPULACIÓN DESDE WEB

## 🌐 Configuración Inicial (Una sola vez)

### En tu PC:
1. Asegurate que el servidor esté corriendo:
   ```
   cd C:\Users\pepeq\OneDrive\Desktop\RIverhub
   node server.js
   ```
2. Verificá tu IP local:
   ```
   ipconfig
   ```
   Ejemplo: `192.168.1.100`

### En tu Celular Android:
1. **Conectate a la misma red WiFi** que tu PC
2. Abrí **Chrome**
3. Andá a: `http://TU_IP:3000`
   - Ejemplo: `http://192.168.1.100:3000`
4. Una vez cargada la app:
   - Tocá los **3 puntitos** (menú)
   - Seleccioná **"Agregar a pantalla de inicio"**
   - Dale un nombre: **"RiverHub Web"**
5. Ahora tenés el ícono en tu pantalla como una app

---

## 📱 Uso Diario

### Para módulos generales:
✅ Usá el APK normal de Android (`RIVERHUB_PRODUCTION_V1.apk`)

### Para Tripulación específicamente:
1. Abrí el ícono **"RiverHub Web"** desde tu pantalla de inicio
2. Navegá a **Tripulación & Safety**
3. Tocá **"+ NUEVO TRIPULANTE"**
4. Vas a ver las opciones de barcos correctamente:
   - TB PARAGUAY 01
   - R/M HERCULES
   - B/M TITAN
   - R/M CENTAURO
5. Completá el formulario
6. Guardá

---

## 🔄 Alternativas

### Opción A: Usar todo desde Web
- Más estable para tripulación
- Requiere conexión a WiFi local
- Todo funciona 100%

### Opción B: Híbrido (Recomendado)
- Android para uso diario (14 módulos)
- Web solo para tripulación
- Mejor de ambos mundos

---

## ⚡ Troubleshooting

**Si no carga la web desde el celular:**
- Verificá que estén en la misma red WiFi
- Desactivá el firewall de Windows temporalmente
- Probá también con: `http://localhost:3000` si estás en el mismo dispositivo

**Si el servidor se cierra:**
- Volvé a ejecutar `node server.js` en la PC
- Considerá usar PM2 para que corra siempre:
  ```
  npm install -g pm2
  pm2 start server.js --name riverhub
  pm2 save
  ```

---

## 🎯 Cuando se resuelva la limitación

Una vez que investigue y resuelva el problema de caché de Capacitor:
1. Te avisaré
2. Generaré un APK actualizado
3. Tripulación funcionará directo en la app Android
4. Ya no necesitarás la versión web

**Nota:** Esto es una solución temporal y práctica. La web funciona perfecto, solo requiere la configuración inicial de 2 minutos.
