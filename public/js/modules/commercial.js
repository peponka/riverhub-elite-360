// js/modules/commercial.js

const commercialLogic = (() => {
    // STATE
    const state = {
        clients: [],
        contracts: [], // Service Orders
        activeContract: null,
        manifests: [] // Cargo for active contract
    };

    // INIT
    const init = async () => {
        void("💼 Módulo Comercial Iniciado");

        // GHOST BUSTER
        const allButtons = document.querySelectorAll('button');
        allButtons.forEach(btn => {
            if (btn.innerText.includes('NUEVA ORDEN') && !btn.innerText.includes('CREAR')) {
                btn.remove();
            }
        });

        const container = document.getElementById('contract-list');
        if (container) {
            container.innerHTML = '<div style="text-align:center; padding:20px; color:#00e5ff"><i class="fas fa-satellite fa-spin"></i> Sincronizando Contratos...</div>';
        }

        // SAFETY NET: If after 4 seconds nothing happened, force mock
        const safetyTimer = setTimeout(() => {
            if (state.contracts.length === 0 && document.getElementById('contract-list').innerText.includes('Sincronizando')) {
                console.warn("⚠️ TIEMPO DE ESPERA AGOTADO: Forzando Mock Data");
                useMockClients();
                useMockContracts();
                renderContractsList();

                // Toast
                if (container) {
                    const toast = document.createElement('div');
                    toast.style.cssText = "background:#ef4444; color:#fff; padding:10px; border-radius:5px; text-align:center; margin-bottom:10px; font-size:0.8rem; animation:fadeIn 0.5s;";
                    toast.innerHTML = "<i class='fas fa-exclamation-circle'></i> Error de conexión: Mostrando datos locales.";
                    container.prepend(toast);
                }
            }
        }, 4000);

        try {
            await loadClients();
            await loadContracts();
        } catch (fatalErr) {
            console.error("FATAL COMMERCIAL INIT:", fatalErr);
            useMockClients();
            useMockContracts();
            renderContractsList();
        } finally {
            clearTimeout(safetyTimer);
            // Always populate barges dropdown on init
            loadBarges();
        }
    };

    // --- DATA FETCHING ---
    const loadClients = async () => {
        if (!window.sb) { useMockClients(); return; }

        const { data, error } = await window.sb.from('clients').select('id, name').order('name');
        if (error) {
            console.warn("Error loading clients (using mock):", error);
            useMockClients();
        } else {
            if (!data || data.length === 0) {
                // AUTO-SEED DB if empty
                void("Creando clientes por defecto en Supabase...");
                const defaultClients = [
                    { name: 'ADM PARAGUAY', type: 'Agro', country: 'Paraguay' },
                    { name: 'CARGILL S.A.', type: 'Agro', country: 'Argentina' },
                    { name: 'BUNGE CONOSUR', type: 'Agro', country: 'Uruguay' }
                ];
                const { data: newClients, err } = await window.sb.from('clients').insert(defaultClients).select();
                state.clients = newClients || [];
            } else {
                state.clients = data;
            }
        }
    };

    const useMockClients = () => {
        state.clients = [];
    };

    const loadContracts = async () => {
        if (!window.sb) { useMockContracts(); return; }
        try {
            const { data, error } = await window.sb.from('service_orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            if (!data || data.length === 0) {
                 void("No hay contratos, pero la base está online. Dejando vacío, espera interacción del usuario.");
                 state.contracts = [];
            } else {
                 state.contracts = data;
            }
            renderContractsList();
        } catch (err) {
            console.error("Error loading contracts (using mock):", err);
            useMockContracts();
            renderContractsList();
            // Fallback notice
            const container = document.getElementById('contract-list');
            if (container) {
                const notice = document.createElement('div');
                notice.innerHTML = '<small style="color:#f59e0b; display:block; text-align:center; padding:5px;">⚠️ Modo Local (Sin conexión DB)</small>';
                container.prepend(notice);
            }
        }
    };

    const useMockContracts = () => {
        state.contracts = [];
    };

    const loadManifests = async (contractId) => {
        if (!window.sb) return;
        const { data, error } = await window.sb.from('cargo_manifests')
            .select('*, barge:fleet_assets(name, type)')
            .eq('service_order_id', contractId);

        if (error) {
            console.warn("Manifest fetch error:", error);
            state.manifests = [];
        } else {
            state.manifests = data || [];
        }
        renderManifests();
    };

    // --- ACTIONS ---
    const openCreateModal = () => {
        const modal = document.getElementById('modal-new-contract');
        const select = document.getElementById('new-contract-client');

        if (!select) {
            console.error("Modal Select not found!");
            return;
        }

        // Populate clients
        select.innerHTML = '';
        state.clients.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.innerText = c.name;
            select.appendChild(opt);
        });

        if (modal) modal.style.display = 'flex';
    };

    const confirmCreateContract = async () => {
        const modal = document.getElementById('modal-new-contract');
        const clientId = document.getElementById('new-contract-client').value;
        const origin = document.getElementById('new-contract-origin').value;
        const dest = document.getElementById('new-contract-dest').value;
        const rate = parseFloat(document.getElementById('new-contract-rate').value) || 0;

        if (!window.sb) { RiverToast.error('Sin conexión a base de datos. No se puede crear la orden.'); return; }

        const btn = document.querySelector('button[onclick="CommercialModule.confirmCreateContract()"]');
        if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> CREANDO...';

        try {
            const payload = {
                client_id: clientId,
                order_number: 'OS-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 10000),
                origin_port: origin,
                destination_port: dest,
                status: 'BORRADOR',
                agreed_rate: rate
            };

            const { data, error } = await window.sb.from('service_orders').insert(payload).select().single();

            if (error) throw error;

            state.contracts.unshift(data);
            renderContractsList();
            selectContract(data);
            if (modal) modal.style.display = 'none';

        } catch (err) {
            console.error("Fallo crear contrato en DB:", err);
            RiverToast.error('Error guardando la orden de servicio en la BD.', 'Error de Datos');
        } finally {
            if (btn) btn.innerHTML = 'CREAR ORDEN';
        }
    };

    // --- CARGO MANIFEST LOGIC ---

    // 1. Load Real Barges
    const loadBarges = async () => {
        const select = document.getElementById('cargo-barge-select');
        if (!select) return;

        const mockBarges = '<option value="b-mock-1">B-001 GRANEL</option><option value="b-mock-2">B-002 TANQUE</option><option value="b-mock-3">B-003 GRANEL</option>';

        // Default Mock if no DB
        if (!window.sb) {
            select.innerHTML = mockBarges;
            return;
        }

        try {
            const { data, error } = await window.sb.fetchMine('fleet_assets', 'id, name');

            if (error || !data || data.length === 0) {
                console.warn("No vessels found, using mock barges");
                select.innerHTML = mockBarges;
            } else {
                populateBargeSelect(data);
            }
        } catch (e) {
            console.warn("loadBarges error, using mock:", e);
            select.innerHTML = mockBarges;
        }
    };

    const populateBargeSelect = (vessels) => {
        const select = document.getElementById('cargo-barge-select');
        if (!select) return;
        select.innerHTML = '';
        if (vessels.length === 0) {
            select.innerHTML = '<option value="">Sin Activos Disponibles</option>';
            return;
        }
        vessels.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.innerText = v.name;
            select.appendChild(opt);
        });
    };

    // 2. Assign Cargo Action
    const assignCargoAction = () => {
        if (!state.activeContract) { RiverToast.warning('Selecciona una orden primero.', 'Atención'); return; }

        const bargeId = document.getElementById('cargo-barge-select').value;
        // Use placeholders if inputs missing (simplified for now)
        const productInput = document.querySelector('#cargo-editor-panel input[type="text"]');
        const qtyInput = document.querySelector('#cargo-editor-panel input[type="number"]');

        const product = productInput ? productInput.value : 'S/D';
        const qty = qtyInput ? parseFloat(qtyInput.value) : 0;

        if (qty <= 0) { RiverToast.warning('Ingresa una cantidad válida.', 'Validación'); return; }

        const btn = document.querySelector('#cargo-editor-panel button.btn-new-contract');
        if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ...';

        addCargoToManifest(state.activeContract.id, bargeId, product, qty, btn);
    };

    const addCargoToManifest = async (contractId, bargeId, product, qty, btnElement) => {
        if (!window.sb) { RiverToast.error('Sin conexión a base de datos.'); return; }

        try {
            const payload = {
                service_order_id: contractId,
                barge_id: bargeId,
                product_type: product,
                quantity: qty
            };

            const { data, error } = await window.sb.from('cargo_manifests').insert(payload).select('*, barge:fleet_assets(name)').single();

            if (error) throw error;

            state.manifests.push(data);
            renderManifests();

        } catch (err) {
            console.error("Fallo asignar carga:", err);
            RiverToast.error('Hubo un error asignando la carga en la BD.', 'Error de Datos');
        } finally {
            if (btnElement) btnElement.innerHTML = 'Asignar';
        }
    };

    // --- RENDERING ---
    const renderContractsList = () => {
        const container = document.getElementById('contract-list');
        if (!container) return;
        container.innerHTML = '';

        if (state.contracts.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:30px; color:#667; border:1px dashed #334; border-radius:10px;">
                    <i class="fas fa-folder-open" style="font-size:2rem; margin-bottom:10px;"></i><br>
                    Sin órdenes activas.<br>
                    <small>Crea una nueva para comenzar.</small>
                </div>
            `;
            return;
        }

        state.contracts.forEach(c => {
            const card = document.createElement('div');
            card.className = `contract-card ${state.activeContract && state.activeContract.id === c.id ? 'active' : ''}`;
            card.onclick = () => selectContract(c);

            const client = state.clients.find(cl => cl.id === c.client_id);
            const clientName = client ? client.name : 'Cliente Genérico';

            card.innerHTML = `
                <div class="contract-info">
                    <span class="client-name">${clientName}</span>
                    <span class="contract-status status-${c.status ? c.status.toLowerCase() : 'draft'}">${c.status || 'BORRADOR'}</span>
                </div>
                <div class="route-info">
                    <i class="fas fa-route"></i> ${c.origin_port} ➔ ${c.destination_port}
                </div>
                <div style="font-size:0.8rem; color:#666; margin-top:5px; display:flex; justify-content:space-between; align-items:center;">
                    <span>${c.order_number}</span>
                    <div style="display:flex; gap:10px;">
                        <button class="btn-icon-sm" onclick="event.stopPropagation(); CommercialModule.deleteContract('${c.id}')" data-tooltip="Eliminar" style="color:#ef4444; background:none; border:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
                        <button class="btn-icon-sm" onclick="event.stopPropagation(); CommercialModule.selectContractId('${c.id}')" data-tooltip="Abrir Orden" style="color:#00e5ff; background:none; border:none; cursor:pointer;"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    };

    const selectContract = (contract) => {
        state.activeContract = contract;
        renderContractsList();

        document.getElementById('cargo-editor-panel').classList.add('visible');
        document.getElementById('active-contract-title').innerText = `Gestión de Carga: ${contract.order_number}`;

        loadManifests(contract.id);
        loadBarges(); // Populate dropdown
    };

    const updateFinancials = () => {
        const container = document.getElementById('financial-summary');
        if (!container) return;

        if (!state.activeContract) {
            container.innerHTML = '';
            return;
        }

        const rate = parseFloat(state.activeContract.agreed_rate) || 0;
        const totalTons = state.manifests.reduce((acc, m) => acc + (parseFloat(m.quantity) || 0), 0);
        const totalRevenue = totalTons * rate;

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0, 255, 0, 0.05); padding:15px; border-radius:8px; border:1px solid rgba(0,255,0,0.3);">
                <div>
                    <div style="font-size:0.7rem; color:#aaa; letter-spacing:1px;">VOLUMEN TOTAL</div>
                    <div style="font-size:1.4rem; font-weight:bold; color:#fff;">${totalTons.toLocaleString()} <span style="font-size:0.9rem">TN</span></div>
                </div>
                <div>
                    <div style="font-size:0.7rem; color:#aaa; letter-spacing:1px;">TARIFA</div>
                    <div style="font-size:1.4rem; font-weight:bold; color:#fff;">$${rate}<span style="font-size:0.9rem">/tn</span></div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:0.7rem; color:#aaa; letter-spacing:1px;">FACTURACIÓN EST.</div>
                    <div style="font-size:1.6rem; font-weight:bold; color:#00e5ff;">$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
            </div>
        `;
    };

    const renderManifests = () => {
        const container = document.getElementById('manifest-list');
        if (!container) return;
        container.innerHTML = '';

        if (state.manifests.length === 0) {
            container.innerHTML = '<div style="color:#556; text-align:center; padding:20px; font-style:italic;">No se ha asignado carga aún.</div>';
            updateFinancials();
            return;
        }

        state.manifests.forEach(m => {
            const row = document.createElement('div');
            row.className = 'manifest-item';
            row.innerHTML = `
                <div>
                    <div class="manifest-barge"><i class="fas fa-box"></i> ${m.barge ? m.barge.name : 'Barcaza ???'}</div>
                    <small style="color:#889">${m.product_type} • ${new Date(m.created_at || Date.now()).toLocaleDateString()}</small>
                </div>
                <div class="manifest-qty">
                    ${m.quantity} TN
                </div>
            `;
            container.appendChild(row);
        });

        updateFinancials();
    };

    const selectContractId = (id) => {
        const c = state.contracts.find(x => x.id === id);
        if (c) selectContract(c);
    };

    const deleteContract = async (id) => {
        if (window.RiverToast) RiverToast.info("Orden de servicio eliminada permanentemente.", "Servicio Eliminado", "fas fa-trash");

        state.contracts = state.contracts.filter(c => c.id !== id);
        if (state.activeContract && state.activeContract.id === id) {
            state.activeContract = null;
            const title = document.getElementById('active-contract-title');
            if (title) title.innerText = "Seleccione una Orden";
            updateFinancials();
            const mf = document.getElementById('manifest-list');
            if (mf) mf.innerHTML = '';
        }
        renderContractsList();

        if (window.sb) {
            const { error } = await window.sb.from('service_orders').delete().eq('id', id);
            if (error) console.error("Error deleting contract", error);
        }
    };

    return {
        init,
        loadClients,
        loadContracts,
        openCreateModal,
        confirmCreateContract,
        selectContractId,
        deleteContract,
        assignCargoAction
    };
})();

window.CommercialModule = commercialLogic;

// Auto-boot if visible
if (document.getElementById('view-commercial') && document.getElementById('view-commercial').style.display !== 'none') {
    CommercialModule.init();
}
