// js/modules/mapa.js
// OPENLAYERS BUILD — Canvas 2D rendering, no DPR tile gaps
// Replaces Leaflet which has bugs with fractional devicePixelRatio

var mapLogic = {
    map: null,
    view: null,
    isInitialized: false,
    aisMarkers: {},       // key -> ol.Feature
    vectorSource: null,
    popupOverlay: null,

    // Called when map view is shown
    onShow: function () {
        void("🗺️ Nexus Map: onShow triggered");
        var container = document.getElementById('map-nexus');
        if (!container) return;

        var mapArea = container.parentElement;
        if (mapArea) {
            mapArea.style.height = '100%';
            mapArea.style.minHeight = '500px';
        }
        container.style.height = '100%';
        container.style.width = '100%';

        if (this.map) {
            this.map.updateSize();
        } else {
            this.initMap();
        }
    },

    // Refresh map size
    refreshMap: function () {
        if (!this.map) return;
        this.map.updateSize();
    },

    // Initialize map
    initMap: function () {
        void("🗺️ Nexus Map: Initializing with OpenLayers (Canvas 2D)...");

        var container = document.getElementById('map-nexus');
        if (!container) return;

        // Clean existing
        if (this.map) {
            this.map.setTarget(null);
            this.map = null;
        }
        container.innerHTML = '';
        this.aisMarkers = {};

        // Vector source for AIS markers
        this.vectorSource = new ol.source.Vector();

        // Ship marker style
        var markerStyle = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 8,
                fill: new ol.style.Fill({ color: '#10b981' }),
                stroke: new ol.style.Stroke({ color: '#064e3b', width: 2 })
            }),
            text: new ol.style.Text({
                offsetY: -18,
                font: 'bold 11px Rajdhani, Arial',
                fill: new ol.style.Fill({ color: '#e2e8f0' }),
                stroke: new ol.style.Stroke({ color: '#0f172a', width: 3 }),
                textAlign: 'center'
            })
        });

        // Vector layer for markers
        var vectorLayer = new ol.layer.Vector({
            source: this.vectorSource,
            style: function (feature) {
                var style = markerStyle.clone();
                style.getText().setText(feature.get('name') || '');
                return style;
            }
        });

        // View
        this.view = new ol.View({
            center: ol.proj.fromLonLat([-58.5, -30.0]),
            zoom: 5,
            minZoom: 2,
            maxZoom: 18
        });

        // Create popup element
        var popupEl = document.createElement('div');
        popupEl.id = 'ol-popup';
        popupEl.style.cssText = 'background:rgba(15,23,42,0.95);color:#e2e8f0;padding:12px 16px;border-radius:10px;border:1px solid rgba(16,185,129,0.3);font-size:13px;min-width:160px;box-shadow:0 4px 20px rgba(0,0,0,0.5);pointer-events:auto;';
        popupEl.innerHTML = '<div id="ol-popup-content"></div>';
        container.appendChild(popupEl);

        this.popupOverlay = new ol.Overlay({
            element: popupEl,
            autoPan: true,
            autoPanAnimation: { duration: 250 },
            positioning: 'bottom-center',
            offset: [0, -12]
        });

        // Create map
        this.map = new ol.Map({
            target: 'map-nexus',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.XYZ({
                        url: 'https://{a-d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                        crossOrigin: 'anonymous'
                    })
                }),
                vectorLayer
            ],
            view: this.view,
            overlays: [this.popupOverlay],
            controls: ol.control.defaults.defaults({ zoom: true, attribution: false })
        });

        // Setup interactions
        var self = this;

        // Click on marker → show popup
        this.map.on('singleclick', function (evt) {
            var feature = self.map.forEachFeatureAtPixel(evt.pixel, function (f) { return f; });
            if (feature) {
                var coords = feature.getGeometry().getCoordinates();
                var content = document.getElementById('ol-popup-content');
                content.innerHTML =
                    '<b style="color:#10b981;font-size:14px;">' + (feature.get('name') || 'Desconocido') + '</b><br>' +
                    '<span style="color:#94a3b8;">MMSI: ' + (feature.get('mmsi') || '—') + '</span><br>' +
                    '<span style="color:#10b981;">🟢 AIS EN VIVO</span>';
                self.popupOverlay.setPosition(coords);
                self.openBottomSheet({ name: feature.get('name'), mmsi: feature.get('mmsi') });
            } else {
                self.popupOverlay.setPosition(undefined);
                self.closeBottomSheet();
            }
        });

        // Cursor pointer on hover
        this.map.on('pointermove', function (evt) {
            var hit = self.map.hasFeatureAtPixel(evt.pixel);
            self.map.getTargetElement().style.cursor = hit ? 'pointer' : '';
        });

        // Weather on map move
        this.map.on('moveend', function () {
            self.updateWeather();
        });

        // Add custom controls
        this.addWeatherWidget();
        this.addHomeControl();

        // Setup search filter
        var searchInput = document.getElementById('nexus-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                var term = e.target.value.toLowerCase();
                var listContainer = document.getElementById('nexus-ship-list');
                if (!listContainer) return;
                var items = listContainer.getElementsByClassName('ship-item-nexus');
                for (var i = 0; i < items.length; i++) {
                    var txt = items[i].textContent || items[i].innerText;
                    items[i].style.display = txt.toLowerCase().indexOf(term) > -1 ? '' : 'none';
                }
            });
        }

        // Connect AIS
        this.connectAIS();

        // Initial weather
        setTimeout(function () { self.updateWeather(); }, 1000);

        // Resize after init
        setTimeout(function () {
            if (self.map) self.map.updateSize();
        }, 500);

        this.isInitialized = true;
        void("🗺️ Nexus Map: Initialized successfully with OpenLayers!");
    },

    // Connect to AIS
    connectAIS: function () {
        void("🚢 Conectando a AIS en tiempo real...");

        var list = document.getElementById('nexus-ship-list');
        if (list) list.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8;">Esperando barcos AIS...</div>';

        if (window.AisStreamService && window.AisStreamService.subscribe) {
            var self = this;
            window.AisStreamService.subscribe(function (vessel) {
                if (!vessel.lat || !vessel.lon) return;

                var key = vessel.mmsi || vessel.name;
                var coords = ol.proj.fromLonLat([vessel.lon, vessel.lat]);

                if (self.aisMarkers[key]) {
                    // Update position
                    self.aisMarkers[key].getGeometry().setCoordinates(coords);
                } else {
                    // Create new feature
                    var feature = new ol.Feature({
                        geometry: new ol.geom.Point(coords),
                        name: vessel.name || 'Desconocido',
                        mmsi: vessel.mmsi,
                        lat: vessel.lat,
                        lon: vessel.lon
                    });

                    self.vectorSource.addFeature(feature);
                    self.aisMarkers[key] = feature;

                    // Add to sidebar list
                    self.addVesselToList(vessel);
                    void('📡 AIS: ' + (vessel.name || key) + ' @ ' + vessel.lat.toFixed(2) + ', ' + vessel.lon.toFixed(2));
                }
            });

            void("✅ Conectado a AIS - Solo barcos reales");
        } else {
            console.warn("⚠️ AisStreamService no disponible, reintentando...");
            var self = this;
            setTimeout(function () { self.connectAIS(); }, 2000);
        }
    },

    // Add vessel to sidebar
    addVesselToList: function (vessel) {
        var list = document.getElementById('nexus-ship-list');
        if (!list) return;

        var waiting = list.querySelector('div[style*="text-align:center"]');
        if (waiting) waiting.remove();

        if (document.getElementById('ais-' + vessel.mmsi)) return;

        var item = document.createElement('div');
        item.className = 'ship-item-nexus';
        item.id = 'ais-' + vessel.mmsi;
        item.innerHTML =
            '<div class="ship-n-dot" style="background: #10b981;"></div>' +
            '<div class="ship-n-info" style="display:flex; flex-direction:column; gap:2px; overflow:hidden;">' +
            '<strong style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + (vessel.name || 'Desconocido') + '</strong>' +
            '<span style="color:#94a3b8; font-size:0.8em;">MMSI: ' + vessel.mmsi + '</span>' +
            '</div>' +
            '<div class="ship-n-act"><i class="fas fa-chevron-right"></i></div>';

        var self = this;
        item.onclick = function () {
            if (self.view) {
                self.view.animate({
                    center: ol.proj.fromLonLat([vessel.lon, vessel.lat]),
                    zoom: 10,
                    duration: 1500
                });
                // Show popup
                var feature = self.aisMarkers[vessel.mmsi];
                if (feature) {
                    var coords = feature.getGeometry().getCoordinates();
                    var content = document.getElementById('ol-popup-content');
                    content.innerHTML =
                        '<b style="color:#10b981;font-size:14px;">' + (vessel.name || 'Desconocido') + '</b><br>' +
                        '<span style="color:#94a3b8;">MMSI: ' + vessel.mmsi + '</span><br>' +
                        '<span style="color:#10b981;">🟢 AIS EN VIVO</span>';
                    self.popupOverlay.setPosition(coords);
                }
            }
        };

        list.appendChild(item);
    },

    // Bottom sheet
    openBottomSheet: function (v) {
        var sheet = document.getElementById('map-bottom-sheet');
        var nameEl = document.getElementById('bs-ship-name');
        var mmsiEl = document.getElementById('bs-ship-mmsi');

        if (nameEl) nameEl.textContent = v.name;
        if (mmsiEl) mmsiEl.textContent = v.mmsi;
        if (sheet) sheet.classList.add('open');

        this.lockTarget = v;
    },

    closeBottomSheet: function () {
        var sheet = document.getElementById('map-bottom-sheet');
        if (sheet) sheet.classList.remove('open');
        this.lockTarget = null;
    },

    lockTarget: null,

    toggleLockOn: function () {
        if (!this.lockTarget || !this.view) return;
        this.view.animate({
            center: ol.proj.fromLonLat([this.lockTarget.lon || -58.5, this.lockTarget.lat || -30]),
            zoom: 12,
            duration: 1000
        });
    },

    // Weather widget (custom overlay)
    addWeatherWidget: function () {
        var existing = document.getElementById('map-weather-widget');
        if (existing) existing.remove();

        var div = document.createElement('div');
        div.id = 'map-weather-widget';
        div.style.cssText = 'position:absolute; top:10px; right:10px; z-index:100; pointer-events:none;';
        div.innerHTML =
            '<div style="background:rgba(15,23,42,0.9); padding:10px 15px; border-radius:10px; border:1px solid rgba(255,255,255,0.1);">' +
            '<div style="display:flex; align-items:center; gap:10px;">' +
            '<i class="fas fa-sun" style="color:#fbbf24; font-size:1.5rem;"></i>' +
            '<div>' +
            '<div id="weather-temp" style="font-size:1.2rem; font-weight:bold; color:#fff;">--°C</div>' +
            '<div id="weather-wind" style="font-size:0.75rem; color:#94a3b8;">-- km/h</div>' +
            '</div>' +
            '</div>' +
            '</div>';

        var container = document.getElementById('map-nexus');
        if (container) container.appendChild(div);
    },

    // Update weather
    updateWeather: async function () {
        if (!this.view) return;

        var center = ol.proj.toLonLat(this.view.getCenter());
        var tempEl = document.getElementById('weather-temp');
        var windEl = document.getElementById('weather-wind');

        try {
            var res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + center[1] + '&longitude=' + center[0] + '&current_weather=true');
            var data = await res.json();

            if (data.current_weather) {
                if (tempEl) tempEl.textContent = data.current_weather.temperature + '°C';
                if (windEl) windEl.textContent = data.current_weather.windspeed + ' km/h';
            }
        } catch (e) {
            console.warn("Weather update failed:", e);
        }
    },

    // Home button
    addHomeControl: function () {
        var existing = document.getElementById('map-home-btn');
        if (existing) existing.remove();

        var btn = document.createElement('button');
        btn.id = 'map-home-btn';
        btn.innerHTML = '<i class="fas fa-home"></i>';
        btn.style.cssText = 'position:absolute; bottom:40px; right:10px; z-index:100; width:34px; height:34px; background:#1e293b; border:1px solid #334155; color:#fff; cursor:pointer; border-radius:6px; display:flex; align-items:center; justify-content:center;';

        var self = this;
        btn.onclick = function (e) {
            e.stopPropagation();
            self.view.animate({
                center: ol.proj.fromLonLat([-59.5, -29.0]),
                zoom: 5,
                duration: 1500
            });
        };

        var container = document.getElementById('map-nexus');
        if (container) container.appendChild(btn);
    }
};

window.mapLogic = mapLogic;