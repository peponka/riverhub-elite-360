// js/modules/calado.js

const CaladoModule = (() => {
    // Estado del módulo
    const state = {
        embarcaciones: [],
        historial: [],
        loading: false
    };

    // Inicialización
    // FIX: Resize map on load and resize events to prevent grey tiles
    const init = async () => {
        void('Módulo de Tracking Conectado (Socket.io).');

        // Listen for resize to fix map layout
        window.addEventListener('resize', () => {
            if (state.map) state.map.invalidateSize();
        });

        // Also invalidate shortly after init for mobile transitions
        setTimeout(() => {
            if (state.map) state.map.invalidateSize();
        }, 1000);

        await loadData();
    };

    // Cargar datos reales
    const loadData = async () => {
        state.loading = true;
        renderUI(); // Show loading state if needed

        try {
            // 1. Fetch Vessels
            let { data: vessels, error: vErr } = await window.sb
                .fetchMine('fleet_assets', '*');

            if (vErr) {
                // fallback
                let res = await window.sb.from('fleet_assets').select('*').order('name');
                vessels = res.data;
                vErr = res.error;
            }

            if (vErr) throw vErr;
            state.embarcaciones = vessels || [];

            // 2. Fetch History (Readings) -> NOW FROM LOGS (Piggyback)
            const { data: logs, error: rErr } = await window.sb
                .from('logs')
                .select(`
                    id, created_at, description, location_data, vessel_id,
                    vessels:vessel_id (name),
                    profiles:user_id (full_name)
                `)
                .eq('action_type', 'DRAFT_READING')
                .order('created_at', { ascending: false })
                .limit(100); // Expanded limit for Virtual Drafts

            if (rErr) throw rErr;

            // Map Logs to Readings format
            state.historial = (logs || []).map(log => ({
                id: log.id,
                created_at: log.created_at,
                draft_value: log.location_data?.draft || 0,
                notes: log.description,
                vessels: log.vessels,
                profiles: log.profiles,
                vessel_id: typeof log.vessels === 'object' ? null : log.vessels // Supabase weirdness check, actually need vessel_id from query if not expanded correctly, but logs has vessel_id column.
            }));

            // Fix: We need vessel_id raw value to map.
            // The select above gets `vessel_id` plain column too? Yes.

            // 3. VIRTUAL COLUMN STRATEGY: Inject current_draft into vessels from logs
            state.embarcaciones.forEach(vessel => {
                const latestLog = logs.find(l => l.vessel_id === vessel.id);
                vessel.current_draft = latestLog ? (latestLog.location_data?.draft || 0) : 0;
            });

        } catch (e) {
            console.error("Calado Load Error:", e);
        } finally {
            state.loading = false;
            renderUI();
        }
    };

    // ... (renderUI logic defined previously) ...
    // Note: I need to make sure I don't overwrite renderUI with the previous tool call's mistake.
    // The previous tool call restored renderUI. I am editing loadData here.
    // Wait, the line numbers in my instruction need to target handleFormSubmit too to remove the update!

    // I will split this into two replaces to be safe? 
    // No, I can target strict blocks. 
    // Let's do loadData first.


    // Renderizar interfaz
    const renderUI = () => {
        const loadingHtml = state.loading ? '<i class="fas fa-circle-notch fa-spin"></i> Cargando...' : '';

        const html = `
            <div class="calado-container">
                <div class="calado-card">
                    <h3><i class="fas fa-ruler-vertical"></i> Registro de Calado</h3>
                    <form id="form-calado">
                        <div class="calado-form-group">
                            <label>Embarcación ${loadingHtml}</label>
                            <div class="input-row-group">
                                <select id="select-embarcacion" required class="input-dark">
                                    <option value="">Seleccionar embarcación...</option>
                                    ${state.embarcaciones.map(e => `
                                        <option value="${e.id}">${e.name}</option>
                                    `).join('')}
                                </select>
                                <button type="button" class="btn-icon-add" title="Agregar Embarcación" onclick="CaladoModule.openAddModal()">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>

                        <div class="calado-form-group">
                            <label>Calado Actual (m)</label>
                            <input type="number" id="input-calado" step="0.01" min="0" max="10" placeholder="Ej: 2.45" required class="input-dark">
                        </div>

                        <div class="calado-form-group">
                            <label>Observaciones</label>
                            <input type="text" id="input-obs" placeholder="Ej: Bajante en río norte" class="input-dark">
                        </div>

                        <button type="submit" class="btn-calado" id="btn-save-reading">
                            <i class="fas fa-save"></i> GUARDAR
                        </button>
                    </form>
                </div>

                <div class="calado-card">
                    <h3><i class="fas fa-chart-line"></i> Estadísticas de Flota</h3>
                    <div class="calado-stats-row">
                        <div class="stat-mini">
                            <div class="stat-mini-value">${calculateAverage()}<span style="font-size: 0.7rem;">m</span></div>
                            <div class="stat-mini-label">Promedio</div>
                        </div>
                        <div class="stat-mini">
                            <div class="stat-mini-value">${state.embarcaciones.length}</div>
                            <div class="stat-mini-label">Unidades</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="calado-card" style="grid-column: 1 / -1; margin-top:20px;">
                <h3><i class="fas fa-table"></i> Estado de Embarcaciones</h3>
                <div class="table-responsive">
                    <table class="calado-table">
                        <thead>
                            <tr>
                                <th>Embarcación</th>
                                <th>Calado Actual</th>
                                <th>Máximo</th>
                                <th>% Seguridad</th>
                                <th>Estado</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-calados">
                            ${state.embarcaciones.length > 0 ? state.embarcaciones.map(e => renderEmbarcacion(e)).join('') : '<tr><td colspan="6" style="text-align:center; padding:20px;">Sin unidades registradas.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="calado-card" style="grid-column: 1 / -1;">
                <h3><i class="fas fa-history"></i> Historial Reciente</h3>
                <table class="calado-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Embarcación</th>
                            <th>Lectura</th>
                            <th>Operador</th>
                            <th>Notas</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-historial">
                        ${state.historial.map(h => `
                            <tr>
                                <td>${new Date(h.created_at).toLocaleString()}</td>
                                <td>${h.vessels?.name || 'Desconocido'}</td>
                                <td><strong style="color:#00e5ff">${h.draft_value}m</strong></td>
                                <td>${h.profiles?.full_name || 'Sistema'}</td>
                                <td>${h.notes || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- MODAL ADD VESSEL -->
            <div id="modal-add-vessel" class="calado-modal-overlay" style="display:none;">
                <div class="calado-modal">
                    <h3><i class="fas fa-ship"></i> Nueva Embarcación</h3>
                    <div class="calado-form-group">
                        <label>Nombre</label>
                        <input type="text" id="new-name" placeholder="Ej: TB Delta-04" class="input-dark">
                    </div>
                    <div class="calado-form-group">
                        <label>Calado Máximo (m)</label>
                        <input type="number" id="new-max" value="3.5" step="0.1" class="input-dark">
                    </div>
                    <div class="modal-actions">
                        <button class="btn-cancel" onclick="CaladoModule.closeAddModal()">Cancelar</button>
                        <button class="btn-save" onclick="CaladoModule.saveNewVessel()">Guardar</button>
                    </div>
                </div>
            </div>
        `;

        const container = document.getElementById('calado-main');
        // Fallback or main container
        const target = container || document.getElementById('view-calado');

        if (target) {
            // If target is view-calado, we might need to insert into a specific child or create one
            // Trying to respect existing structure. Ideally there is a container div inside view-calado.
            // Let's create one if not exists or replace content.
            const inner = target.querySelector('.calado-content-wrapper');
            if (!inner) {
                target.innerHTML = `<div class="calado-content-wrapper">${html}</div>`;
            } else {
                inner.innerHTML = html;
            }

            setupEventListeners();
        }
    };

    const calculateAverage = () => {
        if (state.embarcaciones.length === 0) return '0.00';
        const sum = state.embarcaciones.reduce((a, b) => a + (b.current_draft || 0), 0);
        return (sum / state.embarcaciones.length).toFixed(2);
    };

    // Renderizar fila de embarcación
    const renderEmbarcacion = (e) => {
        const max = e.max_draft || 3.5;
        const current = e.current_draft || 0;
        const porciento = Math.min(100, Math.round((current / max) * 100));

        let estado = 'normal';
        let statusClass = 'status-normal';

        if (porciento > 90) { estado = 'CRÍTICO'; statusClass = 'status-critical'; }
        else if (porciento > 75) { estado = 'ALERTA'; statusClass = 'status-warning'; }
        else { estado = 'OPTIMO'; statusClass = 'status-normal'; }

        return `
            <tr>
                <td>${e.name}</td>
                <td><strong style="color:white; font-size:1.1rem;">${current.toFixed(2)}m</strong></td>
                <td>${max.toFixed(2)}m</td>
                <td>
                    <div style="width: 100px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; height:6px; margin-top:5px;">
                        <div style="width: ${porciento}%; height: 100%; background: ${statusClass === 'status-critical' ? '#ff4444' : (statusClass === 'status-warning' ? '#ffbb33' : '#00e5ff')};"></div>
                    </div>
                    <small>${porciento}%</small>
                </td>
                <td><span class="calado-status ${statusClass}">${estado}</span></td>
                <td>
                    <button class="btn-calado-mini" onclick="CaladoModule.actualizarEmbarcacion('${e.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `;
    };

    // Event listeners
    const setupEventListeners = () => {
        const form = document.getElementById('form-calado');
        if (form) form.onsubmit = handleFormSubmit;

        const sel = document.getElementById('select-embarcacion');
        if (sel) sel.onchange = handleEmbarcacionChange;
    };

    // Manejar envío de formulario
    const handleFormSubmit = async (e) => {
        e.preventDefault();

        const btn = document.getElementById('btn-save-reading');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Guardando...';
        btn.disabled = true;

        try {
            const idEmb = document.getElementById('select-embarcacion').value;
            const calado = parseFloat(document.getElementById('input-calado').value);
            const obs = document.getElementById('input-obs').value;

            if (!idEmb || isNaN(calado)) {
                RiverToast.warning('Datos inválidos', 'Validación');
                return;
            }

            const user = window.AuthModule ? window.AuthModule.getCurrentUser() : null;

            // 1. Insert Reading -> INTO LOGS (Piggyback)
            const { error: rErr } = await window.sb
                .from('logs')
                .insert([{
                    vessel_id: idEmb,
                    user_id: user ? user.id : null,
                    action_type: 'DRAFT_READING',
                    description: obs || 'Actualización de calado',
                    location_data: { draft: calado } // Store value here
                }]);

            if (rErr) throw rErr;

            // 2. Update Vessel Current Draft -> SKIPPED (Virtual Column Strategy)
            // We do not update 'vessels' table because the column 'current_draft' might miss or be cached out.
            // We rely on 'logs' to calculate it on load.

            // Success
            await loadData();

        } catch (err) {
            console.error("❌ ERROR DIRECT INSERT:", err);
            RiverToast.error("Error al guardar: " + (err.message || err), 'Error DB');
        } finally {
            if (btn) {
                btn.innerHTML = '<i class="fas fa-save"></i> GUARDAR';
                btn.disabled = false;
            }
        }
    };


    // Manejar cambio de embarcación
    const handleEmbarcacionChange = (e) => {
        const idEmb = e.target.value;
        if (idEmb) {
            const emb = state.embarcaciones.find(eb => eb.id === idEmb);
            if (emb) {
                const input = document.getElementById('input-calado');
                if (input) input.value = (emb.current_draft || 0).toFixed(2);
            }
        }
    };

    // API pública
    return {
        init,
        actualizarEmbarcacion: (id) => {
            const sel = document.getElementById('select-embarcacion');
            if (sel) {
                sel.value = id;
                handleEmbarcacionChange({ target: sel });

                // Scroll top
                document.querySelector('.calado-container').scrollIntoView({ behavior: 'smooth' });
            }
        },
        openAddModal: () => {
            const m = document.getElementById('modal-add-vessel');
            if (m) m.style.display = 'flex';
        },
        closeAddModal: () => {
            const m = document.getElementById('modal-add-vessel');
            if (m) m.style.display = 'none';
        },
        saveNewVessel: async () => {
            const name = document.getElementById('new-name').value;
            const max = parseFloat(document.getElementById('new-max').value);

            if (!name || isNaN(max)) {
                RiverToast.warning("Completa los datos", 'Validación');
                return;
            }

            try {
                let { error } = await window.sb
                    .insertMine('fleet_assets', {
                        name: name,
                        max_draft: max,
                        current_draft: 0,
                        status: 'OPERATIVO'
                    });

                if (error) {
                     let res = await window.sb.from('fleet_assets').insert([{
                        name: name,
                        max_draft: max,
                        current_draft: 0,
                        status: 'OPERATIVO'
                     }]);
                     error = res.error;
                }

                if (error) throw error;

                CaladoModule.closeAddModal();
                await loadData();

            } catch (e) {
                RiverToast.error("Error: " + e.message, 'Error de Operación');
            }
        }
    };
})();

window.CaladoModule = CaladoModule;
