/*
 * FLEET MANAGER MODULE (FLUVIAFLEET STYLED)
 */

const FleetManagerFluvia = (() => {

    let vessels = [];

    const init = () => {
        void("⚓ FleetManager (FLUVIAFLEETFleet): Iniciando...");
        const content = document.getElementById('flota-grid-container');
        if (!content) return;

        content.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding-top:40px;">
                <i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--text-sec); margin-bottom:15px;"></i>
                <p style="color:var(--text-main); font-family:var(--font-data);">Sincronizando Flota...</p>
            </div>
        `;
        injectModalHTML();
        loadData();
    };

    // ── MODAL HTML ────────────────────────────────────────────────────────────

    const injectModalHTML = () => {
        if (document.getElementById('modal-nueva-embarcacion')) return;

        const modal = document.createElement('div');
        modal.id = 'modal-nueva-embarcacion';
        modal.style.cssText = `
            display:none; position:fixed; inset:0; z-index:9999;
            background:rgba(0,0,0,0.6); backdrop-filter:blur(4px);
            align-items:center; justify-content:center;
        `;
        modal.innerHTML = `
            <div style="
                background:var(--bg-card, #1a1f2e); border:1px solid var(--border, #2a3147);
                border-radius:16px; width:100%; max-width:560px; max-height:90vh;
                overflow-y:auto; padding:32px; position:relative;
                font-family:var(--font-main,'Inter',sans-serif);
                box-shadow: 0 24px 60px rgba(0,0,0,0.5);
            ">
                <!-- Cerrar -->
                <button id="btn-cerrar-modal" style="
                    position:absolute; top:16px; right:16px;
                    background:transparent; border:none; cursor:pointer;
                    color:var(--text-sec,#94a3b8); font-size:1.2rem; padding:4px 8px;
                " onclick="FleetManager.cerrarModal()">✕</button>

                <!-- Título -->
                <div style="margin-bottom:24px;">
                    <h2 style="color:var(--text-main,#e2e8f0); font-size:1.2rem; font-weight:700; margin:0 0 4px;">
                        ⚓ Nueva Embarcación
                    </h2>
                    <p style="color:var(--text-sec,#94a3b8); font-size:0.8rem; margin:0;">
                        Completá los datos. El MMSI es necesario para el tracking en el mapa.
                    </p>
                </div>

                <form id="form-nueva-embarcacion" onsubmit="FleetManager.guardarEmbarcacion(event)">

                    <!-- MMSI destacado -->
                    <div style="
                        background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.25);
                        border-radius:10px; padding:16px; margin-bottom:20px;
                    ">
                        <label style="display:block; font-size:0.72rem; font-weight:700; color:#3B82F6; margin-bottom:6px; letter-spacing:0.05em;">
                            MMSI — IDENTIFICADOR AIS *
                        </label>
                        <input id="vessel-mmsi" type="text" inputmode="numeric" pattern="[0-9]{9}"
                            placeholder="Ej: 760123456 (9 dígitos)" maxlength="9" required
                            style="
                                width:100%; box-sizing:border-box; background:var(--bg-input,#0f1523);
                                border:1px solid rgba(59,130,246,0.4); border-radius:8px;
                                color:var(--text-main,#e2e8f0); font-size:1rem; font-weight:700;
                                padding:10px 14px; outline:none; letter-spacing:0.1em;
                            "
                        />
                        <p style="font-size:0.68rem; color:#64748b; margin:6px 0 0;">
                            El MMSI es el número único del transponder AIS del barco. Sin él, no aparece en el mapa como flota propia.
                        </p>
                    </div>

                    <!-- Nombre y Tipo -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">
                        <div>
                            <label style="display:block; font-size:0.72rem; font-weight:600; color:var(--text-sec,#94a3b8); margin-bottom:6px; letter-spacing:0.04em;">
                                NOMBRE *
                            </label>
                            <input id="vessel-name" type="text" placeholder="Ej: TB PARAGUAY 01" required
                                style="
                                    width:100%; box-sizing:border-box; background:var(--bg-input,#0f1523);
                                    border:1px solid var(--border,#2a3147); border-radius:8px;
                                    color:var(--text-main,#e2e8f0); font-size:0.88rem;
                                    padding:10px 12px; outline:none;
                                "
                            />
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; font-weight:600; color:var(--text-sec,#94a3b8); margin-bottom:6px; letter-spacing:0.04em;">
                                TIPO *
                            </label>
                            <select id="vessel-type" required style="
                                width:100%; box-sizing:border-box; background:var(--bg-input,#0f1523);
                                border:1px solid var(--border,#2a3147); border-radius:8px;
                                color:var(--text-main,#e2e8f0); font-size:0.88rem;
                                padding:10px 12px; outline:none; cursor:pointer;
                            ">
                                <option value="">Seleccionar...</option>
                                <option value="REMOLCADOR">Remolcador</option>
                                <option value="EMPUJADOR">Empujador</option>
                                <option value="BARCAZA GRANEL">Barcaza Granel</option>
                                <option value="BARCAZA TANQUE">Barcaza Tanque</option>
                                <option value="BARCAZA CONTENEDOR">Barcaza Contenedor</option>
                                <option value="LANCHA">Lancha</option>
                                <option value="OTRO">Otro</option>
                            </select>
                        </div>
                    </div>

                    <!-- Estado y Bandera -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">
                        <div>
                            <label style="display:block; font-size:0.72rem; font-weight:600; color:var(--text-sec,#94a3b8); margin-bottom:6px; letter-spacing:0.04em;">
                                ESTADO
                            </label>
                            <select id="vessel-status" style="
                                width:100%; box-sizing:border-box; background:var(--bg-input,#0f1523);
                                border:1px solid var(--border,#2a3147); border-radius:8px;
                                color:var(--text-main,#e2e8f0); font-size:0.88rem;
                                padding:10px 12px; outline:none; cursor:pointer;
                            ">
                                <option value="active">Operativo</option>
                                <option value="transito">En ruta</option>
                                <option value="maintenance">En taller</option>
                            </select>
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; font-weight:600; color:var(--text-sec,#94a3b8); margin-bottom:6px; letter-spacing:0.04em;">
                                BANDERA
                            </label>
                            <select id="vessel-flag" style="
                                width:100%; box-sizing:border-box; background:var(--bg-input,#0f1523);
                                border:1px solid var(--border,#2a3147); border-radius:8px;
                                color:var(--text-main,#e2e8f0); font-size:0.88rem;
                                padding:10px 12px; outline:none; cursor:pointer;
                            ">
                                <option value="">Seleccionar...</option>
                                <option value="Paraguay">🇵🇾 Paraguay</option>
                                <option value="Argentina">🇦🇷 Argentina</option>
                                <option value="Brasil">🇧🇷 Brasil</option>
                                <option value="Uruguay">🇺🇾 Uruguay</option>
                                <option value="Bolivia">🇧🇴 Bolivia</option>
                            </select>
                        </div>
                    </div>

                    <!-- Separador campos técnicos -->
                    <p style="font-size:0.7rem; font-weight:700; color:#475569; letter-spacing:0.08em; margin:18px 0 12px; text-transform:uppercase;">
                        Datos técnicos (opcional)
                    </p>

                    <!-- IMO y Año -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">
                        <div>
                            <label style="display:block; font-size:0.72rem; font-weight:600; color:var(--text-sec,#94a3b8); margin-bottom:6px; letter-spacing:0.04em;">
                                Nº IMO
                            </label>
                            <input id="vessel-imo" type="text" placeholder="Ej: 1234567"
                                style="
                                    width:100%; box-sizing:border-box; background:var(--bg-input,#0f1523);
                                    border:1px solid var(--border,#2a3147); border-radius:8px;
                                    color:var(--text-main,#e2e8f0); font-size:0.88rem;
                                    padding:10px 12px; outline:none;
                                "
                            />
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; font-weight:600; color:var(--text-sec,#94a3b8); margin-bottom:6px; letter-spacing:0.04em;">
                                AÑO CONSTRUCCIÓN
                            </label>
                            <input id="vessel-year" type="number" placeholder="Ej: 2012" min="1950" max="2030"
                                style="
                                    width:100%; box-sizing:border-box; background:var(--bg-input,#0f1523);
                                    border:1px solid var(--border,#2a3147); border-radius:8px;
                                    color:var(--text-main,#e2e8f0); font-size:0.88rem;
                                    padding:10px 12px; outline:none;
                                "
                            />
                        </div>
                    </div>

                    <!-- Eslora, Manga, Calado -->
                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin-bottom:14px;">
                        <div>
                            <label style="display:block; font-size:0.72rem; font-weight:600; color:var(--text-sec,#94a3b8); margin-bottom:6px; letter-spacing:0.04em;">
                                ESLORA (m)
                            </label>
                            <input id="vessel-length" type="number" step="0.1" placeholder="80.0"
                                style="
                                    width:100%; box-sizing:border-box; background:var(--bg-input,#0f1523);
                                    border:1px solid var(--border,#2a3147); border-radius:8px;
                                    color:var(--text-main,#e2e8f0); font-size:0.88rem;
                                    padding:10px 12px; outline:none;
                                "
                            />
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; font-weight:600; color:var(--text-sec,#94a3b8); margin-bottom:6px; letter-spacing:0.04em;">
                                MANGA (m)
                            </label>
                            <input id="vessel-beam" type="number" step="0.1" placeholder="15.0"
                                style="
                                    width:100%; box-sizing:border-box; background:var(--bg-input,#0f1523);
                                    border:1px solid var(--border,#2a3147); border-radius:8px;
                                    color:var(--text-main,#e2e8f0); font-size:0.88rem;
                                    padding:10px 12px; outline:none;
                                "
                            />
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; font-weight:600; color:var(--text-sec,#94a3b8); margin-bottom:6px; letter-spacing:0.04em;">
                                CALADO MÁX (m)
                            </label>
                            <input id="vessel-draft" type="number" step="0.1" placeholder="2.8"
                                style="
                                    width:100%; box-sizing:border-box; background:var(--bg-input,#0f1523);
                                    border:1px solid var(--border,#2a3147); border-radius:8px;
                                    color:var(--text-main,#e2e8f0); font-size:0.88rem;
                                    padding:10px 12px; outline:none;
                                "
                            />
                        </div>
                    </div>

                    <!-- Potencia y Capacidad combustible -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:24px;">
                        <div>
                            <label style="display:block; font-size:0.72rem; font-weight:600; color:var(--text-sec,#94a3b8); margin-bottom:6px; letter-spacing:0.04em;">
                                POTENCIA MOTOR (HP)
                            </label>
                            <input id="vessel-power" type="text" placeholder="Ej: 2 × 1800 HP"
                                style="
                                    width:100%; box-sizing:border-box; background:var(--bg-input,#0f1523);
                                    border:1px solid var(--border,#2a3147); border-radius:8px;
                                    color:var(--text-main,#e2e8f0); font-size:0.88rem;
                                    padding:10px 12px; outline:none;
                                "
                            />
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; font-weight:600; color:var(--text-sec,#94a3b8); margin-bottom:6px; letter-spacing:0.04em;">
                                CAP. COMBUSTIBLE (kL)
                            </label>
                            <input id="vessel-fuel-cap" type="number" step="0.1" placeholder="Ej: 120"
                                style="
                                    width:100%; box-sizing:border-box; background:var(--bg-input,#0f1523);
                                    border:1px solid var(--border,#2a3147); border-radius:8px;
                                    color:var(--text-main,#e2e8f0); font-size:0.88rem;
                                    padding:10px 12px; outline:none;
                                "
                            />
                        </div>
                    </div>

                    <!-- Botones -->
                    <div style="display:flex; gap:12px; justify-content:flex-end;">
                        <button type="button" onclick="FleetManager.cerrarModal()" style="
                            background:transparent; border:1px solid var(--border,#2a3147);
                            color:var(--text-sec,#94a3b8); border-radius:8px;
                            padding:10px 20px; font-size:0.85rem; cursor:pointer;
                        ">Cancelar</button>
                        <button type="submit" id="btn-guardar-vessel" style="
                            background:#3B82F6; border:none; color:#fff;
                            border-radius:8px; padding:10px 24px;
                            font-size:0.85rem; font-weight:700; cursor:pointer;
                            transition: background 0.2s;
                        ">⚓ Guardar Embarcación</button>
                    </div>

                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Cerrar al hacer click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModal();
        });
    };

    const abrirModal = () => {
        const modal = document.getElementById('modal-nueva-embarcacion');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('vessel-mmsi').focus();
        }
    };

    const cerrarModal = () => {
        const modal = document.getElementById('modal-nueva-embarcacion');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('form-nueva-embarcacion').reset();
        }
    };

    const guardarEmbarcacion = async (e) => {
        e.preventDefault();

        const mmsi = document.getElementById('vessel-mmsi').value.trim();
        const name = document.getElementById('vessel-name').value.trim();
        const type = document.getElementById('vessel-type').value;

        if (mmsi.length !== 9 || !/^\d{9}$/.test(mmsi)) {
            if (window.RiverToast) RiverToast.error('El MMSI debe tener exactamente 9 dígitos numéricos.');
            return;
        }

        const btn = document.getElementById('btn-guardar-vessel');
        btn.disabled = true;
        btn.textContent = 'Guardando...';

        const record = {
            name,
            type,
            mmsi,
            status:        document.getElementById('vessel-status').value || 'active',
            flag:          document.getElementById('vessel-flag').value || null,
            imo_number:    document.getElementById('vessel-imo').value.trim() || null,
            year_built:    parseInt(document.getElementById('vessel-year').value) || null,
            length:        parseFloat(document.getElementById('vessel-length').value) || null,
            beam:          parseFloat(document.getElementById('vessel-beam').value) || null,
            draft:         parseFloat(document.getElementById('vessel-draft').value) || null,
            engine_power:  document.getElementById('vessel-power').value.trim() || null,
            fuel_capacity: parseFloat(document.getElementById('vessel-fuel-cap').value) || null,
        };

        try {
            const { error } = await window.sb.insertMine('vessels', record);
            if (error) throw error;

            if (window.RiverToast) RiverToast.success(`${name} agregada a tu flota.`);
            cerrarModal();
            loadData();
        } catch (err) {
            console.error('Error guardando embarcación:', err);
            if (window.RiverToast) RiverToast.error('Error al guardar. Verificá los datos e intentá de nuevo.');
        } finally {
            btn.disabled = false;
            btn.textContent = '⚓ Guardar Embarcación';
        }
    };

    // ── DATA & RENDER ─────────────────────────────────────────────────────────

    const loadData = async () => {
        try {
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
            updateStats();
        }
    };

    const getDemoAssets = () => {
        return [
            { id: 1, name: 'TB PARAGUAY 01', type: 'REMOLCADOR', status: 'active', zone: 'ASUNCIÓN' },
            { id: 2, name: 'R/M HERCULES', type: 'REMOLCADOR', status: 'active', zone: 'CORRIENTES' },
            { id: 3, name: 'R/M CENTAURO', type: 'REMOLCADOR', status: 'maintenance', zone: 'TALLER' },
            { id: 4, name: 'B/G SOJA KING', type: 'BARCAZA GRANEL', status: 'transito', zone: 'KM 1400' },
            { id: 5, name: 'TQ ENERGY', type: 'BARCAZA TANQUE', status: 'active', zone: 'SAN LORENZO' }
        ];
    };

    const updateStats = () => {
        const total = vessels.length;
        const active = vessels.filter(v => v.status === 'active' || v.status === 'transito').length;
        const maint = vessels.filter(v => v.status === 'maintenance').length;

        const stTotal = document.getElementById('stat-total');
        const stActive = document.getElementById('stat-active');
        const stMaint = document.getElementById('stat-maint');

        if(stTotal) stTotal.innerText = total;
        if(stActive) stActive.innerText = active;
        if(stMaint) stMaint.innerText = maint;
    };

    const renderView = () => {
        const content = document.getElementById('flota-grid-container');
        if (!content) return;

        // Add vessel button at the top
        const addBtn = `
            <div style="
                grid-column: 1 / -1;
                display: flex;
                justify-content: flex-end;
                margin-bottom: 4px;
            ">
                <button onclick="FleetManager.abrirModal()" style="
                    background:#3B82F6; border:none; color:#fff;
                    border-radius:10px; padding:10px 20px;
                    font-size:0.85rem; font-weight:700; cursor:pointer;
                    display:flex; align-items:center; gap:8px;
                    transition: background 0.2s;
                ">
                    <i class="fas fa-plus"></i> Agregar Embarcación
                </button>
            </div>
        `;

        const gridHTML = vessels.map(v => {
            let statusText = 'OPERATIVO';
            let statusClass = 'active';

            if (v.status === 'maintenance') { statusClass = 'maintenance'; statusText = 'TALLER'; }
            if (v.status === 'transito') { statusClass = 'transito'; statusText = 'EN RUTA'; }

            const mmsiTag = v.mmsi
                ? `<span style="font-size:0.65rem; color:#3B82F6; background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.2); border-radius:4px; padding:2px 6px;">AIS: ${v.mmsi}</span>`
                : `<span style="font-size:0.65rem; color:#F59E0B; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2); border-radius:4px; padding:2px 6px;">Sin MMSI</span>`;

            return `
                <div class="flota-card">
                    <div class="flota-card-header">
                        <div class="flota-icon">
                            <i class="fa-solid fa-ship"></i>
                        </div>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>

                    <div class="flota-details">
                        <h3 class="flota-name">${v.name}</h3>
                        <span class="flota-type">${v.type || 'ACTIVO'}</span>
                        <div style="margin-top:6px;">${mmsiTag}</div>
                    </div>

                    <div class="flota-footer">
                        <span class="flota-zone"><i class="fa-solid fa-location-crosshairs"></i> ${v.zone || v.flag || 'N/A'}</span>
                        <button class="btn-icon-round" onclick="if(window.RiverToast) RiverToast.info('Ficha de ${v.name}', 'Activo')" title="Ver Ficha Técnica">
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        content.innerHTML = addBtn + gridHTML;
    };

    return { init, loadData, abrirModal, cerrarModal, guardarEmbarcacion };
})();

window.FleetManager = FleetManagerFluvia;
