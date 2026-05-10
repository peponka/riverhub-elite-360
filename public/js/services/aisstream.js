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

        // Check if Socket.IO is available
        if (typeof io === 'undefined') {
            console.error("AISStream: Socket.IO not loaded!");
            setStatus("❌ Socket.IO no disponible", "#ef4444");
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
