// js/modules/monitoring.js

const monitoringLogic = (() => {
    // STATE
    const state = {
        geofences: [],
        alerts: [],
        safetyRules: []
    };

    const init = async () => {
        console.log("📡 Módulo de Monitoreo (Torre de Control) Iniciado");
        await loadGeofences();
        await loadSafetyRules();
        startAlertPolling();

        // If Map module is active, request it to draw geofences
        if (window.mapLogic && typeof window.mapLogic.drawGeofences === 'function') {
            window.mapLogic.drawGeofences(state.geofences);
        }
    };

    // --- DATA FETCHING ---
    const loadGeofences = async () => {
        if (!window.sb) return;
        const { data, error } = await window.sb.from('geofences').select('*');
        if (error) console.error("Error loading geofences", error);
        else state.geofences = data || [];
    };

    const loadSafetyRules = async () => {
        if (!window.sb) return;
        const { data, error } = await window.sb.from('safety_rules').select('*');
        if (error) console.error("Error loading safety rules", error);
        else state.safetyRules = data || [];
    };

    // --- ALERT SYSTEM ---
    const startAlertPolling = () => {
        // Poll for new alerts every 60s
        setInterval(() => {
            checkAlerts();
            checkDraftRules(); // Also check drafts
        }, 30000); // Faster polling for demo

        // Initial check
        setTimeout(() => {
            checkAlerts();
            checkDraftRules();
        }, 2000); // Small delay to let other modules load
    };

    const checkAlerts = async () => {
        if (!window.sb) return;

        // Fetch unread alerts
        const { data, error } = await window.sb.from('alerts')
            .select('*, vessel:assets(name)')
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error("Error checking alerts", error);
            return;
        }

        if (data && data.length > 0) {
            updateDashboardAlerts(data);
        }
    };

    const updateDashboardAlerts = (alerts) => {
        // 1. Update Badge
        const alertBadge = document.querySelector('.card-red .stat-val-big');
        if (alertBadge) {
            alertBadge.innerText = alerts.length.toString().padStart(2, '0');
        }

        // 2. Toast Notification (Robust)
        if (typeof alerts === 'object' && alerts.length > 0) {
            const lastAlert = alerts[0];
            // Simple console log for now to avoid toast spam
            console.log("⚠️ ALERTA:", lastAlert);
        }
    };

    // --- HYDROLOGY AUTOMATION ---
    const checkDraftRules = async () => {
        // 1. Get Active Vessels (Filter those with draft)
        let vessels = [];
        const { data } = await window.sb.from('fleet_assets').select('*').not('current_draft', 'is', null);
        vessels = data || [];

        // 2. Check each vessel against Geofences
        let draftAlerts = [];
        vessels.forEach(v => {
            // Check all geofences (Simulated intersection)
            state.geofences.forEach(geo => {
                // Logic: If (Draft + 0.5m) > MinDepth -> DANGER
                const safetyMargin = 0.5;
                if (v.current_draft + safetyMargin > geo.min_depth_required) {
                    draftAlerts.push({
                        type: 'HYDRO_RISK',
                        vessel: v.name,
                        loc: geo.name,
                        draft: v.current_draft,
                        depth: geo.min_depth_required
                    });
                }
            });
        });

        if (draftAlerts.length > 0) {
            console.warn("⚠️ RIESGO DE VARADURA DETECTADO:", draftAlerts);
            // Combine with DB alerts?
            updateDashboardAlerts(draftAlerts);
        }
    };

    // --- HYDROLOGY CHECKS ---
    const checkDraftSafety = (convoyDraft, locationDepth) => {
        const ukcRule = state.safetyRules.find(r => r.name.includes('UKC')) || { value: 0.5 };
        const margin = parseFloat(ukcRule.value);

        const safetyMargin = locationDepth - convoyDraft;

        if (safetyMargin < 0) return { safe: false, msg: 'VARADURA INMINENTE', color: 'red' };
        if (safetyMargin < margin) return { safe: false, msg: 'PELIGRO: BAJO UKC', color: 'orange' };
        return { safe: true, msg: 'NAVEGACIÓN SEGURA', color: 'green' };
    };

    // --- EXPORTS ---
    return {
        init,
        getGeofences: () => state.geofences,
        checkDraftSafety
    };
})();

window.MonitoringModule = monitoringLogic;
