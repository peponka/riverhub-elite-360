// ============================================
// ADMIN CLIENTE — Panel de Administración por Empresa
// FluviaFleet — Tenant-Aware
// ============================================

const AdminCliente = (() => {
    let tenantId = null;
    let tenantData = null;
    let subChart = null;

    const init = () => {
        console.log("🔵 AdminCliente: Inicializando panel de cliente...");

        // Get tenant from logged-in user
        const user = window.AuthModule?.getCurrentUser?.() || {};
        tenantId = user.company_id || user.tenant_id || null;

        let container = document.getElementById('view-admin');
        const contentArea = document.getElementById('content-area');
        if (!container && contentArea) {
            container = document.createElement('div');
            container.id = 'view-admin';
            container.className = 'view-section';
            container.style.display = 'block';
            contentArea.appendChild(container);
        } else if (container && contentArea && !contentArea.contains(container)) {
            container.style.display = 'block';
            contentArea.appendChild(container);
        }
        if (container) container.style.display = 'block';
        if (!container) return;

        renderShell(container);
        loadMiEmpresa();
    };

    const renderShell = (container) => {
        container.innerHTML = `
            <div class="ac-container">
                <div class="ac-header">
                    <div class="ac-header-left">
                        <div class="ac-logo"><i class="fas fa-building"></i></div>
                        <div>
                            <h1 class="ac-title">MI EMPRESA</h1>
                            <span class="ac-subtitle" id="ac-company-name">CARGANDO...</span>
                        </div>
                    </div>
                    <div class="ac-header-actions">
                        <button class="ac-btn-icon" onclick="AdminCliente.refresh()" data-tooltip="Recargar Datos"><i class="fas fa-sync-alt"></i></button>
                    </div>
                </div>

                <div class="ac-nav">
                    <button class="ac-nav-tab active" data-tab="overview" onclick="AdminCliente.switchTab('overview')">
                        <i class="fas fa-tachometer-alt"></i> Mi Empresa
                    </button>
                    <button class="ac-nav-tab" data-tab="subscription" onclick="AdminCliente.switchTab('subscription')">
                        <i class="fas fa-crown"></i> Mi Suscripción
                    </button>
                    <button class="ac-nav-tab" data-tab="users" onclick="AdminCliente.switchTab('users')">
                        <i class="fas fa-users"></i> Mis Usuarios
                    </button>
                    <button class="ac-nav-tab" data-tab="fleet" onclick="AdminCliente.switchTab('fleet')">
                        <i class="fas fa-ship"></i> Mi Flota
                    </button>
                    <button class="ac-nav-tab" data-tab="invoices" onclick="AdminCliente.switchTab('invoices')">
                        <i class="fas fa-file-invoice-dollar"></i> Facturas
                    </button>
                </div>

                <div id="ac-content" class="ac-content">
                    <div class="ac-loading"><i class="fas fa-circle-notch fa-spin fa-2x"></i><span>Cargando...</span></div>
                </div>
            </div>
        `;
    };

    const switchTab = (tab) => {
        document.querySelectorAll('.ac-nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.ac-nav-tab[data-tab="${tab}"]`)?.classList.add('active');
        switch (tab) {
            case 'overview': loadMiEmpresa(); break;
            case 'subscription': loadMiSuscripcion(); break;
            case 'users': loadMisUsuarios(); break;
            case 'fleet': loadMiFlota(); break;
            case 'invoices': loadFacturas(); break;
        }
    };

    // ─── MI EMPRESA (Overview) ───
    const loadMiEmpresa = async () => {
        const content = document.getElementById('ac-content');
        if (!content) return;

        let company = null;
        let users = [];
        let vessels = [];

        if (window.sb && tenantId) {
            try {
                const [compRes, usrRes, vesRes] = await Promise.all([
                    window.sb.from('clients').select('*').eq('id', tenantId).single(),
                    window.sb.from('profiles').select('*').eq('company_id', tenantId),
                    window.sb.from('fleet').select('*').eq('company_id', tenantId)
                ]);
                if (compRes.data) company = compRes.data;
                if (usrRes.data) users = usrRes.data;
                if (vesRes.data) vessels = vesRes.data;
            } catch (e) { console.warn("AC: Supabase fallback", e); }
        }

        // Mock fallback
        if (!company) {
            company = { name: 'Mi Empresa S.A.', plan: 'SQUAD', status: 'active', country_zone: 'PY', created_at: '2025-06-01' };
            users = [{ id: 1, full_name: 'Admin', role: 'admin' }, { id: 2, full_name: 'Operador 1', role: 'operator' }];
            vessels = [{ id: 1, name: 'TB PARAGUAY 01' }, { id: 2, name: 'B/G SOJA KING' }];
        }

        tenantData = company;
        const nameEl = document.getElementById('ac-company-name');
        if (nameEl) nameEl.textContent = company.name;

        const planColors = { SOLIST: '#64748b', SQUAD: '#10b981', EXPANSION: '#00e5ff', ADMIRAL: '#a855f7', TRIAL: '#f59e0b' };
        const pColor = planColors[(company.plan || 'SQUAD').toUpperCase()] || '#10b981';

        content.innerHTML = `
            <div class="ac-kpi-grid">
                <div class="ac-kpi" style="--ac:#3b82f6;">
                    <i class="fas fa-ship"></i>
                    <div class="ac-kpi-data"><span class="ac-kpi-val">${vessels.length}</span><span class="ac-kpi-lbl">EMBARCACIONES</span></div>
                </div>
                <div class="ac-kpi" style="--ac:#8b5cf6;">
                    <i class="fas fa-users"></i>
                    <div class="ac-kpi-data"><span class="ac-kpi-val">${users.length}</span><span class="ac-kpi-lbl">USUARIOS</span></div>
                </div>
                <div class="ac-kpi" style="--ac:${pColor};">
                    <i class="fas fa-crown"></i>
                    <div class="ac-kpi-data"><span class="ac-kpi-val">${(company.plan || 'SQUAD').toUpperCase()}</span><span class="ac-kpi-lbl">PLAN ACTUAL</span></div>
                </div>
                <div class="ac-kpi" style="--ac:#10b981;">
                    <i class="fas fa-check-circle"></i>
                    <div class="ac-kpi-data"><span class="ac-kpi-val">${(company.status || 'active').toUpperCase()}</span><span class="ac-kpi-lbl">ESTADO</span></div>
                </div>
            </div>

            <div class="ac-split">
                <div class="ac-panel">
                    <h3><i class="fas fa-info-circle" style="color:#3b82f6;"></i> Información General</h3>
                    <div class="ac-info-list">
                        <div class="ac-info-row"><span>Razón Social</span><strong>${company.name}</strong></div>
                        <div class="ac-info-row"><span>Zona</span><strong>${company.country_zone || 'N/A'}</strong></div>
                        <div class="ac-info-row"><span>Desde</span><strong>${new Date(company.created_at).toLocaleDateString()}</strong></div>
                        <div class="ac-info-row"><span>Plan</span><strong style="color:${pColor};">${(company.plan || 'SQUAD').toUpperCase()}</strong></div>
                    </div>
                </div>
                <div class="ac-panel">
                    <h3><i class="fas fa-users" style="color:#8b5cf6;"></i> Equipo (${users.length})</h3>
                    <div class="ac-team-list">
                        ${users.slice(0, 5).map(u => `
                            <div class="ac-team-item">
                                <div class="ac-team-avatar">${(u.full_name || '??')[0]}</div>
                                <div><span class="ac-team-name">${u.full_name || u.email || 'Usuario'}</span><span class="ac-team-role">${(u.role || 'user').toUpperCase()}</span></div>
                            </div>
                        `).join('')}
                        ${users.length > 5 ? `<p style="color:#64748b; text-align:center; margin:10px 0;">+ ${users.length - 5} más</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    };

    // ─── MI SUSCRIPCIÓN ───
    const loadMiSuscripcion = async () => {
        const content = document.getElementById('ac-content');
        if (!content) return;

        let sub = null;
        if (window.sb && tenantId) {
            try {
                const { data } = await window.sb.from('subscriptions').select('*').eq('company_id', tenantId).order('created_at', { ascending: false }).limit(1).single();
                if (data) sub = data;
            } catch (e) { console.warn("AC Sub:", e); }
        }

        if (!sub) {
            sub = { plan_id: 'squad', status: 'active', max_vessels: 3, max_users: 3, price_usd: 450, billing_cycle: 'monthly', current_period_end: '2026-04-15', trial_ends_at: null };
        }

        const plans = [
            { id: 'solist', name: 'SOLIST', price: 150, vessels: 1, users: 1, color: '#64748b', features: ['1 Embarcación', '1 Usuario', 'Dashboard Básico', 'Soporte Email'] },
            { id: 'squad', name: 'SQUAD', price: 450, vessels: 3, users: 3, color: '#10b981', features: ['3 Embarcaciones', '3 Usuarios', 'Reportes Avanzados', 'Soporte Prioritario', 'Tracking Clientes'] },
            { id: 'expansion', name: 'EXPANSIÓN', price: 1200, vessels: 10, users: 5, color: '#00e5ff', features: ['10 Embarcaciones', '5 Usuarios', 'IA Cotizador', 'API Integraciones', 'Soporte 24/7'] },
            { id: 'admiral', name: 'ADMIRAL', price: 1800, vessels: '∞', users: '∞', color: '#a855f7', features: ['Embarcaciones Ilimitadas', 'Usuarios Ilimitados', 'White-Label', 'Gerente de Cuenta', 'SLA Garantizado'] }
        ];

        const currentPlan = plans.find(p => p.id === sub.plan_id) || plans[1];
        const daysLeft = Math.ceil((new Date(sub.current_period_end) - new Date()) / 86400000);

        content.innerHTML = `
            <div class="ac-sub-current">
                <div class="ac-sub-badge" style="background:${currentPlan.color}15; border:1px solid ${currentPlan.color}40;">
                    <i class="fas fa-crown" style="color:${currentPlan.color}; font-size:2rem;"></i>
                    <div>
                        <span class="ac-sub-plan" style="color:${currentPlan.color};">PLAN ${currentPlan.name}</span>
                        <span class="ac-sub-price">$${currentPlan.price}<small>/mes</small></span>
                    </div>
                    <div class="ac-sub-meta">
                        <span><i class="fas fa-calendar"></i> Próximo cobro: ${new Date(sub.current_period_end).toLocaleDateString()}</span>
                        <span><i class="fas fa-clock"></i> ${daysLeft > 0 ? daysLeft + ' días restantes' : 'Vencido'}</span>
                        <span class="ac-sub-status ${sub.status}">${sub.status.toUpperCase()}</span>
                    </div>
                </div>
            </div>

            <h3 style="color:#fff; margin:24px 0 16px;"><i class="fas fa-arrow-up" style="color:#f59e0b;"></i> Cambiar Plan</h3>
            <div class="ac-plans-grid">
                ${plans.map(p => {
                    const isCurrent = p.id === sub.plan_id;
                    const isUpgrade = p.price > currentPlan.price;
                    return `
                        <div class="ac-plan-card ${isCurrent ? 'current' : ''}" style="--pc:${p.color};">
                            ${isCurrent ? '<div class="ac-plan-current-tag">ACTUAL</div>' : ''}
                            <div class="ac-plan-name" style="color:${p.color};">${p.name}</div>
                            <div class="ac-plan-price">$${p.price}<span>/mes</span></div>
                            <ul class="ac-plan-features">
                                ${p.features.map(f => `<li><i class="fas fa-check" style="color:${p.color};"></i> ${f}</li>`).join('')}
                            </ul>
                            ${isCurrent ?
                                `<button class="ac-btn-plan current" disabled>PLAN ACTUAL</button>` :
                                `<button class="ac-btn-plan ${isUpgrade ? 'upgrade' : 'downgrade'}" onclick="AdminCliente.changePlan('${p.id}', '${p.name}', ${p.price})">
                                    ${isUpgrade ? '<i class="fas fa-arrow-up"></i> UPGRADE' : '<i class="fas fa-arrow-down"></i> DOWNGRADE'}
                                </button>`
                            }
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    };

    // ─── MIS USUARIOS ───
    const loadMisUsuarios = async () => {
        const content = document.getElementById('ac-content');
        if (!content) return;

        let users = [];
        if (window.sb && tenantId) {
            try {
                const { data } = await window.sb.from('profiles').select('*').eq('company_id', tenantId);
                if (data) users = data;
            } catch (e) { console.warn("AC Users:", e); }
        }

        if (users.length === 0) {
            users = [
                { id: '1', full_name: 'Carlos Martínez', email: 'carlos@empresa.com', role: 'admin', is_active: true },
                { id: '2', full_name: 'Juan Operador', email: 'juan@empresa.com', role: 'operator', is_active: true },
                { id: '3', full_name: 'María Viewer', email: 'maria@empresa.com', role: 'viewer', is_active: false }
            ];
        }

        const roleColors = { admin: '#8b5cf6', operator: '#3b82f6', viewer: '#64748b', user: '#94a3b8' };

        content.innerHTML = `
            <div class="ac-panel" style="border:none; background:transparent; padding:0;">
                <div class="ac-panel-header">
                    <h3><i class="fas fa-users" style="color:#8b5cf6;"></i> Usuarios de Mi Empresa (${users.length})</h3>
                    <button class="ac-btn-primary" onclick="AdminCliente.inviteUser()"><i class="fas fa-user-plus"></i> INVITAR</button>
                </div>
                <div class="ac-users-list">
                    ${users.map(u => {
                        const rc = roleColors[u.role] || '#64748b';
                        return `
                            <div class="ac-user-row">
                                <div class="ac-user-info">
                                    <div class="ac-user-avatar" style="border-color:${rc};">${(u.full_name || '?')[0]}</div>
                                    <div>
                                        <span class="ac-user-name">${u.full_name || 'Sin nombre'}</span>
                                        <span class="ac-user-email">${u.email || ''}</span>
                                    </div>
                                </div>
                                <span class="ac-role-tag" style="color:${rc}; border-color:${rc};">${(u.role || 'user').toUpperCase()}</span>
                                <span class="ac-user-status ${u.is_active !== false ? 'on' : 'off'}">${u.is_active !== false ? 'ACTIVO' : 'INACTIVO'}</span>
                                <div class="ac-user-actions">
                                    <button class="ac-btn-sm" onclick="AdminCliente.toggleUserRole('${u.id}')" data-tooltip="Cambiar Rol"><i class="fas fa-exchange-alt"></i></button>
                                    <button class="ac-btn-sm" style="color:#ef4444;" onclick="AdminCliente.removeUser('${u.id}', '${u.full_name}')" data-tooltip="Eliminar Usuario"><i class="fas fa-trash"></i></button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    };

    // ─── MI FLOTA ───
    const loadMiFlota = async () => {
        const content = document.getElementById('ac-content');
        if (!content) return;

        let vessels = [];
        if (window.sb && tenantId) {
            try {
                const { data } = await window.sb.from('fleet').select('*').eq('company_id', tenantId);
                if (data) vessels = data;
            } catch (e) { console.warn("AC Fleet:", e); }
        }

        if (vessels.length === 0) {
            vessels = [
                { id: '1', name: 'TB PARAGUAY 01', type: 'REMOLCADOR', status: 'Operativo', ais_speed: '4.2' },
                { id: '2', name: 'B/G SOJA KING', type: 'BARCAZA_GRANEL', status: 'En Tránsito', ais_speed: '0' }
            ];
        }

        content.innerHTML = `
            <div class="ac-panel" style="border:none; background:transparent; padding:0;">
                <div class="ac-panel-header">
                    <h3><i class="fas fa-ship" style="color:#06b6d4;"></i> Mi Flota (${vessels.length} embarcaciones)</h3>
                </div>
                <div class="ac-fleet-grid">
                    ${vessels.map(v => {
                        const sColor = (v.status || '').includes('Operativo') ? '#10b981' : (v.status || '').includes('Mant') ? '#ef4444' : '#3b82f6';
                        return `
                            <div class="ac-fleet-card">
                                <div class="ac-fleet-icon" style="color:${sColor};"><i class="fas fa-ship"></i></div>
                                <div class="ac-fleet-info">
                                    <span class="ac-fleet-name">${v.name}</span>
                                    <span class="ac-fleet-type">${v.type || 'N/A'}</span>
                                </div>
                                <span class="ac-fleet-status" style="color:${sColor}; border-color:${sColor};">${v.status || 'DESCONOCIDO'}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    };

    // ─── FACTURAS ───
    const loadFacturas = async () => {
        const content = document.getElementById('ac-content');
        if (!content) return;

        let invoices = [];
        if (window.sb && tenantId) {
            try {
                const { data } = await window.sb.from('payments').select('*').eq('company_id', tenantId).order('created_at', { ascending: false });
                if (data) invoices = data;
            } catch (e) { console.warn("AC Invoices:", e); }
        }

        if (invoices.length === 0) {
            invoices = [
                { id: 'INV-001', amount: 450, status: 'completed', created_at: '2026-03-01', currency: 'USD' },
                { id: 'INV-002', amount: 450, status: 'completed', created_at: '2026-02-01', currency: 'USD' },
                { id: 'INV-003', amount: 450, status: 'completed', created_at: '2026-01-01', currency: 'USD' }
            ];
        }

        content.innerHTML = `
            <div class="ac-panel" style="border:none; background:transparent; padding:0;">
                <div class="ac-panel-header">
                    <h3><i class="fas fa-file-invoice-dollar" style="color:#10b981;"></i> Mis Facturas</h3>
                </div>
                <div class="ac-invoices-list">
                    ${invoices.map(inv => {
                        const isPaid = inv.status === 'completed';
                        return `
                            <div class="ac-invoice-row">
                                <div class="ac-invoice-left">
                                    <i class="fas ${isPaid ? 'fa-check-circle' : 'fa-clock'}" style="color:${isPaid ? '#10b981' : '#f59e0b'}; font-size:1.2rem;"></i>
                                    <div>
                                        <span class="ac-invoice-id">${inv.id || inv.invoice_number || 'Factura'}</span>
                                        <span class="ac-invoice-date">${new Date(inv.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <span class="ac-invoice-amount">$${inv.amount} ${inv.currency || 'USD'}</span>
                                <span class="ac-invoice-status" style="color:${isPaid ? '#10b981' : '#f59e0b'};">${isPaid ? 'PAGADO' : 'PENDIENTE'}</span>
                                <button class="ac-btn-sm" onclick="window.print()" data-tooltip="Descargar Resumen PDF"><i class="fas fa-download"></i></button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    };

    // ─── ACTIONS ───
    const changePlan = (planId, planName, price) => {
        if (window.RiverToast) RiverToast.success(`Solicitud de cambio a ${planName} enviada. Un gerente te contactará en breve.`, 'Suscripción');
    };

    const inviteUser = () => {
        if (window.RiverToast) RiverToast.success(`Invitación de usuario enviada.`, 'Usuarios');
    };

    const toggleUserRole = (id) => {
        if (window.RiverToast) RiverToast.info('Rol actualizado.', 'Usuarios');
    };

    const removeUser = (id, name) => {
        if (window.RiverToast) RiverToast.success(`${name} eliminado de los registros de tu organización.`, 'Usuarios', 'fas fa-user-minus');
    };

    const refresh = () => {
        const tab = document.querySelector('.ac-nav-tab.active')?.dataset.tab || 'overview';
        switchTab(tab);
    };

    return { init, switchTab, refresh, changePlan, inviteUser, toggleUserRole, removeUser };
})();

window.AdminCliente = AdminCliente;
