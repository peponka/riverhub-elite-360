/*
 * MAPA FLOTA MODULE (FLUVIAFLEET / MAPLIBRE GL JS)
 * Real AIS data via REST API for fleet overview
 * Cross-references registered vessels to highlight "Flota propia"
 */

const MapLogicFlota = (() => {

    let map = null;
    let markers = {};
    let vessels = [];
    let myFleetMMSIs = new Set();   // MMSIs of registered vessels
    let myFleetData = {};           // mmsi -> vessel record from DB

    const loadMyFleet = async () => {
        try {
            if (!window.sb || !window.sb.fetchMine) return;
            const { data, error } = await window.sb.fetchMine('vessels', '*');
            if (error || !Array.isArray(data)) return;
            myFleetMMSIs = new Set();
            myFleetData = {};
            data.forEach(v => {
                if (v.mmsi) {
                    myFleetMMSIs.add(String(v.mmsi));
                    myFleetData[String(v.mmsi)] = v;
                }
            });
            console.log(`🚢 Flota propia cargada: ${myFleetMMSIs.size} embarcaciones`);
        } catch (err) {
            console.warn('⚠️ Error cargando flota propia:', err.message);
        }
    };

    const init = async () => {
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

        map.on('load', async () => {
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

            // Load registered fleet first, then AIS data
            await loadMyFleet();
            loadAISData();
            // Refresh every 30 seconds; reload fleet every 5 minutes
            setInterval(loadAISData, 30000);
            setInterval(loadMyFleet, 300000);
        });
    };

    const buildMarkerEl = (statusColor, isMine, size) => {
        const el = document.createElement('div');
        el.className = 'flota-marker' + (isMine ? ' flota-marker-mine' : '');
        el.style.width = size + 'px';
        el.style.height = size + 'px';
        el.style.backgroundColor = statusColor;
        el.style.borderRadius = '50%';
        el.style.border = isMine ? '2px solid #ffffff' : '2px solid rgba(255,255,255,0.7)';
        el.style.boxShadow = isMine ? `0 0 10px ${statusColor}, 0 0 4px ${statusColor}` : `0 0 4px ${statusColor}80`;
        el.style.cursor = 'pointer';
        el.style.transition = 'all 0.3s ease';
        el.style.zIndex = isMine ? '10' : '1';
        return el;
    };

    const buildPopupHTML = (name, id, speed, course, isMine, dbVessel) => {
        const isMoving = speed > 0.5;
        const statusColor = isMine ? '#3B82F6' : (isMoving ? '#2EA043' : '#94A3B8');
        const badge = isMine
            ? `<div style="margin-top:4px; background:#3B82F615; color:#3B82F6; padding:2px 6px; border-radius:4px; font-size:0.6rem; font-weight:700; display:inline-block; border:1px solid #3B82F630;">⚓ FLOTA PROPIA</div>`
            : '';
        const typeStr = dbVessel ? `<br>Tipo: ${dbVessel.type || '—'}` : '';
        return `
            <div style="font-family:'Inter',sans-serif; min-width:190px;">
                <strong style="font-size:0.85rem; color:#1a1a2e;">🚢 ${name}</strong>
                ${badge}
                <div style="font-size:0.7rem; color:#64748b; margin-top:4px;">
                    MMSI: ${id}${typeStr}<br>
                    Vel: ${Number(speed).toFixed(1)} kn | Rumbo: ${Number(course).toFixed(0)}°
                </div>
                <div style="margin-top:6px; background:${statusColor}15; color:${statusColor};
                    padding:2px 6px; border-radius:4px; font-size:0.6rem; font-weight:700;
                    display:inline-block; border:1px solid ${statusColor}30;">
                    ${isMoving ? 'EN NAVEGACIÓN' : 'FONDEADO'}
                </div>
            </div>
        `;
    };

    const loadAISData = async () => {
        try {
            const resp = await fetch('/api/ais-positions');
            const data = await resp.json();

            // API returns paginated object {total, page, limit, vessels:[...]} — extract vessels array
            const newVessels = data.vessels || (Array.isArray(data) ? data : Object.values(data));
            vessels = newVessels;

            const seenIds = new Set();

            newVessels.forEach(v => {
                const id = String(v.mmsi || v.UserID);
                const lat = parseFloat(v.lat || v.Latitude);
                const lon = parseFloat(v.lon || v.Longitude);
                const name = v.name || v.ShipName || 'Unknown';
                const speed = v.speed || v.Sog || 0;
                const course = v.course || v.Cog || 0;

                if (!id || isNaN(lat) || isNaN(lon)) return;
                seenIds.add(id);

                const isMine = myFleetMMSIs.has(id);
                const dbVessel = isMine ? myFleetData[id] : null;
                const isMoving = speed > 0.5;
                const statusColor = isMine ? '#3B82F6' : (isMoving ? '#2EA043' : '#94A3B8');
                const markerSize = isMine ? 16 : 10;

                if (markers[id]) {
                    markers[id].marker.setLngLat([lon, lat]);
                    markers[id].el.style.backgroundColor = statusColor;
                } else {
                    const el = buildMarkerEl(statusColor, isMine, markerSize);
                    el.addEventListener('click', () => focus(id));

                    const marker = new maplibregl.Marker({ element: el })
                        .setLngLat([lon, lat])
                        .setPopup(
                            new maplibregl.Popup({ offset: 15, closeButton: false })
                                .setHTML(buildPopupHTML(name, id, speed, course, isMine, dbVessel))
                        )
                        .addTo(map);

                    markers[id] = { marker, el, name, lat, lon, isMine };
                }

                markers[id].name = name;
                markers[id].lat = lat;
                markers[id].lon = lon;
            });

            // Show registered vessels that have no live AIS using last known DB position
            myFleetMMSIs.forEach(mmsi => {
                if (seenIds.has(mmsi)) return; // already shown from AIS
                const dbV = myFleetData[mmsi];
                if (!dbV || !dbV.current_lat || !dbV.current_lng) return;
                const lat = parseFloat(dbV.current_lat);
                const lon = parseFloat(dbV.current_lng);
                if (isNaN(lat) || isNaN(lon)) return;

                seenIds.add(mmsi);
                const name = dbV.name || 'Sin nombre';
                const offlineColor = '#F59E0B'; // amber = sin señal AIS

                if (markers[mmsi]) {
                    markers[mmsi].marker.setLngLat([lon, lat]);
                } else {
                    const el = buildMarkerEl(offlineColor, true, 14);
                    el.style.border = '2px dashed #ffffff';
                    el.addEventListener('click', () => focus(mmsi));

                    const marker = new maplibregl.Marker({ element: el })
                        .setLngLat([lon, lat])
                        .setPopup(
                            new maplibregl.Popup({ offset: 15, closeButton: false })
                                .setHTML(`
                                    <div style="font-family:'Inter',sans-serif; min-width:190px;">
                                        <strong style="font-size:0.85rem; color:#1a1a2e;">🚢 ${name}</strong>
                                        <div style="margin-top:4px; background:#F59E0B15; color:#F59E0B; padding:2px 6px; border-radius:4px; font-size:0.6rem; font-weight:700; display:inline-block; border:1px solid #F59E0B30;">⚓ FLOTA PROPIA · SIN SEÑAL AIS</div>
                                        <div style="font-size:0.7rem; color:#64748b; margin-top:4px;">
                                            MMSI: ${mmsi}<br>Tipo: ${dbV.type || '—'}<br>Última posición conocida
                                        </div>
                                    </div>
                                `)
                        )
                        .addTo(map);

                    markers[mmsi] = { marker, el, name, lat, lon, isMine: true };
                }
            });

            // Remove markers for vessels no longer in AIS or own fleet
            Object.keys(markers).forEach(id => {
                if (!seenIds.has(id)) {
                    markers[id].marker.remove();
                    delete markers[id];
                }
            });

            const myCount = [...seenIds].filter(id => myFleetMMSIs.has(id)).length;
            console.log(`🗺️ Flota: ${seenIds.size} total (${myCount} propias)`);
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
