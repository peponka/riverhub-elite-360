/*
 * MAPA MODULE (FLUVIAFLEET / MAPLIBRE GL JS)
 * Real AIS data via Socket.IO + REST API
 */

const MapLogicFluvia = (() => {

    let map = null;
    let aisMarkers = {};
    let isConnected = false;
    let socket = null;
    let vesselCount = 0;

    const init = () => {
        console.log("🗺️ MapLogic (MapLibre) Iniciando con AIS real...");
        
        if (typeof maplibregl === 'undefined') {
            console.error("MapLibre no cargado.");
            return;
        }

        const container = document.getElementById('maplibre-canvas');
        if (!container) return;

        map = new maplibregl.Map({
            container: 'maplibre-canvas',
            style: {
                version: 8,
                sources: {
                    'carto-light': {
                        type: 'raster',
                        tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
                        tileSize: 256,
                        attribution: '&copy; OpenStreetMap, &copy; CARTO'
                    }
                },
                layers: [{
                    id: 'carto-light',
                    type: 'raster',
                    source: 'carto-light',
                    minzoom: 0,
                    maxzoom: 22
                }]
            },
            center: [-58.5, -30.0],
            zoom: 5,
            attributionControl: false
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');

        map.on('load', () => {
            // Add Hidrovía route overlay
            map.addSource('route', {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': [
                            [-57.65, -25.28],  // Asunción
                            [-57.53, -27.45],  // Corrientes
                            [-59.64, -29.15],  // Santa Fe
                            [-60.63, -32.95],  // Rosario
                            [-59.65, -33.75],  // San Nicolás
                            [-58.22, -33.90],  // Zárate
                            [-58.37, -34.60]   // Buenos Aires
                        ]
                    }
                }
            });
            map.addLayer({
                'id': 'route',
                'type': 'line',
                'source': 'route',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#3b82f6',
                    'line-width': 2.5,
                    'line-dasharray': [2, 4],
                    'line-opacity': 0.6
                }
            });

            // Auto-connect to AIS
            connectAIS();
        });
    };

    const connectAIS = () => {
        // 1. Fetch initial positions via REST
        fetchInitialPositions();

        // 2. Connect Socket.IO for real-time updates
        connectSocketIO();
    };

    const fetchInitialPositions = async () => {
        try {
            const resp = await fetch('/api/ais-positions');
            const data = await resp.json();
            
            if (Array.isArray(data)) {
                data.forEach(vessel => addOrUpdateVessel(vessel));
            } else if (typeof data === 'object') {
                // Object keyed by MMSI
                Object.values(data).forEach(vessel => addOrUpdateVessel(vessel));
            }
            
            updateVesselCounter();
            console.log(`📡 AIS: ${vesselCount} embarcaciones cargadas desde API`);
            
            if (window.RiverToast) {
                window.RiverToast.success(`${vesselCount} embarcaciones AIS cargadas en tiempo real`);
            }
        } catch (err) {
            console.warn('⚠️ No se pudo cargar posiciones AIS iniciales:', err.message);
        }
    };

    const connectSocketIO = () => {
        if (typeof io === 'undefined') {
            console.warn('Socket.IO no disponible, usando solo REST API');
            // Poll every 15 seconds as fallback
            setInterval(fetchInitialPositions, 15000);
            return;
        }

        socket = io();
        
        socket.on('connect', () => {
            isConnected = true;
            console.log('🔌 Socket.IO conectado para AIS real-time');
            updateConnectionUI(true);
        });

        socket.on('position_update', (data) => {
            addOrUpdateVessel(data);
            updateVesselCounter();
        });

        socket.on('disconnect', () => {
            isConnected = false;
            console.log('🔌 Socket.IO desconectado');
            updateConnectionUI(false);
        });
    };

    const addOrUpdateVessel = (vessel) => {
        // Normalize field names (handle both formats)
        const mmsi = vessel.mmsi || vessel.UserID || vessel.MMSI;
        const lat = vessel.lat || vessel.Latitude || vessel.latitude;
        const lon = vessel.lon || vessel.Longitude || vessel.longitude;
        const name = vessel.name || vessel.ShipName || vessel.ship_name || 'Unknown';
        const speed = vessel.speed || vessel.Sog || vessel.sog || 0;
        const course = vessel.course || vessel.Cog || vessel.cog || 0;
        const heading = vessel.heading || vessel.TrueHeading || 0;

        if (!mmsi || lat === undefined || lon === undefined) return;
        if (isNaN(lat) || isNaN(lon)) return;

        const id = String(mmsi);

        // Determine vessel status based on speed
        const isMoving = speed > 0.5;
        const statusColor = isMoving ? '#2EA043' : '#94A3B8';
        const statusText = isMoving ? 'EN NAVEGACIÓN' : 'FONDEADO';

        if (aisMarkers[id]) {
            // Update existing marker position
            aisMarkers[id].marker.setLngLat([lon, lat]);
            // Update popup content
            aisMarkers[id].marker.setPopup(
                new maplibregl.Popup({ offset: 15, closeButton: false })
                    .setHTML(buildPopupHTML(name, mmsi, lat, lon, speed, course, statusText, statusColor))
            );
            // Update dot color
            aisMarkers[id].el.style.backgroundColor = statusColor;
        } else {
            // Create new marker
            const el = document.createElement('div');
            el.style.width = '10px';
            el.style.height = '10px';
            el.style.backgroundColor = statusColor;
            el.style.borderRadius = '50%';
            el.style.border = '2px solid rgba(255,255,255,0.9)';
            el.style.boxShadow = `0 0 6px ${statusColor}80`;
            el.style.cursor = 'pointer';
            el.style.transition = 'all 0.3s ease';

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([lon, lat])
                .setPopup(
                    new maplibregl.Popup({ offset: 15, closeButton: false })
                        .setHTML(buildPopupHTML(name, mmsi, lat, lon, speed, course, statusText, statusColor))
                )
                .addTo(map);

            aisMarkers[id] = { marker, el };
            vesselCount++;
        }
    };

    const buildPopupHTML = (name, mmsi, lat, lon, speed, course, statusText, statusColor) => {
        return `
            <div style="font-family:'Inter',sans-serif; min-width:200px;">
                <strong style="font-size:0.9rem; color:#1a1a2e; display:block; margin-bottom:6px;">
                    🚢 ${name}
                </strong>
                <div style="font-size:0.7rem; color:#64748b; line-height:1.6;">
                    <div>MMSI: <strong>${mmsi}</strong></div>
                    <div>Lat: ${Number(lat).toFixed(4)}° | Lon: ${Number(lon).toFixed(4)}°</div>
                    <div>Vel: <strong>${Number(speed).toFixed(1)} kn</strong> | Rumbo: ${Number(course).toFixed(0)}°</div>
                </div>
                <div style="margin-top:8px; background:${statusColor}15; color:${statusColor}; 
                    padding:3px 8px; border-radius:4px; font-size:0.65rem; font-weight:700; 
                    display:inline-block; border: 1px solid ${statusColor}30;">
                    ${statusText}
                </div>
            </div>
        `;
    };

    const updateVesselCounter = () => {
        vesselCount = Object.keys(aisMarkers).length;
        // Update any counter elements in the UI
        const counter = document.getElementById('vessel-count') || document.getElementById('ais-count');
        if (counter) counter.textContent = vesselCount;
        
        // Also update the panel title if exists
        const panel = document.querySelector('.mfc-status');
        if (panel) panel.textContent = `${vesselCount} embarcaciones AIS en vivo`;
    };

    const updateConnectionUI = (connected) => {
        const btn = document.getElementById('btn-connect');
        const apiInput = document.getElementById('ais-apikey');
        
        if (btn) {
            if (connected) {
                btn.innerText = 'CONECTADO';
                btn.style.background = '#2EA043';
                btn.style.borderColor = '#2EA043';
            } else {
                btn.innerText = 'RECONECTANDO...';
                btn.style.background = '#F59E0B';
                btn.style.borderColor = '#F59E0B';
            }
        }
        if (apiInput) {
            apiInput.value = 'Conectado via servidor — datos AIS en tiempo real';
            apiInput.disabled = true;
        }
    };

    const toggleConnection = () => {
        if (isConnected && socket) {
            // Disconnect
            socket.disconnect();
            isConnected = false;
            
            // Clear all markers
            Object.values(aisMarkers).forEach(({ marker }) => marker.remove());
            aisMarkers = {};
            vesselCount = 0;
            updateVesselCounter();
            
            const btn = document.getElementById('btn-connect');
            if (btn) {
                btn.innerText = 'CONECTAR';
                btn.style.background = 'var(--text-main)';
                btn.style.borderColor = 'var(--text-main)';
            }
            const apiInput = document.getElementById('ais-apikey');
            if (apiInput) {
                apiInput.value = '';
                apiInput.disabled = false;
            }
            
            if (window.RiverToast) window.RiverToast.info('Desconectado de AIS Stream');
        } else {
            // Reconnect
            connectAIS();
            if (window.RiverToast) window.RiverToast.success('Reconectando a AIS Stream...');
        }
    };

    const setLayer = (layerName) => {
        document.querySelectorAll('.mfc-btn').forEach(b => b.classList.remove('active'));
        if (event && event.target) event.target.classList.add('active');

        const tileUrls = {
            'light': 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            'dark': 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'satellite': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        };

        const url = tileUrls[layerName];
        if (url && map) {
            map.getSource('carto-light').tiles = [url];
            map.style.sourceCaches['carto-light'].clearTiles();
            map.style.sourceCaches['carto-light'].update(map.transform);
            map.triggerRepaint();
            if (window.RiverToast) window.RiverToast.info(`Capa ${layerName} activada`);
        }
    };

    const toggleTweaks = () => {
        const p = document.getElementById('tweaks-panel');
        if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none';
    };

    // Public API
    return { init, toggleConnection, setLayer, toggleTweaks };
})();

window.MapLogicFluvia = MapLogicFluvia;
