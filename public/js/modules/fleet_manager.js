/*
 * FLEET MANAGER MODULE (REBOOT)
 * Dedicated module for "Gestión de Flota" to avoid conflicts.
 */

const FleetManager = (() => {

    // --- STATE ---
    let vessels = [];

    // --- INIT ---
    const init = () => {
        console.log("⚓ FleetManager: Iniciando...");

        // 1. Encuentra el contenedor
        const content = document.getElementById('admin-content');
        if (!content) {
            console.error("❌ FleetManager: No se encontró '#admin-content'");
            // Intenta revivirlo si el HTML está roto
            return;
        }

        // 2. Renderiza Loading Inmediato (Hard render)
        content.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding-top:100px;">
                <i class="fas fa-circle-notch fa-spin fa-3x" style="color:#00e5ff; margin-bottom:20px;"></i>
                <h3 style="color:#fff;">Cargando Flota...</h3>
            </div>
        `;

        // 3. Carga Datos (Simulado o Real)
        loadData();
    };

    const loadData = async () => {
        try {
            // Intentar Supabase
            if (window.sb && window.sb.fetchMine) {
                const { data, error } = await window.sb.fetchMine('vessels', '*');
                if (!error && data && data.length > 0) {
                    vessels = data;
                } else {
                    vessels = getDemoAssets();
                }
            } else {
                vessels = getDemoAssets();
            }
        } catch (e) {
            console.warn("FleetManager: Error de red, usando demo.", e);
            vessels = getDemoAssets();
        } finally {
            renderView();
        }
    };

    const getDemoAssets = () => {
        return [
            { id: 1, name: 'TB PARAGUAY 01', type: 'REMOLCADOR', status: 'active', zone: 'ASUNCIÓN' },
            { id: 2, name: 'R/M HERCULES', type: 'REMOLCADOR', status: 'active', zone: 'CORRIENTES' },
            { id: 3, name: 'R/M CENTAURO', type: 'REMOLCADOR', status: 'maintenance', zone: 'TALLER' },
            { id: 4, name: 'B/G SOJA KING', type: 'BARCAZA_GRANEL', status: 'transito', zone: 'KM 1400' },
            { id: 5, name: 'TQ ENERGY', type: 'BARCAZA_TANQUE', status: 'active', zone: 'SAN LORENZO' }
        ];
    };

    const renderView = () => {
        const content = document.getElementById('admin-content');
        if (!content) return; // Should not happen

        // Construir Grid HTML
        const grid = vessels.map(v => {
            let color = '#00e5ff'; // Cyan active
            let statusText = 'OPERATIVO';
            if (v.status === 'maintenance') { color = '#ff4444'; statusText = 'TALLER'; }
            if (v.status === 'transito') { color = '#3b82f6'; statusText = 'EN RUTA'; }

            return `
                <div style="background:#0f172a; border:1px solid ${color}; border-radius:12px; padding:20px; position:relative; overflow:hidden;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <div style="width:40px; height:40px; background:${color}20; border-radius:8px; display:flex; align-items:center; justify-content:center;">
                            <i class="fas fa-ship" style="color:${color}; font-size:1.2rem;"></i>
                        </div>
                        <span style="color:${color}; font-weight:bold; font-size:0.75rem; border:1px solid ${color}; padding:2px 8px; border-radius:4px;">${statusText}</span>
                    </div>
                    <h3 style="color:#fff; margin:0 0 5px 0; font-size:1.1rem;">${v.name}</h3>
                    <p style="color:#64748b; font-size:0.8rem; margin:0;">${v.type || 'ACTIVO'}</p>
                    
                    <div style="margin-top:15px; padding-top:15px; border-top:1px solid #334155; display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:#94a3b8; font-size:0.8rem;"><i class="fas fa-map-marker-alt"></i> ${v.zone || 'N/A'}</span>
                        <button onclick="alert('Detalle no disponible en demo')" style="background:transparent; border:none; color:#fff; cursor:pointer;"><i class="fas fa-arrow-right"></i></button>
                    </div>
                </div>
            `;
        }).join('');

        content.innerHTML = `
            <div style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
                <h2 style="color:#fff; margin:0;">Flota Activa <span style="font-size:1rem; color:#64748b; font-weight:normal;">(${vessels.length})</span></h2>
                <button onclick="FleetManager.loadData()" style="background:#334155; border:none; color:#fff; padding:8px 15px; border-radius:6px; cursor:pointer;"><i class="fas fa-sync"></i></button>
            </div>
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px;">
                ${grid}
            </div>
        `;
    };

    return {
        init,
        loadData // Expose for reload button logic
    };
})();

// Attach globally
window.FleetManager = FleetManager;
console.log("✅ FleetManager Loaded.");
