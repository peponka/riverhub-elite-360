// admin-views-ops.js � Extracted from admin-dashboard.js
// Operations views: Ships, Orders, Fleet, Users, Tenants, Billing, Audit
// Mixin: registers on AdminDashboard after load

(function() {
    const AD = window.AdminDashboard;
    if (!AD) { console.error('AdminDashboard not loaded'); return; }

    // --- OPERATIONS VIEWS (extracted from IIFE) ---


    function renderClientShipsView() {
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
                    <button class="btn-table-action" onclick="RiverToast.info('Abriendo visor del contrato comercial activo de: ${s.client}')" style="width:auto; padding:0 15px;" data-tooltip="Visor de Contrato"><i class="fas fa-file-contract"></i></button>
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
                        <button class="btn-table-action" onclick="RiverToast.info('Funcionalidad de filtros avanzados inicializando...')" data-tooltip="Filtros Avanzados"><i class="fas fa-filter"></i></button>
                    </div>
                </div>
                
                <div class="fleet-grid">
                    ${cards}
                </div>
            </div>
        `;
    };

    function renderOrdersView() {
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
                <button class="btn-admin-primary" onclick="RiverToast.info('Descargando PDF de la OT: ${o.id}...\\nAbriendo vista detallada.')" style="width:100%; margin-top:5px; font-size:0.8rem;">VER DETALLES</button>
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

    function renderDashboardView() {
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

    function renderFleetView() {
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
                     <button class="btn-admin-primary" onclick="RiverToast.info('Editando activo ${f.name}...')" style="background:transparent; border:1px solid var(--border-color);">EDITAR</button>
                     <button class="btn-admin-primary" onclick="RiverToast.info('Abriendo tracking para ${f.name}...')">TRACKING</button>
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

    function renderUsersView() {
        const users = [
            { name: "Carlos Martínez", role: "Super Admin", company: "FluviaFleet HQ", last: "Ahora", status: "active", avatar: "CM" },
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
                     <button class="btn-admin-primary" onclick="RiverToast.info('Editando usuario ${u.name}...')" style="flex:1; font-size:0.8rem; background:transparent; border:1px solid #334;">EDITAR</button>
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

    function renderTenantsView() {
        const tenants = [
            { name: "Naviera del Sur S.A.", plan: "PREMIUM", users: 15, status: "active", zone: "ARG-PY" },
            { name: "Transporte Fluvial X", plan: "CORP", users: 42, status: "active", zone: "BRA-PAR" },
            { name: "Logística Yhaguy", plan: "BASIC", users: 5, status: "warning", zone: "PY" },
            { name: "FluviaFleet Demo", plan: "DEV", users: 3, status: "active", zone: "GLOBAL" }
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
                     <button class="btn-admin-primary" onclick="RiverToast.info('Ingresando al panel de administración de la empresa: ${t.name}...')" style="flex:1; font-size:0.8rem;">ADMINISTRAR</button>
                     <button class="btn-icon-action" onclick="RiverToast.info('Abriendo menú de opciones extendidas para: ${t.name}')" style="background:transparent; border:1px solid #334; color:#fff; padding:8px 12px; border-radius:6px;" data-tooltip="Menú de Acciones"><i class="fas fa-ellipsis-v"></i></button>
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

    function renderBillingView() {
        // MOCK DATA including ID for keying
        const invoices = [
            { id: 101, client: "Naviera del Sur S.A.", plan: "PREMIUM", amount: "$850.00", due: "15/05/2026", status: "paid" },
            { id: 102, client: "Transporte Fluvial X", plan: "CORP", amount: "$1,200.00", due: "10/05/2026", status: "pending" },
            { id: 103, client: "Logística Yhaguy", plan: "BASIC", amount: "$350.00", due: "01/05/2026", status: "overdue" },
            { id: 104, client: "FluviaFleet Demo", plan: "DEV", amount: "$0.00", due: "-", status: "free" }
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
                         ${inv.status === 'overdue' ? `<button class="btn-admin-primary" onclick="RiverToast.info('Servicio suspendido preventivamente por falta de pago a ${inv.client}.', 'Billing', 'fas fa-gavel')" style="background:#ef4444; font-size:0.7rem;">SUSPENDER</button>` : ''}
                         <button class="btn-icon-action" onclick="RiverToast.success('Descargando copia comercial de la Factura ID #${inv.id}...\\nEl PDF se generará en segundo plano.')" style="background:transparent; border:1px solid #475569; color:#fff; padding:8px; border-radius:6px;" data-tooltip="Descargar PDF Factura"><i class="fas fa-file-pdf"></i></button>
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
                         <button class="btn-admin-primary" onclick="RiverToast.info('El módulo de filtros avanzados se está desplegando...')" style="background:#334155;"><i class="fas fa-filter"></i> FILTRAR</button>
                         <button class="btn-admin-primary" onclick="RiverToast.success('Exportación CSV encolada. El archivo se descargará automáticamente cuando finalice el procesamiento en el servidor.')"><i class="fas fa-download"></i> EXPORTAR CSV</button>
                    </div>
                </div>
                
                <!-- CARD GRID -->
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
                    ${cards}
                </div>
            </div>
        `;
    };

    function renderAuditView() {
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
                    <button class="btn-icon-action" onclick="RiverToast.info('Visualizando trazabilidad detallada del evento: ${l.action}\\n\\nDatos extendidos cargando...')" style="background:transparent; color:#94a3b8;"><i class="fas fa-eye"></i> Detalles</button>
                </div>
            </div>
        `).join('');

        return `
            <div class="admin-table-container" style="background:#1e293b; border:1px solid #334; border-radius:12px; overflow:hidden;">
                <div class="admin-table-header" style="padding:20px; border-bottom:1px solid #334;">
                    <h3 style="margin:0;"><i class="fas fa-shield-alt"></i> Bitácora de Auditoría</h3>
                    <button class="btn-admin-primary" onclick="RiverToast.info('Compilando histórico de auditoría.\\nEl reporte encriptado se descargará en unos momentos.')" style="background:#334"><i class="fas fa-download"></i> EXPORTAR LOGS</button>
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

    // Register on AdminDashboard
    AD.renderClientShipsView = renderClientShipsView;
    AD.renderOrdersView = renderOrdersView;
    AD.renderDashboardView = renderDashboardView;
    AD.renderFleetView = renderFleetView;
    AD.renderUsersView = renderUsersView;
    AD.renderTenantsView = renderTenantsView;
    AD.renderBillingView = renderBillingView;
    AD.renderAuditView = renderAuditView;
})();

