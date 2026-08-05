// admin-views-clients.js � Extracted from admin-dashboard.js
// Client management views, tabs, and modals
// Mixin: registers on AdminDashboard after load

(function() {
    const AD = window.AdminDashboard;
    if (!AD) { console.error('AdminDashboard not loaded'); return; }

    function escC(v) {
        return String(v == null ? '' : v)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

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
                    if (typeof renderClientUsersTab === 'function') tabContent = renderClientUsersTab(id, name);
                    else console.error('renderClientUsersTab missing');
                    break;
                case 'fleet':
                    if (typeof renderClientFleetTab === 'function') tabContent = renderClientFleetTab(id, name);
                    else console.error('renderClientFleetTab missing');
                    break;
                case 'billing':
                    if (typeof renderClientBillingTab === 'function') tabContent = renderClientBillingTab(id, name);
                    else console.error('renderClientBillingTab missing');
                    break;
                case 'audit':
                    if (typeof renderClientAuditTab === 'function') tabContent = renderClientAuditTab(id, name);
                    else console.error('renderClientAuditTab missing');
                    break;
                case 'general':
                default:
                    if (typeof renderClientGeneralTab === 'function') tabContent = renderClientGeneralTab(id, name);
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

    // General REAL: lee companies (por id). Antes eran datos fijos
    // (RUC 8009281-2, "Roberto Gómez", plan "ENTERPRISE") iguales para
    // cualquier empresa que se abriera.
    function renderClientGeneralTab(id, name) {
        setTimeout(function () { loadClientGeneralTab(id); }, 0);
        return `
            <div id="client-general-container" style="display:flex; flex-direction:column; gap:20px;">
                <div style="text-align:center; padding:40px; color:#64748b;"><i class="fas fa-circle-notch fa-spin"></i> Cargando información de la empresa...</div>
            </div>
        `;
    };

    async function loadClientGeneralTab(id) {
        const cont = document.getElementById('client-general-container');
        if (!cont || !window.sb) return;
        try {
            const res = await Promise.all([
                window.sb.from('companies').select('*').eq('id', id).maybeSingle(),
                window.sb.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', id),
                window.sb.from('vessels').select('id', { count: 'exact', head: true }).eq('company_id', id)
            ]);
            const c = res[0].data;
            if (!c) { cont.innerHTML = '<div style="color:#ef4444; padding:20px;">Empresa no encontrada.</div>'; return; }
            const usuarios = res[1].count || 0;
            const buques = res[2].count || 0;
            const activa = c.is_active !== false && (c.status || 'active') === 'active';
            const plan = String(c.plan || c.plan_tier || '-').toUpperCase();
            const alta = c.created_at ? new Date(c.created_at).toLocaleDateString('es-AR') : '-';
            const trial = c.trial_ends_at ? new Date(c.trial_ends_at).toLocaleDateString('es-AR') : 'N/A';
            cont.innerHTML =
                '<div class="kpi-card" style="background:#1e293b; border:1px solid #334; margin:0;">'
                + '<h4 style="margin-top:0; color:#fff; border-bottom:1px solid #334; padding-bottom:10px;">Información Corporativa</h4>'
                + '<div style="color:#cbd5e1; font-size:0.9rem; line-height:1.8;">'
                + '<strong>Razón Social:</strong> ' + escC(c.name) + '<br>'
                + '<strong>Email de Contacto:</strong> ' + escC(c.contact_email || 'No cargado') + '<br>'
                + '<strong>Alta:</strong> ' + alta + '</div></div>'
                + '<div class="kpi-card" style="background:#1e293b; border:1px solid #334; margin:0;">'
                + '<h4 style="margin-top:0; color:#fff; border-bottom:1px solid #334; padding-bottom:10px;">Plan</h4>'
                + '<div style="color:#cbd5e1; font-size:0.9rem; line-height:1.8;">'
                + '<strong>Plan Actual:</strong> <span class="badge-plan">' + escC(plan) + '</span><br>'
                + '<strong>Estado:</strong> ' + (activa ? 'ACTIVA' : 'INACTIVA') + '<br>'
                + '<strong>Límite de Buques:</strong> ' + (c.max_vessels != null ? c.max_vessels : 'Sin límite') + '<br>'
                + '<strong>Fin de Trial:</strong> ' + trial + '</div></div>'
                + '<div class="kpi-card" style="background:#1e293b; border:1px solid #334; margin:0;">'
                + '<h4 style="margin-top:0; color:#fff; border-bottom:1px solid #334; padding-bottom:10px;">Resumen de Uso</h4>'
                + '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; text-align:center;">'
                + '<div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px;"><div style="font-size:1.5rem; color:#00e5ff; font-weight:700;">' + usuarios + '</div><div style="font-size:0.8rem; color:#94a3b8;">Usuarios</div></div>'
                + '<div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px;"><div style="font-size:1.5rem; color:#f59e0b; font-weight:700;">' + buques + '</div><div style="font-size:0.8rem; color:#94a3b8;">Barcos</div></div>'
                + '</div></div>';
        } catch (e) {
            console.error('loadClientGeneralTab:', e);
            cont.innerHTML = '<div style="color:#ef4444; padding:20px;">No se pudo cargar la información.</div>';
        }
    }

    // Usuarios REAL: lee profiles filtrados por company_id. Antes eran 4
    // personas inventadas ("Roberto Gómez", "Pedro A. Capitán") iguales para
    // cualquier empresa.
    function renderClientUsersTab(id, name) {
        setTimeout(function () { loadClientUsersTab(id, name); }, 0);
        return `
            <div id="client-users-container" style="display:flex; flex-direction:column; gap:15px;">
                <div style="text-align:center; padding:40px; color:#64748b;"><i class="fas fa-circle-notch fa-spin"></i> Cargando usuarios...</div>
            </div>
        `;
    };

    async function loadClientUsersTab(id, name) {
        const cont = document.getElementById('client-users-container');
        if (!cont || !window.sb) return;
        try {
            const r = await window.sb.from('profiles').select('id, full_name, email, role, is_active, last_login').eq('company_id', id).order('full_name');
            const users = r.data || [];
            const header = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">'
                + '<h4 style="margin:0;">Usuarios (' + users.length + ')</h4>'
                + '<button class="btn-admin-primary" onclick="AdminDashboard.openNewUserModal(\'' + escC(name).replace(/'/g, "\\'") + '\')" style="font-size:0.8rem;"><i class="fas fa-user-plus"></i> NUEVO</button></div>';
            if (!users.length) {
                cont.innerHTML = header + '<div style="color:#94a3b8; padding:20px;">Sin usuarios registrados para esta empresa.</div>';
                return;
            }
            const desde = function (iso) {
                if (!iso) return 'Nunca';
                const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
                if (isNaN(min)) return 'Nunca';
                if (min < 60) return min + ' min';
                if (min < 1440) return Math.floor(min / 60) + ' h';
                return Math.floor(min / 1440) + ' d';
            };
            cont.innerHTML = header + users.map(function (u) {
                const activo = u.is_active !== false;
                return '<div class="user-card" style="background:#1e293b; border:1px solid #334; padding:15px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">'
                    + '<div><div style="font-weight:bold; color:#fff;">' + escC(u.full_name || 'Sin nombre') + '</div>'
                    + '<div style="font-size:0.8rem; color:#94a3b8;">' + escC(u.role || 'sin rol') + ' &bull; ' + escC(u.email) + '</div>'
                    + '<div style="font-size:0.7rem; color:#64748b; margin-top:3px;">Último acceso: ' + desde(u.last_login) + '</div></div>'
                    + '<span class="status-badge ' + (activo ? 'badge-active' : 'badge-error') + '">' + (activo ? 'active' : 'inactive') + '</span></div>';
            }).join('');
        } catch (e) {
            console.error('loadClientUsersTab:', e);
            cont.innerHTML = '<div style="color:#ef4444; padding:20px;">No se pudieron cargar los usuarios.</div>';
        }
    }

    // Flota REAL: lee vessels filtrados por company_id. Antes eran 3 buques
    // inventados (M/V IGUAZU, TB TRITON) iguales para cualquier empresa.
    function renderClientFleetTab(id, name) {
        setTimeout(function () { loadClientFleetTab(id, name); }, 0);
        return `
            <div id="client-fleet-container" style="display:flex; flex-direction:column; gap:15px;">
                <div style="text-align:center; padding:40px; color:#64748b;"><i class="fas fa-circle-notch fa-spin"></i> Cargando flota...</div>
            </div>
        `;
    };

    async function loadClientFleetTab(id, name) {
        const cont = document.getElementById('client-fleet-container');
        if (!cont || !window.sb) return;
        try {
            const r = await window.sb.from('vessels').select('id, name, type, status, current_lat, current_lng').eq('company_id', id).order('name');
            const fleets = r.data || [];
            const header = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">'
                + '<h4 style="margin:0;">Flota Asignada (' + fleets.length + ')</h4>'
                + '<button class="btn-admin-primary" onclick="AdminDashboard.openLinkShipModal(\'' + escC(name).replace(/'/g, "\\'") + '\')" style="font-size:0.8rem;"><i class="fas fa-link"></i> VINCULAR</button></div>';
            if (!fleets.length) {
                cont.innerHTML = header + '<div style="color:#94a3b8; padding:20px;">Sin embarcaciones vinculadas a esta empresa.</div>';
                return;
            }
            cont.innerHTML = header + fleets.map(function (f) {
                const pos = (f.current_lat != null && f.current_lng != null) ? Number(f.current_lat).toFixed(3) + ', ' + Number(f.current_lng).toFixed(3) : 'Sin posición';
                const activo = String(f.status || '').toLowerCase().indexOf('activ') === 0;
                return '<div class="fleet-card" style="background:#1e293b; border:1px solid #334; padding:15px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">'
                    + '<div style="display:flex; align-items:center; gap:10px;">'
                    + '<div style="background:#00e5ff; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#000; font-size:0.8rem;"><i class="fas fa-ship"></i></div>'
                    + '<div><div style="font-weight:bold; color:#fff;">' + escC(f.name) + '</div><div style="font-size:0.8rem; color:#94a3b8;">' + escC(String(f.type || 'BUQUE').toUpperCase()) + '</div></div></div>'
                    + '<div style="text-align:right;"><span class="status-badge ' + (activo ? 'badge-active' : 'badge-warning') + '">' + escC(String(f.status || '-')) + '</span>'
                    + '<div style="font-size:0.75rem; color:#94a3b8; margin-top:5px;">' + pos + '</div></div></div>';
            }).join('');
        } catch (e) {
            console.error('loadClientFleetTab:', e);
            cont.innerHTML = '<div style="color:#ef4444; padding:20px;">No se pudo cargar la flota.</div>';
        }
    }

    // Facturacion REAL: lee payments filtrados por company_id. Antes eran 2
    // facturas fijas de "Suscripción Enterprise" de $2,500 iguales para
    // cualquier empresa.
    function renderClientBillingTab(id, name) {
        setTimeout(function () { loadClientBillingTab(id); }, 0);
        return `
            <div id="client-billing-container" style="display:flex; flex-direction:column; gap:15px;">
                <div style="text-align:center; padding:40px; color:#64748b;"><i class="fas fa-circle-notch fa-spin"></i> Cargando facturación...</div>
            </div>
        `;
    };

    async function loadClientBillingTab(id) {
        const cont = document.getElementById('client-billing-container');
        if (!cont || !window.sb) return;
        try {
            const r = await window.sb.from('payments').select('*').eq('company_id', id).order('created_at', { ascending: false });
            const pagos = r.data || [];
            const header = '<div style="display:flex; justify-content:space-between; align-items:center;"><h4 style="margin:0;">Historial de Facturación</h4></div>';
            if (!pagos.length) {
                cont.innerHTML = header + '<div style="color:#94a3b8; padding:20px;">Sin facturación registrada para esta empresa.</div>';
                return;
            }
            const badge = { completed: 'badge-active', pending: 'badge-warning', failed: 'badge-error', refunded: 'badge-info' };
            const texto = { completed: 'PAGADO', pending: 'PENDIENTE', failed: 'FALLIDO', refunded: 'REEMBOLSADO' };
            cont.innerHTML = header + pagos.map(function (p) {
                const fecha = p.paid_at || p.created_at;
                const fechaTxt = fecha ? new Date(fecha).toLocaleDateString('es-AR') : '-';
                return '<div class="invoice-card" style="background:#1e293b; border:1px solid #334; padding:15px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">'
                    + '<div><div style="font-weight:bold; color:#fff;">$' + Number(p.amount || 0).toLocaleString('es-AR') + ' ' + escC(p.currency || 'USD') + '</div>'
                    + '<div style="font-size:0.8rem; color:#94a3b8;">' + fechaTxt + (p.invoice_number ? (' &bull; ' + escC(p.invoice_number)) : '') + '</div></div>'
                    + '<span class="status-badge ' + (badge[p.status] || 'badge-info') + '">' + (texto[p.status] || escC(p.status)) + '</span></div>';
            }).join('');
        } catch (e) {
            console.error('loadClientBillingTab:', e);
            cont.innerHTML = '<div style="color:#ef4444; padding:20px;">No se pudo cargar la facturación.</div>';
        }
    }

    // Auditoria REAL: lee logs filtrados por company_id, cruzado con
    // profiles para el nombre del usuario. Antes eran 2 eventos fijos de
    // "Roberto Gómez" fechados 24/01, iguales para cualquier empresa.
    function renderClientAuditTab(id, name) {
        setTimeout(function () { loadClientAuditTab(id, name); }, 0);
        return `
            <div id="client-audit-container" class="admin-table-container" style="padding:0; overflow:hidden;">
                <div style="text-align:center; padding:40px; color:#64748b;"><i class="fas fa-circle-notch fa-spin"></i> Cargando auditoría...</div>
            </div>
        `;
    };

    async function loadClientAuditTab(id, name) {
        const cont = document.getElementById('client-audit-container');
        if (!cont || !window.sb) return;
        try {
            const res = await Promise.all([
                window.sb.from('logs').select('*').eq('company_id', id).order('created_at', { ascending: false }).limit(50),
                window.sb.from('profiles').select('id, full_name')
            ]);
            const logs = res[0].data || [];
            const nombres = {};
            (res[1].data || []).forEach(function (p) { nombres[p.id] = p.full_name; });
            const header = '<div class="admin-table-header" style="padding:15px;"><h4 style="margin:0;">Auditoría (' + escC(name) + ')</h4></div>';
            if (!logs.length) {
                cont.innerHTML = header + '<div style="color:#94a3b8; padding:20px;">Sin eventos de auditoría para esta empresa.</div>';
                return;
            }
            cont.innerHTML = header + '<div style="display:flex; flex-direction:column;">' + logs.map(function (l) {
                const fecha = l.created_at ? new Date(l.created_at).toLocaleString('es-AR') : '-';
                return '<div style="background:#1e293b; border-bottom:1px solid #334; padding:12px; display:flex; flex-direction:column; gap:5px;">'
                    + '<div style="display:flex; justify-content:space-between; align-items:center;">'
                    + '<span class="badge-plan" style="background:#334; color:#fff; font-size:0.65rem;">' + escC(String(l.action_type || 'EVENTO').toUpperCase()) + '</span>'
                    + '<span style="font-size:0.7rem; color:#64748b;">' + fecha + '</span></div>'
                    + '<div style="color:#e2e8f0; font-size:0.9rem;">' + escC(l.description || '') + '</div>'
                    + '<div style="font-size:0.75rem; color:#94a3b8;">Usuario: ' + escC(nombres[l.user_id] || 'Sistema') + '</div></div>';
            }).join('') + '</div>';
        } catch (e) {
            console.error('loadClientAuditTab:', e);
            cont.innerHTML = '<div style="color:#ef4444; padding:20px;">No se pudo cargar la auditoría.</div>';
        }
    }

    // Modal Logic
    async function submitNewClient() {
        // Scope search to the modal container to ensure we get the visible input
        const container = document.getElementById('admin-modal-container');
        if (!container) return;

        const nameInput = container.querySelector('#new-client-name');
        const planInput = container.querySelector('#new-client-plan');

        const name = nameInput ? nameInput.value.trim() : '';
        const plan = planInput ? planInput.value : 'BASIC';

        void("Submit Debug:", { name, plan });

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
            // "Empresas" son los tenants del SaaS -> tabla companies (no 'clients',
            // que es la lista de contactos comerciales de CADA tenant).
            const { error } = await window.sb
                .from('companies')
                .insert([{
                    name: name,
                    plan: plan,
                    plan_tier: plan,
                    status: 'active',
                    is_active: true
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

