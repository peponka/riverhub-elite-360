// js/modules/panol.js

const panolLogic = (() => {
    const state = {
        items: [],
        loading: false
    };

    const init = async () => {
        console.log("Módulo Pañol Digital activo (Supabase).");
        bindEvents();
        await loadInventory();
    };

    const bindEvents = () => {
        // Modal Logic (Add Product)
        const btnOpen = document.getElementById('btn-new-product');
        const modal = document.getElementById('modal-alta-panol');
        const btnClose = document.getElementById('btn-close-panol');
        const btnCancel = document.getElementById('btn-cancel-panol');
        const btnRegister = document.getElementById('btn-register-panol');

        if (btnOpen && modal) {
            btnOpen.onclick = () => {
                modal.style.display = 'flex';
                // Auto generate SKU
                const skuInput = document.getElementById('input-sku-auto');
                if (skuInput) skuInput.value = 'SKU-' + Math.floor(Math.random() * 100000);

                // Reset inputs
                const nameIn = document.getElementById('panol-input-name');
                const priceIn = document.getElementById('panol-input-price');
                const stockIn = document.getElementById('panol-input-stock');

                if (nameIn) nameIn.value = '';
                if (priceIn) priceIn.value = '0.00';
                if (stockIn) stockIn.value = '0';
            };
        }

        const closeModal = () => { if (modal) modal.style.display = 'none'; };
        if (btnClose) btnClose.onclick = closeModal;
        if (btnCancel) btnCancel.onclick = closeModal;

        if (btnRegister) {
            btnRegister.onclick = async () => {
                await registerNewItem(closeModal, btnRegister);
            };
        }

        // Search Filter
        const searchInput = document.querySelector('.search-bar-panol input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = state.items.filter(i =>
                    i.name.toLowerCase().includes(term) ||
                    i.sku.toLowerCase().includes(term) ||
                    i.category.toLowerCase().includes(term)
                );
                renderItems(filtered);
            });
        }
    };

    const loadInventory = async () => {
        // SAAS UPGRADE: Use fetchMine for automatic tenant filtering
        const { data, error } = await window.sb.fetchMine('inventory_items', '*');

        if (error) {
            console.error("Error loading inventory:", error);
            // Don't alert on 404/empty to avoid annoying popups on init
            return;
        }

        state.items = data || [];
        renderItems(state.items);
    };

    const renderItems = (items) => {
        const container = document.querySelector('.panol-products-col');
        // Keep the search bar, remove cards
        const searchBar = container ? container.querySelector('.search-bar-panol') : null;
        if (!container) return;

        container.innerHTML = '';
        if (searchBar) container.appendChild(searchBar);

        if (items.length === 0) {
            // Show nicer empty state for SaaS users
            const tenant = window.AuthModule ? (window.AuthModule.getCurrentUser()?.company || 'Tu Empresa') : 'Tu Empresa';
            container.insertAdjacentHTML('beforeend', `<div style="color:#667; text-align:center; padding:40px;">
                <i class="fas fa-box-open" style="font-size:2rem; margin-bottom:10px;"></i><br>
                El inventario de <strong>${tenant.toUpperCase()}</strong> está vacío.<br>
                Usa el botón "Nuevo Producto" para comenzar.
            </div>`);
            return;
        }

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="stock-badge" style="background:${item.stock_current <= item.stock_min_alert ? '#ff4444' : '#00e5ff'}">
                    ${item.stock_current}
                </div>
                <span class="category-tag">${item.category}</span>
                <span class="sku-text">${item.sku}</span>
                <h3 class="prod-name">${item.name}</h3>

                <div class="cost-row">
                    <span class="cost-label">COSTO UNIT.</span>
                    <span class="cost-val">$${item.unit_price}</span>
                </div>

                <div class="stock-actions">
                     <button class="btn-out" data-id="${item.id}" onclick="panolLogic.registerExit('${item.id}', ${item.stock_current})">
                        <i class="fas fa-shopping-cart"></i> REGISTRAR SALIDA
                     </button>
                </div>
            `;
            container.appendChild(card);
        });
    };

    const registerNewItem = async (closeModalCallback, btnEl) => {
        // Robust ID selection
        const nameIn = document.getElementById('panol-input-name');
        const skuIn = document.getElementById('input-sku-auto');
        const catIn = document.getElementById('panol-input-category');
        const priceIn = document.getElementById('panol-input-price');
        const stockIn = document.getElementById('panol-input-stock');
        const minIn = document.getElementById('panol-input-min');

        const nameVal = nameIn ? nameIn.value : '';
        const skuVal = skuIn ? skuIn.value : '';
        const catVal = catIn ? catIn.value : 'Motor';
        const priceVal = priceIn ? priceIn.value : '0';
        const stockVal = stockIn ? stockIn.value : '0';
        const minVal = minIn ? minIn.value : '5';

        if (!nameVal || !skuVal) {
            alert("Complete los datos obligatorios (Nombre, SKU).");
            return;
        }

        const originalText = btnEl.innerHTML;
        btnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> GUARDANDO...';

        // SAAS UPGRADE: Use insertMine for automatic company tagging
        const { error } = await window.sb.insertMine('inventory_items', {
            name: nameVal,
            sku: skuVal,
            category: catVal,
            unit_price: parseFloat(priceVal) || 0,
            stock_current: parseInt(stockVal) || 0,
            stock_min_alert: parseInt(minVal) || 5
        });

        if (error) {
            // DEMO MODE BYPASS
            if (error.message && (error.message.includes("row-level security") || error.message.includes("permission denied") || error.message.includes("network"))) {
                console.warn("⚠️ RLS/Network Error intercepted. Switching to LOCAL DEMO simulation.");
                alert("MODO DEMO: Item registrado localmente.");

                // Fake Update
                state.items.push({
                    id: 'temp-' + Date.now(),
                    name: nameVal,
                    sku: skuVal,
                    category: catVal,
                    stock_current: parseInt(stockVal) || 0,
                    unit_price: parseFloat(priceVal) || 0,
                    stock_min_alert: parseInt(minVal) || 5
                });

                closeModalCallback();
                renderItems(state.items);
                if (nameIn) nameIn.value = '';
            } else {
                console.error(error);
                alert("Error: " + error.message);
            }
        } else {
            alert("Item registrado correctamente.");
            closeModalCallback();
            await loadInventory();
            // Clear inputs
            if (nameIn) nameIn.value = '';
        }
        btnEl.innerHTML = originalText;
    };

    const registerExit = async (itemId, currentStock) => {
        if (currentStock <= 0) {
            alert("Stock insuficiente.");
            return;
        }

        const qty = 1; // Default 1 for quick action
        const newStock = currentStock - qty;

        // Note: Movements also need company_id, using insertMine
        const { error: moveError } = await window.sb.insertMine('inventory_movements', {
            item_id: itemId,
            type: 'BAJA',
            quantity: qty,
            user_id: window.AuthModule ? window.AuthModule.getCurrentUser()?.id : null
        });

        if (moveError) {
            console.error(moveError);
            alert("Error al registrar movimiento.");
            return;
        }

        const { error: updateError } = await window.sb
            .from('inventory_items')
            .update({ stock_current: newStock })
            .eq('id', itemId);

        if (updateError) {
            console.error(updateError);
            alert("Error al actualizar inventario.");
        } else {
            await loadInventory(); // Refresh
        }
    };

    return { init, registerExit };
})();

window.PanolModule = panolLogic;
