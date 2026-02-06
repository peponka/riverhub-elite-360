// fix-map.js: Force Load Map with Dark Theme
// Updated: 2026-02-06 - Estilo igual al Mapa de Flota

console.log("🚀 Módulo Fix-Map Cargado");

window.addEventListener('load', () => {
    setTimeout(() => {
        const mapContainer = document.getElementById('map-dashboard-new');
        if (!mapContainer) return;

        // Limpiar
        if (mapContainer._leaflet_id) {
            mapContainer._leaflet_id = null;
        }
        mapContainer.innerHTML = '';

        console.log("🔄 Re-iniciando Mapa Dashboard (Estilo Dark)...");

        const map = L.map('map-dashboard-new', {
            zoomControl: true,
            attributionControl: false,
            background: '#0b1116'
        }).setView([-30.0, -58.5], 6); // Hidrovía: Paraguay → Río de la Plata

        // CARTO Dark Matter - Igual que Mapa de Flota
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap © CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);

        // Resize Final
        setTimeout(() => map.invalidateSize(), 500);
        setTimeout(() => map.invalidateSize(), 1000);

        // Cargar barcos si Supabase está listo
        if (window.sb) {
            loadShipsFix(map);
        }

        // Guardar referencia global para AIS
        window.dashboardMap = map;

    }, 2000); // Esperar 2 segundos a que todo lo demás cargue
});

async function loadShipsFix(map) {
    try {
        const { data } = await window.sb.fetchMine('vessels', '*');

        if (data && data.length > 0) {
            data.forEach(v => {
                if (v.status !== 'active') return;

                const icon = L.divIcon({
                    className: 'custom-ship-marker',
                    html: '<div class="marker-pulse" style="border-color:#00e5ff; color:#00e5ff;"><i class="fas fa-ship"></i></div>',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                let lat = v.current_location?.lat || (-27 + Math.random() * -5);
                let lng = v.current_location?.lng || (-58 + Math.random() * -3);

                L.marker([lat, lng], { icon: icon })
                    .addTo(map)
                    .bindPopup(`<b>${v.name}</b><br>Estado: ${v.status}`);
            });

            console.log(`✅ Dashboard: ${data.length} barcos cargados`);
        }
    } catch (e) {
        console.warn("Dashboard loadShips error:", e);
    }
}
