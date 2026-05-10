/*
 * MANTENIMIENTO KANBAN MODULE (FLUVIAFLEET STYLED)
 */

const MaintenanceModuleFluvia = (() => {

    const state = {
        vessels: [
            { id: '1', name: 'TB PARAGUAY 01' },
            { id: '2', name: 'R/M HERCULES' },
            { id: '3', name: 'B/G SOJA KING' }
        ],
        tasks: [],
        charts: {},
        simInterval: null
    };

    const init = () => {
        void("🛠️ Mantenimiento (FLUVIAFLEETFleet) Iniciando...");
        loadDemoData();
        initCharts();
    };

    const loadDemoData = () => {
        state.tasks = [
            { id: 't1', vessel_id: '1', description: 'Revisión Inyectores Motor Estribor', priority: 'high', status: 'pending', created_at: new Date(Date.now() - 86400000).toISOString() },
            { id: 't2', vessel_id: '2', description: 'Falla en panel VHF de cabina', priority: 'medium', status: 'in_progress', created_at: new Date(Date.now() - 172800000).toISOString() },
            { id: 't3', vessel_id: '1', description: 'Rotura bomba de achique - Bodega 2', priority: 'critical', status: 'pending', created_at: new Date().toISOString() },
            { id: 't4', vessel_id: '3', description: 'Pintura y sellado menor cubierta', priority: 'low', status: 'completed', created_at: new Date(Date.now() - 400000000).toISOString() }
        ];
        renderBoard();
        updateKPIs();
    };

    const renderBoard = () => {
        ['pending', 'in_progress', 'completed'].forEach(s => {
            const list = document.getElementById(`list-${s}`);
            if (list) list.innerHTML = '';
        });

        const counts = { pending: 0, in_progress: 0, completed: 0 };

        state.tasks.forEach(task => {
            const st = task.status;
            counts[st]++;
            
            const list = document.getElementById(`list-${st}`);
            if (list) {
                const vessel = state.vessels.find(v => v.id === task.vessel_id) || { name: 'N/A' };
                const date = new Date(task.created_at).toLocaleDateString('es-ES');
                
                const card = document.createElement('div');
                card.className = `kb-task prio-${task.priority}`;
                card.draggable = true;
                
                card.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData("text", task.id);
                    card.style.opacity = '0.5';
                });
                card.addEventListener('dragend', () => {
                    card.style.opacity = '1';
                    // clear hover classes
                    document.querySelectorAll('.kb-column').forEach(c => c.classList.remove('drag-hover'));
                });

                card.innerHTML = `
                    <div class="kb-meta">
                        <span><i class="fa-solid fa-ship" style="color:var(--text-sec); margin-right:4px;"></i> ${vessel.name}</span>
                        <span>${date}</span>
                    </div>
                    <div class="kb-desc">${task.description}</div>
                    <div class="kb-footer">
                        <span class="kb-prio-tag">${task.priority}</span>
                    </div>
                `;
                list.appendChild(card);
            }
        });

        document.getElementById('c-pending').innerText = counts.pending;
        document.getElementById('c-prog').innerText = counts.in_progress;
        document.getElementById('c-comp').innerText = counts.completed;
    };

    const updateKPIs = () => {
        const open = state.tasks.filter(t => t.status !== 'completed').length;
        const crit = state.tasks.filter(t => t.status !== 'completed' && (t.priority === 'critical' || t.priority === 'high')).length;
        
        const openEl = document.getElementById('kpi-open');
        const critEl = document.getElementById('kpi-crit');
        
        if (openEl) openEl.innerText = open;
        if (critEl) critEl.innerText = crit;
    };

    // --- DRAG & DROP ---
    const allowDrop = (e) => {
        e.preventDefault();
    };
    
    const dragEnter = (e) => {
        e.currentTarget.classList.add('drag-hover');
    };
    
    const dragLeave = (e) => {
        e.currentTarget.classList.remove('drag-hover');
    };

    const drop = (e, newStatus) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-hover');
        const taskId = e.dataTransfer.getData("text");
        
        const tIndex = state.tasks.findIndex(t => t.id === taskId);
        if (tIndex > -1) {
            state.tasks[tIndex].status = newStatus;
            renderBoard();
            updateKPIs();
            if(window.RiverToast) window.RiverToast.success(`Tarea movida a ${newStatus.toUpperCase()}`);
        }
    };

    // --- MODAL ---
    const openCreateModal = () => {
        const existing = document.getElementById('modal-mnt-fluvia');
        if (existing) existing.remove();

        const opts = state.vessels.map(v => `<option value="${v.id}">${v.name}</option>`).join('');

        const modalHTML = `
        <div id="modal-mnt-fluvia" class="modal-overlay-fluvia">
            <div class="modal-content-fluvia">
                <h3><i class="fa-solid fa-wrench" style="color:var(--text-sec);"></i> Nueva Orden de Trabajo</h3>
                
                <div class="form-group-fluvia">
                    <label>Embarcación</label>
                    <select id="mnt-vessel" class="input-fluvia">${opts}</select>
                </div>
                
                <div class="form-group-fluvia">
                    <label>Nivel de Prioridad</label>
                    <select id="mnt-prio" class="input-fluvia">
                        <option value="low">Rutina (Baja)</option>
                        <option value="medium" selected>Normal (Media)</option>
                        <option value="high">Urgente (Alta)</option>
                        <option value="critical">CRÍTICA (Detiene Operación)</option>
                    </select>
                </div>

                <div class="form-group-fluvia">
                    <label>Descripción de Falla o Tarea</label>
                    <textarea id="mnt-desc" class="input-fluvia" rows="3" placeholder="Detalle técnico..."></textarea>
                </div>

                <div class="modal-footer-fluvia">
                    <button class="btn-outline" onclick="document.getElementById('modal-mnt-fluvia').remove()">Cancelar</button>
                    <button class="btn-primary" onclick="MaintenanceModuleFluvia.submitTask()">Generar Orden</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    };

    const submitTask = () => {
        const v = document.getElementById('mnt-vessel').value;
        const p = document.getElementById('mnt-prio').value;
        const d = document.getElementById('mnt-desc').value;

        if (!d.trim()) {
            if(window.RiverToast) window.RiverToast.warning("Ingrese una descripción.");
            return;
        }

        state.tasks.unshift({
            id: 't' + Date.now(),
            vessel_id: v,
            priority: p,
            description: d,
            status: 'pending',
            created_at: new Date().toISOString()
        });

        document.getElementById('modal-mnt-fluvia').remove();
        if(window.RiverToast) window.RiverToast.success("Orden de trabajo generada correctamente.");
        
        renderBoard();
        updateKPIs();
    };

    // --- CHARTS (Sincronoscopio Fake) ---
    const initCharts = () => {
        if (typeof Chart === 'undefined') return;

        const setupChart = (id, color) => {
            const ctx = document.getElementById(id).getContext('2d');
            return new Chart(ctx, {
                type: 'line',
                data: {
                    labels: Array(15).fill(''),
                    datasets: [{
                        data: Array.from({length: 15}, () => 800 + Math.random() * 20),
                        borderColor: color,
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { x: { display: false }, y: { display: false, min: 780, max: 850 } },
                    animation: false
                }
            });
        };

        state.charts.c1 = setupChart('chart-sincro-1', '#10b981'); // stb
        state.charts.c2 = setupChart('chart-sincro-2', '#0ea5e9'); // port

        if (state.simInterval) clearInterval(state.simInterval);
        state.simInterval = setInterval(() => {
            [state.charts.c1, state.charts.c2].forEach(c => {
                const data = c.data.datasets[0].data;
                data.shift();
                data.push(800 + Math.random() * 30);
                c.update();
            });

            const v1 = Math.round(state.charts.c1.data.datasets[0].data[14]);
            const v2 = Math.round(state.charts.c2.data.datasets[0].data[14]);
            document.getElementById('rpm-stb').innerText = `${v1} RPM`;
            document.getElementById('rpm-port').innerText = `${v2} RPM`;
        }, 1000);
    };

    return { init, openCreateModal, submitTask, allowDrop, dragEnter, dragLeave, drop };
})();

window.MaintenanceModuleFluvia = MaintenanceModuleFluvia;
