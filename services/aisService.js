const WebSocket = require('ws');

class AISService {
    constructor(io, supabaseClient) {
        this.io = io;
        this.supabase = supabaseClient;
        this.API_KEY = process.env.AIS_API_KEY || '';
        this.HIDROVIA_BOX = [[[-36.0, -63.0], [-18.0, -53.0]]];
        this.aisConnected = false;
        this.aisReconnectTimer = null;
        this.aisPositions = {}; // Store in service
    }

    startAISStream(appLocals) {
        if (!this.API_KEY) {
            console.warn('⚠️ AIS API Key: usando fallback. Configurar AIS_API_KEY en .env para producción.');
        }
        
        console.log("📡 Conectando a AISStream...");
        const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

        ws.on('open', () => {
            this.aisConnected = true;
            if (appLocals) appLocals.aisConnected = true;
            console.log("✅ Satélite AIS conectado");
            ws.send(JSON.stringify({
                Apikey: this.API_KEY,
                BoundingBoxes: this.HIDROVIA_BOX,
                FilterMessageTypes: ["PositionReport"]
            }));
        });

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data);
                if (msg.MessageType === "PositionReport") {
                    const ship = msg.Message.PositionReport;
                    if (msg.MetaData && msg.MetaData.ShipName) {
                        ship.ShipName = msg.MetaData.ShipName.trim();
                    }
                    this.io.emit('position_update', ship);

                    const mmsi = ship.UserID || ship.mmsi;
                    if (mmsi) {
                        const position = {
                            mmsi,
                            name: ship.ShipName || 'Unknown',
                            lat: ship.Latitude,
                            lon: ship.Longitude,
                            speed: ship.Sog || 0,
                            course: ship.Cog || 0,
                            heading: ship.TrueHeading || 0,
                            timestamp: new Date().toISOString()
                        };
                        this.aisPositions[mmsi] = position;
                        if (appLocals && appLocals.aisPositions) {
                            appLocals.aisPositions[mmsi] = position;
                        }

                        // Sync to Supabase
                        if (this.supabase) {
                            this.supabase.from('vessels')
                                .update({
                                    current_lat: ship.Latitude,
                                    current_lng: ship.Longitude,
                                    last_position_update: new Date().toISOString()
                                })
                                .eq('mmsi', mmsi.toString())
                                .then() 
                                .catch(() => {});
                        }
                    }
                }
            } catch (e) { }
        });

        ws.on('error', (e) => {
            this.aisConnected = false;
            if (appLocals) appLocals.aisConnected = false;
            console.warn("⚠️ Error AIS:", e.message);
        });

        ws.on('close', (code) => {
            this.aisConnected = false;
            if (appLocals) appLocals.aisConnected = false;
            console.log(`❌ AIS desconectado (${code}). Reintentando en 15s...`);
            if (this.aisReconnectTimer) clearTimeout(this.aisReconnectTimer);
            this.aisReconnectTimer = setTimeout(() => this.startAISStream(appLocals), 15000);
        });
    }

    getPositions() {
        return this.aisPositions;
    }

    isConnected() {
        return this.aisConnected;
    }
}

module.exports = AISService;
