const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

// Config
const AIS_KEY = process.env.AIS_API_KEY || '';
const SUPABASE_URL = 'https://nfybnnpdrvyxucgpqmmo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || '';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// Hidrovia Paraguay-Parana bounding box
// From northern Paraguay (~-19 lat) to Buenos Aires (~-35 lat)
const HIDROVIA_BBOX = [
    [[-19.0, -62.0], [-35.0, -56.0]]
];

let messageCount = 0;
let savedCount = 0;

function connect() {
    console.log('[AIS] Connecting to AISStream...');
    const socket = new WebSocket('wss://stream.aisstream.io/v0/stream');

    socket.onopen = function() {
        console.log('[AIS] Connected! Subscribing to Hidrovia Paraguay-Parana...');
        const sub = {
            Apikey: AIS_KEY,
            BoundingBoxes: HIDROVIA_BBOX,
            FilterMessageTypes: ['PositionReport', 'StandardClassBPositionReport', 'ShipStaticData']
        };
        socket.send(JSON.stringify(sub));
        console.log('[AIS] Subscription sent. Waiting for vessels...');
    };

    socket.onmessage = async function(event) {
        try {
            const msg = JSON.parse(event.data);
            messageCount++;

            if (msg.error) {
                console.error('[AIS] Error:', msg.error);
                return;
            }

            const meta = msg.MetaData || {};
            const lat = meta.latitude || meta.Latitude;
            const lng = meta.longitude || meta.Longitude;
            const mmsi = meta.MMSI;
            const shipName = (meta.ShipName || '').trim();

            if (!lat || !lng || !mmsi) return;

            // Extract speed and course from position reports
            let sog = null, cog = null, heading = null;
            if (msg.MessageType === 'PositionReport' && msg.Message?.PositionReport) {
                const pr = msg.Message.PositionReport;
                sog = pr.Sog;
                cog = pr.Cog;
                heading = pr.TrueHeading;
            } else if (msg.MessageType === 'StandardClassBPositionReport' && msg.Message?.StandardClassBPositionReport) {
                const pr = msg.Message.StandardClassBPositionReport;
                sog = pr.Sog;
                cog = pr.Cog;
                heading = pr.TrueHeading;
            }

            // Upsert to Supabase
            const { error } = await sb.from('ais_traffic').upsert({
                mmsi: mmsi.toString(),
                ship_name: shipName || 'UNKNOWN',
                latitude: lat,
                longitude: lng,
                speed: sog,
                course: cog,
                heading: heading,
                message_type: msg.MessageType,
                updated_at: new Date().toISOString()
            }, { onConflict: 'mmsi' });

            if (error) {
                if (savedCount === 0) console.error('[AIS] Supabase error:', error.message);
            } else {
                savedCount++;
                if (savedCount % 10 === 0 || savedCount <= 5) {
                    console.log(`[AIS] ${shipName || mmsi} @ ${lat.toFixed(4)}, ${lng.toFixed(4)} | SOG: ${sog} | Messages: ${messageCount} | Saved: ${savedCount}`);
                }
            }
        } catch (e) {
            // Silently ignore parse errors
        }
    };

    socket.onerror = function(err) {
        console.error('[AIS] WebSocket error:', err.message || err);
    };

    socket.onclose = function() {
        console.log('[AIS] Connection closed. Reconnecting in 5s...');
        setTimeout(connect, 5000);
    };
}

console.log('=== RiverHub AIS Proxy ===');
console.log('Hidrovia Paraguay-Parana: Lat -19 to -35, Lng -62 to -56');
console.log('Streaming to Supabase table: ais_traffic');
console.log('');
connect();
