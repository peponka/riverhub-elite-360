// js/modules/admin-dashboard.js

const AdminDashboard = (() => {

    // STARTUP
    const init = () => {
        void("Admin Dashboard: Init...");

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
        void(`Admin Router: ${viewName}`);

        // Update Nav Active State (Horizontal)
        document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
        const navItem = document.querySelector(`.nav-tab[data-nav="${viewName}"]`);
        if (navItem) navItem.classList.add('active');

        // Render Content
        const contentArea = document.getElementById('admin-main-content');
        if (!contentArea) return;

        // Delegate to mixin-registered views (loaded from admin-views-*.js)
        const AD = window.AdminDashboard || {};
        const viewMap = {
            'dashboard': () => { contentArea.innerHTML = AD.renderDashboardView ? AD.renderDashboardView() : ''; initMiniMap(); initDashboardChart(); },
            'fleet': () => { contentArea.innerHTML = AD.renderFleetView ? AD.renderFleetView() : ''; },
            'users': () => { contentArea.innerHTML = AD.renderUsersView ? AD.renderUsersView() : ''; },
            'tenants': () => { contentArea.innerHTML = AD.renderTenantsView ? AD.renderTenantsView() : ''; },
            'billing': () => { contentArea.innerHTML = AD.renderBillingView ? AD.renderBillingView() : ''; },
            'audit': () => { contentArea.innerHTML = AD.renderAuditView ? AD.renderAuditView() : ''; },
            'clients': () => { contentArea.innerHTML = AD.renderClientsView ? AD.renderClientsView() : ''; },
            'client-ships': () => { contentArea.innerHTML = AD.renderClientShipsView ? AD.renderClientShipsView() : ''; },
            'orders': () => { contentArea.innerHTML = AD.renderOrdersView ? AD.renderOrdersView() : ''; }
        };
        const handler = viewMap[viewName];
        if (handler) handler();
        else contentArea.innerHTML = '<h1>404 Not Found</h1>';
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
                        <button class="nav-tab" data-nav="fleet" onclick="AdminDashboard.routeTo('fleet')"><i class="fas fa-anchor"></i> GESTI�N FLOTA</button>
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
            container.innerHTML = '<div style="padding:20px; color:#ef4444;">Error: Supabase no est� conectado.</div>';
            return;
        }

        try {
            // Simple query without explicit schema prefix to help cache
            const { data: clients, error } = await window.sb
                .from('clients')
                .select('*')
                .limit(100);

            if (error) throw error;

            if (!clients || clients.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center; padding:40px; color:#64748b;">
                        <i class="fas fa-folder-open" style="font-size:2rem; margin-bottom:10px;"></i><br>
                        No hay clientes registrados a�n.
                    </div>`;
                return;
            }

            void("Clients loaded:", clients);

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
                        <button onclick="window.AdminDashboard.viewClientDetails('${c.id}', '${c.name}', 'billing')" title="Facturaci�n" class="btn-icon-action" style="background:transparent; border:1px solid #334; color:#10b981; padding:8px; border-radius:6px; cursor:pointer;"><i class="fas fa-file-invoice-dollar"></i></button>
                        <button onclick="window.AdminDashboard.viewClientDetails('${c.id}', '${c.name}', 'audit')" title="Auditor�a" class="btn-icon-action" style="background:transparent; border:1px solid #334; color:#ef4444; padding:8px; border-radius:6px; cursor:pointer;"><i class="fas fa-history"></i></button>
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

    // VIEWS — Extracted to admin-views-clients.js and admin-views-ops.js
    // These functions are registered as mixins after admin-dashboard.js loads.

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
        if (window.RiverToast) RiverToast.warning(`Iniciando sesi�n remota como "${name}". P�rdida temporal de root...`, 'Impersonate Activo', 'fas fa-user-secret');
        void("Impersonating:", name);
        setTimeout(() => {
            AuthModule.login({
                id: 'impersonated-id',
                email: 'impersonated@user.local',
                full_name: name,
                role: role.toLowerCase().replace(' ', '_')
            });
        }, 1500);
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
                        label: 'Consumo B�nker (L)',
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
        loadClientsData,
        impersonateUser,
        toggleSidebar
        // Client/Ops views registered by admin-views-clients.js and admin-views-ops.js mixins
    };
})();

window.AdminDashboard = AdminDashboard;
// window.AdminModule = AdminDashboard; // REMOVED TO PREVENT CONFLICT WITH TENANT ADMIN
