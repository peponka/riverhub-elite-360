// js/modules/mapa.js
// FRESH BUILD - 2026-02-06 - SOLO AIS REAL EN VIVO

var mapLogic = {
    map: null,
    isInitialized: false,
    aisMarkers: {},

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

        // Reset markers
        this.aisMarkers = {};

        // Create new map
        this.map = L.map('map-nexus', {
            zoomControl: false,
            attributionControl: false,
            background: '#0b1116'
        }).setView([-30.0, -58.5], 5);

        // Add tile layer - CARTO DARK MATTER
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);

        // Add zoom control
        L.control.zoom({ position: 'bottomright' }).addTo(this.map);

        // Add weather widget
        this.addWeatherWidget();

        // Conectar a AIS REAL
        this.connectAIS();

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

    // Conectar a AIS real
    connectAIS: function () {
        console.log("🚢 Conectando a AIS en tiempo real...");

        const list = document.getElementById('nexus-ship-list');
        if (list) list.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8;">Esperando barcos AIS...</div>';

        if (window.AisStreamService && window.AisStreamService.subscribe) {
            window.AisStreamService.subscribe((vessel) => {
                if (!vessel.lat || !vessel.lon) return;

                const key = vessel.mmsi || vessel.name;

                if (this.aisMarkers[key]) {
                    // Actualizar posición existente
                    this.aisMarkers[key].setLatLng([vessel.lat, vessel.lon]);
                } else {
                    // Crear nuevo marcador AIS (verde)
                    const icon = L.divIcon({
                        className: 'ais-live-marker',
                        html: '<div class="marker-pulse" style="color:#10b981;"><i class="fas fa-ship"></i></div>',
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    });

                    this.aisMarkers[key] = L.marker([vessel.lat, vessel.lon], { icon })
                        .addTo(this.map)
                        .bindPopup(`<b>${vessel.name || 'Desconocido'}</b><br>MMSI: ${vessel.mmsi}<br>🟢 AIS EN VIVO`);

                    // Agregar a la lista visual
                    this.addVesselToList(vessel);
                    console.log(`📡 AIS: ${vessel.name} @ ${vessel.lat.toFixed(2)}, ${vessel.lon.toFixed(2)}`);
                }
            });

            console.log("✅ Conectado a AIS - Solo barcos reales");
        } else {
            console.warn("⚠️ AisStreamService no disponible, reintentando...");
            setTimeout(() => this.connectAIS(), 2000);
        }
    },

    // Agregar barco a la lista del sidebar
    addVesselToList: function (vessel) {
        const list = document.getElementById('nexus-ship-list');
        if (!list) return;

        // Limpiar mensaje de espera
        const waiting = list.querySelector('div[style*="text-align:center"]');
        if (waiting) waiting.remove();

        // Evitar duplicados
        if (document.getElementById(`ais-${vessel.mmsi}`)) return;

        const item = document.createElement('div');
        item.className = 'ship-item-nexus';
        item.id = `ais-${vessel.mmsi}`;
        item.innerHTML = `
            <div class="ship-n-dot" style="background: #10b981;"></div>
            <div class="ship-n-info">
                <strong>${vessel.name || 'Desconocido'}</strong>
                <span>MMSI: ${vessel.mmsi}</span>
            </div>
            <div class="ship-n-act"><i class="fas fa-chevron-right"></i></div>
        `;

        const self = this;
        item.onclick = function () {
            if (self.map && self.aisMarkers[vessel.mmsi]) {
                self.map.setView([vessel.lat, vessel.lon], 10);
                self.aisMarkers[vessel.mmsi].openPopup();
            }
        };

        list.appendChild(item);
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