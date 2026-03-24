// js/modules/tripulacion.js

const CrewModule = (() => {
    const state = {
        crew: [],
        vessels: [],
        loading: false
    };

    const init = async () => {
        console.log("Módulo Tripulación & Safety activo (Supabase).");

        // Wait for connection/session briefly
        if (!window.sb) {
            console.warn("Supabase not ready, retrying in 500ms");
            setTimeout(init, 500);
            return;
        }

        // Load data immediately
        await loadData();
        bindEvents();
    };

    const bindEvents = () => {
        const btnNewCrew = document.getElementById('btn-new-crew');
        if (btnNewCrew) {
            // REDIRECT TO STANDALONE PAGE (bypasses modal caching)
            btnNewCrew.onclick = () => {
                window.location.href = 'crew-form.html';
            };
            console.log("✅ Botón de tripulación redirigido a página standalone");
        }

        // Auto-refresh when returning to tab
        window.addEventListener('focus', () => {
            if (document.getElementById('view-tripulacion').style.display !== 'none') {
                console.log("Tab focused, refreshing crew...");
                loadData();
            }
        });
    };

    const loadData = async () => {
        state.loading = true;
        const container = document.querySelector('.crew-list');
        if (container) container.innerHTML = '<div style="color:#00e5ff; text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> Conectando con Base de Datos...</div>';

        try {
            // Fetch crew
            let cRes = await window.sb.fetchMine('crew_members', '*');
            if (cRes.error) {
                console.warn("fetchMine failed on crew_members, falling back...", cRes.error);
                cRes = await window.sb.from('crew_members').select('*');
                if (cRes.error) throw cRes.error;
            }

            // Fetch fleet_assets (vessels)
            let vRes = await window.sb.fetchMine('fleet_assets', 'id, name');
            if (vRes.error) {
                console.warn("fetchMine failed on fleet_assets, falling back...", vRes.error);
                vRes = await window.sb.from('fleet_assets').select('id, name');
            }

            // 3. Set State
            state.crew = cRes.data || [];
            state.vessels = vRes.data || [];

            // 4. Render
            renderCrewList();
            populateVesselSelect();

        } catch (e) {
            console.error("Crew Load Error:", e);
            if (container) container.innerHTML = `<div style="color:#ef4444; text-align:center; padding:20px;">
                <i class="fas fa-exclamation-triangle"></i> Error de conexión.
            </div>`;
        } finally {
            state.loading = false;
        }
    };

    const renderCrewList = () => {
        const container = document.querySelector('.crew-list');
        if (!container) return;
        container.innerHTML = '';

        if (state.crew.length === 0) {
            const tenant = window.AuthModule ? (window.AuthModule.getCurrentUser()?.company || 'SIN EMPRESA') : '...';
            container.innerHTML = `
                <div style="grid-column: 1 / -1; padding:40px; color:#64748b; text-align:center; border: 1px dashed #334155; border-radius: 12px;">
                    <i class="fas fa-users" style="font-size:2rem; margin-bottom:15px; color:#334155;"></i><br>
                    Sin tripulación asignada para <strong>${tenant.toUpperCase()}</strong>.<br>
                    <span style="font-size:0.8rem;">(0 registros encontrados en BD)</span>
                </div>`;
            return;
        }

        const resolveVesselName = (c) => {
            const vid = c.vessel_id || '';
            if (!vid) return 'Sin Asignar';
            
            // Map locally from state.vessels manually fetched
            const found = state.vessels.find(v => v.id === vid);
            if (found) return found.name;

            if (vid.includes('AIS')) return 'AIS TGT ' + vid.substr(4, 4);
            return 'Sin Asignar';
        };

        state.crew.forEach(c => {
            const vesselName = resolveVesselName(c);
            let statusClass = 'card-status-active';
            let statusText = 'ACTIVO';
            let statusColor = '#10b981';

            if (c.status === 'leave') { statusClass = 'card-status-leave'; statusText = 'FRANCO'; statusColor = '#f59e0b'; }
            if (c.status === 'medical') { statusClass = 'card-status-medical'; statusText = 'MÉDICO'; statusColor = '#ef4444'; }

            const card = document.createElement('div');
            card.className = `crew-card-elite ${statusClass}`;

            card.innerHTML = `
                <div class="card-top-strip"></div>
                <div class="card-body-elite">
                    <div class="profile-row">
                        <div class="avatar-elite">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(c.full_name || 'NN')}&background=random&color=fff&bold=true" alt="Crew">
                        </div>
                        <div class="profile-info">
                            <h3>${c.full_name || 'Desconocido'}</h3>
                            <span class="profile-role">${c.role ? c.role.toUpperCase() : 'SIN ROL'}</span>
                            <span class="doc-id"><i class="fas fa-id-card"></i> ${c.doc_id || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="card-stats-grid">
                        <div class="stat-chip">
                            <span class="stat-mini-label">BUQUE ACTUAL</span>
                            <span class="stat-mini-value"><i class="fas fa-ship" style="color:#64748b; margin-right:4px;"></i> ${vesselName}</span>
                        </div>
                        <div class="stat-chip">
                            <span class="stat-mini-label">ESTADO</span>
                            <span class="stat-mini-value" style="color:${statusColor}">${statusText}</span>
                        </div>
                    </div>

                    <div class="health-strip">
                        <div class="health-label-row">
                            <span>APTO MÉDICO</span>
                            <span style="color:#10b981;">VIGENTE</span>
                        </div>
                        <div class="health-track"><div class="health-fill" style="width: 100%;"></div></div>
                    </div>
                </div>
                
                <div class="card-actions-elite">
                    <button class="btn-card-action" onclick="RiverToast.info('Abriendo gestor documental de tripulante...', 'Expediente', 'fas fa-copy')"><i class="fas fa-file-contract"></i> DOCS</button>
                    <button class="btn-card-action primary" onclick="RiverToast.info('Activando proceso de relevo para ${c.full_name}. Refiriendo a Capitanía...', 'Solicitud de Relevo', 'fas fa-exchange-alt')"><i class="fas fa-exchange-alt"></i> RELEVAR</button>
                </div>
            `;
            container.appendChild(card);
        });
    };

    const getStatusColor = (s) => {
        if (s === 'active') return '#00ff88';
        if (s === 'leave') return '#ffbb33';
        if (s === 'medical') return '#ff4444';
        return '#889';
    };

    const populateVesselSelect = () => {
        // 1. Populate Modal Selects (if any exist in DOM)
        let select = document.getElementById('crew-input-vessel');
        if (!select) {
            const modal = document.getElementById('modal-nuevo-relevo');
            if (modal) select = modal.querySelector('select');
        }

        const selectV2 = document.getElementById('crew-v2-vessel');

        const options = '<option value="">Seleccionar buque...</option>' +
            state.vessels.map(v => `<option value="${v.id}">${v.name}</option>`).join('');

        if (select) select.innerHTML = options;
        if (selectV2) selectV2.innerHTML = options;

        // 2. Populate Main Filter (The one in the screenshot)
        const filterSelect = document.querySelector('.tripulacion-container .filters-row select:nth-of-type(2)');
        // Or better, find by text context of label if possible, but structure is fixed.
        // Looking at HTML structure: div > label "FILTRAR POR EMBARCACIÓN" > select

        // Let's target all selects in the filter row to be safe or be specific
        const vesselFilters = document.querySelectorAll('.filters-row .input-filter-dark');
        if (vesselFilters.length >= 2) {
            // Second one usually is vessel based on HTML order
            const vFilter = vesselFilters[1];
            if (vFilter) {
                vFilter.innerHTML = '<option value="">TODA LA FLOTA</option>' +
                    state.vessels.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
            }
        }
    };

    const submitV2 = async () => {
        const nameInput = document.getElementById('crew-v2-name');
        const roleInput = document.getElementById('crew-v2-role');
        const vesselSelect = document.getElementById('crew-v2-vessel');

        if (!nameInput || !vesselSelect) return RiverToast.error("Error interno: V2 Inputs no encontrados", "Fallo UI");

        const name = nameInput.value;
        const role = roleInput.value;
        const vesselId = vesselSelect.value; // Can be null if not selected, handle gracefully

        if (!name) return RiverToast.warning("Por favor ingrese el nombre del tripulante.", "Datos Faltantes");

        const btn = document.querySelector('#modal-nuevo-relevo-v2 button[onclick*="submitV2"]');
        if (btn) btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> PROCESANDO...';

        await saveCrewMemberV2(name, role, vesselId)
            .finally(() => {
                if (btn) btn.innerHTML = 'CONFIRMAR RELEVO';
            });
    };

    const saveCrewMemberV2 = async (name, role, vesselId) => {
        try {
            // SAAS UPGRADE: insertMine automatically tags with company_id
            const { error } = await window.sb.insertMine('crew_members', {
                full_name: name,
                role: role,
                vessel_id: vesselId || null, // Allow null if unassigned
                status: 'active'
            });

            if (error) throw error;

            RiverToast.success("Orden de Relevo (V2) Registrada con Éxito.", "Relevo Ejecutado");
            document.getElementById('modal-nuevo-relevo-v2').style.display = 'none';
            loadData(); // Refresh list

        } catch (e) {
            console.warn("V2 Error:", e);
            RiverToast.error("Error al guardar relevo: " + e.message, "Fallo Operativo");
        }
    };

    // Legacy save kept internal, not modifying it.

    return { init, submitV2 };
})();

window.CrewModule = CrewModule;
