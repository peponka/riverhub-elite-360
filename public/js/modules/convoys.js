// js/modules/convoys.js

(function () {
    // If already defined, exit to avoid re-declaration errors
    if (window.ConvoysModule && window.ConvoysModule.isLoaded) return;

    const convoysLogic = (() => {
        // STATE
        const state = {
            assets: [], // All available assets (Tugs + Barges)
            currentConvoy: {
                name: "Nuevo Convoy",
                tug: null,
                slots: [] // { row: 1, col: 0, bargeId: 'xyz' }
            },
            draggedAsset: null,
            selectedAssetId: null // For Touch/Mobile interaction
        };

        // HOISTED INIT FUNCTION
        const initializeModule = async () => {
            console.log("Módulo Armador de Convoys activo (Elite V2).");

            setupGlobalDelegation(); // ROBUST EVENT DELEGATION
            await loadAssets();
            renderAssetsList();
            initCanvas();
        };

        // GLOBAL DELEGATION: The only way to be 100% sure with dynamic content
        const setupGlobalDelegation = () => {
            // Remove previous if needed (optional, but document listeners stack)
            // Better to just have a flag or rely on module singleton pattern via IIFE
            if (window._convoyEventsAttached) return;
            window._convoyEventsAttached = true;

            document.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-save-convoy');
                if (btn) {
                    e.preventDefault();
                    console.log("Global Delegate: SAVE CLICKED");
                    saveConvoyToDB();
                }
            });
        };

        // 0. MODAL LOGIC (Placeholder for 'Add Asset')
        const setupModals = () => {
            const btnAdd = document.getElementById('btn-add-asset-convoy');
            // Simple alert for now, can be expanded to real modal if needed
            if (btnAdd) {
                btnAdd.onclick = () => {
                    const assetName = prompt("Nombre de la nueva barcaza:");
                    if (assetName) {
                        state.assets.push({
                            id: 'local-' + Date.now(),
                            name: assetName,
                            type: 'BARCAZA_GRANEL',
                            length_meters: 60,
                            width_meters: 15
                        });
                        renderAssetsList();
                    }
                };
            }
        };

        // 1. DATA: Fetch Assets from Supabase
        const loadAssets = async () => {
            const listContainer = document.getElementById('asset-list-container');
            if (listContainer) listContainer.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Cargando Flota...</div>';

            try {
                // Check Supabase connection
                if (!window.sb) throw new Error("Supabase client not found");

                const { data, error } = await window.sb
                    .from('vessels')
                    .select('*')
                    .order('name', { ascending: true });

                if (error) throw error;

                if (data && data.length > 0) {
                    state.assets = data.map(v => ({
                        id: v.id,
                        name: v.name,
                        type: mapVesselType(v.vessel_type),
                        raw: v
                    }));
                } else {
                    console.warn("DB Empty: Using Mock Data");
                    useMockAssets();
                }

            } catch (err) {
                console.error("Error loading assets:", err);
                useMockAssets();
            }

            renderAssetsList();
        };

        const mapVesselType = (dbType) => {
            if (!dbType) return 'BARCAZA_GRANEL';
            const t = dbType.toLowerCase();
            if (t.includes('tug') || t.includes('remolcador') || t.includes('push')) return 'REMOLCADOR';
            if (t.includes('oil') || t.includes('tank') || t.includes('cisterna')) return 'BARCAZA_TANQUE';
            if (t.includes('bulk') || t.includes('granel')) return 'BARCAZA_GRANEL';
            if (t.includes('container')) return 'BARCAZA_CONTAINER';
            return 'BARCAZA_GRANEL';
        };

        const useMockAssets = () => {
            state.assets = [
                { id: 'b1', name: 'B-101 (Demo)', type: 'BARCAZA_GRANEL' },
                { id: 'b2', name: 'B-102 (Demo)', type: 'BARCAZA_GRANEL' },
                { id: 't1', name: 'T-505 (Demo)', type: 'BARCAZA_TANQUE' },
                { id: 'tug1', name: 'HERCULES (Demo)', type: 'REMOLCADOR' }
            ];
        };

        // 2. RENDER: Left Side List
        const renderAssetsList = () => {
            const listContainer = document.getElementById('asset-list-container');
            if (!listContainer) return;
            listContainer.innerHTML = '';

            state.assets.forEach(asset => {
                const el = document.createElement('div');
                el.className = 'draggable-asset';
                el.draggable = true;
                el.setAttribute('data-id', asset.id);
                el.setAttribute('data-type', asset.type);

                let icon = 'fa-ship';
                if (asset.type.includes('TANQUE')) icon = 'fa-oil-can';
                if (asset.type.includes('GRANEL')) icon = 'fa-cubes';
                if (asset.type === 'REMOLCADOR') icon = 'fa-dharmachakra';

                el.innerHTML = `
                <i class="fas ${icon} asset-icon"></i>
                <div class="asset-info">
                    <span class="asset-name">${asset.name}</span>
                    <span class="type-tag">${asset.type.replace('BARCAZA_', '')}</span>
                </div>
            `;

                // Drag Events
                el.addEventListener('dragstart', (e) => {
                    state.draggedAsset = asset;
                    e.dataTransfer.setData('text/plain', asset.id);
                    el.classList.add('dragging');
                });

                el.addEventListener('dragend', () => {
                    el.classList.remove('dragging');
                    state.draggedAsset = null;
                });

                // Mobile Tap to Select (Click & Touch)
                const handleAssetSelect = (e) => {
                    // e.preventDefault(); // Don't block scroll
                    // 1. Update State
                    state.selectedAssetId = asset.id;

                    // 2. Visual Feedback
                    document.querySelectorAll('.draggable-asset').forEach(a => a.classList.remove('selected'));
                    el.classList.add('selected');

                    console.log("Selected:", asset.name);
                    showToast(`Seleccionado: ${asset.name}`, 'info');
                };

                el.addEventListener('click', handleAssetSelect);
                el.addEventListener('touchend', handleAssetSelect);

                listContainer.appendChild(el);
            });
        };

        // 3. CANVAS: Matrix Grid
        const initCanvas = () => {
            const grid = document.getElementById('convoy-grid');
            if (!grid) return;
            grid.innerHTML = '';

            // 6 Rows (5..0) x 5 Cols (-2..2)
            // Adjust for visual appeal: fewer rows if too tall
            const rows = 6;
            const cols = 5;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const cell = document.createElement('div');
                    cell.className = 'grid-cell';
                    cell.dataset.row = r;
                    cell.dataset.col = c;

                    // --- DRAG & DROP HANDLERS (DESKTOP) ---
                    cell.addEventListener('dragover', (e) => {
                        e.preventDefault(); // Allow Drop
                        cell.classList.add('drag-over');
                    });

                    cell.addEventListener('dragleave', () => {
                        cell.classList.remove('drag-over');
                    });

                    cell.addEventListener('drop', (e) => {
                        e.preventDefault();
                        cell.classList.remove('drag-over');
                        const assetId = e.dataTransfer.getData('text/plain');
                        handleDrop(assetId, r, c);
                    });

                    // --- TAP HANDLERS (MOBILE) ---
                    // Handle both Click (PC) and TouchEnd (Mobile)
                    const handleTap = (e) => {
                        // e.preventDefault(); // Don't block scrolling unless confirmed action
                        if (state.selectedAssetId) {
                            handleDrop(state.selectedAssetId, r, c);
                        }
                    };

                    cell.addEventListener('click', handleTap);
                    cell.addEventListener('touchend', handleTap); // Critical for Mobile

                    grid.appendChild(cell);
                }
            }
        };

        const handleDrop = (assetId, row, col) => {
            // Find in current available assets
            const assetIndex = state.assets.findIndex(a => a.id == assetId);
            if (assetIndex === -1) return; // Not found or already placed

            const asset = state.assets[assetIndex];

            // 1. Check if cell is occupied
            const existingIndex = state.currentConvoy.slots.findIndex(s => s.row == row && s.col == col);
            if (existingIndex >= 0) {
                // Return the OLD asset to the list!
                const oldSlot = state.currentConvoy.slots[existingIndex];
                const oldAsset = oldSlot.asset_data;
                if (oldAsset) state.assets.push(oldAsset);

                state.currentConvoy.slots.splice(existingIndex, 1);
            }

            // 2. Add new slot
            state.currentConvoy.slots.push({
                row: row,
                col: col,
                asset_id: asset.id,
                asset_data: asset
            });

            // 3. Remove FROM AVAILABLE LIST (Queue Logic)
            state.assets.splice(assetIndex, 1);

            // 4. Clear selection to prevent double placement
            state.selectedAssetId = null;
            document.querySelectorAll('.draggable-asset').forEach(a => a.classList.remove('selected'));

            renderAssetsList(); // Update UI list
            dropAssetInCell(asset, row, col);
        };

        const dropAssetInCell = (asset, row, col) => {
            const grid = document.getElementById('convoy-grid');
            const cell = grid.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
            if (!cell) return;

            const isTug = asset.type === 'REMOLCADOR';

            cell.innerHTML = '';
            const badge = document.createElement('div');
            badge.className = isTug ? 'deployed-tug' : 'deployed-barge';
            if (asset.type.includes('TANQUE')) badge.classList.add('tanker');
            if (asset.type.includes('GRANEL')) badge.classList.add('bulk');
            if (asset.type.includes('CONTAINER')) badge.classList.add('container');

            badge.innerHTML = `
            <span class="barge-label">${asset.name}</span>
            <button class="btn-remove-barge"><i class="fas fa-times"></i></button>
        `;

            badge.querySelector('.btn-remove-barge').onclick = (e) => {
                e.stopPropagation();

                // 1. Remove from local state
                const idx = state.currentConvoy.slots.findIndex(s => s.row == row && s.col == col);
                if (idx > -1) {
                    const removedSlot = state.currentConvoy.slots[idx];
                    state.currentConvoy.slots.splice(idx, 1);

                    // 2. Return to Available List (Queue Logic)
                    if (removedSlot.asset_data) {
                        state.assets.push(removedSlot.asset_data);
                        // Optional: Sort logic could go here to keep list tidy
                    }
                }

                renderAssetsList(); // Update UI list to show returned asset

                // 3. Remove from DOM
                cell.innerHTML = '';
            };

            cell.appendChild(badge);
        };

        // 4. PERSISTENCE (REAL SUPABASE)
        const saveConvoyToDB = async () => {
            const slotCount = state.currentConvoy && state.currentConvoy.slots ? state.currentConvoy.slots.length : 0;

            try {
                const nameInput = document.querySelector('.convoy-name-input');
                const convoyName = nameInput ? nameInput.value : "Convoy Sin Nombre";

                if (!state.currentConvoy || !state.currentConvoy.slots || state.currentConvoy.slots.length === 0) {
                    alert("El convoy está vacío. Agregue activos antes de guardar.");
                    return;
                }

                showToast("💾 Guardando en nube...", "info");

                if (!window.sb) throw new Error("Sin conexión a base de datos");

                // Construct Payload
                const payload = {
                    name: convoyName,
                    // Auto-generate code if needed by DB constraint
                    convoy_code: 'CNV-' + Date.now().toString().slice(-6),
                    configuration: state.currentConvoy.slots,
                    status: 'active',
                    // Total capacity calc could go here
                };

                // Use insertMine for tenant isolation
                const { data, error } = await window.sb.insertMine('convoys', payload);

                if (error) throw error;

                showToast("✅ Convoy guardado y sincronizado exitosamente.", "success");
                console.log("Convoy Saved:", data);

            } catch (err) {
                console.error("Save Error:", err);
                showToast("❌ Error al guardar: " + err.message, "error");
            }
        };

        // UTILS
        const showToast = (msg, type = 'info') => {
            const output = document.getElementById('toast-container') || createToastContainer();
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.style.cssText = `background: #333; color: white; padding: 12px; margin-top: 10px; border-radius: 4px;`;
            toast.innerText = msg;
            output.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        };

        const createToastContainer = () => {
            const div = document.createElement('div');
            div.id = 'toast-container';
            div.style.cssText = "position: fixed; bottom: 80px; right: 20px; z-index: 9999;";
            document.body.appendChild(div);
            return div;
        };

        // 5. LOAD LOGIC
        const openLoadModal = async () => {
            const modal = document.getElementById('modal-load-convoy');
            if (modal) {
                modal.style.display = 'flex'; // Flex to center with existing global CSS if any, or just block
                // Force center style if global missing
                modal.style.justifyContent = 'center';
                modal.style.alignItems = 'center';
                modal.style.position = 'fixed';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100%';
                modal.style.height = '100%';
                modal.style.background = 'rgba(0,0,0,0.8)';
                modal.style.zIndex = '100000';
            }
            await fetchSavedConvoys();
        };

        const fetchSavedConvoys = async () => {
            const container = document.getElementById('saved-convoys-list');
            container.innerHTML = '<div style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Buscando...</div>';

            try {
                if (!window.sb) throw new Error("Sin conexión DB");
                const { data, error } = await window.sb.from('convoys').select('*').order('created_at', { ascending: false });
                if (error) throw error;

                renderSavedList(data || []);
            } catch (err) {
                container.innerHTML = `<div style="color:red; text-align:center;">Error: ${err.message}</div>`;
            }
        };

        const renderSavedList = (list) => {
            const container = document.getElementById('saved-convoys-list');
            container.innerHTML = '';

            if (list.length === 0) {
                container.innerHTML = '<div style="text-align:center; color:#94a3b8;">No tienes convoys guardados.</div>';
                return;
            }

            list.forEach(c => {
                const item = document.createElement('div');
                item.style.cssText = "background:#334155; padding:10px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;";

                const date = new Date(c.created_at).toLocaleDateString();
                const shipCount = c.configuration ? c.configuration.length : 0;

                item.innerHTML = `
                    <div>
                        <div style="font-weight:bold; color:#0ea5e9;">${c.name}</div>
                        <div style="font-size:0.8rem; color:#cbd5e1;">${shipCount} Barcos • ${date}</div>
                    </div>
                    <div>
                        <button class="btn-load-action" style="background:#22c55e; color:white; border:none; padding:5px 10px; border-radius:4px; margin-right:5px; cursor:pointer;">
                            <i class="fas fa-upload"></i>
                        </button>
                        <button class="btn-delete-action" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;

                // ACTIONS
                item.querySelector('.btn-load-action').onclick = () => loadConvoyState(c);
                item.querySelector('.btn-delete-action').onclick = async () => {
                    if (confirm('¿Eliminar este convoy?')) {
                        await window.sb.from('convoys').delete().eq('id', c.id);
                        fetchSavedConvoys(); // Refresh
                    }
                };

                container.appendChild(item);
            });
        };

        const loadConvoyState = (convoyData) => {
            // 1. Reset Grid
            state.currentConvoy.slots = [];
            const grid = document.getElementById('convoy-grid');
            if (grid) grid.innerHTML = '';
            initCanvas(); // Re-build grid DOM

            // 2. Set Name
            const nameInput = document.querySelector('.convoy-name-input');
            if (nameInput) nameInput.value = convoyData.name;

            // 3. Populate Slots
            if (convoyData.configuration && Array.isArray(convoyData.configuration)) {
                convoyData.configuration.forEach(slot => {
                    // Restore slot state
                    state.currentConvoy.slots.push(slot);
                    // Visual Drop
                    dropAssetInCell(slot.asset_data, slot.row, slot.col);
                });
            }

            // Close Modal
            document.getElementById('modal-load-convoy').style.display = 'none';
            showToast(`Convoy "${convoyData.name}" cargado.`);
        };

        // 6. EXIT LOGIC (Exposed)
        const exitMobileMode = () => {
            console.log("Exiting Convoys Mode... (Global Trigger)");

            // 0. Remove Floating Button
            const floatBtn = document.getElementById('float-exit-convoy');
            if (floatBtn) floatBtn.remove();

            // 1. Remove Fullscreen Mode Class
            document.body.classList.remove('mode-fullscreen-convoys');

            // 2. Hide Convoys View
            const view = document.getElementById('view-convoys');
            if (view) view.style.display = 'none';

            // 3. Manual Restoration of Top Bar
            const topBar = document.querySelector('.top-bar');
            if (topBar) {
                topBar.style.removeProperty('display');
                topBar.style.removeProperty('height');
                topBar.style.removeProperty('opacity');
                topBar.style.display = '';
            }

            // 4. Force specific Mobile Nav reset
            document.querySelectorAll('.mobile-nav-item').forEach(i => i.classList.remove('active'));
            // Try to activate dashboard icon
            const firstNav = document.querySelector('.mobile-nav-item');
            if (firstNav) firstNav.classList.add('active');

            // 5. Trigger Dashboard View Click
            const navDash = document.getElementById('nav-dashboard');
            if (navDash) {
                navDash.click();
            } else {
                const dashView = document.getElementById('view-dashboard');
                if (dashView) dashView.style.display = 'block';
            }
        };

        // PUBLIC API
        return {
            init: initializeModule,
            exitMobileMode: exitMobileMode,
            saveConvoyToDB: saveConvoyToDB,
            openLoadModal: openLoadModal, // NEW
            isLoaded: true
        };
    })();

    window.ConvoysModule = convoysLogic;

    // FAILSAFE: Global expose for inline onclick
    window.saveConvoyToDB = convoysLogic.saveConvoyToDB;

    // AUTO BOOT SAFE BLOCK
    try {
        const el = document.getElementById('view-convoys');
        if (el && el.style.display !== 'none') {
            if (window.ConvoysModule && typeof window.ConvoysModule.init === 'function') {
                window.ConvoysModule.init();
            }
        }
    } catch (e) {
        console.warn("Auto-boot failed:", e);
    }

})(); // END IIFE
