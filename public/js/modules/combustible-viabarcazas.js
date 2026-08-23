/*
 * COMBUSTIBLE MODULE (VIABARCAZAS STYLED)
 */

const CombustibleModuleViaBarcazas = (() => {

    const state = {
        vessels: [],
        fuelLogs: [],
        activeVesselId: null
    };

    const init = async () => {
        void("⛽ Combustible (viabarcazasFleet) Iniciando...");
        await loadData();
    };

    /* Carga la flota y las cargas de combustible REALES.
       Antes init() llamaba directo a loadFallbackData() — el comentario decía
       "Direct to demo data for isolated UI preview" — así que la pantalla
       siempre mostraba 3 barcos y 3 movimientos inventados, aunque la base
       tuviera 15 embarcaciones y 16 cargas registradas.
       Si la consulta falla o vuelve vacía se cae al demo, para no dejar la
       pantalla en blanco. */
    const loadData = async () => {
        try {
            if (!window.sb || !window.sb.fetchMine) { loadFallbackData(); return; }

            const [vRes, fRes] = await Promise.all([
                window.sb.fetchMine('vessels', 'id, name, fuel_capacity'),
                window.sb.fetchMine('fuel_logs', 'vessel_id, log_type, quantity, location, logged_at')
            ]);

            const vessels = (vRes && vRes.data) || [];
            if (!vessels.length) { loadFallbackData(); return; }

            const logs = (fRes && fRes.data) || [];

            // Nivel estimado del tanque = ÚLTIMA carga sobre la capacidad.
            //
            // No se suman todas las cargas a propósito: `fuel_logs` solo tiene
            // movimientos de tipo 'carga' (no hay consumos registrados), así que
            // el acumulado supera la capacidad — p.ej. 64.000 L cargados en un
            // tanque de 38.000 daría 100%, que es falso. La última carga es lo
            // más cercano a un nivel real con los datos que hay.
            state.vessels = vessels.map(v => {
                const cap = Number(v.fuel_capacity) || 0;
                const mios = logs
                    .filter(l => l.vessel_id === v.id)
                    .sort((a, b) => new Date(b.logged_at || 0) - new Date(a.logged_at || 0));
                const ultima = mios.length ? Math.abs(Number(mios[0].quantity) || 0) : 0;
                const nivel = cap > 0 ? Math.max(0, Math.min(100, Math.round((ultima / cap) * 100))) : 0;
                return {
                    id: v.id,
                    name: v.name,
                    capacity: cap,
                    level: nivel,
                    // Sin registros de consumo no se puede calcular autonomía
                    // ni eficiencia reales: van en 0 en vez de inventarlas.
                    autonomy: 0,
                    efficiency: 0
                };
            });

            // La base guarda 'carga' en minúscula y la UI muestra el tipo tal
            // cual junto a etiquetas como CARGA/CONSUMO/ANOMALÍA.
            state.fuelLogs = logs.map(l => ({
                ...l,
                log_type: String(l.log_type || 'carga').toUpperCase()
            }));
            state.activeVesselId = state.vessels[0].id;
            renderVesselList();
            updateDashboard(state.vessels[0]);
        } catch (e) {
            console.warn('Combustible: error cargando datos reales, se usan los de demo.', e);
            loadFallbackData();
        }
    };

    // Pre-loaded realistic data
    const loadFallbackData = () => {
        state.vessels = [
            { id: '1', name: 'TB PARAGUAY 01', capacity: 50000, level: 65, autonomy: 169, efficiency: 85 },
            { id: '2', name: 'R/M HERCULES', capacity: 80000, level: 42, autonomy: 109, efficiency: 78 },
            { id: '3', name: 'B/G SOJA KING', capacity: 10000, level: 80, autonomy: 208, efficiency: 95 }
        ];

        // Seed logs
        state.fuelLogs = [
            { vessel_id: '1', log_type: 'CARGA', quantity: 15000, location: 'Puerto Villeta', logged_at: new Date(Date.now() - 86400000).toISOString() },
            { vessel_id: '1', log_type: 'CONSUMO', quantity: -3000, location: 'Navegación Km 600', logged_at: new Date(Date.now() - 43200000).toISOString() },
            { vessel_id: '2', log_type: 'CARGA', quantity: 30000, location: 'Pto. San Lorenzo', logged_at: new Date(Date.now() - 172800000).toISOString() }
        ];

        if (state.vessels.length > 0) {
            state.activeVesselId = state.vessels[0].id;
            renderVesselList();
            updateDashboard(state.vessels[0]);
        }
    };

    const renderVesselList = () => {
        const listContainer = document.querySelector('.fleet-list-bunker');
        if (!listContainer) return;

        listContainer.innerHTML = state.vessels.map(v => {
            const isActive = v.id === state.activeVesselId;
            const liters = (v.capacity || 0).toLocaleString('es-ES');
            
            return `
                <div class="vessel-card-bunker ${isActive ? 'active' : ''}" onclick="CombustibleModuleViaBarcazas.selectVessel('${v.id}')">
                    <div class="v-info">
                        <h4>${v.name}</h4>
                        <span class="fuel-amount">${liters} L max</span>
                    </div>
                </div>
            `;
        }).join('');
    };

    const selectVessel = (id) => {
        state.activeVesselId = id;
        renderVesselList();
        const v = state.vessels.find(x => x.id === id);
        if (v) updateDashboard(v);
    };

    const updateDashboard = (vessel) => {
        if (!vessel) return;
        
        const titleEl = document.getElementById('shipName');
        const fillEl = document.getElementById('liquid');
        const percentEl = document.getElementById('percentageText');
        const statVals = document.querySelectorAll('.stat-val-bunker');

        if (titleEl) titleEl.innerText = vessel.name;
        if (fillEl && percentEl) {
            fillEl.style.height = `${vessel.level}%`;
            
            // Adjust color based on level
            if(vessel.level < 20) fillEl.style.background = 'linear-gradient(0deg, #dc2626, #ef4444)'; // Red
            else if(vessel.level < 40) fillEl.style.background = 'linear-gradient(0deg, #d97706, #f59e0b)'; // Orange
            else fillEl.style.background = 'linear-gradient(0deg, #eab308, #facc15)'; // Yellow

            animateValue(percentEl, parseInt(percentEl.innerText) || 0, vessel.level, 800);
        }

        if (statVals.length >= 2) {
            statVals[0].innerHTML = `${vessel.autonomy} <small>HRS</small>`;
            statVals[1].innerHTML = `${vessel.efficiency} <small>%</small>`;
        }

        renderHistory(vessel.id);
    };

    const animateValue = (obj, start, end, duration) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start) + "%";
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    };

    const renderHistory = (vesselId) => {
        const historyList = document.querySelector('.history-list');
        if (!historyList) return;

        const filtered = state.fuelLogs.filter(l => l.vessel_id === vesselId).sort((a,b) => new Date(b.logged_at) - new Date(a.logged_at));

        historyList.innerHTML = filtered.map(log => {
            const isAnomaly = log.log_type === 'ANOMALÍA' || log.quantity < 0;
            const badgeClass = isAnomaly ? 'danger' : 'info';
            const valClass = isAnomaly ? 'negative' : 'positive';
            const sign = log.quantity > 0 ? '+' : '';
            const qtyStr = `${sign}${log.quantity.toLocaleString('es-ES')}L`;
            const dateStr = new Date(log.logged_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

            return `
                <div class="history-item">
                    <div class="h-row" style="margin-bottom:6px;">
                        <span class="h-tag ${badgeClass}">${log.log_type}</span>
                        <span class="h-date">${dateStr}</span>
                    </div>
                    <div class="h-row">
                        <span class="h-loc"><i class="fa-solid fa-location-dot" style="font-size:0.8em; color:var(--text-sec);"></i> ${log.location}</span>
                        <span class="h-val ${valClass}">${qtyStr}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        if(filtered.length === 0) {
            historyList.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-sec); font-size:0.8rem;">Sin registros.</div>';
        }
    };

    const openFuelModal = () => {
        const existing = document.getElementById('modal-fuel-viabarcazas');
        if (existing) existing.remove();

        const opts = state.vessels.map(v => `<option value="${v.id}" ${v.id === state.activeVesselId ? 'selected' : ''}>${v.name}</option>`).join('');

        const modalHTML = `
        <div id="modal-fuel-viabarcazas" class="modal-overlay-viabarcazas">
            <div class="modal-content-viabarcazas">
                <h3><i class="fa-solid fa-gas-pump" style="color:var(--text-sec);"></i> Registrar Suministro</h3>
                
                <div class="form-group-viabarcazas">
                    <label>BUQUE / UNIDAD</label>
                    <select id="fl-vessel" class="input-viabarcazas">
                        ${opts}
                    </select>
                </div>
                
                <div style="display:flex; gap:16px;">
                    <div class="form-group-viabarcazas" style="flex:1;">
                        <label>CANTIDAD (LITROS)</label>
                        <input type="number" id="fl-amount" class="input-viabarcazas" placeholder="Ej: 15000">
                    </div>
                    <div class="form-group-viabarcazas" style="flex:1;">
                        <label>UBICACIÓN / PUERTO</label>
                        <input type="text" id="fl-loc" class="input-viabarcazas" placeholder="Ej: Pto. Villeta">
                    </div>
                </div>

                <div class="form-group-viabarcazas">
                    <label>OBSERVACIONES</label>
                    <input type="text" id="fl-notes" class="input-viabarcazas" placeholder="Opcional">
                </div>

                <div class="modal-footer-viabarcazas">
                    <button class="btn-outline" onclick="document.getElementById('modal-fuel-viabarcazas').remove()">Cancelar</button>
                    <button class="btn-primary" onclick="CombustibleModuleViaBarcazas.submitLoad()"><i class="fa-solid fa-check"></i> Autorizar Carga</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    };

    const submitLoad = () => {
        const vid = document.getElementById('fl-vessel').value;
        const amt = parseFloat(document.getElementById('fl-amount').value);
        const loc = document.getElementById('fl-loc').value;

        if (!amt || !loc) {
            if(window.RiverToast) window.RiverToast.warning("Complete cantidad y ubicación.");
            return;
        }

        // Add to local state
        state.fuelLogs.unshift({
            vessel_id: vid,
            log_type: 'CARGA',
            quantity: amt,
            location: loc,
            logged_at: new Date().toISOString()
        });

        // Update Vessel Level
        const v = state.vessels.find(x => x.id === vid);
        if (v) {
            const addedPercent = Math.round((amt / v.capacity) * 100);
            v.level = Math.min(100, v.level + addedPercent);
            v.autonomy = Math.round(v.level * 2.6);
        }

        document.getElementById('modal-fuel-viabarcazas').remove();
        if(window.RiverToast) window.RiverToast.success("Suministro registrado y nivel actualizado.");

        // Re-render
        if(state.activeVesselId === vid) {
            updateDashboard(v);
        } else {
            selectVessel(vid);
        }
    };

    return { init, selectVessel, openFuelModal, submitLoad };
})();

window.CombustibleModuleViaBarcazas = CombustibleModuleViaBarcazas;
