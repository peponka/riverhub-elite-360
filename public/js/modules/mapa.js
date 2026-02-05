// js/modules/mapa.js
// FRESH BUILD - 2026-01-30 - CLEAN MAP WITHOUT POLYLINES

var mapLogic = {
    map: null,
    isInitialized: false,
    vessels: [],

    // Called when map view is shown
    onShow: function () {
        console.log("🗺️ Nexus Map: onShow triggered");
        const container = document.getElementById('map-nexus');
        if (!container) return;

        if (container.offsetHeight === 0) {
            container.style.height = '100%';
        }

        if (!this.isInitialized) {
            this.initMap();
        } else {
            this.refreshMap();
        }
    },

    // Refresh map size
    refreshMap: function () {
        if (this.map) {
            this.map.invalidateSize();
            setTimeout(() => this.map && this.map.invalidateSize(), 100);
            setTimeout(() => this.map && this.map.invalidateSize(), 300);
        }
    },

    // Initialize map from scratch
    initMap: async function () {
        console.log("🗺️ Nexus Map: Initializing...");

        const container = document.getElementById('map-nexus');

        // Clean any existing map
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        if (container) {
            container.innerHTML = '';
        }

        // Reset vessels
        this.vessels = [];

        // Create new map
        this.map = L.map('map-nexus', {
            zoomControl: false,
            attributionControl: false,
            background: '#0b1116'
        }).setView([-29.0, -59.5], 6);

        // Add tile layer - CARTO DARK MATTER (Dark + Cities + Roads)
        // This is the best balance: Premium look, but with useful labels.
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);

        // (Overlay removed to keep labels bright)

        // Add zoom control
        L.control.zoom({ position: 'bottomright' }).addTo(this.map);

        // Add weather widget
        this.addWeatherWidget();

        // Load vessels from database
        await this.loadVessels();

        // Add home button
        this.addHomeControl();

        // Close bottom sheet on map click
        this.map.on('click', () => this.closeBottomSheet());

        // Update weather on map move
        this.map.on('moveend', () => this.updateWeather());
        setTimeout(() => this.updateWeather(), 1000);

        this.isInitialized = true;
        console.log("🗺️ Nexus Map: Initialized successfully!");

        // Final size refresh
        setTimeout(() => this.refreshMap(), 500);
    },

    // Load vessels from Supabase
    loadVessels: async function () {
        console.log("🚢 Loading vessels...");

        if (!window.sb) {
            console.warn("Supabase not available, using demo data");
            this.loadDemoVessels();
            return;
        }

        try {
            const { data, error } = await window.sb.fetchMine('vessels', '*');

            if (error) throw error;

            if (data && data.length > 0) {
                data.forEach(v => {
                    const lat = v.current_location?.lat || (-25 + Math.random() * -8);
                    const lng = v.current_location?.lng || (-57 + Math.random() * -4);

                    this.vessels.push({
                        id: v.id,
                        name: v.name,
                        mmsi: v.mmsi,
                        _lat: lat,
                        _lng: lng,
                        status: v.status,
                        isDemo: false
                    });
                });

                this.addMarkersToMap();
                this.renderVesselList();
                console.log(`✅ Loaded ${data.length} vessels`);
            } else {
                console.log("No vessels found, loading demo...");
                this.loadDemoVessels();
            }
        } catch (e) {
            console.error("Error loading vessels:", e);
            this.loadDemoVessels();
        }
    },

    // Demo vessels fallback
    loadDemoVessels: function () {
        const demoData = [
            { name: "HIDROVÍA I", mmsi: "701000001", _lat: -27.47, _lng: -58.83 },
            { name: "PARANÁ EXPRESS", mmsi: "701000002", _lat: -32.94, _lng: -60.65 },
            { name: "RÍO PLATA", mmsi: "701000003", _lat: -34.60, _lng: -58.38 }
        ];

        demoData.forEach((v, i) => {
            this.vessels.push({
                id: `demo-${i}`,
                name: v.name,
                mmsi: v.mmsi,
                _lat: v._lat,
                _lng: v._lng,
                status: 'active',
                isDemo: true
            });
        });

        this.addMarkersToMap();
        this.renderVesselList();
    },

    // Add markers to map
    addMarkersToMap: function () {
        this.vessels.forEach(v => {
            const color = v.isDemo ? '#f59e0b' : '#00e5ff';

            const icon = L.divIcon({
                className: 'custom-ship-marker',
                html: `<div class="marker-pulse" style="color:${color};"><i class="fas fa-ship"></i></div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            const marker = L.marker([v._lat, v._lng], { icon }).addTo(this.map);
            v.marker = marker;

            marker.on('click', () => {
                if (window.innerWidth <= 768) {
                    this.openBottomSheet(v);
                } else {
                    marker.bindPopup(`
                        <b>${v.name}</b><br>
                        MMSI: ${v.mmsi}<br>
                        Estado: ${v.status || 'Activo'}
                    `).openPopup();
                }
            });
        });
    },

    // Render vessel list in sidebar
    renderVesselList: function () {
        const list = document.getElementById('nexus-ship-list');
        if (!list) return;

        list.innerHTML = '';

        this.vessels.forEach(v => {
            const item = document.createElement('div');
            item.className = 'ship-item-nexus';
            item.innerHTML = `
                <div class="ship-n-dot" style="background: ${v.isDemo ? '#f59e0b' : '#00e5ff'};"></div>
                <div class="ship-n-info">
                    <strong>${v.name}</strong>
                    <span>MMSI: ${v.mmsi}</span>
                </div>
                <div class="ship-n-act"><i class="fas fa-chevron-right"></i></div>
            `;

            item.onclick = () => {
                this.map.setView([v._lat, v._lng], 10);
                if (v.marker) v.marker.openPopup();
            };

            list.appendChild(item);
        });
    },

    // Mobile bottom sheet
    openBottomSheet: function (v) {
        const sheet = document.getElementById('map-bottom-sheet');
        const nameEl = document.getElementById('bs-ship-name');
        const mmsiEl = document.getElementById('bs-ship-mmsi');

        if (nameEl) nameEl.textContent = v.name;
        if (mmsiEl) mmsiEl.textContent = v.mmsi;
        if (sheet) sheet.classList.add('open');

        this.lockTarget = v;
    },

    closeBottomSheet: function () {
        const sheet = document.getElementById('map-bottom-sheet');
        if (sheet) sheet.classList.remove('open');
        this.lockTarget = null;
    },

    lockTarget: null,

    toggleLockOn: function () {
        if (!this.lockTarget) return;
        this.map.setView([this.lockTarget._lat, this.lockTarget._lng], 12);
    },

    // Weather widget
    addWeatherWidget: function () {
        const WeatherControl = L.Control.extend({
            onAdd: function () {
                const div = L.DomUtil.create('div', 'weather-widget');
                div.id = 'map-weather-widget';
                div.innerHTML = `
                    <div style="background:rgba(15,23,42,0.9); padding:10px 15px; border-radius:10px; border:1px solid rgba(255,255,255,0.1);">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <i class="fas fa-sun" style="color:#fbbf24; font-size:1.5rem;"></i>
                            <div>
                                <div id="weather-temp" style="font-size:1.2rem; font-weight:bold; color:#fff;">--°C</div>
                                <div id="weather-wind" style="font-size:0.75rem; color:#94a3b8;">-- km/h</div>
                            </div>
                        </div>
                    </div>
                `;
                return div;
            }
        });
        new WeatherControl({ position: 'topright' }).addTo(this.map);
    },

    // Update weather
    updateWeather: async function () {
        if (!this.map) return;

        const center = this.map.getCenter();
        const tempEl = document.getElementById('weather-temp');
        const windEl = document.getElementById('weather-wind');

        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${center.lat}&longitude=${center.lng}&current_weather=true`);
            const data = await res.json();

            if (data.current_weather) {
                if (tempEl) tempEl.textContent = `${data.current_weather.temperature}°C`;
                if (windEl) windEl.textContent = `${data.current_weather.windspeed} km/h`;
            }
        } catch (e) {
            console.warn("Weather update failed:", e);
        }
    },

    // Home button
    addHomeControl: function () {
        const HomeControl = L.Control.extend({
            onAdd: function (map) {
                const btn = L.DomUtil.create('button', 'leaflet-bar');
                btn.innerHTML = '<i class="fas fa-home"></i>';
                btn.style.cssText = 'width:34px; height:34px; background:#1e293b; border:1px solid #334155; color:#fff; cursor:pointer; border-radius:4px;';
                btn.onclick = (e) => {
                    e.stopPropagation();
                    map.setView([-29.0, -59.5], 6);
                };
                return btn;
            }
        });
        new HomeControl({ position: 'bottomright' }).addTo(this.map);
    }
};

window.mapLogic = mapLogic;