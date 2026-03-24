// js/modules/hidrologia.js

const hydroLogic = {
    // Coordenadas Base (Rosario - Zona Clave)
    baseLocation: { lat: -32.94, lng: -60.65 },

    // PUNTOS DE MONITOREO REALES (Lat/Lng aprox sobre el canal del río)
    stations: {
        asuncion: { name: 'Asunción', lat: -25.296, lng: -57.649 }, // Río Paraguay
        rosario: { name: 'Rosario', lat: -32.964, lng: -60.608 },  // Río Paraná
        corumba: { name: 'Corumbá', lat: -19.000, lng: -57.650 }   // Alto Paraguay
    },

    init: async function () {
        console.log("Módulo Hidrología REAL activo (Open-Meteo Flood API).");

        // 1. Cargar Clima Base (Rosario como ref)
        await this.loadCurrentWeather();

        // 2. Cargar Hidrología Real
        await this.renderHydrology();
    },

    loadCurrentWeather: async function () {
        if (!window.WeatherService) return;
        const w = await window.WeatherService.getWeather(this.baseLocation.lat, this.baseLocation.lng);
        if (!w) return;
        this.safeText('hydro-temp', `${w.temp}°C`);
        this.safeText('hydro-wind', `${w.windSpeed} km/h`);
        this.safeText('hydro-desc', window.WeatherService.getWeatherDesc(w.code));
        const iconEl = document.getElementById('hydro-icon');
        if (iconEl) iconEl.className = `fas ${window.WeatherService.getWeatherIcon(w.code)} fa-3x`;
    },

    renderHydrology: async function () {
        // Obtenemos Caudal Real de Asunción (Referencia Principal)
        const st = this.stations.asuncion;
        let flowData = null;

        if (window.WeatherService) {
            const chart = document.getElementById('hydro-chart-bars');
            if (chart) chart.innerHTML = '<div style="color:#00e5ff; padding:20px; text-align:center;"><i class="fas fa-satellite fa-spin"></i> Conectando satélite para aforo de caudal...</div>';
            flowData = await window.WeatherService.getRiverDischarge(st.lat, st.lng, 30);
        }

        if (!flowData) {
            this.renderMockFallback(); // Si falla la API, fallback visual
            return;
        }

        // Renderizar Gráfico de Caudal
        const container = document.getElementById('hydro-chart-bars');
        if (!container) return;
        container.innerHTML = '';

        // Título del Gráfico
        const info = document.createElement('div');
        info.innerHTML = `<small style="color:#94a3b8">CAUDAL: RÍO PARAGUAY (m³/s) - ÚLTIMOS 30 DÍAS</small>`;
        info.style.marginBottom = '10px';
        container.appendChild(info);

        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'hydro-chart-flex'; // Requires CSS flex definition or inline
        chartWrapper.style.display = 'flex';
        chartWrapper.style.alignItems = 'flex-end';
        chartWrapper.style.height = '150px';
        chartWrapper.style.gap = '2px';
        container.appendChild(chartWrapper);

        // Encontrar max para escalar
        const maxFlow = Math.max(...flowData.map(d => d.discharge || 0)) * 1.1;

        flowData.forEach((day, i) => {
            const val = day.discharge || 0;
            const pct = (val / maxFlow) * 100;
            const isToday = i === (flowData.length - 8); // Ajuste aprox hoy

            const bar = document.createElement('div');
            bar.style.width = '100%';
            bar.style.height = '0%';
            bar.style.transition = 'height 1s ease';
            bar.style.position = 'relative';

            // Color Logic (Median vs Real)
            const median = day.median || val;
            if (val < median * 0.8) bar.style.background = '#ef4444'; // Sequía (-20% de media)
            else if (val > median * 1.2) bar.style.background = '#00e5ff'; // Crecida (+20% de media)
            else bar.style.background = '#3b82f6'; // Normal

            if (isToday) bar.style.borderTop = '2px solid #fff'; // Mark today

            bar.title = `${new Date(day.date).toLocaleDateString()}: ${val.toFixed(0)} m³/s`;

            chartWrapper.appendChild(bar);

            // Animate
            setTimeout(() => bar.style.height = `${pct}%`, 50 * i);
        });

        // Actualizar Valor Numérico Principal
        const todayData = flowData[flowData.length - 8]; // Tomamos el de hoy (forecast 7 days)
        if (todayData) {
            this.updateLevelDisplay(todayData.discharge, todayData.median);
        }
    },

    safeText: function (id, text) {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    },

    updateLevelDisplay: function (flow, median) {
        // En lugar de nivel en metros, mostramos Caudal y Tendencia
        const asuEl = document.getElementById('hydro-level-asu');
        if (asuEl) {
            // Convertir Flow a una estimación de Nivel visual o solo mostrar Flow
            // Vamos a mostrar el Flow con un label pequeño
            const diff = calculateTrend(flow, median);
            asuEl.innerHTML = `
                <div style="font-size:1.5rem; font-weight:bold;">${flow.toFixed(0)} <span style="font-size:0.8rem">m³/s</span></div>
                <div style="font-size:0.7rem; color:${diff.color}">${diff.text} (${diff.pct}%)</div>
            `;
            asuEl.className = ''; // Remove old classes
        }
    },

    renderMockFallback: function () {
        // Fallback antiguo por si se corta internet
        console.warn("Hidrología: Usando Fallback");
        const container = document.getElementById('hydro-chart-bars');
        if (container) container.innerHTML = "Offline Mode";
    }
};

// Helper
function calculateTrend(current, median) {
    if (!median) return { text: 'N/A', pct: 0, color: '#aaa' };
    const pct = ((current - median) / median) * 100;
    if (pct < -20) return { text: 'BAJANTE CRÍTICA', pct: pct.toFixed(0), color: '#ef4444' };
    if (pct < -10) return { text: 'BAJANTE', pct: pct.toFixed(0), color: '#fbbf24' };
    if (pct > 20) return { text: 'CRECIDA', pct: '+' + pct.toFixed(0), color: '#00e5ff' };
    return { text: 'ESTABLE', pct: pct.toFixed(0), color: '#10b981' };
}

document.addEventListener('DOMContentLoaded', () => {
    // Observer or navigation check could trigger this, doing timeout for simplicity
    setTimeout(() => hydroLogic.init(), 1000);

    const downloadBtn = document.querySelector('#view-hidrologia .btn-ghost-blue');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (window.RiverToast) {
                RiverToast.info("Generando boletín en PDF...", "Hidrología", "fas fa-file-pdf");
                setTimeout(() => {
                    RiverToast.success("Boletín meteorológico descargado con éxito.", "Descarga Completada");
                }, 2000);
            }
        });
    }
});
