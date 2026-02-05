
// fix-map.js: Force Load Map
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

        console.log("🔄 Re-iniciando Mapa desde Fix-Map...");

        const map = L.map('map-dashboard-new', {
            zoomControl: false,
            attributionControl: false
        }).setView([-27.1, -58.55], 8);

        // Capa Satelital ESRI
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 17
        }).addTo(map);

        // Resize Final
        setTimeout(() => map.invalidateSize(), 500);
        setTimeout(() => map.invalidateSize(), 1000);

        // Cargar barcos si Supabase está listo
        if (window.sb) {
            loadShipsFix(map);
        }
    }, 2000); // Esperar 2 segundos a que todo lo demás cargue
});

async function loadShipsFix(map) {
    const { data } = await window.sb
        .from('vessels')
        .select('*')
        .eq('status', 'active');

    if (data) {
        data.forEach(v => {
            const icon = L.divIcon({
                className: 'custom-ship-marker',
                html: '<div style="background:#00e5ff;width:10px;height:10px;border-radius:50%;box-shadow:0 0 10px #00e5ff"></div>'
            });
            let lat = v.current_location?.lat || -27.1;
            let lng = v.current_location?.lng || -58.55;
            if (lat !== 0) L.marker([lat, lng], { icon: icon }).addTo(map);
        });
    }
}
