// admin-views-clients.js � Extracted from admin-dashboard.js
// Client management views, tabs, and modals
// Mixin: registers on AdminDashboard after load

(function() {
    const AD = window.AdminDashboard;
    if (!AD) { console.error('AdminDashboard not loaded'); return; }

    // --- CLIENT VIEWS (extracted from IIFE) ---

    function renderClientsView() {
        // Trigger fetch in background
        setTimeout(AD.loadClientsData, 100);

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
    function viewClientDetails(id, name, activeTab = 'general') {
        // Debug
        void('Viewing details:', id, name, activeTab);

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
                         <button class="btn-admin-primary" onclick="RiverToast.info('El documento PDF se descargará automáticamente en instantes.', 'Generando Reporte')" style="background:#334;"><i class="fas fa-download"></i> REPORTE</button>
                        <button class="btn-admin-primary" onclick="RiverToast.info('Cliente suspendido, bloqueando su acceso de red inmediatamente. (Modo Simulación)', 'Alerta del Sistema', 'fas fa-ban')" style="background:#ef4444;"><i class="fas fa-ban"></i> SUSPENDER</button>
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

    function renderClientGeneralTab(name) {
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

    function renderClientUsersTab(name) {
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

    function renderClientFleetTab(name) {
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

    function renderClientBillingTab(name) {
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
                     <button class="btn-icon-action" onclick="RiverToast.success('Iniciando descarga segura de la Factura de ${i.period}.', 'Exportando PDF')" style="background:#334; border:1px solid #475569; color:#fff; padding:8px; border-radius:6px;" data-tooltip="Descargar PDF"><i class="fas fa-file-pdf"></i></button>
                </div>
            </div>
        `).join('');

        return `
             <div style="display:flex; flex-direction:column; gap:15px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                     <h4 style="margin:0;">Historial de Facturación</h4>
                     <button class="btn-admin-primary" onclick="RiverToast.info('Verifique su carpeta de descargas en unos segundos.', 'Consolidando Estado de Cuenta')" style="background:#334; font-size:0.8rem;"><i class="fas fa-download"></i> ESTADO</button>
                </div>
                <div>
                    ${cards}
                </div>
            </div>
        `;
    };

    function renderClientAuditTab(name) {
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
    function submitNewClient = async () => {
        // Scope search to the modal container to ensure we get the visible input
        const container = document.getElementById('admin-modal-container');
        if (!container) return;

        const nameInput = container.querySelector('#new-client-name');
        const planInput = container.querySelector('#new-client-plan');
        const typeInput = container.querySelector('#new-client-type');

        const name = nameInput ? nameInput.value.trim() : '';
        const plan = planInput ? planInput.value : 'BASIC';
        const type = typeInput ? typeInput.value : 'AGRO';

        void("Submit Debug:", { name, plan, type });

        if (!name) {
            // Debug alert to help user understand what happened
            RiverToast.warning(`Error de Lectura: El campo nombre parece vacío para el sistema.\\n(Valor leído: "${name}")\\n\\nIntenta escribir de nuevo.`, "Datos Inválidos");
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
                    RiverToast.warning("Error de Caché de Supabase (Muy común al crear tablas nuevas).\\n\\nSOLUCIÓN RÁPIDA:\\n1. Ve a Supabase > Settings > API\\n2. Clickea en 'Reload Schema' o 'Refresh'.", "Fallo de Servidor");
                    throw error;
                }
                throw error;
            }

            RiverToast.success("¡Cliente Guardado en Supabase!", "Registro Completo");
            document.getElementById('admin-modal-container').innerHTML = '';

            // Reload list with a small delay to allow propagation
            setTimeout(AD.loadClientsData, 500);

        } catch (e) {
            console.error("Supabase Error:", e);
            RiverToast.error("Error de Base de Datos: " + e.message, "Fallo de Guardado");
            if (btn) {
                btn.innerHTML = 'REINTENTAR';
                btn.disabled = false;
            }
        }
    };

    function openNewClientModal() {
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

    function openNewUserModal(clientName) {
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
                        <button class="btn-admin-primary" onclick="RiverToast.success('Usuario creado exitosamente en el sistema de gestión interna.'); document.getElementById('admin-modal-container').innerHTML = ''">GUARDAR</button>
                    </div>
                </div>
            </div>
        `;
    };

    function openEditUserModal(userName) {
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
                        <button class="btn-admin-primary" onclick="RiverToast.success('Privilegios y estado del usuario actualizados correctamente.'); document.getElementById('admin-modal-container').innerHTML = ''">ACTUALIZAR</button>
                    </div>
                </div>
            </div>
        `;
    };

    function openGlobalTrackingModal(shipName, location) {
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

    function openNewTenantModal() {
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
                        <button class="btn-admin-primary" onclick="RiverToast.info('Empresa Registrada (Simulación)'); document.getElementById('admin-modal-container').innerHTML = ''">REGISTRAR</button>
                    </div>
                </div>
            </div>
        `;
    };

    function openNewOrderModal() {
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
                        <button class="btn-admin-primary" onclick="RiverToast.info('Orden Generada (Simulación)'); document.getElementById('admin-modal-container').innerHTML = ''">CREAR ORDEN</button>
                    </div>
                </div>
            </div>
        `;
    };

    function openNewFleetModal() {
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
                        <button class="btn-admin-primary" onclick="RiverToast.success('Activo Creado con Éxito'); document.getElementById('admin-modal-container').innerHTML = ''">GUARDAR ACTIVO</button>
                    </div>
                </div>
            </div>
        `;
    };

    function openNewUserModalGlobal() {
        openNewUserModal('Global');
    };

    function openLinkShipModal(clientName) {
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
                        <button class="btn-admin-primary" onclick="RiverToast.success('Barco Vinculado'); document.getElementById('admin-modal-container').innerHTML = ''">VINCULAR</button>
                    </div>
                </div>
            </div>
        `;
    };

    // Register on AdminDashboard
    AD.renderClientsView = renderClientsView;
    AD.viewClientDetails = viewClientDetails;
    AD.openNewClientModal = openNewClientModal;
    AD.submitNewClient = submitNewClient;
    AD.openNewUserModal = openNewUserModal;
    AD.openNewUserModalGlobal = openNewUserModalGlobal;
    AD.openEditUserModal = openEditUserModal;
    AD.openLinkShipModal = openLinkShipModal;
    AD.openGlobalTrackingModal = openGlobalTrackingModal;
    AD.openNewTenantModal = openNewTenantModal;
    AD.openNewOrderModal = openNewOrderModal;
    AD.openNewFleetModal = openNewFleetModal;
})();

