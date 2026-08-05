// AISStream Service - Socket.IO Client
// Connects to the server which receives AIS data from aisstream.io

const AisStreamService = (() => {
    void("🚢 AISStream: Service Module Loaded (Socket.IO Version)");

    let socket = null;
    let _subscribers = [];
    let isConnected = false;
    let statusCallback = null;
    let reconnectAttempts = 0;

    const setStatus = (msg, color = 'white') => {
        void(`[AIS-Status] ${msg}`);
        if (statusCallback) statusCallback(msg, color);
    };

    const setDebugCallback = (fn) => { statusCallback = fn; };

    /**
     * Connect to Server via Socket.IO
     */
    const connect = () => {
        if (isConnected) return;

        // Socket.IO esta deshabilitado a proposito en esta app (ver
        // comentario "SOCKET.IO (Disabled - using native WebSocket via
        // AISStream)" en app.html), asi que `io` nunca esta definido aqui.
        // Antes esto tiraba console.error y se quedaba sin datos: los
        // suscriptores de Dashboard y Mapa (dashboard.js, mapa.js) nunca
        // recibian una sola actualizacion de posicion. Fallback a polling
        // REST del mismo endpoint que ya usa el mapa del panel admin.
        if (typeof io === 'undefined') {
            console.warn("AISStream: Socket.IO no disponible, usando polling REST");
            setStatus("📡 Conectado vía REST (polling)", "#fbbf24");
            connectRestFallback();
            return;
        }

        setStatus("📡 Conectando al servidor...", "#fbbf24");

        try {
            // Connect to same origin (works for localhost and Render)
            socket = io({
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 5000,
                reconnectionAttempts: 10
            });

            socket.on('connect', () => {
                isConnected = true;
                reconnectAttempts = 0;
                setStatus("✅ CONECTADO AL SERVIDOR AIS", "#10b981");
                void("🚢 AISStream: Connected to server");
            });

            // Listen for AIS position updates from server
            socket.on('position_update', (data) => {
                // Parse and normalize the data
                const vesselData = {
                    mmsi: data.UserID || data.mmsi,
                    name: data.ShipName || data.name || 'Unknown',
                    lat: data.Latitude || data.lat,
                    lon: data.Longitude || data.lon,
                    speed: data.Sog || data.speed || 0,
                    course: data.Cog || data.course || 0,
                    heading: data.TrueHeading || data.heading || 0,
                    navStatus: data.NavigationalStatus || 0,
                    timestamp: new Date().toISOString()
                };

                // Notify all subscribers
                _subscribers.forEach(cb => cb(vesselData));

                // Log for debugging
                void(`📡 AIS: ${vesselData.name} (${vesselData.mmsi}) @ ${vesselData.lat?.toFixed(4)}, ${vesselData.lon?.toFixed(4)}`);
            });

            socket.on('disconnect', (reason) => {
                isConnected = false;
                setStatus(`❌ Desconectado: ${reason}`, "#ef4444");
                void("AISStream: Disconnected -", reason);
            });

            socket.on('connect_error', (error) => {
                reconnectAttempts++;
                setStatus(`⚠️ Error de conexión (intento ${reconnectAttempts})`, "#f59e0b");
                console.warn("AISStream: Connection error -", error.message);
            });

        } catch (e) {
            console.error("AISStream: Socket creation failed:", e);
            setStatus("❌ Error al crear socket", "#ef4444");
        }
    };

    let _restInterval = null;

    const connectRestFallback = () => {
        if (_restInterval) return;

        const poll = async () => {
            try {
                const resp = await fetch('/api/ais-positions');
                const data = await resp.json();
                const vessels = Array.isArray(data) ? data : (data.vessels || []);

                isConnected = vessels.length > 0;
                if (isConnected) setStatus(`✅ ${vessels.length} embarcaciones (REST)`, "#10b981");

                vessels.forEach(v => {
                    const vesselData = {
                        mmsi: v.mmsi,
                        name: v.name || 'Unknown',
                        lat: v.lat,
                        lon: v.lon,
                        speed: v.speed || 0,
                        course: v.course || 0,
                        heading: v.heading || 0,
                        navStatus: v.navStatus || 0,
                        timestamp: new Date().toISOString()
                    };
                    _subscribers.forEach(cb => cb(vesselData));
                });
            } catch (e) {
                console.warn("AISStream: REST polling error -", e.message);
            }
        };

        poll();
        _restInterval = setInterval(poll, 15000);
    };

    /**
     * Subscribe to AIS updates
     * @param {Function} callback - Called with vessel data on each update
     */
    const subscribe = (callback) => {
        _subscribers.push(callback);
        void(`AISStream: New subscriber (total: ${_subscribers.length})`);
    };

    /**
     * Unsubscribe from updates
     */
    const unsubscribe = (callback) => {
        _subscribers = _subscribers.filter(cb => cb !== callback);
    };

    /**
     * Check connection status
     */
    const getStatus = () => ({
        connected: isConnected,
        subscriberCount: _subscribers.length
    });

    return {
        connect,
        subscribe,
        unsubscribe,
        setDebugCallback,
        getStatus
    };

})();

window.AisStreamService = AisStreamService;

// Auto-connect when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to let other scripts load
    setTimeout(() => {
        AisStreamService.connect();
    }, 2000);
});
