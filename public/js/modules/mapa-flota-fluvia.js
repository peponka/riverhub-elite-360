/*
 * MAPA FLOTA MODULE (FLUVIAFLEET / MAPLIBRE GL JS)
 */

const MapLogicFlota = (() => {

    let map = null;
    let markers = {};

    const ships = [
        { id: '1', name: 'TB PARAGUAY 01', lat: -27.5, lon: -58.8, status: 'stop' }, // Pilar
        { id: '2', name: 'R/M HERCULES', lat: -32.8, lon: -60.6, status: 'nav' }, // Rosario
        { id: '3', name: 'Itaipú 07', lat: -25.28, lon: -57.64, status: 'nav' } // Asuncion
    ];

    const init = () => {
        void("🗺️ MapLogicFlota (MapLibre) Iniciando...");
        
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
            center: [-58.5, -29.0],
            zoom: 5,
            attributionControl: false
        });

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
                            [-57.64, -25.28], // Asuncion
                            [-60.6, -32.8] // Rosario (unordered for visual)
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
                    'line-color': '#94a3b8',
                    'line-width': 2,
                    'line-dasharray': [2, 4]
                }
            });

            plotShips();
        });
    };

    const plotShips = () => {
        ships.forEach(v => {
            const el = document.createElement('div');
            el.className = 'flota-marker';
            el.style.width = '14px';
            el.style.height = '14px';
            el.style.backgroundColor = v.status === 'nav' ? 'var(--status-ok)' : 'var(--status-warn)';
            el.style.borderRadius = '50%';
            el.style.border = '3px solid #FFFFFF';
            el.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            el.style.cursor = 'pointer';

            el.addEventListener('click', () => focus(v.id));

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([v.lon, v.lat])
                .addTo(map);

            markers[v.id] = marker;
        });
    };

    const focus = (id) => {
        const v = ships.find(s => s.id === id);
        if (v && map) {
            map.flyTo({
                center: [v.lon, v.lat],
                zoom: 12,
                speed: 1.5,
                curve: 1,
                easing(t) { return t; }
            });
            
            // Highlight list selection (mock)
            // UI update for Right Sidebar could go here.
            if(window.RiverToast) window.RiverToast.info(`Enfocando a ${v.name}`);
        }
    };

    return { init, focus };
})();

window.MapLogicFlota = MapLogicFlota;
