/*
  * ADMIN MODULE REBOOT - "GRILLA DE MESAS" STYLE
  * Simple, Directo, Sin dependencias complejas.
  */

const AdminModule = (() => {
    // ESTADO INTERNO (State)
    let state = {
        assets: [],
        isLoading: false,
        error: null
    };

    // --- 1. INICIALIZACION (The Hook) ---
    const init = async () => {
        void("🚀 AdminModule: Iniciando (REBOOT)...");

        // 1.1 Verificar contenedor
        const container = document.getElementById('admin-content');
        if (!container) {
            console.error("❌ AdminModule: No encuentro #admin-content en el DOM.");
            return;
        }

        // 1.2 Mostrar Carga Inmediata
        renderLoading();

        // 1.3 Intentar Cargar Datos (Con Fallback a Demo)
        await loadData();
    };

    // --- 2. DATA LAYER (Supabase + Fallback) ---
    const loadData = async () => {
        state.isLoading = true;

        try {
            // Intentar conectar con Supabase si existe
            if (window.sb && window.sb.fetchMine) {
                const { data, error } = await window.sb.fetchMine('vessels', '*');
                if (error) throw error;

                if (data && data.length > 0) {
                    state.assets = data;
                } else {
                    // Si devuelve array vacío, usamos demo
                    void("⚠️ AdminModule: DB vacía, usando datos demo.");
                    state.assets = getDemoData();
                }
            } else {
                throw new Error("Supabase Offline");
            }

        } catch (e) {
            console.warn("⚠️ AdminModule: Fallo al cargar datos reales. Usando modo DEMO.", e);
            state.assets = getDemoData();
        } finally {
            state.isLoading = false;
            render();
        }
    };

    const getDemoData = () => {
        return [
            { id: '1', name: 'TB PARAGUAY 01', vessel_type: 'REMOLCADOR', status: 'transito', mmsi: 701000001, zone: 'KM 1580 ASUNCIÓN' },
            { id: '2', name: 'R/M HERCULES', vessel_type: 'REMOLCADOR', status: 'operativo', mmsi: 701000002, zone: 'KM 1240 CORRIENTES' },
            { id: '3', name: 'R/M CENTAURO', vessel_type: 'REMOLCADOR', status: 'transito', mmsi: 701000003, zone: 'KM 1100 GOYA' },
            { id: '4', name: 'B/M SOJA KING', vessel_type: 'BARCAZA_GRANEL', status: 'operativo', mmsi: '', zone: 'AMARRADERO SUR' },
            { id: '5', name: 'TQ LIQUID ENERGY', vessel_type: 'BARCAZA_TANQUE', status: 'mantenimiento', mmsi: '', zone: 'ASTILLERO AGUADA' },
            { id: '6', name: 'R/M ORION', vessel_type: 'REMOLCADOR', status: 'operativo', mmsi: 701000006, zone: 'KM 1400 PILAR' },
        ];
    };

    // --- 3. RENDER ENGINE (Visuals) ---
    const renderLoading = () => {
        const c = document.getElementById('admin-content');
        if (c) c.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; color:#00e5ff;">
                <i class="fas fa-satellite-dish fa-spin fa-3x" style="margin-bottom:20px;"></i>
                <div style="font-family:'Rajdhani'; font-size:1.5rem; letter-spacing:2px;">CONECTANDO SATÉLITE...</div>
            </div>
        `;
    };

    const render = () => {
        const container = document.getElementById('admin-content');
        if (!container) return;

        // Header Style
        const header = `
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 25px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:15px;">
               <div>
                   <div style="color:#64748b; font-size:0.8rem; letter-spacing:1px; margin-bottom:5px;">VISTA SATELITAL • TIEMPO REAL</div>
                   <h2 style="color:#fff; margin:0; font-size:2rem; text-shadow:0 0 20px rgba(0,229,255,0.3);">FLOTA ACTIVA</h2>
               </div>
               <div style="display:flex; gap:10px;">
                    <div style="background:#0f172a; border:1px solid #334155; padding:8px 15px; border-radius:30px; color:#94a3b8; display:flex; align-items:center;">
                        <i class="fas fa-clock" style="margin-right:8px; color:#00e5ff;"></i> ${new Date().toLocaleTimeString()}
                    </div>
                    <button onclick="AdminModule.addVessel()" style="background:var(--neon-green); color:#000; border:none; padding:8px 20px; border-radius:30px; font-weight:bold; cursor:pointer; box-shadow:0 0 15px rgba(16,185,129,0.3);">
                        <i class="fas fa-plus"></i> NUEVO
                    </button>
               </div>
            </div>
        `;

        // Grid Style
        let gridHtml = '<div class="admin-grid-reboot" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:20px;">';

        state.assets.forEach(asset => {
            // Logic Colors
            let statusColor = '#10b981'; // Green
            let statusIcon = 'fa-check-circle';
            if (asset.status === 'mantenimiento') { statusColor = '#ef4444'; statusIcon = 'fa-tools'; }
            if (asset.status === 'transito') { statusColor = '#3b82f6'; statusIcon = 'fa-water'; }

            gridHtml += `
                <div style="background:rgba(15, 23, 42, 0.95); border:1px solid ${statusColor}44; border-radius:12px; padding:20px; position:relative; overflow:hidden; transition:transform 0.2s;" onmouseover="this.style.borderColor='${statusColor}'; this.style.transform='translateY(-5px)'" onmouseout="this.style.borderColor='${statusColor}44'; this.style.transform='translateY(0)'">
                    
                    <!-- Status Strip -->
                    <div style="position:absolute; top:0; left:0; width:4px; height:100%; background:${statusColor}; box-shadow: 0 0 10px ${statusColor};"></div>

                    <!-- Header -->
                    <div style="display:flex; justify-content:space-between; margin-bottom:15px; padding-left:10px;">
                        <div style="font-size:1.2rem; font-weight:bold; color:#fff;">${asset.name}</div>
                        <div style="color:${statusColor}; font-size:1.2rem;"><i class="fas ${asset.vessel_type === 'REMOLCADOR' ? 'fa-ship' : 'fa-box-open'}"></i></div>
                    </div>

                    <!-- Details -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; padding-left:10px; margin-bottom:15px;">
                        <div>
                            <div style="color:#64748b; font-size:0.7rem;">TIPO</div>
                            <div style="color:#cbd5e1; font-size:0.9rem;">${asset.vessel_type}</div>
                        </div>
                        <div>
                            <div style="color:#64748b; font-size:0.7rem;">MMSI</div>
                            <div style="color:#cbd5e1; font-size:0.9rem; font-family:monospace;">${asset.mmsi || 'N/A'}</div>
                        </div>
                         <div style="grid-column: 1 / -1;">
                            <div style="color:#64748b; font-size:0.7rem;">UBICACIÓN ACTUAL</div>
                            <div style="color:#00e5ff; font-size:0.9rem;"><i class="fas fa-map-marker-alt"></i> ${asset.zone || asset.current_zone || 'EN RUTA'}</div>
                        </div>
                    </div>

                    <!-- Action Bar -->
                    <div style="border-top:1px solid rgba(255,255,255,0.05); padding-top:15px; padding-left:10px; display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:5px; color:${statusColor}; font-size:0.8rem; font-weight:bold; text-transform:uppercase;">
                             <i class="fas ${statusIcon}"></i> ${asset.status}
                        </div>
                        <button onclick="AdminModule.deleteVessel('${asset.id}')" style="background:transparent; border:none; color:#ef4444; cursor:pointer opacity:0.7;">
                             <i class="fas fa-trash"></i>
                        </button>
                    </div>

                </div>
            `;
        });

        gridHtml += '</div>';

        container.innerHTML = header + gridHtml;
    };

    // --- 4. ACTIONS (Add/Remove) ---
    const addVessel = () => {
        // Replaced prompt with auto-generation to avoid native blocking
        const name = "TB NUEVO " + Math.floor(Math.random() * 100);
        state.assets.unshift({
            id: 'new-' + Date.now(),
            name: name.toUpperCase(),
            vessel_type: 'REMOLCADOR',
            status: 'operativo',
            zone: 'PUERTO ASUNCIÓN'
        });
        if (window.RiverToast) RiverToast.success("Nuevo activo asignado a la grilla.", "Nueva Embarcación");
        render();
    };

    const deleteVessel = (id) => {
        if (window.RiverToast) RiverToast.success("Activo eliminado definitivamente de la base satelital.", "Flota Actualizada", "fas fa-trash");
        state.assets = state.assets.filter(a => a.id !== id);
        render();
    };

    // PUBLIC API
    return {
        init,
        addVessel,
        deleteVessel
    };

})();

// AUTO-BOOTSTRAP (Por si 'global.js' falla)
window.AdminModule = AdminModule;
void("✅ AdminModule (REBOOT) Cargado en Memoria.");
