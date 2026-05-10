/*
 * FLEET MANAGER MODULE (FLUVIAFLEET STYLED)
 */

const FleetManagerFluvia = (() => {

    let vessels = [];

    const init = () => {
        void("⚓ FleetManager (FLUVIAFLEETFleet): Iniciando...");
        const content = document.getElementById('flota-grid-container');
        if (!content) return;

        content.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding-top:40px;">
                <i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--text-sec); margin-bottom:15px;"></i>
                <p style="color:var(--text-main); font-family:var(--font-data);">Sincronizando Flota...</p>
            </div>
        `;
        loadData();
    };

    const loadData = async () => {
        try {
            if (window.sb && window.sb.fetchMine) {
                const { data, error } = await window.sb.fetchMine('vessels', '*');
                if (!error && data && data.length > 0) {
                    vessels = data;
                } else {
                    vessels = getDemoAssets();
                }
            } else {
                vessels = getDemoAssets();
            }
        } catch (e) {
            console.warn("FleetManager: Error de red, usando demo.", e);
            vessels = getDemoAssets();
        } finally {
            renderView();
            updateStats();
        }
    };

    const getDemoAssets = () => {
        return [
            { id: 1, name: 'TB PARAGUAY 01', type: 'REMOLCADOR', status: 'active', zone: 'ASUNCIÓN' },
            { id: 2, name: 'R/M HERCULES', type: 'REMOLCADOR', status: 'active', zone: 'CORRIENTES' },
            { id: 3, name: 'R/M CENTAURO', type: 'REMOLCADOR', status: 'maintenance', zone: 'TALLER' },
            { id: 4, name: 'B/G SOJA KING', type: 'BARCAZA GRANEL', status: 'transito', zone: 'KM 1400' },
            { id: 5, name: 'TQ ENERGY', type: 'BARCAZA TANQUE', status: 'active', zone: 'SAN LORENZO' }
        ];
    };

    const updateStats = () => {
        const total = vessels.length;
        const active = vessels.filter(v => v.status === 'active' || v.status === 'transito').length;
        const maint = vessels.filter(v => v.status === 'maintenance').length;
        
        const stTotal = document.getElementById('stat-total');
        const stActive = document.getElementById('stat-active');
        const stMaint = document.getElementById('stat-maint');

        if(stTotal) stTotal.innerText = total;
        if(stActive) stActive.innerText = active;
        if(stMaint) stMaint.innerText = maint;
    };

    const renderView = () => {
        const content = document.getElementById('flota-grid-container');
        if (!content) return;

        const gridHTML = vessels.map(v => {
            let statusText = 'OPERATIVO';
            let statusClass = 'active';

            if (v.status === 'maintenance') { statusClass = 'maintenance'; statusText = 'TALLER'; }
            if (v.status === 'transito') { statusClass = 'transito'; statusText = 'EN RUTA'; }

            return `
                <div class="flota-card">
                    <div class="flota-card-header">
                        <div class="flota-icon">
                            <i class="fa-solid fa-ship"></i>
                        </div>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    
                    <div class="flota-details">
                        <h3 class="flota-name">${v.name}</h3>
                        <span class="flota-type">${v.type || 'ACTIVO'}</span>
                    </div>
                    
                    <div class="flota-footer">
                        <span class="flota-zone"><i class="fa-solid fa-location-crosshairs"></i> ${v.zone || 'N/A'}</span>
                        <button class="btn-icon-round" onclick="if(window.RiverToast) RiverToast.info('Detalle del activo ${v.name}', 'Ficha de Activo')" title="Ver Ficha Técnica">
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        content.innerHTML = gridHTML;
    };

    return { init, loadData };
})();

window.FleetManager = FleetManagerFluvia;
