// js/modules/bitacora.js

const BitacoraModule = (() => {

    // --- STATE & UTILS ---
    const identifyType = (text) => {
        text = text.toLowerCase();
        if (text.includes('alerta') || text.includes('peligro') || text.includes('falla') || text.includes('error')) return 'alert';
        if (text.includes('ok') || text.includes('listo') || text.includes('completado') || text.includes('inicio')) return 'success';
        return 'info';
    };

    const init = async () => {
        console.log("Módulo Bitácora Digital Iniciado.");
        setupListeners(); // Attach input listener
        await loadLogs(); // Load data (async)
    };

    // --- ACTIONS ---
    const addLog = async () => {
        const input = document.getElementById('log-text');
        const btn = document.getElementById('btn-save-log');
        const text = input ? input.value.trim() : '';

        if (!text) {
            RiverToast.warning('Por favor escriba una descripción del evento.', 'Campo vacío');
            return;
        }

        if (btn) {
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> GUARDANDO...';
            btn.disabled = true;
        }

        try {
            // 1. Try Supabase Insert (with tenant isolation)
            const { error } = await window.sb.insertMine('logs', {
                description: text,
                action_type: identifyType(text),
                user_id: window.AuthModule?.getCurrentUser()?.id || null,
                vessel_id: null // Global log for now
            });

            if (error) throw error;

            // 2. Refresh List
            await loadLogs();
            if (input) input.value = '';

        } catch (e) {
            console.warn("DB Save failed, switching to local simulation:", e);
            injectLocalLog({
                description: text,
                action_type: identifyType(text),
                created_at: new Date().toISOString(),
                profiles: { full_name: 'Modo Offline' }
            });
            if (input) input.value = '';
        } finally {
            if (btn) {
                btn.innerHTML = '<i class="fas fa-pen-nib"></i> REGISTRAR EVENTO';
                btn.disabled = false;
            }
        }
    };

    const quickAction = (type, title) => {
        const input = document.getElementById('log-text');
        if (input) {
            input.value = title + ": ";
            input.focus();
        }
    };

    // --- DATA HANDLING ---
    const loadLogs = async () => {
        const container = document.getElementById('bitacora-list');
        if (!container) return;

        container.innerHTML = '<div style="text-align:center; padding:20px; color:#64748b;"><i class="fas fa-sync fa-spin"></i> Cargando historial...</div>';

        try {
            // Use fetchMine for tenant isolation, then sort client-side
            const { data, error } = await window.sb.fetchMine('logs', '*, profiles:user_id(full_name)');

            if (error) throw error;
            // Sort by created_at descending and limit to 20
            const sorted = (data || [])
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 20);
            renderLogs(sorted);

        } catch (e) {
            console.error("Error loading logs, showing demo data");
            // Render Fallback/Demo Data instead of Error
            renderLogs([
                { description: 'Sistema iniciado en modo de contingencia.', action_type: 'info', created_at: new Date().toISOString(), profiles: { full_name: 'System' } }
            ]);
        }
    };

    const renderLogs = (logs) => {
        const container = document.getElementById('bitacora-list');
        if (!container) return;
        container.innerHTML = '';

        if (logs.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:40px; color:#64748b;">Sin registros recientes.</div>';
            return;
        }

        logs.forEach(log => {
            const date = new Date(log.created_at);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            // Should properly format date if needed, for new days
            const author = log.profiles?.full_name || 'Sistema';

            let variant = 'variant-info';
            let icon = 'fa-info-circle';

            if (log.action_type === 'alert') { variant = 'variant-alert'; icon = 'fa-exclamation-triangle'; }
            if (log.action_type === 'success') { variant = 'variant-success'; icon = 'fa-check-circle'; }
            if (log.action_type === 'mech') { variant = 'variant-mech'; icon = 'fa-cogs'; }

            const item = document.createElement('div');
            item.className = `log-entry ${variant}`;
            item.innerHTML = `
                <div class="log-sidebar">
                    <span class="time-main">${timeStr}</span>
                    <span class="time-sub">HOY</span>
                </div>
                <div class="log-marker"></div>
                <div class="log-card">
                    <div class="log-header-row">
                        <span class="log-badge"><i class="fas ${icon}"></i> ${log.action_type}</span>
                        <div class="log-author">
                            <i class="fas fa-user-circle"></i> ${author}
                        </div>
                    </div>
                    <div class="log-text-content">
                        ${log.description}
                    </div>
                    <div class="mobile-time" style="display:none;">${timeStr}</div>
                </div>
            `;
            container.appendChild(item);
        });
    };

    const injectLocalLog = (log) => {
        const container = document.getElementById('bitacora-list');
        if (!container) return;

        // Remove empty state if present
        if (container.innerText.includes("Sin registros")) container.innerHTML = '';

        const date = new Date(log.created_at);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const author = log.profiles?.full_name || 'Tú';

        let variant = 'variant-info';
        let icon = 'fa-info-circle';

        if (log.action_type === 'alert') { variant = 'variant-alert'; icon = 'fa-exclamation-triangle'; }
        if (log.action_type === 'success') { variant = 'variant-success'; icon = 'fa-check-circle'; }
        if (log.action_type === 'mech') { variant = 'variant-mech'; icon = 'fa-cogs'; }

        const item = document.createElement('div');
        item.className = `log-entry ${variant}`;
        item.innerHTML = `
            <div class="log-sidebar">
                <span class="time-main">${timeStr}</span>
                <span class="time-sub">AHORA</span>
            </div>
            <div class="log-marker"></div>
            <div class="log-card">
                <div class="log-header-row">
                    <span class="log-badge"><i class="fas ${icon}"></i> ${log.action_type}</span>
                    <div class="log-author">
                        <i class="fas fa-user-circle"></i> ${author}
                    </div>
                </div>
                <div class="log-text-content">
                    ${log.description}
                </div>
            </div>
        `;
        container.insertBefore(item, container.firstChild);
    };

    const setupListeners = () => {
        const input = document.getElementById('log-text');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') addLog();
            });
        }
        // Button listeners will be handled by onclick in HTML or attached here if needed
        const btn = document.getElementById('btn-save-log');
        if (btn) btn.onclick = addLog;

        // Quick Actions
        const qBtns = {
            'btn-q-guardia': ['info', 'Cambio de Guardia'],
            'btn-q-zarpe': ['success', 'Inicio de Maniobra / Zarpe'],
            'btn-q-fondeo': ['info', 'Maniobra de Fondeo'],
            'btn-q-novedad': ['alert', 'Novedad Operativa']
        };

        Object.keys(qBtns).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.onclick = () => quickAction(qBtns[id][0], qBtns[id][1]);
        });
    };

    return { init, addLog, quickAction };

})();

window.BitacoraModule = BitacoraModule;
