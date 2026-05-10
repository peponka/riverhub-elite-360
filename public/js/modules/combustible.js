
var FuelModule = (() => {
    // --- STATE ---
    const state = {
        vessels: [],
        fuelLogs: [],
        activeVesselId: null,
        loading: false
    };

    // --- INIT ---
    const init = async () => {
        void("⛽ Módulo Combustible (Supabase) Inicializando...");
        try {
            await loadVessels();
            setupEventListeners();
            if (state.vessels.length > 0) {
                state.activeVesselId = state.vessels[0].id;
                renderVesselList();
                updateDashboard(state.vessels[0]);
            }
            void("✅ Combustible Renderizado OK");
        } catch (e) {
            console.error("❌ Error en Combustible:", e);
            // Fallback to demo data
            loadFallbackData();
        }
    };

    const loadVessels = async () => {
        if (!window.sb) { loadFallbackData(); return; }

        try {
            let res = await window.sb.fetchMine('fleet_assets', 'id, name, type, fuel_capacity, status');
            if (res.error) res = await window.sb.from('fleet_assets').select('id, name, type, fuel_capacity, status');
            
            const { data, error } = res;
            if (error) throw error;
            if (error) throw error;

            if (data && data.length > 0) {
                state.vessels = data.map(v => ({
                    id: v.id,
                    name: v.name,
                    type: v.type || 'RM',
                    capacity: v.fuel_capacity || 40000,
                    level: 50, // Will be calculated from logs
                    autonomy: 0,
                    efficiency: 0
                }));
                // Load fuel data for each vessel
                await loadFuelStats();
            } else {
                loadFallbackData();
            }
        } catch (e) {
            console.warn("⚠️ Combustible: Supabase no disponible, modo demo", e.message);
            loadFallbackData();
        }
    };

    const loadFuelStats = async () => {
        if (!window.sb) return;

        for (let vessel of state.vessels) {
            try {
                const { data } = await window.sb
                    .from('fuel_logs')
                    .select('quantity, log_type, logged_at')
                    .eq('vessel_id', vessel.id)
                    .order('logged_at', { ascending: false })
                    .limit(20);

                if (data && data.length > 0) {
                    // Calculate current level from logs
                    let totalLoaded = 0, totalConsumed = 0;
                    data.forEach(log => {
                        if (log.log_type === 'CARGA' || log.log_type === 'load') {
                            totalLoaded += parseFloat(log.quantity) || 0;
                        } else {
                            totalConsumed += Math.abs(parseFloat(log.quantity) || 0);
                        }
                    });
                    const net = totalLoaded - totalConsumed;
                    vessel.level = Math.max(5, Math.min(100, Math.round((net / vessel.capacity) * 100)));
                    vessel.autonomy = Math.round(vessel.level * 2.6);
                    vessel.efficiency = Math.round(70 + Math.random() * 25);
                }
            } catch (e) {
                // Keep defaults
            }
        }
    };

    const loadFallbackData = () => {
        state.vessels = [];
        state.activeVesselId = null;
        renderVesselList();
        updateDashboard(null);
    };

    const setupEventListeners = () => {
        const btn = document.querySelector('.btn-register-load');
        if (btn) {
            btn.onclick = openFuelModal;
        }
    };

    const openFuelModal = () => {
        const existing = document.getElementById('modal-fuel-load');
        if (existing) existing.remove();

        const modalHTML = `
        <div id="modal-fuel-load" class="modal-overlay" style="display:flex; z-index:10000; align-items:center; justify-content:center;">
            <div class="modal-content card-elite" style="max-width:450px; width:100%; border:1px solid var(--border-color);">
                <div class="modal-header" style="border-bottom:1px solid var(--border-light); padding-bottom:15px; margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="color:var(--neon-cyan); margin:0;"><i class="fas fa-gas-pump"></i> NUEVA CARGA</h3>
                    <button onclick="document.getElementById('modal-fuel-load').remove()" class="btn-ghost" style="padding:5px 10px;" data-tooltip="Cerrar Panel"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                     <div style="margin-bottom:15px;">
                        <label style="display:block; color:var(--text-muted); font-size:0.8rem; margin-bottom:5px;">BUQUE / UNIDAD</label>
                        <select id="fuel-vessel-select" class="input-elite" style="width:100%;">
                            ${state.vessels.map(v => `<option value="${v.id}">${v.name}</option>`).join('')}
                        </select>
                     </div>
                     <div style="margin-bottom:15px; display:flex; gap:15px;">
                        <div style="flex:1;">
                            <label style="display:block; color:var(--text-muted); font-size:0.8rem; margin-bottom:5px;">CANTIDAD (LITROS)</label>
                            <input type="number" id="fuel-amount" placeholder="Ej: 5000" class="input-elite" style="width:100%;">
                        </div>
                        <div style="flex:1;">
                             <label style="display:block; color:var(--text-muted); font-size:0.8rem; margin-bottom:5px;">UBICACIÓN</label>
                            <input type="text" id="fuel-location" placeholder="Ej: Rosario" class="input-elite" style="width:100%;">
                        </div>
                     </div>
                     <div style="margin-bottom:10px;">
                        <label style="display:block; color:var(--text-muted); font-size:0.8rem; margin-bottom:5px;">NOTAS ADICIONALES</label>
                        <textarea id="fuel-notes" rows="2" class="input-elite" style="width:100%; resize:none;"></textarea>
                     </div>
                </div>
                <div class="modal-footer" style="padding-top:20px; border-top:1px solid var(--border-light); display:flex; justify-content:flex-end; gap:10px;">
                    <button onclick="document.getElementById('modal-fuel-load').remove()" class="btn-material btn-material-secondary">CANCELAR</button>
                    <button onclick="FuelModule.submitLoad()" class="btn-material btn-material-primary">CONFIRMAR CARGA</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    };

    const submitLoad = async () => {
        const vid = document.getElementById('fuel-vessel-select').value;
        const amount = document.getElementById('fuel-amount').value;
        const loc = document.getElementById('fuel-location').value;
        const notes = document.getElementById('fuel-notes')?.value || '';

        if (!amount || !loc) {
            RiverToast.warning("Por favor complete todos los campos requeridos.", "Faltan Datos");
            return;
        }

        // Try Supabase insert
        if (window.sb && window.sb.insertMine) {
            try {
                const { error } = await window.sb.insertMine('fuel_logs', {
                    vessel_id: vid.startsWith('demo') ? null : vid,
                    log_type: 'CARGA',
                    quantity: parseFloat(amount),
                    location: loc,
                    notes: notes,
                    logged_at: new Date().toISOString()
                });
                if (error) throw error;
                RiverToast.success("Carga de combustible registrada exitosamente en Supabase.", "Carga Terminada");
            } catch (e) {
                console.warn("⚠️ Supabase insert failed, registering locally:", e.message);
                RiverToast.warning("Carga registrada localmente (sin persistencia en nube).", "Modo Offline");
            }
        } else {
            RiverToast.info("Carga de combustible registrada (Modo Demo).", "Simulación");
        }

        document.getElementById('modal-fuel-load').remove();

        // Refresh UI
        state.activeVesselId = vid;
        const vessel = state.vessels.find(v => v.id == vid);
        if (vessel) {
            vessel.level = Math.min(100, vessel.level + Math.round((parseFloat(amount) / vessel.capacity) * 100));
            vessel.autonomy = Math.round(vessel.level * 2.6);
        }
        renderVesselList();
        updateDashboard(state.vessels.find(v => v.id == vid));
    };

    // --- RENDER SIDEBAR LIST ---
    const renderVesselList = () => {
        const listContainer = document.querySelector('.fleet-list-bunker');
        if (!listContainer) return;

        listContainer.innerHTML = '';
        state.vessels.forEach(v => {
            const el = document.createElement('div');
            el.className = `vessel-card-bunker ${v.id === state.activeVesselId ? 'active' : ''}`;
            el.onclick = () => selectVessel(v.id);

            const liters = (v.capacity || 0).toLocaleString('es-ES');
            const iconHTML = v.id === state.activeVesselId ? '<i class="fas fa-ship"></i>' : '';

            el.innerHTML = `
                <div style="display:flex; justify-content:space-between; width:100%;">
                    <div class="v-info">
                        <h4>${v.name}</h4>
                        <span class="fuel-amount">${liters} L</span>
                    </div>
                     ${v.id === state.activeVesselId ? `<div style="color:#00e5ff;">${iconHTML}</div>` : ''}
                </div>
            `;
            listContainer.appendChild(el);
        });
    };

    const selectVessel = (id) => {
        state.activeVesselId = id;
        const vessel = state.vessels.find(v => v.id === id);
        if (vessel) {
            updateDashboard(vessel);
            renderVesselList();
        }
    };

    const updateDashboard = (vessel) => {
        if (!vessel) return;
        const titleEl = document.getElementById('shipName');
        if (titleEl) titleEl.innerText = vessel.name;

        const fillEl = document.getElementById('liquid');
        const percentEl = document.getElementById('percentageText');

        if (fillEl && percentEl) {
            fillEl.style.height = `${vessel.level}%`;
            animateValue(percentEl, parseInt(percentEl.innerText) || 0, vessel.level, 1000);
        }

        const statVals = document.querySelectorAll('.stat-val-bunker');
        if (statVals.length >= 2) {
            statVals[0].innerHTML = `${vessel.autonomy} <small>HRS</small>`;
            statVals[1].innerHTML = `${vessel.efficiency} <small>%</small>`;
        }

        renderHistory(vessel.id);
    };

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start) + "%";
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }

    // --- RENDER HISTORY ---
    const renderHistory = async (vesselId) => {
        const historyList = document.querySelector('.history-list');
        if (!historyList) return;

        let historyData = [];

        // Try Supabase first
        if (window.sb && !vesselId?.toString().startsWith('demo')) {
            try {
                const { data } = await window.sb
                    .from('fuel_logs')
                    .select('*')
                    .eq('vessel_id', vesselId)
                    .order('logged_at', { ascending: false })
                    .limit(10);

                if (data && data.length > 0) {
                    historyData = data.map(log => ({
                        type: log.log_type || 'CARGA',
                        loc: log.location || 'N/D',
                        val: log.log_type === 'ANOMALÍA' ? `-${log.quantity}L` : `+${log.quantity}L`,
                        date: new Date(log.logged_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                        isAnomaly: log.log_type === 'ANOMALÍA' || log.log_type === 'anomaly'
                    }));
                }
            } catch (e) {
                // Fall through to demo data
            }
        }

        // Fallback demo data removed

        historyList.innerHTML = '';
        historyData.forEach(item => {
            const badgeClass = item.isAnomaly ? 'danger' : 'info';
            const valClass = item.isAnomaly ? 'negative' : 'positive';
            historyList.innerHTML += `
                <div class="history-item">
                    <div class="h-row">
                        <span class="h-tag ${badgeClass}">${item.type}</span>
                        <span class="h-date">${item.date}</span>
                    </div>
                    <div class="h-row" style="margin-top:5px; margin-bottom:0;">
                        <span class="h-loc">${item.loc}</span>
                        <span class="h-val ${valClass}">${item.val}</span>
                    </div>
                </div>
            `;
        });
    };

    return {
        init,
        selectVessel,
        state,
        submitLoad
    };
})();

window.FuelModule = FuelModule;
