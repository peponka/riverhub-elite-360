// js/modules/dashboard.js
// Updated: 2026-02-06 07:36 - Dark Map + AIS Integration
const dashboardLogic = {
    ships: [],
    dashMap: null,

    init: async function () {
        console.log("🚀 Módulo Radar Dashboard Activo.");
        this.updateGreeting();
        this.renderScadaCharts();

        let attempts = 0;
        while (!window.sb && attempts < 20) {
            await new Promise(r => setTimeout(r, 200));
            attempts++;
        }

        if (window.sb) {
            await this.startRadar();
            this.checkOnboarding();
        } else {
            console.warn("Dashboard: Supabase not ready.");
            this.initMapOffline();
        }
    },

    checkOnboarding: async function () {
        try {
            const { count, error } = await window.sb
                .from('vessels')
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
                window.sb.fetchMine('vessels', 'id, status'),
                // 2. My Active Crew
                window.sb.fetchMine('crew_members', 'id'),
                // 3. My Open Incidents/Maintenance
                window.sb.fetchMine('maintenance_logs', 'id')
            ]);

            // PROCESS VESSELS
            const myVessels = vesselsRes.data || [];
            const activeCount = myVessels.filter(v => v.status === 'active').length;
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
        const active = vessels.filter(v => v.status === 'active').length;
        const maint = vessels.filter(v => v.status === 'maintenance').length;
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

    startRadar: async function () {
        const mapId = 'map-dashboard-new';
        const mapContainer = document.getElementById(mapId);
        if (!mapContainer) return;

        if (this.dashMap) {
            this.dashMap.remove();
            this.dashMap = null;
        }

        this.dashMap = L.map(mapId, {
            zoomControl: true,
            attributionControl: false,
            background: '#0b1116'
        }).setView([-30.0, -58.5], 6); // Hidrovía completa: Paraguay → Río de la Plata

        // CARTO Dark Matter - Estilo igual al Mapa de Flota
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.dashMap);

        await this.loadShips();

        // Subscribe to AIS live updates
        this.subscribeToAIS();

        setTimeout(() => { if (this.dashMap) this.dashMap.invalidateSize(); }, 600);
    },

    // AIS Live markers storage
    aisMarkers: {},

    loadShips: async function () {
        if (!this.dashMap) return;
        try {
            // SAAS UPGRADE: Load only MY active ships
            const { data } = await window.sb.fetchMine('vessels', '*');

            if (data && data.length > 0) {
                this.ships = data;
                const shipIcon = L.divIcon({
                    className: 'custom-ship-marker',
                    html: `<div class="marker-pulse" style="border-color:#00e5ff; color:#fff; text-shadow:0 0 5px #00e5ff;"><i class="fas fa-ship"></i></div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                // Fit bounds if multiple ships
                const markers = [];

                this.ships.forEach(v => {
                    // Logic: Use real lat/long if available, else fallback to random in region (Demo for empty location)
                    const hasLoc = v.current_location && v.current_location.lat;
                    let lat = hasLoc ? v.current_location.lat : -27.1 + (Math.random() - 0.5);
                    let lng = hasLoc ? v.current_location.lng : -58.55 + (Math.random() - 0.5);

                    if (v.status !== 'active') return; // Only show active on radar

                    const m = L.marker([lat, lng], { icon: shipIcon })
                        .addTo(this.dashMap)
                        .bindPopup(`<b>${v.name}</b><br>Estado: ${v.status}<br>Carga: ${v.cargo_percent || 0}%`);
                    markers.push(m);
                });

                if (markers.length > 0) {
                    const group = new L.featureGroup(markers);
                    this.dashMap.fitBounds(group.getBounds().pad(0.1));
                }
            } else {
                console.log("Dashboard: No active vessels found for this tenant.");
            }
        } catch (e) {
            console.error(e);
        }
    },

    // Subscribe to AISStream for live vessel updates
    subscribeToAIS: function () {
        if (!window.AisStreamService) {
            console.warn("Dashboard: AisStreamService not available");
            return;
        }

        console.log("📡 Dashboard: Subscribing to AIS live updates...");

        window.AisStreamService.subscribe((vessel) => {
            if (!this.dashMap) return;

            const mmsi = vessel.mmsi;
            const lat = vessel.lat;
            const lon = vessel.lon;

            if (!lat || !lon) return;

            // Create icon for AIS vessels (green color to differentiate)
            const aisIcon = L.divIcon({
                className: 'custom-ship-marker ais-live',
                html: `<div class="marker-pulse" style="border-color:#10b981; color:#10b981;"><i class="fas fa-ship"></i></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            // Update existing marker or create new one
            if (this.aisMarkers[mmsi]) {
                // Update position
                this.aisMarkers[mmsi].setLatLng([lat, lon]);
            } else {
                // Create new marker
                const marker = L.marker([lat, lon], { icon: aisIcon })
                    .addTo(this.dashMap)
                    .bindPopup(`<b>${vessel.name}</b><br>MMSI: ${mmsi}<br>Velocidad: ${vessel.speed?.toFixed(1) || 0} kn`);

                this.aisMarkers[mmsi] = marker;
                console.log(`🚢 Dashboard: New AIS vessel - ${vessel.name}`);
            }
        });
    },

    initMapOffline: function () {
        this.startRadar();
    },

    onShow: function () {
        if (this.dashMap) {
            setTimeout(() => this.dashMap.invalidateSize(), 100);
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

    renderScadaCharts: function () {
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

        this.createChart('scada-chart-2', 'line', {
            labels: ['Asu', 'Pil', 'Hum', 'Ros'],
            datasets: [{
                label: 'Nivel',
                data: [4.2, 3.8, 2.1, 1.9],
                borderColor: '#ff4444',
                borderWidth: 3,
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: '#1e293b',
                pointBorderColor: '#ff4444',
                pointBorderWidth: 2
            }]
        });

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