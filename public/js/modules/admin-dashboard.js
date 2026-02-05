// js/modules/admin-dashboard.js

const AdminDashboard = (() => {

    // STARTUP
    const init = () => {
        console.log("Admin Dashboard: Init...");

        // Render Layout FIRST to ensure user sees something
        renderLayout();

        // Then attempt to route to dashboard
        routeTo('dashboard');

        // Optional: Check Role after rendering (Non-blocking for UI structure)
        const user = window.AuthModule ? AuthModule.getCurrentUser() : null;
        if (!user || !['admin', 'super_admin', 'superadmin'].includes(user.role)) {
            console.warn("AdminDashboard: Role check warning - proceeding in Demo/Bypass mode");
        }
    };

    // ROUTING
    const routeTo = (viewName) => {
        console.log(`Admin Router: ${viewName}`);

        // Update Nav Active State (Horizontal)
        document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
        const navItem = document.querySelector(`.nav-tab[data-nav="${viewName}"]`);
        if (navItem) navItem.classList.add('active');

        // Render Content
        const contentArea = document.getElementById('admin-main-content');
        if (!contentArea) return;

        switch (viewName) {
            case 'dashboard':
                contentArea.innerHTML = renderDashboardView();
                // Post-render: Charts or Maps
                initMiniMap();
                initDashboardChart();
                break;
            case 'fleet':
                contentArea.innerHTML = renderFleetView();
                break;
            case 'users':
                contentArea.innerHTML = renderUsersView();
                break;
            case 'tenants':
                contentArea.innerHTML = renderTenantsView();
                break;
            case 'billing':
                contentArea.innerHTML = renderBillingView();
                break;
            case 'audit':
                contentArea.innerHTML = renderAuditView();
                break;
            case 'clients':
                contentArea.innerHTML = renderClientsView();
                break;
            case 'client-ships':
                contentArea.innerHTML = renderClientShipsView();
                break;
            case 'orders': // Work Orders
                contentArea.innerHTML = renderOrdersView();
                break;
            case 'tenants': // Restored
                contentArea.innerHTML = renderTenantsView();
                break;
            default:
                contentArea.innerHTML = '<h1>404 Not Found</h1>';
        }
    };

    // LAYOUT BUILDER
    const renderLayout = () => {
        const container = document.getElementById('view-admin-panel');
        if (!container) return;

        // INJECT STYLES FOR TABS
        const style = document.createElement('style');
        style.innerHTML = `
            .nav-tab {
                background: transparent;
                border: 1px solid transparent;
                color: #94a3b8;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s;
                white-space: nowrap;
                flex-shrink: 0; /* Important for scroll */
            }
            .nav-tab:hover {
                color: #fff;
                background: rgba(255,255,255,0.05);
            }
            .nav-tab.active {
                background: rgba(0, 229, 255, 0.1);
                color: #00e5ff;
                border: 1px solid rgba(0, 229, 255, 0.2);
                box-shadow: 0 0 15px rgba(0, 229, 255, 0.1);
            }
            .admin-container {
                padding: 20px;
                height: 100%;
                width: 100%; /* Fix width */
                overflow-y: auto;
                box-sizing: border-box; /* Fix padding calc */
            }
            .admin-module-header {
                background:#1e293b; 
                border:1px solid #334; 
                border-radius:12px; 
                padding:20px; 
                margin-bottom:20px;
            }
            .admin-header-top {
                display:flex; 
                justify-content:space-between; 
                align-items:center; 
                margin-bottom:20px; 
                border-bottom:1px solid #334; 
                padding-bottom:15px;
            }
            
            /* MOBILE OVERRIDES */
            @media (max-width: 768px) {
                .admin-container { 
                    padding: 10px; 
                    padding-bottom: 120px; /* Space for bottom nav */
                    overflow-x: hidden;
                }
                .admin-module-header { 
                    padding: 15px !important; 
                    margin-bottom: 15px;
                    border-radius: 8px;
                }
                .admin-header-top {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 15px;
                }
                .tenant-selector {
                    width: 100%;
                }
                .tenant-selector select {
                    width: 100%;
                }
                .nav-tab { 
                    padding: 8px 12px; 
                    font-size: 0.8rem; 
                }
                /* Hide redundant titles if needed */
                .admin-header-top .badge-plan {
                    display: none;
                }
            }
        `;
        container.appendChild(style);

        container.innerHTML += `
            <div class="admin-container">
                <!-- HEADER & NAV -->
                <div class="admin-module-header">
                    <div class="admin-header-top">
                         <div style="font-size:1.2rem; font-weight:bold; color:#fff; display:flex; align-items:center; gap:10px;">
                            <i class="fas fa-layer-group" style="color:#00e5ff"></i> 
                            ADMINISTRA
                            <span class="badge-plan" style="font-size:0.6rem; vertical-align:middle;">SUPER ADMIN</span>
                        </div>
                        <div class="tenant-selector" style="display:flex; align-items:center; gap:10px;">
                            <i class="fas fa-building" style="color:#64748b;"></i>
                            <select style="background:#0f172a; border:1px solid #334; color:#fff; padding:5px; border-radius:4px;">
                                <option>Todas las Empresas</option>
                                <option>Naviera del Sur S.A.</option>
                            </select>
                        </div>
                    </div>

                    <!-- HORIZONTAL NAV -->
                    <div class="admin-nav-horizontal" style="display:flex; gap:10px; overflow-x:auto; padding-bottom:5px; -webkit-overflow-scrolling: touch;">
                        <button class="nav-tab active" data-nav="dashboard" onclick="AdminDashboard.routeTo('dashboard')"><i class="fas fa-chart-line"></i> Dashboard</button>
                        <button class="nav-tab" data-nav="fleet" onclick="AdminDashboard.routeTo('fleet')"><i class="fas fa-anchor"></i> GESTIÓN FLOTA</button>
                        <button class="nav-tab" data-nav="client-ships" onclick="AdminDashboard.routeTo('client-ships')"><i class="fas fa-ship"></i> Barcos (Clientes)</button>
                        <button class="nav-tab" data-nav="clients" onclick="AdminDashboard.routeTo('clients')"><i class="fas fa-users"></i> Clientes</button>
                         <button class="nav-tab" data-nav="orders" onclick="AdminDashboard.routeTo('orders')"><i class="fas fa-tasks"></i> Ordenes</button>
                        <button class="nav-tab" data-nav="users" onclick="AdminDashboard.routeTo('users')"><i class="fas fa-user-shield"></i> Usuarios</button>
                        <button class="nav-tab" data-nav="billing" onclick="AdminDashboard.routeTo('billing')"><i class="fas fa-file-invoice-dollar"></i> Billing</button>
                        <button class="nav-tab" data-nav="audit" onclick="AdminDashboard.routeTo('audit')"><i class="fas fa-history"></i> Logs</button>
                    </div>
                </div>

                <!-- MAIN CONTENT -->
                <main id="admin-main-content" class="admin-content" style="min-height: 500px; width: 100%;">
                    <!-- Dynamic View Injected Here -->
                </main>
            </div>
        `;
    };

    // ... (existing views)

    // ASYNC LOADER FOR CLIENTS
    const loadClientsData = async () => {
        const container = document.getElementById('clients-dynamic-container');
        if (!container) return; // View changed

        if (!window.sb) {
            container.innerHTML = '<div style="padding:20px; color:#ef4444;">Error: Supabase no está conectado.</div>';
            return;
        }

        try {
            // Simple query without explicit schema prefix to help cache
            const { data: clients, error } = await window.sb
                .from('clients')
                .select('*'); // Removed order to simplify first fetch

            if (error) throw error;

            if (!clients || clients.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center; padding:40px; color:#64748b;">
                        <i class="fas fa-folder-open" style="font-size:2rem; margin-bottom:10px;"></i><br>
                        No hay clientes registrados aún.
                    </div>`;
                return;
            }

            console.log("Clients loaded:", clients);

            let cards = clients.map(c => `
                <div class="client-card" style="background:linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border:1px solid #334; border-radius:12px; padding:20px; display:flex; flex-direction:column; gap:15px; box-shadow:0 4px 6px rgba(0,0,0,0.3);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <h3 style="margin:0; color:#fff; font-size:1.1rem;">${c.name}</h3>
                            <span class="badge-plan" style="font-size:0.65rem; margin-top:5px; display:inline-block;">${c.plan || 'BASIC'}</span>
                        </div>
                        <div style="text-align:right;">
                            <span class="status-badge ${c.status === 'active' ? 'badge-active' : 'badge-warning'}">${(c.status || 'active').toUpperCase()}</span>
                        </div>
                    </div>

                    <div style="font-size:0.85rem; color:#94a3b8; display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <div><i class="fas fa-globe-americas"></i> Zona: ${c.country_zone || 'N/A'}</div>
                        <div><i class="fas fa-users"></i> ${c.users_count || 0} Usuarios</div>
                        <div><i class="fas fa-calendar-alt"></i> ${new Date(c.created_at).toLocaleDateString()}</div>
                        <div><i class="fas fa-id-badge"></i> Roles: ${(c.roles_config || 'Standard').split(',')[0]}</div>
                    </div>

                    <div style="border-top:1px solid #334; padding-top:15px; display:grid; grid-template-columns: repeat(5, 1fr); gap:6px;">
                        <button onclick="window.AdminDashboard.viewClientDetails('${c.id}', '${c.name}', 'general')" title="General" class="btn-icon-action" style="background:transparent; border:1px solid #334; color:#94a3b8; padding:8px; border-radius:6px; cursor:pointer;"><i class="fas fa-info-circle"></i></button>
                        <button onclick="window.AdminDashboard.viewClientDetails('${c.id}', '${c.name}', 'users')" title="Usuarios" class="btn-icon-action" style="background:transparent; border:1px solid #334; color:#00e5ff; padding:8px; border-radius:6px; cursor:pointer;"><i class="fas fa-users"></i></button>
                        <button onclick="window.AdminDashboard.viewClientDetails('${c.id}', '${c.name}', 'fleet')" title="Flota" class="btn-icon-action" style="background:transparent; border:1px solid #334; color:#f59e0b; padding:8px; border-radius:6px; cursor:pointer;"><i class="fas fa-ship"></i></button>
                        <button onclick="window.AdminDashboard.viewClientDetails('${c.id}', '${c.name}', 'billing')" title="Facturación" class="btn-icon-action" style="background:transparent; border:1px solid #334; color:#10b981; padding:8px; border-radius:6px; cursor:pointer;"><i class="fas fa-file-invoice-dollar"></i></button>
                        <button onclick="window.AdminDashboard.viewClientDetails('${c.id}', '${c.name}', 'audit')" title="Auditoría" class="btn-icon-action" style="background:transparent; border:1px solid #334; color:#ef4444; padding:8px; border-radius:6px; cursor:pointer;"><i class="fas fa-history"></i></button>
                    </div>
                    
                    <button class="btn-admin-primary" onclick="window.AdminDashboard.viewClientDetails('${c.id}', '${c.name}', 'general')" style="width:100%; margin-top:5px; cursor:pointer;">GESTIONAR EMPRESA</button>
                </div>
            `).join('');

            container.innerHTML = cards;

        } catch (e) {
            console.error("Supabase Error:", e);
            container.innerHTML = `<div style="color:#ef4444; padding:20px;">Error al cargar datos reales: ${e.message}</div>`;
        }
    };

    const renderClientsView = () => {
        // Trigger fetch in background
        setTimeout(loadClientsData, 100);

        return `
            <div class="admin-table-container" style="background:transparent; border:none;">
                <div class="admin-table-header" style="background:#1e293b; border-radius:12px; border:1px solid #334; padding:20px; margin-bottom:20px; display:flex; flex-direction:column; gap:15px;">
                    <div>
                        <h3 style="margin:0;"><i class="fas fa-user-shield"></i> Backoffice Order</h3>
                        <p style="margin:5px 0 0 0; font-size:0.85rem; color:#94a3b8;">Gestión Integral de Empresas (Supabase Connected).</p>
                    </div>
                    
                    <div style="display:flex; gap:10px; width:100%; justify-content:space-between; flex-wrap:wrap;">
                         <div style="flex-grow:1; min-width:200px;">
                            <input type="text" placeholder="Buscar Cliente..." style="background:#0f172a; border:1px solid #334; color:white; padding:8px; border-radius:6px; width:100%;">
                         </div>
                         <button class="btn-admin-primary" onclick="window.AdminDashboard.openNewClientModal()" style="width:auto; padding:0 20px;"><i class="fas fa-plus"></i> NUEVO</button>
                    </div>
                </div>

                <!-- CARD GRID LAYOUT -->
                <div id="clients-dynamic-container" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
                     <div style="grid-column: 1/-1; text-align:center; padding:40px; color:#64748b;">
                        <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; margin-bottom:10px;"></i><br>
                        Conectando con Base de Datos...
                    </div>
                </div>
            </div>
        `;
    };

    // View Details (Drill Down) with Tabs
    // View Details (Drill Down) with Tabs
    const viewClientDetails = (id, name, activeTab = 'general') => {
        // Debug
        console.log('Viewing details:', id, name, activeTab);

        const contentArea = document.getElementById('admin-main-content');
        if (!contentArea) {
            console.error('Content area not found');
            return;
        }

        // Define Tabs
        const tabs = [
            { id: 'general', label: 'General & Contrato', icon: 'fa-info-circle' },
            { id: 'users', label: 'Usuarios y Roles', icon: 'fa-users' },
            { id: 'fleet', label: 'Flota Asignada', icon: 'fa-ship' },
            { id: 'billing', label: 'Facturación', icon: 'fa-file-invoice-dollar' },
            { id: 'audit', label: 'Auditoría', icon: 'fa-history' }
        ];

        // Generate Tab HTML
        const tabsHtml = tabs.map(t => `
            <div onclick="window.AdminDashboard.viewClientDetails('${id}', '${name}', '${t.id}')" 
                 style="padding:10px 15px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:5px; border-bottom: 2px solid ${activeTab === t.id ? '#00e5ff' : 'transparent'}; color: ${activeTab === t.id ? '#fff' : '#94a3b8'}; transition:all 0.2s; min-width:80px; text-align:center;">
                <i class="fas ${t.icon}" style="font-size:1.2rem;"></i> 
                <span style="font-size:0.7rem;">${t.label}</span>
            </div>
        `).join('');

        // Render Content based on activeTab
        let tabContent = '';
        try {
            switch (activeTab) {
                case 'users':
                    if (typeof renderClientUsersTab === 'function') tabContent = renderClientUsersTab(name);
                    else console.error('renderClientUsersTab missing');
                    break;
                case 'fleet':
                    if (typeof renderClientFleetTab === 'function') tabContent = renderClientFleetTab(name);
                    else console.error('renderClientFleetTab missing');
                    break;
                case 'billing':
                    if (typeof renderClientBillingTab === 'function') tabContent = renderClientBillingTab(name);
                    else console.error('renderClientBillingTab missing');
                    break;
                case 'audit':
                    if (typeof renderClientAuditTab === 'function') tabContent = renderClientAuditTab(name);
                    else console.error('renderClientAuditTab missing');
                    break;
                case 'general':
                default:
                    if (typeof renderClientGeneralTab === 'function') tabContent = renderClientGeneralTab(name);
                    else {
                        console.error('renderClientGeneralTab missing');
                        tabContent = '<div style="color:red; padding:20px;">Error: General Tab Renderer Missing</div>';
                    }
                    break;
            }
        } catch (e) {
            console.error('Error rendering tab:', e);
            tabContent = `<div style="color:red; padding:20px;">Error loading view: ${e.message}</div>`;
        }

        contentArea.innerHTML = `
            <div style="margin-bottom:20px;">
                <button class="btn-doc-mini" onclick="AdminDashboard.routeTo('clients')"><i class="fas fa-arrow-left"></i> VOLVER AL LISTADO</button>
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="margin:0;">Gestión: ${name} <span class="badge-plan" style="font-size:0.5em; vertical-align:middle;">ACTIVO</span></h2>
                <div style="display:flex; gap:10px;">
                     <button class="btn-admin-primary" onclick="alert('Generando Reporte PDF...')" style="background:#334;"><i class="fas fa-download"></i> REPORTE</button>
                    <button class="btn-admin-primary" onclick="alert('Funcionalidad de Suspensión: Próximamente')" style="background:#ef4444;"><i class="fas fa-ban"></i> SUSPENDER</button>
                </div>
            </div>

            <!-- TABS CONTAINER -->
            <div style="display:flex; gap:10px; border-bottom:1px solid #334; margin-bottom:25px; overflow-x:auto;">
                ${tabsHtml}
            </div>

            <!-- TAB CONTENT -->
            <div class="animate-fade-in" style="min-height:400px;">
                ${tabContent}
            </div>
        `;
    };

    // --- CLIENT TABS RENDERERS ---

    const renderClientGeneralTab = (name) => {
        return `
            <div style="display:flex; flex-direction:column; gap:20px;">
                <!-- Card 1: Info -->
                <div class="kpi-card" style="background:#1e293b; border:1px solid #334; margin:0;">
                    <h4 style="margin-top:0; color:#fff; border-bottom:1px solid #334; padding-bottom:10px;">Información Corporativa</h4>
                    <div style="color:#cbd5e1; font-size:0.9rem; line-height:1.8;">
                        <strong>Razón Social:</strong> ${name}<br>
                        <strong>RUC / TAX ID:</strong> 8009281-2<br>
                        <strong>Dirección:</strong> Av. Aviadores del Chaco 2050<br>
                        <strong>País:</strong> Paraguay <img src="https://flagcdn.com/w20/py.png" style="width:16px;"><br>
                        <strong>Contacto Admin:</strong> Roberto Gómez (roberto@${name.replace(/\s/g, '').toLowerCase()}.com)
                    </div>
                </div>

                <!-- Card 2: Licencia -->
                <div class="kpi-card" style="background:#1e293b; border:1px solid #334; margin:0;">
                    <h4 style="margin-top:0; color:#fff; border-bottom:1px solid #334; padding-bottom:10px;">Licencia Activa</h4>
                        <div style="color:#cbd5e1; font-size:0.9rem; line-height:1.8;">
                        <strong>Plan Actual:</strong> <span class="badge-plan">ENTERPRISE</span><br>
                        <strong>Inicio Contrato:</strong> 01/01/2024<br>
                        <strong>Renovación:</strong> 01/01/2026<br>
                        <strong>SLA:</strong> 99.9% Garantizado
                    </div>
                </div>

                <!-- Card 3: Uso -->
                <div class="kpi-card" style="background:#1e293b; border:1px solid #334; margin:0;">
                    <h4 style="margin-top:0; color:#fff; border-bottom:1px solid #334; padding-bottom:10px;">Resumen de Uso</h4>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; text-align:center;">
                        <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px;">
                            <div style="font-size:1.5rem; color:#00e5ff; font-weight:700;">12</div>
                            <div style="font-size:0.8rem; color:#94a3b8;">Usuarios</div>
                        </div>
                            <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px;">
                            <div style="font-size:1.5rem; color:#f59e0b; font-weight:700;">15</div>
                            <div style="font-size:0.8rem; color:#94a3b8;">Barcos</div>
                        </div>
                            <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px;">
                            <div style="font-size:1.5rem; color:#10b981; font-weight:700;">ACTIVE</div>
                            <div style="font-size:0.8rem; color:#94a3b8;">Status</div>
                        </div>
                            <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px;">
                            <div style="font-size:1.5rem; color:#ec4899; font-weight:700;">0</div>
                            <div style="font-size:0.8rem; color:#94a3b8;">Deuda</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    const renderClientUsersTab = (name) => {
        const users = [
            { name: "Roberto Gómez (Admin)", role: "Super Admin", last: "Ahora", status: "active", email: "roberto@cargill.com" },
            { name: "Juan C. (Ops)", role: "Dispatcher", last: "2h", status: "active", email: "juan.ops@cargill.com" },
            { name: "Pedro A. (Capitán)", role: "Captain", last: "1d", status: "offline", email: "pedro.cap@cargill.com" },
            { name: "Maria L. (Ventas)", role: "Viewer", last: "5h", status: "busy", email: "maria.sales@cargill.com" }
        ];

        let cards = users.map(u => `
            <div class="user-card" style="background:#1e293b; border:1px solid #334; padding:15px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                     <div style="font-weight:bold; color:#fff;">${u.name}</div>
                     <div style="font-size:0.8rem; color:#94a3b8;">${u.role} &bull; ${u.email}</div>
                     <div style="font-size:0.7rem; color:#64748b; margin-top:3px;">Último acceso: ${u.last}</div>
                </div>
                <div style="text-align:right; display:flex; flex-direction:column; gap:5px; align-items:flex-end;">
                     <span class="status-badge ${u.status === 'active' ? 'badge-active' : (u.status === 'busy' ? 'badge-warning' : 'badge-error')}">${u.status}</span>
                     <button class="btn-icon-action" onclick="AdminDashboard.openEditUserModal('${u.name}')" style="background:transparent; border:1px solid #475569; color:#94a3b8; padding:5px; border-radius:4px;"><i class="fas fa-edit"></i></button>
                </div>
            </div>
        `).join('');

        return `
            <div style="display:flex; flex-direction:column; gap:15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                     <h4 style="margin:0;">Usuarios (${users.length})</h4>
                     <button class="btn-admin-primary" onclick="AdminDashboard.openNewUserModal('${name}')" style="font-size:0.8rem;"><i class="fas fa-user-plus"></i> NUEVO</button>
                </div>
                ${cards}
            </div>
        `;
    };

    const renderClientFleetTab = (name) => {
        const fleets = [
            { name: "M/V IGUAZU", type: "EMP + BARCAZAS", status: "Navegando", loc: "km 1200" },
            { name: "M/V PARANA", type: "REMOLCADOR", status: "Puerto", loc: "Rosario" },
            { name: "TB TRITON", type: "REMOLCADOR", status: "Mant. Preventivo", loc: "Asunción" }
        ];

        let cards = fleets.map(f => `
            <div class="fleet-card" style="background:#1e293b; border:1px solid #334; padding:15px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="background:#00e5ff; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#000; font-size:0.8rem;"><i class="fas fa-ship"></i></div>
                    <div>
                         <div style="font-weight:bold; color:#fff;">${f.name}</div>
                         <div style="font-size:0.8rem; color:#94a3b8;">${f.type}</div>
                    </div>
                </div>
                <div style="text-align:right;">
                    <span class="status-badge ${f.status === 'Navegando' ? 'badge-active' : 'badge-warning'}">${f.status}</span>
                    <div style="font-size:0.75rem; color:#94a3b8; margin-top:5px;">${f.loc}</div>
                </div>
            </div>
        `).join('');

        return `
             <div style="display:flex; flex-direction:column; gap:15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                     <h4 style="margin:0;">Flota Asignada (${fleets.length})</h4>
                     <button class="btn-admin-primary" onclick="AdminDashboard.openLinkShipModal('${name}')" style="font-size:0.8rem;"><i class="fas fa-link"></i> VINCULAR</button>
                </div>
                ${cards}
            </div>
        `;
    };

    const renderClientBillingTab = (name) => {
        const invoices = [
            { period: "Ene 2026", concept: "Suscripción Enterprise + Addons", amount: "$2,500.00", status: "PAID" },
            { period: "Dic 2025", concept: "Suscripción Enterprise", amount: "$2,500.00", status: "PAID" }
        ];

        let cards = invoices.map(i => `
            <div class="invoice-card" style="background:#1e293b; border:1px solid #334; padding:15px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div>
                     <div style="font-weight:bold; color:#fff;">${i.concept}</div>
                     <div style="font-size:0.8rem; color:#94a3b8;">${i.period} &bull; ${i.amount}</div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                     <span class="status-badge badge-active">${i.status}</span>
                     <button class="btn-icon-action" onclick="alert('Descargar PDF: ${i.period}')" style="background:#334; border:1px solid #475569; color:#fff; padding:8px; border-radius:6px;"><i class="fas fa-file-pdf"></i></button>
                </div>
            </div>
        `).join('');

        return `
             <div style="display:flex; flex-direction:column; gap:15px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                     <h4 style="margin:0;">Historial de Facturación</h4>
                     <button class="btn-admin-primary" onclick="alert('Descargar Estado de Cuenta')" style="background:#334; font-size:0.8rem;"><i class="fas fa-download"></i> ESTADO</button>
                </div>
                <div>
                    ${cards}
                </div>
            </div>
        `;
    };

    const renderClientAuditTab = (name) => {
        const logs = [
            { date: "24/01 10:30", user: "Roberto Gómez", action: "LOGIN", type: "info", desc: "Inicio de sesión desde IP 192.168.1.55" },
            { date: "23/01 14:15", user: "Juan C.", action: "UPDATE", type: "warning", desc: "Modificó ETA de M/V IGUAZU" }
        ];

        let items = logs.map(l => `
            <div style="background:#1e293b; border-bottom:1px solid #334; padding:12px; display:flex; flex-direction:column; gap:5px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="badge-plan" style="background:${l.type === 'info' ? '#334' : '#f59e0b'}; color:#fff; font-size:0.65rem;">${l.action}</span>
                    <span style="font-size:0.7rem; color:#64748b;">${l.date}</span>
                </div>
                <div style="color:#e2e8f0; font-size:0.9rem;">${l.desc}</div>
                <div style="font-size:0.75rem; color:#94a3b8;">Usuario: ${l.user}</div>
            </div>
        `).join('');

        return `
             <div class="admin-table-container" style="padding:0; overflow:hidden;">
                <div class="admin-table-header" style="padding:15px;">
                     <h4 style="margin:0;">Auditoría (${name})</h4>
                </div>
                <div style="display:flex; flex-direction:column;">
                    ${items}
                </div>
            </div>
        `;
    };

    // Modal Logic
    const submitNewClient = async () => {
        // Scope search to the modal container to ensure we get the visible input
        const container = document.getElementById('admin-modal-container');
        if (!container) return;

        const nameInput = container.querySelector('#new-client-name');
        const planInput = container.querySelector('#new-client-plan');
        const typeInput = container.querySelector('#new-client-type');

        const name = nameInput ? nameInput.value.trim() : '';
        const plan = planInput ? planInput.value : 'BASIC';
        const type = typeInput ? typeInput.value : 'AGRO';

        console.log("Submit Debug:", { name, plan, type });

        if (!name) {
            // Debug alert to help user understand what happened
            alert(`⚠️ Error de Lectura: El campo nombre parece vacío para el sistema. \n(Valor leído: "${name}")\n\nIntenta escribir de nuevo.`);
            return;
        }

        const btn = document.getElementById('btn-create-client');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            btn.disabled = true;
        }

        try {
            // Force PostgREST to refresh schema cache by adding a random param if possible, 
            // but for JS Client, we just retry or rely on server side config.
            // Let's try inserting without wait first? No, default is fine.

            const { error } = await window.sb
                .from('clients')
                .insert([{  // Array format is safer sometimes
                    name: name,
                    plan: plan,
                    country_zone: 'PY',
                    roles_config: 'Admin,Viewer',
                    users_count: 1,
                    status: 'active'
                }]);

            if (error) {
                // Specific hint for Schema Cache issue
                if (error.message && error.message.includes('schema cache')) {
                    alert("⚠️ Error de Caché de Supabase (Muy común al crear tablas nuevas).\n\nSOLUCIÓN RÁPIDA:\n1. Ve a Supabase > Settings > API\n2. Clickea en 'Reload Schema' o 'Refresh'.\n\nEl código está bien, pero el servidor no se enteró de la nueva tabla aún.");
                    throw error;
                }
                throw error;
            }

            alert("✅ ¡Cliente Guardado en Supabase!");
            document.getElementById('admin-modal-container').innerHTML = '';

            // Reload list with a small delay to allow propagation
            setTimeout(loadClientsData, 500);

        } catch (e) {
            console.error("Supabase Error:", e);
            alert("❌ Error de Base de Datos: " + e.message);
            if (btn) {
                btn.innerHTML = 'REINTENTAR';
                btn.disabled = false;
            }
        }
    };

    const openNewClientModal = () => {
        let container = document.getElementById('admin-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'admin-modal-container';
            document.body.appendChild(container);
        }

        container.innerHTML = `
            <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:9999;">
                <div style="background:#1e293b; width:500px; padding:30px; border-radius:12px; border:1px solid #334155; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
                    <h3 style="margin-top:0; color:#fff; border-bottom:1px solid #334; padding-bottom:10px;">Nuevo Cliente (Supabase)</h3>
                    
                    <div class="calado-form-group" style="margin-top:20px;">
                        <label>Razón Social</label>
                        <input type="text" id="new-client-name" autocomplete="off" placeholder="Ej: Naviera Guaraní S.A.">
                    </div>
                    
                    <div class="calado-form-group">
                        <label>Email Admin Principal</label>
                        <input type="email" id="new-client-email" autocomplete="off" placeholder="admin@empresa.com">
                    </div>
                    
                    <div class="calado-form-group">
                        <label>Tipo de Industria</label>
                        <select id="new-client-type">
                            <option value="AGRO">Agroexportadora</option>
                            <option value="LOGISTIC">Logística Fluvial</option>
                            <option value="FUEL">Combustibles / Hidrocarburos</option>
                        </select>
                    </div>
                    
                    <div class="calado-form-group">
                        <label>Plan Inicial</label>
                        <select id="new-client-plan">
                            <option value="TRIAL">Trial (14 días)</option>
                            <option value="BASIC">Professional</option>
                            <option value="ENTERPRISE">Enterprise</option>
                        </select>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:25px; pt-4 border-top:1px solid #334;">
                        <button class="btn-admin-primary" style="background:transparent; border:1px solid #64748b;" onclick="document.getElementById('admin-modal-container').innerHTML = ''">CANCELAR</button>
                        <button id="btn-create-client" class="btn-admin-primary" onclick="AdminDashboard.submitNewClient()">CREAR CLIENTE</button>
                    </div>
                </div>
            </div>
        `;
    };

    const openNewUserModal = (clientName) => {
        let container = document.getElementById('admin-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'admin-modal-container';
            document.body.appendChild(container);
        }
        container.innerHTML = `
            <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:9999;">
                <div style="background:#1e293b; width:90%; max-width:500px; padding:30px; border-radius:12px; border:1px solid #334155; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
                    <h3 style="margin-top:0; color:#fff;">Nuevo Usuario para ${clientName}</h3>
                    <div class="calado-form-group">
                        <label>Nombre Completo</label>
                        <input type="text" placeholder="Ej: Juan Pérez">
                    </div>
                    <div class="calado-form-group">
                        <label>Email Corporativo</label>
                        <input type="email" placeholder="usuario@empresa.com">
                    </div>
                    <div class="calado-form-group">
                        <label>Rol Asignado</label>
                        <select>
                            <option>Viewer (Solo lectura)</option>
                            <option>Captain (Carga de reportes)</option>
                            <option>Dispatcher (Gestión de Flota)</option>
                            <option>Admin (Gestión Total)</option>
                        </select>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                        <button class="btn-admin-primary" style="background:transparent; border:1px solid #fff;" onclick="document.getElementById('admin-modal-container').innerHTML = ''">CANCELAR</button>
                        <button class="btn-admin-primary" onclick="alert('Usuario Creado'); document.getElementById('admin-modal-container').innerHTML = ''">GUARDAR</button>
                    </div>
                </div>
            </div>
        `;
    };

    const openEditUserModal = (userName) => {
        let container = document.getElementById('admin-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'admin-modal-container';
            document.body.appendChild(container);
        }
        container.innerHTML = `
            <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:9999;">
                <div style="background:#1e293b; width:90%; max-width:500px; padding:30px; border-radius:12px; border:1px solid #334155; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
                    <h3 style="margin-top:0; color:#fff;">Editar Usuario: ${userName}</h3>
                    <div class="calado-form-group">
                        <label>Rol Asignado</label>
                        <select>
                             <option>Admin (Gestión Total)</option>
                             <option>Dispatcher (Gestión de Flota)</option>
                             <option>Captain (Carga de reportes)</option> 
                            <option>Viewer (Solo lectura)</option>
                        </select>
                    </div>
                     <div class="calado-form-group">
                        <label>Estado</label>
                        <select>
                            <option value="active">Activo</option>
                            <option value="busy">Ausente</option>
                            <option value="offline">Inactivo / Bloqueado</option>
                        </select>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                        <button class="btn-admin-primary" style="background:transparent; border:1px solid #fff;" onclick="document.getElementById('admin-modal-container').innerHTML = ''">CANCELAR</button>
                        <button class="btn-admin-primary" onclick="alert('Usuario Actualizado'); document.getElementById('admin-modal-container').innerHTML = ''">ACTUALIZAR</button>
                    </div>
                </div>
            </div>
        `;
    };

    const openGlobalTrackingModal = (shipName, location) => {
        let container = document.getElementById('admin-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'admin-modal-container';
            document.body.appendChild(container);
        }

        container.innerHTML = `
             <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:9999;">
                <div style="background:#1e293b; width:95%; max-width:600px; height:80vh; padding:20px; border-radius:12px; border:1px solid #334155; box-shadow:0 20px 50px rgba(0,0,0,0.5); display:flex; flex-direction:column;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <div>
                             <h3 style="margin:0; color:#fff;"><i class="fas fa-satellite-dish" style="color:#00e5ff;"></i> Tracking Satelital</h3>
                             <div style="font-size:0.8rem; color:#94a3b8;">${shipName} @ ${location}</div>
                        </div>
                        <button onclick="document.getElementById('admin-modal-container').innerHTML = ''" style="background:transparent; border:none; color:#fff; font-size:1.5rem;"><i class="fas fa-times"></i></button>
                    </div>
                    
                    <div style="flex-grow:1; background:#0f172a; border-radius:8px; border:1px solid #334; position:relative; overflow:hidden;">
                        <!-- MOCK MAP -->
                        <div style="width:100%; height:100%; background:url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-57.5, -25.3, 10, 0, 0/600x400?access_token=pk.mock') center/cover no-repeat; display:flex; align-items:center; justify-content:center;">
                            <div style="width:20px; height:20px; background:#00e5ff; border-radius:50%; box-shadow:0 0 20px #00e5ff; animation:pulse 2s infinite;"></div>
                        </div>
                         <div style="position:absolute; bottom:20px; left:20px; background:rgba(0,0,0,0.7); padding:10px; border-radius:8px; font-size:0.8rem; color:#fff;">
                            <div><strong>Speed:</strong> 8.5 knts</div>
                            <div><strong>Course:</strong> 180° S</div>
                            <div><strong>ETA Rosario:</strong> 3 días</div>
                        </div>
                    </div>

                    <div style="margin-top:15px; display:flex; gap:10px; justify-content:center;">
                        <button class="btn-admin-primary" style="flex:1;"><i class="fas fa-history"></i> Historial</button>
                        <button class="btn-admin-primary" style="flex:1; background:#334;"><i class="fas fa-share-alt"></i> Compartir</button>
                    </div>
                </div>
            </div>
        `;
    };

    const openNewTenantModal = () => {
        let container = document.getElementById('admin-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'admin-modal-container';
            document.body.appendChild(container);
        }

        container.innerHTML = `
             <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:9999;">
                <div style="background:#1e293b; width:90%; max-width:500px; padding:30px; border-radius:12px; border:1px solid #334155; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
                    <h3 style="margin-top:0; color:#fff;">Registrar Nueva Empresa</h3>
                    <div class="calado-form-group">
                        <label>Nombre de la Empresa</label>
                        <input type="text" placeholder="Ej: Transfluvial S.A.">
                    </div>
                    <div class="calado-form-group">
                        <label>Plan de Suscripción</label>
                        <select>
                            <option>Basic</option>
                            <option>Premium</option>
                            <option>Corporate</option>
                            <option>Enterprise</option>
                        </select>
                    </div>
                    <div class="calado-form-group">
                        <label>Zona de Operación</label>
                         <select>
                            <option>Paraguay (PY)</option>
                            <option>Argentina (ARG)</option>
                            <option>Brasil (BRA)</option>
                            <option>Uruguay (URU)</option>
                            <option>Bolivia (BOL)</option>
                        </select>
                    </div>
                    <div class="calado-form-group">
                        <label>Límite de Usuarios</label>
                        <input type="number" placeholder="Ej: 10" min="1">
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                        <button class="btn-admin-primary" style="background:transparent; border:1px solid #fff;" onclick="document.getElementById('admin-modal-container').innerHTML = ''">CANCELAR</button>
                        <button class="btn-admin-primary" onclick="alert('Empresa Registrada (Simulación)'); document.getElementById('admin-modal-container').innerHTML = ''">REGISTRAR</button>
                    </div>
                </div>
            </div>
        `;
    };

    const openNewOrderModal = () => {
        let container = document.getElementById('admin-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'admin-modal-container';
            document.body.appendChild(container);
        }

        container.innerHTML = `
             <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:9999;">
                <div style="background:#1e293b; width:90%; max-width:500px; padding:30px; border-radius:12px; border:1px solid #334155; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
                    <h3 style="margin-top:0; color:#fff;">Nueva Orden de Trabajo</h3>
                    <div class="calado-form-group">
                        <label>Embarcación Afectada</label>
                        <select>
                            <option>M/V IGUAZU</option>
                            <option>R/M TITAN</option>
                            <option>B-2001</option>
                        </select>
                    </div>
                    <div class="calado-form-group">
                        <label>Tipo de Trabajo</label>
                        <select>
                            <option>Mantenimiento Correctivo</option>
                            <option>Mantenimiento Preventivo</option>
                            <option>Inspección / Auditoría</option>
                            <option>Abastecimiento</option>
                        </select>
                    </div>
                    <div class="calado-form-group">
                        <label>Prioridad</label>
                         <select>
                            <option value="alta" style="color:red;">ALTA</option>
                            <option value="media" style="color:orange;">MEDIA</option>
                            <option value="baja" style="color:green;">BAJA</option>
                        </select>
                    </div>
                    <div class="calado-form-group">
                        <label>Detalle de la Orden</label>
                        <textarea rows="3" placeholder="Describa el trabajo a realizar..." style="width:100%; background:#0f172a; border:1px solid #334; color:white; padding:10px; border-radius:6px;"></textarea>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                        <button class="btn-admin-primary" style="background:transparent; border:1px solid #fff;" onclick="document.getElementById('admin-modal-container').innerHTML = ''">CANCELAR</button>
                        <button class="btn-admin-primary" onclick="alert('Orden Generada (Simulación)'); document.getElementById('admin-modal-container').innerHTML = ''">CREAR ORDEN</button>
                    </div>
                </div>
            </div>
        `;
    };

    const openNewFleetModal = () => {
        let container = document.getElementById('admin-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'admin-modal-container';
            document.body.appendChild(container); // Append to body, not inside view
        }

        container.innerHTML = `
            <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:9999;">
                <div style="background:#1e293b; width:90%; max-width:500px; padding:30px; border-radius:12px; border:1px solid #334155; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
                    <h3 style="margin-top:0; color:#fff;">Nuevo Activo de Flota</h3>
                    <div class="calado-form-group">
                        <label>Nombre de la Embarcación / Activo</label>
                        <input type="text" placeholder="Ej: R/M GUARANI I">
                    </div>
                    <div class="calado-form-group">
                        <label>Tipo de Activo</label>
                        <select>
                            <option>Remolcador</option>
                            <option>Barcaza Granelera</option>
                            <option>Buque Tanque</option>
                            <option>Lancha de Apoyo</option>
                            <option>Infraestructura (Puerto)</option>
                        </select>
                    </div>
                    <div class="calado-form-group">
                        <label>Empresa Propietaria</label>
                         <select>
                            <option>Flota Propia</option>
                            <option>Cargill SACI</option>
                            <option>Naviera Chaco</option>
                        </select>
                    </div>
                    <div class="calado-form-group">
                        <label>Zona Inicial</label>
                        <input type="text" placeholder="Ej: Asunción / Km 1630">
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                        <button class="btn-admin-primary" style="background:transparent; border:1px solid #fff;" onclick="document.getElementById('admin-modal-container').innerHTML = ''">CANCELAR</button>
                        <button class="btn-admin-primary" onclick="alert('Activo Creado con Éxito'); document.getElementById('admin-modal-container').innerHTML = ''">GUARDAR ACTIVO</button>
                    </div>
                </div>
            </div>
        `;
    };

    const openNewUserModalGlobal = () => {
        openNewUserModal('Global');
    };

    const openLinkShipModal = (clientName) => {
        let container = document.getElementById('admin-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'admin-modal-container';
            document.body.appendChild(container);
        }
        container.innerHTML = `
            <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:9999;">
                <div style="background:#1e293b; width:90%; max-width:500px; padding:30px; border-radius:12px; border:1px solid #334155; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
                    <h3 style="margin-top:0; color:#fff;">Vincular Barco a ${clientName}</h3>
                    <div class="calado-form-group">
                        <label>Buscar Barco / Identificador AIS</label>
                        <input type="text" placeholder="Ej: 701000001 or M/V IGUAZU">
                    </div>
                    <div class="calado-form-group">
                        <label>Tipo de Relación</label>
                        <select>
                            <option>Propiedad (Dueño)</option>
                            <option>Charter (Alquiler)</option>
                            <option>Gestión Técnica</option>
                        </select>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                        <button class="btn-admin-primary" style="background:transparent; border:1px solid #fff;" onclick="document.getElementById('admin-modal-container').innerHTML = ''">CANCELAR</button>
                        <button class="btn-admin-primary" onclick="alert('Barco Vinculado'); document.getElementById('admin-modal-container').innerHTML = ''">VINCULAR</button>
                    </div>
                </div>
            </div>
        `;
    };

    const renderClientShipsView = () => {
        const ships = [
            { id: 's1', name: "M/V IGUAZU", clientId: 'c1', client: "Cargill SACI", type: "EMP + BARCAZAS", status: "Navegando", loc: "km 1200" },
            { id: 's2', name: "M/V PARANA", clientId: 'c1', client: "Cargill SACI", type: "REMOLCADOR", status: "Puerto", loc: "Rosario" },
            { id: 's3', name: "TB TRITON", clientId: 'c4', client: "Naviera Chaco", type: "REMOLCADOR", status: "Mant. Preventivo", loc: "Asunción" },
            { id: 's4', name: "B-2001", clientId: 'c2', client: "ADM Paraguay", type: "BARCAZA", status: "Cargada", loc: "Villeta" },
            { id: 's5', name: "R/M ORION", clientId: 'c3', client: "Petropar", type: "REMOLCADOR", status: "Navegando", loc: "km 600" }
        ];

        let cards = ships.map(s => `
            <div class="fleet-card" data-status="${s.status === 'Navegando' ? 'active' : (s.status === 'Puerto' ? 'port' : 'maintenance')}">
                <div class="fleet-card-header">
                     <div style="display:flex; align-items:center; gap:10px;">
                        <div style="background:var(--neon-cyan); width:8px; height:8px; border-radius:50%; box-shadow:0 0 10px var(--neon-cyan);"></div>
                        <div>
                            <h3 class="fleet-card-title">${s.name}</h3>
                            <span style="font-size:0.75rem; color:var(--text-muted);">${s.type}</span>
                        </div>
                    </div>
                    <span class="status-badge ${s.status === 'Navegando' ? 'active' : (s.status === 'Puerto' ? 'pending' : 'inactive')}">${s.status.toUpperCase()}</span>
                </div>

                <div class="fleet-card-body">
                    <div class="fleet-info-row">
                        <span>Ubicación:</span>
                        <span class="fleet-info-val"><i class="fas fa-map-marker-alt" style="color:var(--neon-gold);"></i> ${s.loc}</span>
                    </div>
                    <div class="fleet-info-row">
                        <span>Propietario:</span>
                        <a href="#" onclick="AdminDashboard.viewClientDetails('${s.clientId}', '${s.client}')" style="color:var(--neon-cyan); text-decoration:none; font-weight:600;">
                            ${s.client} <i class="fas fa-external-link-alt" style="font-size:0.7em;"></i>
                        </a>
                    </div>
                </div>

                <div class="fleet-card-actions">
                    <button class="btn-admin-primary" onclick="AdminDashboard.openGlobalTrackingModal('${s.name}', '${s.loc}')" style="font-size:0.8rem;"><i class="fas fa-satellite-dish"></i> TRACKING</button>
                    <button class="btn-table-action" onclick="alert('Ver Contrato: ${s.client}')" style="width:auto; padding:0 15px;"><i class="fas fa-file-contract"></i></button>
                </div>
            </div>
        `).join('');

        return `
            <div class="admin-table-container" style="background:transparent; border:none; padding:0;">
                <div class="admin-header" style="margin-bottom:20px;">
                    <div>
                        <h3 style="margin:0; font-size:1.5rem;">Barcos de Clientes (Global)</h3>
                        <p style="margin:5px 0 0 0; color:var(--text-muted);">Monitoreo de toda la flota de terceros.</p>
                    </div>
                    <div style="display:flex; gap:10px; margin-top:10px;">
                        <input type="text" placeholder="Buscar barco o empresa..." style="background:var(--bg-panel); border:1px solid var(--border-color); color:white; padding:8px; border-radius:6px; min-width:200px;">
                        <button class="btn-table-action" onclick="alert('Filtrar Resultados')"><i class="fas fa-filter"></i></button>
                    </div>
                </div>
                
                <div class="fleet-grid">
                    ${cards}
                </div>
            </div>
        `;
    };

    const renderOrdersView = () => {
        const orders = [
            { id: "OT-2024-001", vessel: "M/V IGUAZU", type: "MANTENIMIENTO", priority: "ALTA", status: "En Progreso", assigned: "Taller Central" },
            { id: "OT-2024-002", vessel: "B-2001", type: "INSPECCIÓN", priority: "MEDIA", status: "Pendiente", assigned: "Juan Tec." },
            { id: "OT-2024-003", vessel: "R/M TITAN", type: "ABASTECIMIENTO", priority: "BAJA", status: "Completado", assigned: "Logística" },
        ];

        let cards = orders.map(o => `
            <div style="background:#1e293b; border:1px solid #334; border-radius:12px; padding:15px; display:flex; flex-direction:column; gap:10px; box-shadow:0 4px 6px rgba(0,0,0,0.3);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                     <span style="font-family:monospace; color:#94a3b8; font-size:0.85rem;">${o.id}</span>
                     <span class="status-badge ${o.priority === 'ALTA' ? 'badge-error' : (o.priority === 'MEDIA' ? 'badge-warning' : 'badge-info')}">${o.priority}</span>
                </div>
                <div>
                     <h3 style="margin:0; font-size:1rem; color:#fff;">${o.vessel}</h3>
                     <span style="font-size:0.75rem; color:#94a3b8;">${o.type}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; color:#cbd5e1;">
                    <span><i class="fas fa-user-cog"></i> ${o.assigned}</span>
                    <span style="color:${o.status === 'Completado' ? '#10b981' : '#f59e0b'}">${o.status}</span>
                </div>
                <button class="btn-admin-primary" onclick="alert('Abriendo Orden ${o.id}...')" style="width:100%; margin-top:5px; font-size:0.8rem;">VER DETALLES</button>
            </div>
        `).join('');

        return `
            <div class="admin-table-container" style="background:transparent; border:none;">
                <div class="admin-table-header" style="background:#1e293b; border-radius:12px; border:1px solid #334; padding:20px; margin-bottom:20px;">
                    <h3 style="margin:0;"><i class="fas fa-tasks"></i> Órdenes de Trabajo</h3>
                    <button class="btn-admin-primary" onclick="AdminDashboard.openNewOrderModal()"><i class="fas fa-plus"></i> NUEVA ORDEN</button>
                </div>
                
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
                    ${cards}
                </div>
            </div>
        `;
    };

    // --- VIEWS RENDERERS ---

    const renderDashboardView = () => {
        return `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="margin:0; font-weight:700;">Torre de Control</h2>
                <button class="btn-admin-primary" onclick="AdminDashboard.routeTo('clients')" style="background:#4f46e5;">
                    <i class="fas fa-users-cog"></i> GESTIONAR CLIENTES
                </button>
            </div>
            
            <!-- KPIs -->
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-title">CONVOYS ACTIVOS</div>
                    <div class="kpi-value">12</div>
                    <div class="kpi-trend trend-up"><i class="fas fa-arrow-up"></i> 2 vs ayer</div>
                </div>
                <div class="kpi-card" style="grid-column: span 2; display:flex; flex-direction:column; justify-content:center;">
                    <div class="kpi-title" style="margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
                         <span><i class="fas fa-chart-line"></i> TENDENCIAS DE FLOTA</span>
                         <select style="background:#0f172a; color:#fff; border:1px solid #334; padding:2px 8px; border-radius:4px; font-size:0.75rem;">
                             <option>Últimos 7 días</option>
                             <option>Mes Actual</option>
                         </select>
                    </div>
                    <div style="flex-grow:1; min-height:300px; width:100%; position:relative;">
                        <canvas id="admin-chart-main"></canvas>
                    </div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-title">REPORTE DIARIO DE FLOTA</div>
                    <textarea style="width:100%; height:120px; background:#0f172a; border:1px solid #334; color:#94a3b8; padding:10px; border-radius:6px; resize:none; font-size:0.8rem; line-height:1.4;" readonly>
> M/V IGUAZU: Zarpe confirmado 08:00 AM.
> R/M TITAN: En puerto, espera descaga.
> B-2001: Mantenimiento completado.

Resumen: Operaciones normales en zona sur. Nivel de río estable (+2cm).
                    </textarea>
                    <button class="btn-admin-primary" style="margin-top:10px; width:100%; font-size:0.8rem;"><i class="fas fa-paper-plane"></i> ENVIAR INFORME</button>
                </div>
                <div class="kpi-card">
                    <div class="kpi-title">DISPONIBILIDAD FLOTA</div>
                    <div class="kpi-value">88%</div>
                    <div class="kpi-trend trend-up">2 Barcos en Mantenimiento</div>
                </div>
            </div>

            <div style="background:#1e293b; padding:20px; border-radius:12px; border:1px solid #334155; margin: 30px 0; min-height: 350px;">
                <div class="admin-table-header" style="padding:0; margin-bottom:15px; background:transparent; border:none;">
                    <h3 style="margin:0; font-size:1.1rem;"><i class="fas fa-chart-area" style="color:#00e5ff; margin-right:10px;"></i>Rendimiento de Flota (Online)</h3>
                    <select style="background:#0f172a; color:#fff; border:1px solid #334155; padding:5px; border-radius:5px;">
                        <option>Últimos 7 días</option>
                        <option>Mes actual</option>
                    </select>
                </div>
                <div style="height:300px; width:100%;">
                    <canvas id="admin-chart-main"></canvas>
                </div>
            </div>

            <!-- MINI MAP -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:30px;">
                <div>
                     <div class="admin-table-header" style="background:#1e293b; border-radius:8px 8px 0 0; border:1px solid #334155;">
                        <h3 style="margin:0; font-size:1rem;">Posición Global de Flota</h3>
                    </div>
                    <div id="admin-map-mini" class="admin-map-container" style="border-top:none; border-radius:0 0 8px 8px;">
                        <!-- Leaflet Here -->
                        <div style="height:100%; display:flex; align-items:center; justify-content:center; color:#64748b;">
                            <i class="fas fa-map-marked-alt" style="font-size:2rem; margin-right:10px;"></i> Cargando Satélite...
                        </div>
                    </div>
                </div>

                <!-- ALERTS PANEL -->
                <div style="background:#1e293b; border:1px solid #334155; border-radius:8px; padding:20px;">
                     <h3 style="margin-top:0; font-size:1rem; border-bottom:1px solid #334155; padding-bottom:10px;">Alertas Recientes</h3>
                     <div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">
                        <div style="padding:10px; background:rgba(239, 68, 68, 0.1); border-left:3px solid #ef4444; font-size:0.85rem;">
                            <strong style="color:#ef4444;">VARADURA</strong><br>
                            Convoy C-202 - Km 455
                            <div style="font-size:0.7em; color:#94a3b8; margin-top:5px;">Hace 10 min</div>
                        </div>
                         <div style="padding:10px; background:rgba(245, 158, 11, 0.1); border-left:3px solid #f59e0b; font-size:0.85rem;">
                            <strong style="color:#f59e0b;">NIVEL BAJO</strong><br>
                            Paso Bermejo - 3.2m
                             <div style="font-size:0.7em; color:#94a3b8; margin-top:5px;">Hace 1 hora</div>
                        </div>
                     </div>
                </div>
            </div>
        `;
    };

    const renderFleetView = () => {
        // MOCK DATA
        const fleets = [
            { name: "R/M HERCULES", type: "REMOLCADOR", status: "active", zone: "Km 450", last_update: "2 min" },
            { name: "R/M TITAN", type: "REMOLCADOR", status: "active", zone: "Km 1200", last_update: "5 min" },
            { name: "B-2045", type: "BARCAZA", status: "maintenance", zone: "Astillero", last_update: "1 día" },
            { name: "R/M ORION", type: "REMOLCADOR", status: "warning", zone: "Puerto", last_update: "10 min" },
            { name: "T-001", type: "TANQUE", status: "active", zone: "Km 600", last_update: "12 min" },
        ];

        let cards = fleets.map(f => `
            <div class="fleet-card" data-status="${f.status}">
                <div class="fleet-card-header">
                    <h3 class="fleet-card-title">${f.name}</h3>
                    <span class="fleet-badge">${f.type}</span>
                </div>
                
                <div class="fleet-card-body">
                    <div class="fleet-info-row">
                        <span>Estado:</span>
                        <span class="status-badge ${f.status === 'active' ? 'active' : (f.status === 'warning' ? 'pending' : 'inactive')}">
                            ${f.status.toUpperCase()}
                        </span>
                    </div>
                    <div class="fleet-info-row">
                        <span><i class="fas fa-map-marker-alt" style="color:var(--neon-gold)"></i> Zona:</span>
                        <span class="fleet-info-val">${f.zone}</span>
                    </div>
                    <div class="fleet-info-row">
                        <span><i class="fas fa-clock"></i> Actualizado:</span>
                        <span class="fleet-info-val">${f.last_update}</span>
                    </div>
                </div>

                <div class="fleet-card-actions">
                     <button class="btn-admin-primary" onclick="alert('Editando activo ${f.name}...')" style="background:transparent; border:1px solid var(--border-color);">EDITAR</button>
                     <button class="btn-admin-primary" onclick="alert('Abriendo tracking para ${f.name}...')">TRACKING</button>
                </div>
            </div>
        `).join('');

        return `
             <div class="admin-table-container" style="background:transparent; border:none; padding:0;">
                <div class="admin-header" style="margin-bottom:20px;">
                    <div>
                        <h3 style="margin:0; font-size:1.5rem; color:var(--text-main);">Gestión de Activos</h3>
                        <p style="margin:5px 0 0 0; color:var(--text-muted);">Control total de la flota operativa.</p>
                    </div>
                    <button class="btn-admin-primary" onclick="AdminDashboard.openNewFleetModal()"><i class="fas fa-plus"></i> NUEVO ACTIVO</button>
                </div>
                 <div class="fleet-grid">
                    ${cards}
                </div>
            </div>
        `;
    };

    const renderUsersView = () => {
        const users = [
            { name: "Carlos Martínez", role: "Super Admin", company: "RiverHub HQ", last: "Ahora", status: "active", avatar: "CM" },
            { name: "Juan Pérez", role: "Admin", company: "Naviera del Sur", last: "2h", status: "active", avatar: "JP" },
            { name: "Ana Gomez", role: "Dispatcher", company: "Naviera del Sur", last: "5h", status: "busy", avatar: "AG" },
            { name: "Roberto Diaz", role: "Captain", company: "Trans. Fluvial X", last: "1d", status: "offline", avatar: "RD" },
            { name: "Maria L.", role: "Viewer", company: "Logística Yhaguy", last: "3d", status: "active", avatar: "ML" }
        ];

        let cards = users.map(u => `
            <div style="background:#1e293b; border:1px solid #334; border-radius:12px; padding:15px; display:flex; flex-direction:column; gap:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="admin-avatar" style="width:35px; height:35px; font-size:0.8em;">${u.avatar}</div>
                        <div>
                             <h4 style="margin:0; color:#fff; font-size:1rem;">${u.name}</h4>
                             <div style="font-size:0.75rem; color:#94a3b8;">${u.role}</div>
                        </div>
                    </div>
                     <span class="status-badge ${u.status === 'active' ? 'badge-active' : (u.status === 'busy' ? 'badge-warning' : 'badge-error')}">
                        ${u.status.toUpperCase()}
                    </span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#cbd5e1; border-top:1px solid #334; padding-top:10px;">
                    <span>${u.company}</span>
                    <span style="color:#64748b;">${u.last}</span>
                </div>
                <div style="display:flex; gap:10px; margin-top:5px;">
                     <button class="btn-admin-primary" onclick="alert('Editando usuario ${u.name}...')" style="flex:1; font-size:0.8rem; background:transparent; border:1px solid #334;">EDITAR</button>
                     <button class="btn-admin-primary" onclick="AdminDashboard.impersonateUser('${u.name}', '${u.role}')" title="Simular Usuario" style="flex:1; font-size:0.8rem; background:#4f46e5; border:1px solid #6366f1;"><i class="fas fa-mask"></i> SIMULAR</button>
                </div>
            </div>
        `).join('');

        return `
             <div class="admin-table-container" style="background:transparent; border:none;">
                <div class="admin-table-header" style="background:#1e293b; border-radius:12px; border:1px solid #334; padding:20px; margin-bottom:20px;">
                    <h3 style="margin:0;">Usuarios y Permisos</h3>
                    <button class="btn-admin-primary" onclick="AdminDashboard.openNewUserModalGlobal()"><i class="fas fa-user-plus"></i> NUEVO USUARIO</button>
                </div>
                 <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
                    ${cards}
                </div>
            </div>
        `;
    };

    const renderTenantsView = () => {
        const tenants = [
            { name: "Naviera del Sur S.A.", plan: "PREMIUM", users: 15, status: "active", zone: "ARG-PY" },
            { name: "Transporte Fluvial X", plan: "CORP", users: 42, status: "active", zone: "BRA-PAR" },
            { name: "Logística Yhaguy", plan: "BASIC", users: 5, status: "warning", zone: "PY" },
            { name: "RiverHub Demo", plan: "DEV", users: 3, status: "active", zone: "GLOBAL" }
        ];

        let cards = tenants.map(t => `
            <div style="background:#1e293b; border:1px solid #334; border-radius:12px; padding:15px; display:flex; flex-direction:column; gap:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                     <h3 style="margin:0; color:#fff; font-size:1.1rem;">${t.name}</h3>
                     <span class="badge-plan">${t.plan}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; color:#94a3b8;">
                    <span><i class="fas fa-users"></i> ${t.users} Usuarios</span>
                    <span class="status-badge ${t.status === 'active' ? 'badge-active' : 'badge-warning'}">${t.status.toUpperCase()}</span>
                </div>
                <div style="font-size:0.8rem; color:#64748b;">
                    <i class="fas fa-globe-americas"></i> Zona: ${t.zone}
                </div>
                <div style="display:flex; gap:10px; margin-top:5px;">
                     <button class="btn-admin-primary" onclick="alert('Administrando Tenant ${t.name}...')" style="flex:1; font-size:0.8rem;">ADMINISTRAR</button>
                     <button class="btn-icon-action" onclick="alert('Más opciones para ${t.name}')" style="background:transparent; border:1px solid #334; color:#fff; padding:8px 12px; border-radius:6px;"><i class="fas fa-ellipsis-v"></i></button>
                </div>
            </div>
        `).join('');

        return `
            <div class="admin-table-container" style="background:transparent; border:none;">
                <div class="admin-table-header" style="background:#1e293b; border-radius:12px; border:1px solid #334; padding:20px; margin-bottom:20px;">
                    <h3 style="margin:0;">Empresas Registradas (Tenants)</h3>
                    <button class="btn-admin-primary" onclick="AdminDashboard.openNewTenantModal()"><i class="fas fa-plus"></i> NUEVA EMPRESA</button>
                </div>
                 <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
                    ${cards}
                </div>
            </div>
        `;
    };

    const renderBillingView = () => {
        // MOCK DATA including ID for keying
        const invoices = [
            { id: 101, client: "Naviera del Sur S.A.", plan: "PREMIUM", amount: "$850.00", due: "15/05/2026", status: "paid" },
            { id: 102, client: "Transporte Fluvial X", plan: "CORP", amount: "$1,200.00", due: "10/05/2026", status: "pending" },
            { id: 103, client: "Logística Yhaguy", plan: "BASIC", amount: "$350.00", due: "01/05/2026", status: "overdue" },
            { id: 104, client: "RiverHub Demo", plan: "DEV", amount: "$0.00", due: "-", status: "free" }
        ];

        let cards = invoices.map(inv => `
            <div style="background:#1e293b; border:1px solid #334; border-radius:12px; padding:20px; display:flex; flex-direction:column; gap:15px; box-shadow:0 4px 6px rgba(0,0,0,0.3);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <h3 style="margin:0; color:#fff; font-size:1rem;">${inv.client}</h3>
                        <span class="badge-plan" style="font-size:0.65rem; margin-top:5px; display:inline-block;">${inv.plan}</span>
                    </div>
                    <div style="text-align:right;">
                        <span class="status-badge ${inv.status === 'paid' ? 'badge-active' : (inv.status === 'overdue' ? 'badge-error' : (inv.status === 'free' ? 'badge-info' : 'badge-warning'))}">
                            ${inv.status.toUpperCase()}
                        </span>
                        <div style="font-size:0.75rem; color:#94a3b8; margin-top:5px;">Vence: ${inv.due}</div>
                    </div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #334; padding-top:10px;">
                    <div style="font-size:1.2rem; font-weight:700; color:#fff;">${inv.amount}</div>
                    <div style="display:flex; gap:10px;">
                         ${inv.status === 'overdue' ? `<button class="btn-admin-primary" onclick="alert('Suspendiendo servicio a ${inv.client}...')" style="background:#ef4444; font-size:0.7rem;">SUSPENDER</button>` : ''}
                         <button class="btn-icon-action" onclick="alert('Descargando PDF Factura #${inv.id}...')" style="background:transparent; border:1px solid #475569; color:#fff; padding:8px; border-radius:6px;"><i class="fas fa-file-pdf"></i></button>
                    </div>
                </div>
            </div>
        `).join('');

        return `
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:20px; margin-bottom:30px;" class="kpi-grid">
                <div class="kpi-card" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border:1px solid #334155;">
                    <div class="kpi-title">MRR (INGRESO MENSUAL)</div>
                    <div class="kpi-value" style="color:#10b981;">$2,400</div>
                    <div class="kpi-trend trend-up"><i class="fas fa-arrow-up"></i> +12% vs mes anterior</div>
                </div>
                <div class="kpi-card" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border:1px solid #334155;">
                    <div class="kpi-title">SUSCRIPCIONES ACTIVAS</div>
                    <div class="kpi-value" style="color:#3b82f6;">4</div>
                    <div class="kpi-trend"><span style="color:#94a3b8;">3 Pagas / 1 Free</span></div>
                </div>
                <div class="kpi-card" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border:1px solid #334155;">
                    <div class="kpi-title">TASA DE MOROSIDAD</div>
                    <div class="kpi-value" style="color:#ef4444;">25%</div>
                    <div class="kpi-trend trend-down"><i class="fas fa-exclamation-circle"></i> 1 Cliente en Mora</div>
                </div>
            </div>

            <div class="admin-table-container" style="background:transparent; border:none;">
                <div class="admin-table-header" style="background:#1e293b; border-radius:12px; border:1px solid #334; padding:20px; margin-bottom:20px;">
                    <h3 style="margin:0;">Control de Facturación</h3>
                    <div style="display:flex; gap:10px;">
                         <button class="btn-admin-primary" onclick="alert('Filtrando resultados...')" style="background:#334155;"><i class="fas fa-filter"></i> FILTRAR</button>
                         <button class="btn-admin-primary" onclick="alert('Exportando CSV... Pendiende implementación backend')"><i class="fas fa-download"></i> EXPORTAR CSV</button>
                    </div>
                </div>
                
                <!-- CARD GRID -->
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
                    ${cards}
                </div>
            </div>
        `;
    };

    const renderAuditView = () => {
        const logs = [
            { time: "21/01 14:30", actor: "Carlos M.", action: "DELETE", target: "Barcaza B-204", ip: "192.168.1.45" },
            { time: "21/01 14:15", actor: "Juan Pérez", action: "LOGIN", target: "System", ip: "201.23.44.12" },
            { time: "21/01 13:50", actor: "System", action: "AUTO-ALERT", target: "Nivel Rio < 3m", ip: "LOCALHOST" },
            { time: "21/01 12:00", actor: "Ana Gomez", action: "UPDATE", target: "Convoy C-202", ip: "10.0.0.5" },
            { time: "21/01 11:30", actor: "Carlos M.", action: "CREATE", target: "Usuario Nuevo", ip: "192.168.1.45" }
        ];

        let cards = logs.map(l => `
            <div style="background:#1e293b; border-bottom:1px solid #334; padding:15px; display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="badge-plan" style="background:${l.action === 'DELETE' ? '#ef4444' : (l.action === 'CREATE' ? '#10b981' : '#334155')}; font-size:0.7rem;">${l.action}</span>
                        <strong style="color:#e2e8f0;">${l.actor}</strong>
                    </div>
                    <span style="font-family:monospace; color:#94a3b8; font-size:0.8rem;">${l.time}</span>
                </div>
                <div style="font-size:0.9rem; color:#cbd5e1;">Target: ${l.target}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; color:#64748b; font-size:0.8rem;">
                    <span>IP: ${l.ip}</span>
                    <button class="btn-icon-action" onclick="alert('Ver detalles de auditoría para ${l.action}')" style="background:transparent; color:#94a3b8;"><i class="fas fa-eye"></i> Detalles</button>
                </div>
            </div>
        `).join('');

        return `
            <div class="admin-table-container" style="background:#1e293b; border:1px solid #334; border-radius:12px; overflow:hidden;">
                <div class="admin-table-header" style="padding:20px; border-bottom:1px solid #334;">
                    <h3 style="margin:0;"><i class="fas fa-shield-alt"></i> Bitácora de Auditoría</h3>
                    <button class="btn-admin-primary" onclick="alert('Exportando Logs...')" style="background:#334"><i class="fas fa-download"></i> EXPORTAR LOGS</button>
                </div>
                
                <!-- LIST LAYOUT -->
                <div style="display:flex; flex-direction:column;">
                    ${cards}
                </div>
                 <div style="padding:15px; text-align:center;">
                    <button class="btn-admin-primary" style="background:transparent; border:1px solid #334; width:100%;">CARGAR MÁS</button>
                </div>
            </div>
        `;
    };

    const toggleSidebar = () => {
        const sidebar = document.querySelector('.admin-sidebar');
        if (sidebar) {
            if (sidebar.style.display === 'flex') {
                sidebar.style.display = 'none';
            } else {
                sidebar.style.display = 'flex';
                sidebar.style.position = 'fixed'; // Changed to fixed for better mobile UX
                sidebar.style.top = '60px';
                sidebar.style.left = '0';
                sidebar.style.bottom = '0'; // Use bottom instead of height calc
                sidebar.style.width = '260px';
                sidebar.style.zIndex = '1000'; // Ensure it's on top
            }
        }
    };

    const impersonateUser = (name, role) => {
        if (confirm(`⚠️ ¿Estás seguro de que quieres entrar como "${name}"?\n\nPerderás tus privilegios de Super Admin temporalmente.`)) {
            console.log("Impersonating:", name);
            AuthModule.login({
                id: 'impersonated-id',
                email: 'impersonated@user.local',
                full_name: name,
                role: role.toLowerCase().replace(' ', '_')
            });
        }
    };

    // MINI MAP INIT
    const initMiniMap = () => {
        setTimeout(() => {
            const container = document.getElementById('admin-map-mini');
            if (!container) return;

            // Clean content
            container.innerHTML = '';

            const map = L.map(container, {
                zoomControl: false,
                attributionControl: false,
                background: '#0b1116'
            }).setView([-27.0, -58.5], 5);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                opacity: 0.8
            }).addTo(map);

            // Mock Markers
            const mockPos = [
                [-27.0, -58.5],
                [-32.9, -60.6],
                [-25.2, -57.5]
            ];

            mockPos.forEach(pos => {
                L.circleMarker(pos, {
                    color: '#6366f1',
                    fillColor: '#6366f1',
                    fillOpacity: 0.5,
                    radius: 5
                }).addTo(map);
            });
        }, 100);
    };

    // CHART INIT
    const initDashboardChart = () => {
        setTimeout(() => {
            const ctx = document.getElementById('admin-chart-main');
            if (!ctx) return;

            // Check if Chart.js is loaded
            if (typeof Chart === 'undefined') {
                ctx.parentElement.innerHTML = '<div style="color:red;">Error: Chart.js library not loaded in index.html</div>';
                return;
            }

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
                    datasets: [{
                        label: 'Carga Transportada (TN)',
                        data: [1200, 1900, 3000, 5000, 2300, 3400, 4500],
                        borderColor: '#00e5ff',
                        backgroundColor: 'rgba(0, 229, 255, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'Consumo Búnker (L)',
                        data: [800, 1200, 1500, 2200, 1800, 2000, 2500],
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.05)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: '#94a3b8' } }
                    },
                    scales: {
                        y: {
                            grid: { color: '#334155' },
                            ticks: { color: '#94a3b8' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8' }
                        }
                    }
                }
            });
        }, 300);
    };

    return {
        init,
        routeTo,
        impersonateUser,
        viewClientDetails,
        openNewClientModal,
        openNewOrderModal, // Added export
        openNewTenantModal, // Added export
        openGlobalTrackingModal, // Added export
        openNewFleetModal,
        openNewUserModal,
        openNewUserModalGlobal,
        openLinkShipModal,
        openEditUserModal,
        toggleSidebar,
        submitNewClient // Added Export
    };
})();

window.AdminDashboard = AdminDashboard;
// window.AdminModule = AdminDashboard; // REMOVED TO PREVENT CONFLICT WITH TENANT ADMIN
