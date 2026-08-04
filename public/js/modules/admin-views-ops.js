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

    // Flota REAL: lee la tabla vessels. Antes eran 5 buques escritos a mano
    // (R/M HERCULES, B-2045, R/M ORION...) con estados y ubicaciones fijas,
    // mientras la base ya tenia 15 embarcaciones reales.
    function renderFleetView() {
        setTimeout(loadFleetAdminData, 0);
        const fleets = [];

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
                 <div class="fleet-grid" id="fleet-admin-grid">
                    ${cards}
                    <div style="color:var(--text-muted); padding:20px;">Cargando flota...</div>
                </div>
            </div>
        `;
    };

    // Usuarios REALES: profiles + su empresa. Antes eran 5 personas inventadas
    // ("Juan Perez", "Ana Gomez"...) con empresas que no existen.
    function renderUsersView() {
        setTimeout(loadUsersAdminData, 0);
        const users = [];

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
                 <div id="users-admin-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
                    ${cards}
                    <div style="color:#94a3b8; padding:20px;">Cargando usuarios...</div>
                </div>
            </div>
        `;
    };

    async function loadUsersAdminData() {
        const grid = document.getElementById('users-admin-grid');
        if (!grid || !window.sb) return;
        try {
            const res = await Promise.all([
                window.sb.from('profiles').select('id, full_name, email, role, is_active, last_login, company_id'),
                window.sb.from('companies').select('id, name')
            ]);
            const usuarios = res[0].data || [];
            const empresas = {};
            (res[1].data || []).forEach(function (c) { empresas[c.id] = c.name; });
            if (!usuarios.length) {
                grid.innerHTML = '<div style="color:#94a3b8; padding:20px;">Sin usuarios registrados.</div>';
                return;
            }
            const iniciales = function (n, e) {
                const base = (n || e || '?').trim();
                const p = base.split(/[\s@.]+/).filter(Boolean);
                return ((p[0] || '?')[0] + (p[1] ? p[1][0] : '')).toUpperCase();
            };
            const desde = function (iso) {
                if (!iso) return 'Nunca';
                const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
                if (isNaN(min)) return 'Sin dato';
                if (min < 60) return min + ' min';
                if (min < 1440) return Math.floor(min / 60) + ' h';
                return Math.floor(min / 1440) + ' d';
            };
            grid.innerHTML = usuarios.map(function (u) {
                const nombre = u.full_name || u.email || 'Sin nombre';
                const activo = u.is_active !== false;
                return '<div style="background:#1e293b; border:1px solid #334; border-radius:12px; padding:15px; display:flex; flex-direction:column; gap:10px;">'
                    + '<div style="display:flex; justify-content:space-between; align-items:center;">'
                    + '<div style="display:flex; align-items:center; gap:10px;">'
                    + '<div class="admin-avatar" style="width:35px; height:35px; font-size:0.8em;">' + escB(iniciales(u.full_name, u.email)) + '</div>'
                    + '<div><h4 style="margin:0; color:#fff; font-size:1rem;">' + escB(nombre) + '</h4>'
                    + '<div style="font-size:0.75rem; color:#94a3b8;">' + escB(u.role || 'sin rol') + '</div></div></div>'
                    + '<span class="status-badge ' + (activo ? 'badge-active' : 'badge-error') + '">' + (activo ? 'ACTIVO' : 'INACTIVO') + '</span></div>'
                    + '<div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#cbd5e1; border-top:1px solid #334; padding-top:10px;">'
                    + '<span>' + escB(empresas[u.company_id] || 'Sin empresa') + '</span>'
                    + '<span style="color:#64748b;">' + desde(u.last_login) + '</span></div></div>';
            }).join('');
        } catch (e) {
            console.error('loadUsersAdminData:', e);
            grid.innerHTML = '<div style="color:#ef4444; padding:20px;">No se pudieron cargar los usuarios.</div>';
        }
    }

    // Empresas REALES: companies + conteo real de usuarios por empresa.
    // Antes eran 4 empresas inventadas con cantidades de usuarios ficticias.
    function renderTenantsView() {
        setTimeout(loadTenantsAdminData, 0);
        const tenants = [];

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
                 <div id="tenants-admin-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
                    ${cards}
                    <div style="color:#94a3b8; padding:20px;">Cargando empresas...</div>
                </div>
            </div>
        `;
    };

    async function loadTenantsAdminData() {
        const grid = document.getElementById('tenants-admin-grid');
        if (!grid || !window.sb) return;
        try {
            const res = await Promise.all([
                window.sb.from('companies').select('id, name, plan, plan_tier, status, is_active, max_vessels'),
                window.sb.from('profiles').select('company_id'),
                window.sb.from('vessels').select('company_id')
            ]);
            const empresas = res[0].data || [];
            if (!empresas.length) {
                grid.innerHTML = '<div style="color:#94a3b8; padding:20px;">Sin empresas registradas.</div>';
                return;
            }
            // Conteos reales, no numeros escritos a mano
            const porEmpresaUsr = {}, porEmpresaBuq = {};
            (res[1].data || []).forEach(function (p) { if (p.company_id) porEmpresaUsr[p.company_id] = (porEmpresaUsr[p.company_id] || 0) + 1; });
            (res[2].data || []).forEach(function (v) { if (v.company_id) porEmpresaBuq[v.company_id] = (porEmpresaBuq[v.company_id] || 0) + 1; });

            grid.innerHTML = empresas.map(function (t) {
                const activa = t.is_active !== false && (t.status || 'active') === 'active';
                const usuarios = porEmpresaUsr[t.id] || 0;
                const buques = porEmpresaBuq[t.id] || 0;
                return '<div style="background:#1e293b; border:1px solid #334; border-radius:12px; padding:15px; display:flex; flex-direction:column; gap:10px;">'
                    + '<div style="display:flex; justify-content:space-between; align-items:center;">'
                    + '<h3 style="margin:0; color:#fff; font-size:1.1rem;">' + escB(t.name) + '</h3>'
                    + '<span class="badge-plan">' + escB(String(t.plan || t.plan_tier || '-').toUpperCase()) + '</span></div>'
                    + '<div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; color:#94a3b8;">'
                    + '<span><i class="fas fa-users"></i> ' + usuarios + ' usuario' + (usuarios === 1 ? '' : 's') + '</span>'
                    + '<span class="status-badge ' + (activa ? 'badge-active' : 'badge-warning') + '">' + (activa ? 'ACTIVA' : 'INACTIVA') + '</span></div>'
                    + '<div style="font-size:0.8rem; color:#64748b;"><i class="fas fa-ship"></i> ' + buques + ' embarcacion' + (buques === 1 ? '' : 'es') + '</div></div>';
            }).join('');
        } catch (e) {
            console.error('loadTenantsAdminData:', e);
            grid.innerHTML = '<div style="color:#ef4444; padding:20px;">No se pudieron cargar las empresas.</div>';
        }
    }

    // Facturacion REAL: lee subscriptions + payments + companies.
    // Antes eran 4 facturas escritas a mano con clientes que NO existen
    // ("Naviera del Sur S.A.", "Logistica Yhaguy"). Las tablas ya existian
    // pero estaban vacias: se sembraron con el catalogo de planes real del
    // producto (ver sql/SEED_BILLING.sql).
    //
    // El render es sincrono (contentArea.innerHTML = render()), asi que se
    // devuelve el cascaron y se rellena cuando llegan los datos.
    function renderBillingView() {
        setTimeout(loadBillingData, 0);
        const invoices = [];

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
            <div id="billing-kpis" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:20px; margin-bottom:30px;" class="kpi-grid">
                <div class="kpi-card" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border:1px solid #334155;">
                    <div class="kpi-title">MRR (INGRESO MENSUAL)</div>
                    <div class="kpi-value" style="color:#10b981;">...</div>
                    <div class="kpi-trend"><span style="color:#94a3b8;">Cargando</span></div>
                </div>
                <div class="kpi-card" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border:1px solid #334155;">
                    <div class="kpi-title">SUSCRIPCIONES ACTIVAS</div>
                    <div class="kpi-value" style="color:#3b82f6;">...</div>
                    <div class="kpi-trend"><span style="color:#94a3b8;"></span></div>
                </div>
                <div class="kpi-card" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border:1px solid #334155;">
                    <div class="kpi-title">COBRADO</div>
                    <div class="kpi-value" style="color:#f59e0b;">...</div>
                    <div class="kpi-trend"><span style="color:#94a3b8;"></span></div>
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
                <div id="billing-cards" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
                    ${cards}
                    <div style="color:#94a3b8; padding:20px;">Cargando facturacion...</div>
                </div>
            </div>
        `;
    };

    async function loadFleetAdminData() {
        const grid = document.getElementById('fleet-admin-grid');
        if (!grid || !window.sb) return;
        try {
            const r = await window.sb.from('vessels')
                .select('id, name, type, status, current_lat, current_lng, last_position_update')
                .order('name');
            const buques = r.data || [];
            if (!buques.length) {
                grid.innerHTML = '<div style="color:var(--text-muted); padding:20px;">Sin embarcaciones registradas.</div>';
                return;
            }
            // La base guarda los estados en espanol ('Activo', 'Mantenimiento').
            const clase = function (st) {
                const s = String(st || '').toLowerCase();
                if (s.indexOf('activ') === 0) return 'active';
                if (s.indexOf('mantenim') === 0 || s.indexOf('mainten') === 0) return 'inactive';
                return 'pending';
            };
            const desde = function (iso) {
                if (!iso) return 'Sin dato';
                const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
                if (isNaN(min)) return 'Sin dato';
                if (min < 60) return min + ' min';
                if (min < 1440) return Math.floor(min / 60) + ' h';
                return Math.floor(min / 1440) + ' d';
            };
            grid.innerHTML = buques.map(function (v) {
                const pos = (v.current_lat != null && v.current_lng != null)
                    ? Number(v.current_lat).toFixed(3) + ', ' + Number(v.current_lng).toFixed(3)
                    : 'Sin posicion';
                return '<div class="fleet-card" data-status="' + clase(v.status) + '">'
                    + '<div class="fleet-card-header"><h3 class="fleet-card-title">' + escB(v.name) + '</h3>'
                    + '<span class="fleet-badge">' + escB(String(v.type || 'BUQUE').toUpperCase()) + '</span></div>'
                    + '<div class="fleet-card-body">'
                    + '<div class="fleet-info-row"><span>Estado:</span>'
                    + '<span class="status-badge ' + clase(v.status) + '">' + escB(String(v.status || '-').toUpperCase()) + '</span></div>'
                    + '<div class="fleet-info-row"><span><i class="fas fa-map-marker-alt" style="color:var(--neon-gold)"></i> Posicion:</span>'
                    + '<span class="fleet-info-val">' + pos + '</span></div>'
                    + '<div class="fleet-info-row"><span><i class="fas fa-clock"></i> Actualizado:</span>'
                    + '<span class="fleet-info-val">' + desde(v.last_position_update) + '</span></div>'
                    + '</div></div>';
            }).join('');
        } catch (e) {
            console.error('loadFleetAdminData:', e);
            grid.innerHTML = '<div style="color:#ef4444; padding:20px;">No se pudo cargar la flota.</div>';
        }
    }

    function billingKpi(titulo, valor, color, sub) {
        return '<div class="kpi-card" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border:1px solid #334155;">'
            + '<div class="kpi-title">' + titulo + '</div>'
            + '<div class="kpi-value" style="color:' + color + ';">' + valor + '</div>'
            + '<div class="kpi-trend"><span style="color:#94a3b8;">' + (sub || '') + '</span></div></div>';
    }

    function escB(v) {
        return String(v == null ? '' : v)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    async function loadBillingData() {
        const cont = document.getElementById('billing-cards');
        const kpis = document.getElementById('billing-kpis');
        if (!cont || !window.sb) return;
        try {
            const res = await Promise.all([
                window.sb.from('subscriptions').select('*'),
                window.sb.from('payments').select('*').order('created_at', { ascending: false }).limit(60),
                window.sb.from('companies').select('id, name')
            ]);
            const subs = res[0].data || [];
            const pagos = res[1].data || [];
            const empresas = {};
            (res[2].data || []).forEach(function (c) { empresas[c.id] = c.name; });

            const activas = subs.filter(function (s) { return s.status === 'active'; });
            const mrr = activas.reduce(function (a, s) { return a + Number(s.price_usd || 0); }, 0);
            const cobrado = pagos.filter(function (p) { return p.status === 'completed'; })
                                 .reduce(function (a, p) { return a + Number(p.amount || 0); }, 0);
            const pendiente = pagos.filter(function (p) { return p.status === 'pending'; })
                                   .reduce(function (a, p) { return a + Number(p.amount || 0); }, 0);

            if (kpis) {
                kpis.innerHTML =
                    billingKpi('MRR (INGRESO MENSUAL)', '$' + mrr.toLocaleString('es-AR'), '#10b981', activas.length + ' suscripciones activas') +
                    billingKpi('SUSCRIPCIONES ACTIVAS', String(activas.length), '#3b82f6', subs.length + ' en total') +
                    billingKpi('COBRADO', '$' + cobrado.toLocaleString('es-AR'), '#f59e0b', '$' + pendiente.toLocaleString('es-AR') + ' pendiente');
            }

            if (!pagos.length) {
                cont.innerHTML = '<div style="color:#94a3b8; padding:20px;">Sin facturacion registrada.</div>';
                return;
            }

            const badge = { completed: 'badge-active', pending: 'badge-warning', failed: 'badge-error', refunded: 'badge-info' };
            const texto = { completed: 'PAGADO', pending: 'PENDIENTE', failed: 'FALLIDO', refunded: 'REEMBOLSADO' };

            cont.innerHTML = pagos.map(function (p) {
                const sub = subs.filter(function (s) { return s.id === p.subscription_id; })[0];
                const nombre = empresas[p.company_id] || 'Empresa sin nombre';
                const plan = sub ? String(sub.plan_id).toUpperCase() : '-';
                const fecha = p.paid_at || p.created_at;
                const fechaTxt = fecha ? new Date(fecha).toLocaleDateString('es-AR') : '-';
                return '<div style="background:#1e293b; border:1px solid #334; border-radius:12px; padding:20px; display:flex; flex-direction:column; gap:15px;">'
                    + '<div style="display:flex; justify-content:space-between; align-items:flex-start;">'
                    + '<div><h3 style="margin:0; color:#fff; font-size:1rem;">' + escB(nombre) + '</h3>'
                    + '<span class="badge-plan" style="font-size:0.65rem; margin-top:5px; display:inline-block;">' + escB(plan) + '</span></div>'
                    + '<div style="text-align:right;"><span class="status-badge ' + (badge[p.status] || 'badge-info') + '">' + (texto[p.status] || escB(p.status)) + '</span>'
                    + '<div style="font-size:0.75rem; color:#94a3b8; margin-top:5px;">' + (p.status === 'completed' ? 'Pagado' : 'Emitido') + ': ' + fechaTxt + '</div></div></div>'
                    + '<div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #334; padding-top:10px;">'
                    + '<div style="font-size:1.2rem; font-weight:700; color:#fff;">$' + Number(p.amount || 0).toLocaleString('es-AR') + ' ' + escB(p.currency || 'USD') + '</div>'
                    + '<div style="font-size:0.7rem; color:#64748b;">' + escB(p.invoice_number || '') + '</div></div></div>';
            }).join('');
        } catch (e) {
            console.error('loadBillingData:', e);
            cont.innerHTML = '<div style="color:#ef4444; padding:20px;">No se pudo cargar la facturacion.</div>';
        }
    }

    // Auditoria REAL: lee la tabla logs (31 registros). Antes eran 5 eventos
    // inventados, todos fechados el 21/01, con actores que no existen.
    function renderAuditView() {
        setTimeout(loadAuditAdminData, 0);
        const logs = [];

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
                <div id="audit-admin-list" style="display:flex; flex-direction:column;">
                    ${cards}
                    <div style="color:#94a3b8; padding:20px;">Cargando bitacora...</div>
                 </div>
            </div>
        `;
    }
    // ^ Faltaba esta llave de cierre de renderAuditView (bug preexistente).
    // Sin ella el archivo entero era un SyntaxError, asi que NINGUNA de las
    // AD.render*View del final llegaba a registrarse y el panel de superadmin
    // no cargaba ninguna vista.

    async function loadAuditAdminData() {
        const cont = document.getElementById('audit-admin-list');
        if (!cont || !window.sb) return;
        try {
            const res = await Promise.all([
                window.sb.from('logs').select('id, action_type, description, created_at, user_id, vessel_id')
                    .order('created_at', { ascending: false }).limit(40),
                window.sb.from('profiles').select('id, full_name, email'),
                window.sb.from('vessels').select('id, name')
            ]);
            const registros = res[0].data || [];
            const personas = {}, buques = {};
            (res[1].data || []).forEach(function (p) { personas[p.id] = p.full_name || p.email; });
            (res[2].data || []).forEach(function (v) { buques[v.id] = v.name; });

            if (!registros.length) {
                cont.innerHTML = '<div style="color:#94a3b8; padding:20px;">Sin registros de auditoria.</div>';
                return;
            }
            const color = function (a) {
                const s = String(a || '').toLowerCase();
                if (s.indexOf('delete') >= 0 || s.indexOf('alert') >= 0) return '#ef4444';
                if (s.indexOf('create') >= 0 || s.indexOf('insert') >= 0) return '#10b981';
                return '#334155';
            };
            cont.innerHTML = registros.map(function (l) {
                const cuando = l.created_at ? new Date(l.created_at).toLocaleString('es-AR') : '-';
                const quien = personas[l.user_id] || 'Sistema';
                const objetivo = buques[l.vessel_id] || l.description || '-';
                return '<div style="background:#1e293b; border-bottom:1px solid #334; padding:15px; display:flex; flex-direction:column; gap:8px;">'
                    + '<div style="display:flex; justify-content:space-between; align-items:center;">'
                    + '<div style="display:flex; align-items:center; gap:10px;">'
                    + '<span class="badge-plan" style="background:' + color(l.action_type) + '; font-size:0.7rem;">' + escB(String(l.action_type || 'EVENTO').toUpperCase()) + '</span>'
                    + '<strong style="color:#e2e8f0;">' + escB(quien) + '</strong></div>'
                    + '<span style="font-family:monospace; color:#94a3b8; font-size:0.8rem;">' + cuando + '</span></div>'
                    + '<div style="font-size:0.9rem; color:#cbd5e1;">' + escB(objetivo) + '</div></div>';
            }).join('');
        } catch (e) {
            console.error('loadAuditAdminData:', e);
            cont.innerHTML = '<div style="color:#ef4444; padding:20px;">No se pudo cargar la bitacora.</div>';
        }
    }

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

