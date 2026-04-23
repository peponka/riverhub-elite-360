/* 
 * FLUVIAFLEET CREW MANAGER WRAPPER 
 */

const CrewModuleFluvia = (() => {
    const state = {
        crew: [],
        vessels: [],
        loading: false
    };

    const init = async () => {
        console.log("Módulo Tripulación (FLUVIAFLEETFleet) Iniciado.");
        await loadData();
    };

    const loadData = async () => {
        state.loading = true;
        const container = document.getElementById('crew-grid-container');
        if (container) container.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-sec); grid-column: 1/-1;"><i class="fas fa-circle-notch fa-spin fa-2x"></i><p style="margin-top:10px; font-family:var(--font-data);">Sincronizando Nómina...</p></div>';

        try {
            if (window.sb && window.sb.fetchMine) {
                let cRes = await window.sb.fetchMine('crew_members', '*');
                let vRes = await window.sb.fetchMine('fleet_assets', 'id, name');
                
                state.crew = (!cRes.error && cRes.data) ? cRes.data : getDemoCrew();
                state.vessels = (!vRes.error && vRes.data) ? vRes.data : getDemoAssets();
            } else {
                state.crew = getDemoCrew();
                state.vessels = getDemoAssets();
            }
        } catch(e) {
            console.warn("CrewModule: local fallback", e);
            state.crew = getDemoCrew();
            state.vessels = getDemoAssets();
        } finally {
            state.loading = false;
            renderCrewList();
        }
    };

    const getDemoCrew = () => [
        { id: '1', full_name: 'Cap. Juan Pérez', role: 'CAPITAN', doc_id: 'PN-88219', status: 'active', vessel_id: '1' },
        { id: '2', full_name: 'Marcos Riquelme', role: 'MARINERO', doc_id: 'PN-44122', status: 'active', vessel_id: '2' },
        { id: '3', full_name: 'David Ozuna', role: 'MECANICO', doc_id: 'PN-09123', status: 'leave', vessel_id: null },
        { id: '4', full_name: 'Esteban Lopez', role: 'PRACTICO', doc_id: 'PN-11223', status: 'medical', vessel_id: '1' }
    ];

    const getDemoAssets = () => [
        { id: '1', name: 'TB PARAGUAY 01' },
        { id: '2', name: 'R/M HERCULES' }
    ];

    const renderCrewList = () => {
        const container = document.getElementById('crew-grid-container');
        if (!container) return;

        if (state.crew.length === 0) {
            container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; border:1px dashed var(--border-color); color:var(--text-sec); border-radius:var(--radius-lg);">No hay tripulantes registrados.</div>`;
            return;
        }

        const resolveVessel = (vid) => {
            if(!vid) return 'EN BASE / SIN ASIGNAR';
            const f = state.vessels.find(v => v.id == vid);
            return f ? f.name : 'AIS TGT Oculto';
        };

        const html = state.crew.map(c => {
            const vesselName = resolveVessel(c.vessel_id);
            let stClass = 'st-active';
            let stText = 'ACTIVO';
            let aptoMed = 'VIGENTE';
            let aptoColor = 'var(--status-ok)';

            if (c.status === 'leave') { stClass = 'st-leave'; stText = 'FRANCO'; }
            if (c.status === 'medical') { stClass = 'st-medical'; stText = 'MÉDICO'; aptoMed = 'RESTRINGIDO'; aptoColor = 'var(--status-err)'; }

            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.full_name || 'NN')}&background=f8fafc&color=0f172a&bold=true`;

            return `
                <div class="crew-card-fluvia ${stClass}">
                    <div class="crew-card-strip"></div>
                    <div class="crew-header">
                        <img src="${avatarUrl}" class="crew-avatar" alt="avatar">
                        <div class="crew-info">
                            <h3 class="crew-name">${c.full_name}</h3>
                            <span class="crew-role">${c.role || 'TRIPULANTE'}</span>
                        </div>
                    </div>

                    <div class="crew-status-badge">
                        <i class="fa-solid fa-circle" style="font-size:6px;"></i> ${stText}
                    </div>

                    <div class="crew-box">
                        <div>
                            <span class="c-stat-label">EMBARCACIÓN</span>
                            <span class="c-stat-val"><i class="fa-solid fa-ship" style="color:var(--text-sec); font-size:0.8em;"></i> ${vesselName}</span>
                        </div>
                        <div>
                            <span class="c-stat-label">DOCUMENTO</span>
                            <span class="c-stat-val"><i class="fa-regular fa-id-card" style="color:var(--text-sec); font-size:0.8em;"></i> ${c.doc_id || 'N/A'}</span>
                        </div>
                    </div>

                    <div class="health-strip-fluvia">
                        <div class="hlt-label">
                            <span>CERT. MÉDICO</span>
                            <span style="color:${aptoColor};">${aptoMed}</span>
                        </div>
                        <div class="hlt-track"><div class="hlt-fill"></div></div>
                    </div>

                    <div class="crew-actions">
                        <button class="btn-crew-act" onclick="RiverToast.info('Visualizando expediente docs de ${c.full_name}', 'Expediente')"><i class="fa-solid fa-file-contract"></i> DOCS</button>
                        <button class="btn-crew-act primary" onclick="RiverToast.warning('Iniciando proceso de relevo para ${c.full_name}', 'Capitanía')"><i class="fa-solid fa-exchange-alt"></i> RELEVAR</button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    };

    return { init };
})();

window.CrewModule = CrewModuleFluvia;
