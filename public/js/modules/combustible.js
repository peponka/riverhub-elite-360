
var FuelModule = (() => {
    // --- STATE ---
    const state = {
        vessels: [
            { id: 1, name: 'TB PARAGUAY 01', type: 'TB', level: 69, capacity: 45000, autonomy: 182, efficiency: 94 },
            { id: 2, name: 'R/M HERCULES', type: 'RM', level: 45, capacity: 55000, autonomy: 110, efficiency: 88 },
            { id: 3, name: 'R/M CENTAURO', type: 'RM', level: 82, capacity: 32000, autonomy: 210, efficiency: 97 },
            { id: 4, name: 'R/M ORION STAR', type: 'RM', level: 20, capacity: 40000, autonomy: 48, efficiency: 76 }
        ],
        activeVesselId: 1
    };

    // --- INIT ---
    // --- INIT ---
    const init = () => {
        console.log("⛽ Módulo Combustible (Bunkering User Design) Inicializando...");
        try {
            // Wait for DOM to be ready
            setTimeout(() => {
                renderVesselList();
                // Default to first vessel
                updateDashboard(state.vessels[0]);
                setupEventListeners();
                console.log("✅ Combustible Renderizado OK");
            }, 100);
        } catch (e) {
            console.error("❌ Error critical en Combustible:", e);
        }
    };

    const setupEventListeners = () => {
        const btn = document.querySelector('.btn-register-load');
        if (btn) {
            btn.onclick = openFuelModal;
        } else {
            console.warn("⚠️ Botón .btn-register-load no encontrado");
        }
    };

    const openFuelModal = () => {
        // Remove existing if any
        const existing = document.getElementById('modal-fuel-load');
        if (existing) existing.remove();

        const modalHTML = `
        <div id="modal-fuel-load" class="modal-overlay" style="display:flex; z-index:10000; align-items:center; justify-content:center;">
            <div class="modal-content card-elite" style="max-width:450px; width:100%; border:1px solid var(--border-color);">
                <div class="modal-header" style="border-bottom:1px solid var(--border-light); padding-bottom:15px; margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="color:var(--neon-cyan); margin:0;"><i class="fas fa-gas-pump"></i> NUEVA CARGA</h3>
                    <button onclick="document.getElementById('modal-fuel-load').remove()" class="btn-ghost" style="padding:5px 10px;"><i class="fas fa-times"></i></button>
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

    const submitLoad = () => {
        const vid = document.getElementById('fuel-vessel-select').value;
        const amount = document.getElementById('fuel-amount').value;
        const loc = document.getElementById('fuel-location').value;

        if (!amount || !loc) {
            alert("Por favor complete todos los campos requeridos.");
            return;
        }

        console.log(`Carga Registrada: Buque ${vid}, ${amount}L en ${loc}`);
        // Here you would call backend

        // Mock Update UI
        alert("✅ Carga registrada exitosamente (Simulación)");
        document.getElementById('modal-fuel-load').remove();

        // Refresh active if needed
        state.activeVesselId = parseInt(vid);
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

            // Format amount as 12.450 L
            const liters = v.capacity.toLocaleString('es-ES', { minimumFractionDigits: 0 });
            const isDimmed = v.id !== state.activeVesselId ? 'dimmed' : '';

            // Icon only for active or specific logic? User used ph-boat. adapting to fontawesome
            const iconHTML = v.id === state.activeVesselId ? '<i class="fas fa-ship"></i>' : '';

            el.innerHTML = `
                <div style="display:flex; justify-content:space-between; width:100%;">
                    <div class="v-info">
                        <h4>${v.name}</h4>
                        <span class="fuel-amount ${isDimmed}">${liters} L</span>
                    </div>
                     ${v.id === state.activeVesselId ? `<div style="color:#00e5ff;">${iconHTML}</div>` : ''}
                </div>
            `;
            listContainer.appendChild(el);
        });
    };

    // --- SELECTION HANDLER ---
    const selectVessel = (id) => {
        state.activeVesselId = id;
        const vessel = state.vessels.find(v => v.id === id);
        if (vessel) {
            // Animate only if switching? For now direct update
            updateDashboard(vessel);
            renderVesselList();
        }
    };

    // --- UPDATE DASHBOARD UI ---
    const updateDashboard = (vessel) => {
        // Title
        const titleEl = document.getElementById('shipName');
        if (titleEl) titleEl.innerText = vessel.name;

        // Tank
        const fillEl = document.getElementById('liquid');
        const percentEl = document.getElementById('percentageText');

        if (fillEl && percentEl) {
            fillEl.style.height = `${vessel.level}%`;

            // Text Animation
            animateValue(percentEl, parseInt(percentEl.innerText) || 0, vessel.level, 1000);
        }

        // Stats
        const statVals = document.querySelectorAll('.stat-val-bunker');
        if (statVals.length >= 2) {
            statVals[0].innerHTML = `${vessel.autonomy} <small>HRS</small>`;
            statVals[1].innerHTML = `${vessel.efficiency} <small>%</small>`;
        }

        // History
        renderHistory(vessel.id);
    };

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start) + "%";
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // --- RENDER HISTORY ---
    const renderHistory = (vesselId) => {
        const historyList = document.querySelector('.history-list');
        if (!historyList) return;

        // Mock data logic (could filter by vesselId in real app)
        const historyData = [
            { type: 'CARGA', loc: 'ROSARIO', val: '+8000L', date: '05 Nov, 10:30', isAnomaly: false },
            { type: 'CARGA', loc: 'VILLETA', val: '+5000L', date: '06 Nov, 14:15', isAnomaly: false },
            { type: 'ANOMALÍA', loc: 'KM 1445', val: '-450L', date: '07 Nov, 03:00', isAnomaly: true },
        ];

        historyList.innerHTML = '';
        historyData.forEach(item => {
            const badgeClass = item.isAnomaly ? 'danger' : 'info';
            const valClass = item.isAnomaly ? 'negative' : 'positive';
            const label = item.type; // CARGA or ANOMALÍA

            historyList.innerHTML += `
                <div class="history-item">
                    <div class="h-row">
                        <span class="h-tag ${badgeClass}">${label}</span>
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

// Assign to window
window.FuelModule = FuelModule;
