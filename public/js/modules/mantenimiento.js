const MaintenanceModule = (() => {
    let charts = {};
    let simulationInterval = null;
    let tasks = []; // Store fetched tasks

    const init = async () => {
        console.log("🛠️ Inicializando Módulo de Mantenimiento (Hybrid Elite)...");
        const container = document.getElementById('view-mantenimiento');
        if (!container) return;

        // Render Dashboard Structure (Hybrid: Vitals + Kanban)
        container.innerHTML = `
            <div class="maintenance-container">
                <!-- HEADER -->
                <div class="maintenance-controls">
                    <div class="nexus-title-group">
                        <div class="nexus-logo"><i class="fas fa-tools"></i></div>
                        <div class="nexus-text">
                            <h2>CONTROL DE MANTENIMIENTO</h2>
                            <div class="nexus-sub">MONITOREO EN TIEMPO REAL & GESTIÓN DE TAREAS</div>
                        </div>
                    </div>
                    
                    <div class="control-actions">
                        <button class="btn-apertura" onclick="MaintenanceModule.openCreateModal()">
                            <i class="fas fa-plus-circle"></i> NUEVA ORDEN
                        </button>
                    </div>
                </div>

                <!-- SECTION 1: VITALS (Charts) -->
                <div class="dashboard-grid compact-vitals">
                    <!-- Sincronoscopio -->
                    <div class="dash-card sincro-card">
                        <div class="card-title">SINCRONOSCOPIO (SIMULADO)</div>
                        <div class="chart-row">
                            <div class="chart-container-mini">
                                <div class="rpm-val-overlay green" id="rpm-stb">0 RPM</div>
                                <canvas id="chart-sincro-1"></canvas>
                                <div class="chart-label">ESTRIBOR</div>
                            </div>
                            <div class="chart-container-mini">
                                <div class="rpm-val-overlay yellow" id="rpm-port">0 RPM</div>
                                <canvas id="chart-sincro-2"></canvas>
                                <div class="chart-label">BABOR</div>
                            </div>
                        </div>
                    </div>

                    <!-- KPI Cards -->
                     <div class="dash-card kpi-card">
                        <div class="kpi-value" id="kpi-open">0</div>
                        <div class="kpi-label">ÓRDENES ABIERTAS</div>
                    </div>
                    <div class="dash-card kpi-card">
                        <div class="kpi-value warning" id="kpi-critical">0</div>
                        <div class="kpi-label">CRÍTICAS</div>
                    </div>
                </div>

                <!-- SECTION 2: KANBAN BOARD -->
                <div class="kanban-wrapper">
                    <h3>TABLERO DE ÓRDENES DE TRABAJO</h3>
                    <div class="kanban-board">
                        
                        <!-- Col 1: PENDING -->
                        <div class="kanban-column" id="col-pending" ondrop="MaintenanceModule.drop(event, 'pending')" ondragover="MaintenanceModule.allowDrop(event)">
                            <div class="col-header header-pending">
                                <span>PENDIENTE</span>
                                <span class="count-badge" id="count-pending">0</span>
                            </div>
                            <div class="task-list" id="list-pending">
                                <!-- Tasks go here -->
                            </div>
                        </div>

                        <!-- Col 2: IN PROGRESS -->
                        <div class="kanban-column" id="col-in-progress" ondrop="MaintenanceModule.drop(event, 'in_progress')" ondragover="MaintenanceModule.allowDrop(event)">
                            <div class="col-header header-progress">
                                <span>EN PROGRESO</span>
                                <span class="count-badge" id="count-in-progress">0</span>
                            </div>
                            <div class="task-list" id="list-in_progress">
                                <!-- Tasks go here -->
                            </div>
                        </div>

                        <!-- Col 3: COMPLETED -->
                        <div class="kanban-column" id="col-completed" ondrop="MaintenanceModule.drop(event, 'completed')" ondragover="MaintenanceModule.allowDrop(event)">
                            <div class="col-header header-completed">
                                <span>FINALIZADO</span>
                                <span class="count-badge" id="count-completed">0</span>
                            </div>
                            <div class="task-list" id="list-completed">
                                <!-- Tasks go here -->
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            <!-- MODAL CREATE -->
            <div id="modal-mnt-create" class="modal-overlay" style="display:none;">
                <div class="modal-card">
                    <div class="modal-header">
                        <h3><i class="fas fa-wrench"></i> NUEVA ORDEN DE TRABAJO</h3>
                        <button class="btn-close-modal" onclick="MaintenanceModule.closeCreateModal()" data-tooltip="Cerrar Reporte"><i class="fas fa-times"></i></button>
                    </div>
                    <form onsubmit="MaintenanceModule.handleCreate(event)">
                        <div class="modal-body">
                            <div class="input-group-modal">
                                <label>EMBARCACIÓN</label>
                                <select id="mnt-new-vessel" class="modal-input" required></select>
                            </div>
                            <div class="input-group-modal">
                                <label>PRIORIDAD</label>
                                <select id="mnt-new-priority" class="modal-input">
                                    <option value="medium">Media</option>
                                    <option value="high">Alta</option>
                                    <option value="critical">CRÍTICA (Detiene Op.)</option>
                                    <option value="low">Baja (Rutina)</option>
                                </select>
                            </div>
                            <div class="input-group-modal">
                                <label>DESCRIPCIÓN</label>
                                <textarea id="mnt-new-desc" class="modal-input" rows="3" required placeholder="Describa la falla o tarea..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn-cancel" onclick="MaintenanceModule.closeCreateModal()">CANCELAR</button>
                            <button type="submit" class="modal-purple-btn">CREAR ORDEN</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        await loadVessels();
        await loadTasks();
        initCharts();
    };

    // --- DATA LOADING ---
    const loadVessels = async () => {
        try {
            let res = await window.sb.fetchMine('fleet_assets', 'id, name');
            if (res.error) res = await window.sb.from('fleet_assets').select('id, name');
            
            const select = document.getElementById('mnt-new-vessel');
            if (select && res.data) {
                stateVessels = res.data; // Store for resolving in loadTasks
                select.innerHTML = res.data.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
            }
        } catch (e) { console.warn("MNT Error loading vessels", e); }
    };

    let stateVessels = [];

    const loadTasks = async () => {
        try {
            let { data, error } = await window.sb.fetchMine('maintenance_tasks', '*');
            
            if (error) {
                console.warn("fetchMine Error, fallback to normal select...", error);
                let res = await window.sb.from('maintenance_tasks')
                    .select('*')
                    .order('created_at', { ascending: false });
                data = res.data;
                error = res.error;
            }

            if (error) throw error;
            
            // Map vessels locally
            if (data) {
                 data.forEach(t => {
                     const fv = stateVessels.find(v => v.id === t.vessel_id);
                     if (fv) t.vessels = { name: fv.name };
                 });
            }

            tasks = data || [];
            renderBoard();
            updateKPIs();
        } catch (e) {
            console.error("MNT Error loading tasks:", e);
            if (e.message && e.message.includes("relation")) {
                console.warn("Table missing? Switching to Mock Mode");
                tasks = getMockTasks();
                renderBoard();
            }
        }
    };

    const renderBoard = () => {
        // Clear Lists
        ['pending', 'in_progress', 'completed'].forEach(s => {
            const el = document.getElementById(`list-${s}`);
            if (el) el.innerHTML = '';
        });

        const counts = { pending: 0, in_progress: 0, completed: 0 };

        tasks.forEach(task => {
            const status = mapStatus(task.status);
            const listId = `list-${status}`;
            const listEl = document.getElementById(listId);

            if (listEl) {
                counts[status]++;
                const card = createCard(task);
                listEl.appendChild(card);
            }
        });

        // Update Counts
        document.getElementById('count-pending').innerText = counts.pending;
        document.getElementById('count-in-progress').innerText = counts.in_progress;
        document.getElementById('count-completed').innerText = counts.completed;
    };

    const mapStatus = (s) => {
        if (!s) return 'pending';
        s = s.toLowerCase();
        if (s.includes('progress') || s.includes('ejecucion')) return 'in_progress';
        if (s.includes('done') || s.includes('complete') || s.includes('final')) return 'completed';
        return 'pending';
    };

    const createCard = (task) => {
        const div = document.createElement('div');
        div.className = `kanban-card priority-${task.priority || 'medium'}`;
        div.draggable = true;
        div.id = `task-${task.id}`;

        // Drag Data
        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData("text", task.id);
        });

        const vesselName = task.vessels ? task.vessels.name : 'N/A';
        const date = new Date(task.created_at).toLocaleDateString();

        div.innerHTML = `
            <div class="card-meta">
                <span class="vessel-tag"><i class="fas fa-ship"></i> ${vesselName}</span>
                <span class="date-tag">${date}</span>
            </div>
            <div class="card-desc">${task.description}</div>
            <div class="card-footer">
                <span class="prio-badge ${task.priority}">${task.priority}</span>
                ${task.assigned_to ? `<span class="assignee-avatar">${task.assigned_to.substr(0, 2)}</span>` : ''}
            </div>
        `;
        return div;
    };

    const updateKPIs = () => {
        const open = tasks.filter(t => t.status !== 'completed' && t.status !== 'done').length;
        const critical = tasks.filter(t => (t.priority === 'critical' || t.priority === 'high') && t.status !== 'completed').length;

        document.getElementById('kpi-open').innerText = open;
        document.getElementById('kpi-critical').innerText = critical;
    };

    // --- DRAG & DROP LOGIC ---
    const allowDrop = (ev) => ev.preventDefault();

    const drop = async (ev, newStatus) => {
        ev.preventDefault();
        const taskId = ev.dataTransfer.getData("text");

        // Optimistic UI Update
        const taskIndex = tasks.findIndex(t => t.id == taskId);
        if (taskIndex > -1) {
            tasks[taskIndex].status = newStatus;
            renderBoard(); // re-render immediately
            updateKPIs();

            try {
                // DB Update
                const { error } = await window.sb
                    .from('maintenance_tasks')
                    .update({ status: newStatus })
                    .eq('id', taskId);

                if (error) throw error;
            } catch (e) {
                console.error("Drop save failed:", e);
                RiverToast.error("Error al actualizar estado. Revierta cambio.", 'Fallo de Sincronización');
                loadTasks(); // Revert
            }
        }
    };


    // --- ACTIONS ---
    const handleCreate = async (e) => {
        e.preventDefault();
        const vesselId = document.getElementById('mnt-new-vessel').value;
        const desc = document.getElementById('mnt-new-desc').value;
        const prio = document.getElementById('mnt-new-priority').value;

        try {
            const user = window.AuthModule?.getCurrentUser();
            const companyId = user?.company_id || 'DEMO';
            const payload = {
                vessel_id: vesselId,
                description: desc,
                priority: prio,
                status: 'pending',
                task_type: 'corrective'
            };

            // Intento 1: Modo SaaS (con company_id)
            let { error } = await window.sb.from('maintenance_tasks').insert([{
                ...payload,
                company_id: companyId
            }]);

            // Si falla por columna desconocida (Schema Cache Error o BD desactualizada), probamos modo Legacy
            if (error && (error.message.includes("column") || error.message.includes("schema"))) {
                console.warn("⚠️ Falló inserción SaaS, reintentando modo Legacy (sin company_id)...");
                const retry = await window.sb.from('maintenance_tasks').insert([payload]);
                error = retry.error;
            }

            if (error) throw error;

            RiverToast.success("Orden creada exitosamente", "Operación Exitosa");
            closeCreateModal();
            loadTasks();

        } catch (err) {
            console.error(err);
            // Mock Fallback
            if (err.message && (err.message.includes("relation") || err.message.includes("fetch"))) {
                tasks.unshift({
                    id: 'temp-' + Date.now(),
                    description: desc,
                    priority: prio,
                    status: 'pending',
                    vessels: { name: 'Demo Vessel' },
                    created_at: new Date()
                });
                renderBoard();
                closeCreateModal();
                RiverToast.warning("Orden creada localmente. Se sincronizará al recuperar conexión.", "Modo Offline");
            } else {
                RiverToast.error("No se pudo crear la Orden: " + err.message, "Error");
            }
        }
    };

    const openCreateModal = () => document.getElementById('modal-mnt-create').style.display = 'flex';
    const closeCreateModal = () => document.getElementById('modal-mnt-create').style.display = 'none';

    // --- CHARTS (Keep them simple) ---
    const initCharts = () => {
        if (typeof Chart === 'undefined') return;

        // Simple Chart Setup (Reuse logic but cleaner)
        const setupChart = (id, color, min, max) => {
            const ctx = document.getElementById(id).getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 100);
            gradient.addColorStop(0, color + '33'); // 20% opacity
            gradient.addColorStop(1, color + '00');

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: Array(15).fill(''),
                    datasets: [{
                        data: Array.from({ length: 15 }, () => min + Math.random() * (max - min)),
                        borderColor: color,
                        backgroundColor: gradient,
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { x: { display: false }, y: { display: false } },
                    animation: false
                }
            });
            return chart;
        };

        charts.c1 = setupChart('chart-sincro-1', '#4ade80', 800, 850);
        charts.c2 = setupChart('chart-sincro-2', '#fbbf24', 780, 830);

        // Simulation Loop
        if (simulationInterval) clearInterval(simulationInterval);
        simulationInterval = setInterval(() => {
            if (document.getElementById('view-mantenimiento').style.display === 'none') return;

            [charts.c1, charts.c2].forEach(c => {
                const data = c.data.datasets[0].data;
                data.shift();
                data.push(800 + Math.random() * 50);
                c.update();
            });

            document.getElementById('rpm-stb').innerText = Math.round(charts.c1.data.datasets[0].data[14]) + " RPM";
            document.getElementById('rpm-port').innerText = Math.round(charts.c2.data.datasets[0].data[14]) + " RPM";
        }, 1000);
    };

    const getMockTasks = () => [];

    return { init, openCreateModal, closeCreateModal, handleCreate, allowDrop, drop };
})();

window.MaintenanceModule = MaintenanceModule;