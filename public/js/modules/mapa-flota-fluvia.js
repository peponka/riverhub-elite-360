/*
 * MAPA FLOTA MODULE (FLUVIAFLEET / MAPLIBRE GL JS)
 * Real AIS data via REST API for fleet overview
 */

const MapLogicFlota = (() => {

    let map = null;
    let markers = {};
    let vessels = [];

    const init = () => {
        console.log("🗺️ MapLogicFlota (MapLibre) Iniciando con AIS real...");
        
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
            center: [-58.5, -29.0],
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
                            [-57.65, -25.28],
                            [-57.53, -27.45],
                            [-59.64, -29.15],
                            [-60.63, -32.95],
                            [-59.65, -33.75],
                            [-58.22, -33.90],
                            [-58.37, -34.60]
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
                    'line-width': 2,
                    'line-dasharray': [2, 4],
                    'line-opacity': 0.5
                }
            });

            // Load real AIS data
            loadAISData();
            // Refresh every 30 seconds
            setInterval(loadAISData, 30000);
        });
    };

    const loadAISData = async () => {
        try {
            const resp = await fetch('/api/ais-positions');
            const data = await resp.json();
            
            const newVessels = Array.isArray(data) ? data : Object.values(data);
            vessels = newVessels;
            
            // Update or create markers
            const seenIds = new Set();
            
            newVessels.forEach(v => {
                const id = String(v.mmsi || v.UserID);
                const lat = v.lat || v.Latitude;
                const lon = v.lon || v.Longitude;
                const name = v.name || v.ShipName || 'Unknown';
                const speed = v.speed || v.Sog || 0;
                const course = v.course || v.Cog || 0;
                
                if (!id || isNaN(lat) || isNaN(lon)) return;
                seenIds.add(id);
                
                const isMoving = speed > 0.5;
                const statusColor = isMoving ? '#2EA043' : '#94A3B8';
                const statusText = isMoving ? 'nav' : 'stop';

                if (markers[id]) {
                    markers[id].marker.setLngLat([lon, lat]);
                    markers[id].el.style.backgroundColor = statusColor;
                } else {
                    const el = document.createElement('div');
                    el.className = 'flota-marker';
                    el.style.width = '12px';
                    el.style.height = '12px';
                    el.style.backgroundColor = statusColor;
                    el.style.borderRadius = '50%';
                    el.style.border = '2px solid rgba(255,255,255,0.9)';
                    el.style.boxShadow = `0 0 6px ${statusColor}80`;
                    el.style.cursor = 'pointer';
                    el.style.transition = 'all 0.3s ease';

                    el.addEventListener('click', () => focus(id));

                    const marker = new maplibregl.Marker({ element: el })
                        .setLngLat([lon, lat])
                        .setPopup(
                            new maplibregl.Popup({ offset: 15, closeButton: false })
                                .setHTML(`
                                    <div style="font-family:'Inter',sans-serif; min-width:180px;">
                                        <strong style="font-size:0.85rem; color:#1a1a2e;">🚢 ${name}</strong>
                                        <div style="font-size:0.7rem; color:#64748b; margin-top:4px;">
                                            MMSI: ${id}<br>
                                            Vel: ${Number(speed).toFixed(1)} kn | Rumbo: ${Number(course).toFixed(0)}°
                                        </div>
                                        <div style="margin-top:6px; background:${statusColor}15; color:${statusColor}; 
                                            padding:2px 6px; border-radius:4px; font-size:0.6rem; font-weight:700; 
                                            display:inline-block; border:1px solid ${statusColor}30;">
                                            ${isMoving ? 'EN NAVEGACIÓN' : 'FONDEADO'}
                                        </div>
                                    </div>
                                `)
                        )
                        .addTo(map);

                    markers[id] = { marker, el, name, lat, lon };
                }
                
                // Update stored data
                markers[id].name = name;
                markers[id].lat = lat;
                markers[id].lon = lon;
            });

            // Remove markers for vessels no longer present
            Object.keys(markers).forEach(id => {
                if (!seenIds.has(id)) {
                    markers[id].marker.remove();
                    delete markers[id];
                }
            });

            console.log(`🗺️ Flota: ${seenIds.size} embarcaciones actualizadas`);
        } catch (err) {
            console.warn('⚠️ Error cargando datos AIS:', err.message);
        }
    };

    const focus = (id) => {
        const v = markers[id];
        if (v && map) {
            const lngLat = v.marker.getLngLat();
            map.flyTo({
                center: [lngLat.lng, lngLat.lat],
                zoom: 12,
                speed: 1.5,
                curve: 1,
                easing(t) { return t; }
            });
            
            // Open popup
            v.marker.togglePopup();
            
            if (window.RiverToast) window.RiverToast.info(`Enfocando: ${v.name || id}`);
        }
    };

    return { init, focus };
})();

window.MapLogicFlota = MapLogicFlota;
