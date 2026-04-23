/*
 * MAPA MODULE (FLUVIAFLEET / MAPLIBRE GL JS)
 */

const MapLogicFluvia = (() => {

    let map = null;
    let aisMarkers = {};
    let isDemo = true;

    const init = () => {
        console.log("🗺️ MapLogic (MapLibre) Iniciando...");
        
        if (typeof maplibregl === 'undefined') {
            console.error("MapLibre no cargado.");
            return;
        }

        const container = document.getElementById('maplibre-canvas');
        if (!container) return;

        // Use Carto Light Raster to prevent Localhost/CORS blocking
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

        // Add river path overlay
        map.on('load', () => {
            // Simulated river path geojson
            map.addSource('route', {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': [
                            [-58.8, -27.5], // Corrientes
                            [-60.6, -32.8], // Rosario
                            [-58.3, -34.6]  // BsAs
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
                    'line-width': 3,
                    'line-dasharray': [2, 4]
                }
            });

            // Start Mock Engine immediately for Demo
            startMockAIS();
        });
    };

    const startMockAIS = () => {
        const ships = [
            { id: '1', name: 'TB PARAGUAY 01', lat: -27.5, lon: -58.8, speed: 0.05 },
            { id: '2', name: 'R/M HERCULES', lat: -32.8, lon: -60.6, speed: -0.03 },
            { id: '3', name: 'Itaipú 07', lat: -33.5, lon: -59.5, speed: 0.02 }
        ];

        const updatePositions = () => {
            if (!isDemo) return;

            ships.forEach(v => {
                v.lat += (Math.random() - 0.5) * 0.02 + (v.speed * 0.1);
                v.lon += (Math.random() - 0.5) * 0.02;

                if (aisMarkers[v.id]) {
                    aisMarkers[v.id].setLngLat([v.lon, v.lat]);
                } else {
                    // Create minimal custom marker element
                    const el = document.createElement('div');
                    el.style.width = '12px';
                    el.style.height = '12px';
                    el.style.backgroundColor = 'var(--status-ok)';
                    el.style.borderRadius = '50%';
                    el.style.border = '2px solid #FFFFFF';
                    el.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
                    el.style.cursor = 'pointer';

                    const marker = new maplibregl.Marker({ element: el })
                        .setLngLat([v.lon, v.lat])
                        .setPopup(new maplibregl.Popup({ offset: 15 })
                            .setHTML(`
                                <strong style="font-family:var(--font-brand); font-size:1rem; color:var(--text-main); display:block; margin-bottom:5px;">${v.name}</strong>
                                <span style="color:var(--text-sec); font-family:var(--font-data); font-size:0.75rem;">MMSI: ${v.id}0000</span>
                                <div style="margin-top:10px; background:rgba(46,160,67,0.1); color:var(--status-ok); padding:3px 6px; border-radius:4px; font-size:0.65rem; font-weight:700; display:inline-block;">EN VIVO</div>
                            `))
                        .addTo(map);

                    aisMarkers[v.id] = marker;
                }
            });
            setTimeout(updatePositions, 3000);
        };
        
        updatePositions();
    };

    const toggleConnection = () => {
        const key = document.getElementById('ais-apikey').value;
        const btn = document.getElementById('btn-connect');
        
        if (!key && btn.innerText === 'CONECTAR') {
            if(window.RiverToast) window.RiverToast.warning("Ingrese una API Key válida primero.");
            return;
        }

        if (btn.innerText === 'CONECTAR') {
            // Disconnect mock, pretend to connect real
            btn.innerText = 'DESCONECTAR';
            btn.style.background = 'var(--status-err)';
            btn.style.borderColor = 'var(--status-err)';
            document.getElementById('ais-apikey').disabled = true;
            isDemo = false;
            
            // Clear markers
            Object.values(aisMarkers).forEach(m => m.remove());
            aisMarkers = {};
            
            if(window.RiverToast) window.RiverToast.success("Conectado a AISStream. Esperando paquetes WSS...");
            
            // Wait 2 sec, throw error (mocking failure of real connection without proper keys)
            setTimeout(() => {
                if(window.RiverToast) window.RiverToast.error("WSS Error: API Key Inválida o Límite de Cuota");
                toggleConnection(); // auto disconnect
            }, 3000);

        } else {
            btn.innerText = 'CONECTAR';
            btn.style.background = 'var(--text-main)';
            btn.style.borderColor = 'var(--text-main)';
            document.getElementById('ais-apikey').disabled = false;
            
            // Reactivate Mock
            isDemo = true;
            startMockAIS();
            if(window.RiverToast) window.RiverToast.info("Desconectado de WSS. Restaurando telemetría interna (Mock).");
        }
    };

    const setLayer = (layerName) => {
        document.querySelectorAll('.mfc-btn').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
        // MapLibre layer swapping logic goes here in full implementation
        if(window.RiverToast) window.RiverToast.info(`Capa ${layerName} activada (Simulada)`);
    };

    const toggleTweaks = () => {
        const p = document.getElementById('tweaks-panel');
        p.style.display = p.style.display === 'none' ? 'block' : 'none';
    };

    return { init, toggleConnection, setLayer, toggleTweaks };
})();

window.MapLogicFluvia = MapLogicFluvia;
