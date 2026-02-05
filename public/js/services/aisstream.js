const AisStreamService = (() => {

    console.log("AISStream: Service Module Loaded.");

    // API CONFIG
    // Check if running on Android (Capacitor) to use 10.0.2.2 special IP
    const isAndroid = window.Capacitor && window.Capacitor.getPlatform() === 'android';

    // Configurable Socket URL
    const SOCKET_URL = window.AppConfig?.navigation?.socketUrl
        || (isAndroid ? "ws://10.0.2.2:3000" : "ws://127.0.0.1:3000");

    let socket = null;
    let _subscribers = [];
    let isConnected = false;
    let keepAliveInterval = null;
    let statusCallback = null;

    const setStatus = (msg, color = 'white') => {
        console.log(`[AIS-Status] ${msg}`);
        if (statusCallback) statusCallback(msg, color);
    };

    const setDebugCallback = (fn) => { statusCallback = fn; };

    /**
     * Connect to Local Relay WebSocket
     */
    const connect = () => {
        if (isConnected) return;

        setStatus("📡 Buscando Puente (127.0.0.1:3000)...", "#fbbf24"); // Yellow

        try {
            socket = new WebSocket(SOCKET_URL);

            // CONNECTION WATCHDOG
            setTimeout(() => {
                if (!isConnected && socket.readyState !== WebSocket.OPEN) {
                    console.warn("AISStream: Relay timeout.");
                    setStatus("⚠️ Puente no detectado. Revisa 'node ais_relay.js'", "#ef4444");
                    try { socket.close(); } catch (e) { }
                }
            }, 5000);

        } catch (e) {
            console.error("AISStream: Socket Creation Failed:", e);
            setStatus("Socket Error (Content Security Policy?)", "#ef4444");
            return;
        }

        socket.onopen = function () {
            isConnected = true;
            setStatus("✅ CONECTADO AL PUENTE LOCAL", "#10b981"); // Green
            startKeepAlive();
        };

        socket.onmessage = function (event) {
            try {
                const message = JSON.parse(event.data);

                if (message["MessageType"] === "PositionReport") {
                    notifySubscribers(message);
                    setStatus("Receiving Live Data 📡", "#10b981"); // Green
                }

            } catch (e) {
                console.warn("AISStream Parse Error:", e);
            }
        };

        socket.onclose = function (event) {
            isConnected = false;
            setStatus(`Connection Closed (${event.code})`, "#ef4444");
            stopKeepAlive();

            // Auto Reconnect
            setTimeout(() => {
                setStatus("Reconnecting in 5s...", "#f59e0b");
                connect();
            }, 5000);
        };

        socket.onerror = function (error) {
            setStatus("WebSocket Error (Check Console)", "#ef4444");
            console.error("AISStream Error:", error);
        };
    };

    /**
     * Provide standardized vessel data to subscribers
     */
    const notifySubscribers = (rawMsg) => {
        const report = rawMsg["Message"]["PositionReport"];
        const meta = rawMsg["MetaData"];

        if (!report || !meta) return;

        // Standardize Data Schema for our App
        const vesselData = {
            mmsi: report["UserID"], // MMSI
            name: meta["ShipName"].trim(),
            lat: report["Latitude"],
            lon: report["Longitude"],
            speed: report["Sog"], // Speed over ground
            course: report["Cog"], // Course over ground
            heading: report["TrueHeading"],
            // Additional info
            navStatus: report["NavigationalStatus"],
            // Timestamp
            timestamp: new Date().toISOString()
        };

        _subscribers.forEach(cb => cb(vesselData));
    };

    /**
     * Subscribe to updates
     * @param {Function} callback (vesselData) => {}
     */
    const subscribe = (callback) => {
        _subscribers.push(callback);
    };

    const startKeepAlive = () => {
        keepAliveInterval = setInterval(() => {
            // Heartbeat
        }, 30000);
    };

    const stopKeepAlive = () => {
        clearInterval(keepAliveInterval);
    };

    return {
        connect,
        subscribe,
        setDebugCallback
    };

})();

window.AisStreamService = AisStreamService;
