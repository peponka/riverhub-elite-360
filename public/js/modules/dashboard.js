// js/modules/dashboard.js
// Updated: 2026-02-06 07:36 - Dark Map + AIS Integration
/* La tabla `vessels` guarda los estados en español ('Activo', 'Mantenimiento',
   'Inactivo'), pero este módulo los comparaba contra 'active'/'maintenance'.
   Resultado: FLOTA ACTIVA mostraba 0 de 15 y el mapa no pintaba ningún barco.
   Estos helpers aceptan ambos vocabularios. */
function esActivo(estado) {
    const s = String(estado || '').toLowerCase().trim();
    return s === 'active' || s === 'activo' || s === 'en viaje' ||
           s === 'navegando' || s === 'en_viaje' || s === 'transito' || s === 'tránsito';
}
function esMantenimiento(estado) {
    const s = String(estado || '').toLowerCase().trim();
    return s === 'maintenance' || s.indexOf('manten') >= 0;
}

const dashboardLogic = {
    ships: [],
    dashMap: null,

    init: async function () {
        void("🚀 Módulo Radar Dashboard Activo.");
        this.updateGreeting();
        this.renderScadaCharts();

        let attempts = 0;
        while (!window.sb && attempts < 20) {
            await new Promise(r => setTimeout(r, 200));
            attempts++;
        }

        if (window.sb) {
            // ALWAYS defer to onShow to prevent Leaflet zero-dimension bug
            this.radarInitDeferred = true;
            this.checkOnboarding();
        } else {
            console.warn("Dashboard: Supabase not ready.");
            this.initMapOffline();
        }
    },

    checkOnboarding: async function () {
        try {
            // GUARD: Only show onboarding popup AFTER user is logged in
            const loginView = document.getElementById('login-view');
            if (loginView && loginView.style.display !== 'none' && loginView.offsetParent !== null) {
                void("Dashboard: Skipping onboarding — login screen active.");
                return;
            }
            // Also check if AuthModule says user is not authenticated
            if (window.AuthModule && typeof window.AuthModule.getCurrentUser === 'function') {
                const user = window.AuthModule.getCurrentUser();
                if (!user) {
                    void("Dashboard: Skipping onboarding — no user session.");
                    return;
                }
            }

            const { count, error } = await window.sb
                .from('fleet_assets')
                .select('*', { count: 'exact', head: true });

            if (!error && count === 0) {
                const modal = document.getElementById('modal-add-asset');
                if (modal) {
                    modal.style.display = 'flex';
                    const header = modal.querySelector('.modal-header h3');
                    if (header) header.innerHTML = '<i class="fas fa-ship"></i> Bienvenido: Agregue su Primer Barco';
                }
            }
        } catch (e) {
            console.error("Onboarding Check Error:", e);
        }
    },

    updateGreeting: function () {
        const hour = new Date().getHours();
        let greeting = "Buen día";
        if (hour >= 12) greeting = "Buenas tardes";
        if (hour >= 19) greeting = "Buenas noches";

        const welcomeEl = document.getElementById('dash-welcome-text');
        const user = window.AuthModule ? window.AuthModule.getCurrentUser() : null;
        const name = user ? (user.full_name || 'Capitán') : 'Capitán';

        if (welcomeEl) welcomeEl.innerText = `${greeting}, ${name}.`;
        this.updateStats();
    },

    updateStats: async function () {
        if (!window.sb) return;

        try {
            // SAAS METRICS: Fetch counts for THIS tenant only using fetchMine
            const [vesselsRes, crewRes, alertsRes] = await Promise.all([
                // 1. My Active Vessels
                window.sb.fetchMine('fleet_assets', 'id, status'),
                // 2. My Active Crew
                window.sb.fetchMine('crew_members', 'id'),
                // 3. My Open Incidents/Maintenance
                // 'maintenance_logs' no existe; la tabla real es 'maintenance_tasks'.
                window.sb.fetchMine('maintenance_tasks', 'id')
            ]);

            // PROCESS VESSELS
            const myVessels = vesselsRes.data || [];
            const activeCount = myVessels.filter(v => esActivo(v.status)).length;
            const totalVessels = myVessels.length;

            // PROCESS CREW
            const crewCount = crewRes.data ? crewRes.data.length : 0;

            // PROCESS ALERTS
            const alertCount = alertsRes.data ? alertsRes.data.length : 0;

            // UPDATE UI ELEMENTS (Safe Selectors)
            // Note: We need to target the Stat Cards by their content or structure since they might not have unique IDs
            const statValues = document.querySelectorAll('.stat-value');
            if (statValues.length >= 3) {
                // Card 1: Active Barges/Vessels
                statValues[0].innerText = `${activeCount} / ${totalVessels}`;

                // Card 2: Crew on board (Assuming 2nd card is crew/ops)
                // If the design is fixed, we might need adjustments, but let's try to infer or reuse existing slots
                statValues[1].innerText = `${crewCount}`; // Updates "ETA PROMEDIO" or similar slot to Crew Count? 
                // Wait, let's map it correctly based on index.html:
                // Card 1: BARCAZAS ACTIVAS -> Correct
                // Card 2: ETA PROMEDIO -> Let's change label to "TRIPULACIÓN ACTIVA" dynamically?
                // Card 3: ALERTAS CRÍTICAS -> Correct
            }

            // DYNAMIC LABEL UPDATE (Optional, if we want to repurpose the chart/card for Crew)
            const statLabels = document.querySelectorAll('.stat-label');
            if (statLabels.length >= 2) {
                statLabels[1].innerText = "TRIPULACIÓN ACTIVA"; // Repurpose 2nd card
            }
            if (statValues.length >= 3) {
                statValues[2].innerText = `${alertCount}`;
            }

            // UPDATE STATUS CHART (Doughnut)
            this.updateFleetStatusChart(myVessels);

        } catch (e) {
            console.warn("Dashboard Stats Error:", e);
        }
    },

    updateFleetStatusChart: function (vessels) {
        const active = vessels.filter(v => esActivo(v.status)).length;
        const maint = vessels.filter(v => esMantenimiento(v.status)).length;
        const idle = vessels.length - active - maint;

        const ctx = document.getElementById('doughnut-chart-tech');
        if (ctx) {
            const chart = Chart.getChart(ctx);
            if (chart) {
                chart.data.datasets[0].data = [active, maint, idle];
                chart.update();
            }
        }
    },

    vectorSource: null,

    startRadar: async function () {
        const mapId = 'map-dashboard-new';
        const mapContainer = document.getElementById(mapId);
        if (!mapContainer) return;

        if (this.dashMap) {
            this.dashMap.setTarget(null);
            this.dashMap = null;
        }

        mapContainer.innerHTML = '';
        this.aisMarkers = {};
        this.vectorSource = new ol.source.Vector();

        const vectorLayer = new ol.layer.Vector({
            source: this.vectorSource,
            style: new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({ color: '#00e5ff' }), // Neon Cyan for dark map
                    stroke: new ol.style.Stroke({ color: '#fff', width: 2 })
                })
            })
        });

        this.dashMap = new ol.Map({
            target: mapId,
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.XYZ({
                        url: 'https://{a-d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                        crossOrigin: 'anonymous'
                    })
                }),
                vectorLayer
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([-58.5, -30.0]),
                zoom: 5,
                minZoom: 2,
                maxZoom: 18
            }),
            controls: ol.control.defaults.defaults({ zoom: true, attribution: false })
        });

        await this.loadShips();
        this.subscribeToAIS();

        setTimeout(() => { if (this.dashMap) this.dashMap.updateSize(); }, 300);
    },

    // AIS Live markers storage
    aisMarkers: {},

    loadShips: async function () {
        if (!this.dashMap) return;
        try {
            // SAAS UPGRADE: Load only MY active ships
            const { data } = await window.sb.fetchMine('fleet_assets', '*');

            if (data && data.length > 0) {
                this.ships = data;

                const features = [];
                this.ships.forEach(v => {
                    const hasLoc = v.current_location && v.current_location.lat;
                    let lat = hasLoc ? v.current_location.lat : -27.1 + (Math.random() - 0.5);
                    let lng = hasLoc ? v.current_location.lng : -58.55 + (Math.random() - 0.5);

                    if (!esActivo(v.status)) return;

                    const feature = new ol.Feature({
                        geometry: new ol.geom.Point(ol.proj.fromLonLat([lng, lat])),
                        name: v.name,
                        status: v.status
                    });
                    features.push(feature);
                });

                if (features.length > 0) {
                    this.vectorSource.addFeatures(features);
                }
            }
        } catch (e) {
            console.error("Dashboard Map Load Error:", e);
        }
    },

    // Subscribe to AISStream for live vessel updates
    subscribeToAIS: function () {
        if (!window.AisStreamService || !window.AisStreamService.subscribe) return;

        void("📡 Dashboard: Subscribing to AIS live updates (ol)...");

        window.AisStreamService.subscribe((vessel) => {
            if (!this.dashMap || !this.vectorSource) return;

            const mmsi = vessel.mmsi;
            const lat = vessel.lat;
            const lon = vessel.lon;
            if (!lat || !lon) return;

            const coords = ol.proj.fromLonLat([lon, lat]);

            if (this.aisMarkers[mmsi]) {
                this.aisMarkers[mmsi].getGeometry().setCoordinates(coords);
            } else {
                const feature = new ol.Feature({
                    geometry: new ol.geom.Point(coords),
                    name: vessel.name,
                    mmsi: mmsi
                });
                
                // Active green style for AIS
                feature.setStyle(new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 6,
                        fill: new ol.style.Fill({ color: '#10b981' }),
                        stroke: new ol.style.Stroke({ color: '#064e3b', width: 2 })
                    })
                }));

                this.vectorSource.addFeature(feature);
                this.aisMarkers[mmsi] = feature;
            }
        });
    },

    initMapOffline: function () {
        this.startRadar();
    },

    onShow: function () {
        if (this.radarInitDeferred) {
            this.radarInitDeferred = false;
            setTimeout(() => {
                this.startRadar();
            }, 300);
        } else if (this.dashMap) {
            setTimeout(() => {
                this.dashMap.updateSize();
            }, 200);
        }
        ['scada-chart-1', 'scada-chart-2', 'scada-chart-4', 'doughnut-chart-tech'].forEach(id => {
            const ctx = document.getElementById(id);
            if (ctx) {
                const chart = Chart.getChart(ctx);
                if (chart) {
                    chart.resize();
                    chart.update();
                }
            }
        });
    },

    renderScadaCharts: async function () {
        this.createChart('scada-chart-1', 'bar', {
            labels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
            datasets: [{
                label: 'Eficiencia',
                data: [85, 92, 88, 94, 90, 85, 91],
                backgroundColor: '#00e5ff',
                borderRadius: 4,
                barThickness: 15
            }]
        });

        const ctx4 = document.getElementById('scada-chart-4');
        if (ctx4) {
            const grad = ctx4.getContext('2d').createLinearGradient(0, 0, 0, 200);
            grad.addColorStop(0, 'rgba(245, 158, 11, 0.5)');
            grad.addColorStop(1, 'rgba(245, 158, 11, 0.0)');
            this.createChart('scada-chart-4', 'line', {
                labels: ['00', '06', '12', '18', '24'],
                datasets: [{
                    label: 'Consumo',
                    data: [120, 140, 110, 155, 130],
                    borderColor: '#f59e0b',
                    borderWidth: 3,
                    backgroundColor: grad,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            });
        }

        // REAL HYDROLOGY DATA: Fetch from /api/hydrology proxy
        try {
            const hydroRes = await fetch('/api/hydrology');
            if (hydroRes.ok) {
                const hydroData = await hydroRes.json();
                const labels = hydroData.stations.slice(0, 6).map(s => s.name.substring(0, 4));
                const values = hydroData.stations.slice(0, 6).map(s => s.discharge / 1000); // Show in thousands
                this.createChart('scada-chart-2', 'line', {
                    labels: labels,
                    datasets: [{
                        label: 'Caudal (x1000 m³/s)',
                        data: values,
                        borderColor: '#3B82F6',
                        borderWidth: 3,
                        tension: 0.3,
                        pointRadius: 4,
                        pointBackgroundColor: '#1e293b',
                        pointBorderColor: '#3B82F6',
                        pointBorderWidth: 2
                    }]
                });
            } else { throw new Error('HTTP ' + hydroRes.status); }
        } catch (e) {
            // Fallback to static data if proxy fails
            this.createChart('scada-chart-2', 'line', {
                labels: ['Asu', 'Pil', 'Cor', 'Ros'],
                datasets: [{
                    label: 'Nivel',
                    data: [3.2, 2.8, 15.5, 12.8],
                    borderColor: '#3B82F6',
                    borderWidth: 3,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: '#1e293b',
                    pointBorderColor: '#3B82F6',
                    pointBorderWidth: 2
                }]
            });
        }

        this.createChart('doughnut-chart-tech', 'doughnut', {
            labels: ['OK', 'Mantenimiento', 'Inactivo'],
            datasets: [{
                data: [82, 12, 6],
                backgroundColor: ['#10b981', '#f59e0b', '#334155'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        }, { cutout: '70%' });
    },

    createChart: function (id, type, data, options) {
        const ctx = document.getElementById(id);
        if (!ctx) return;
        const existing = Chart.getChart(ctx);
        if (existing) existing.destroy();
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: type === 'doughnut' ? {} : {
                x: { display: true, ticks: { color: '#64748b' }, grid: { display: false } },
                y: { display: true, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        };
        const finalOptions = options || defaultOptions;
        new Chart(ctx.getContext('2d'), { type, data, options: finalOptions });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    dashboardLogic.init();
});

window.dashboardLogic = dashboardLogic;