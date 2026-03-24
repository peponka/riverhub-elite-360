// js/modules/viajes.js

const viajesLogic = (() => {
    // State
    const state = {
        trips: [],
        currentUser: null
    };

    // Old definitions removed


    const submitNewTrip = async () => {
        const vesselId = document.getElementById('new-trip-vessel').value;
        const origin = document.getElementById('new-trip-origin').value;
        const dest = document.getElementById('new-trip-dest').value;
        const cargo = document.getElementById('new-trip-cargo').value;
        const cargoTons = document.getElementById('new-trip-cargo-tons')?.value || 0;
        const eta = document.getElementById('new-trip-eta').value;

        if (!vesselId || !origin || !dest) {
            RiverToast.warning("Por favor complete los campos obligatorios.", "Requiere Atención");
            return;
        }

        const btn = document.querySelector('#modal-new-trip .modal-purple-btn');
        const originalText = btn.innerText;
        btn.innerText = "PROCESANDO...";
        btn.disabled = true;

        try {
            const user = window.AuthModule?.getCurrentUser();
            const companyId = user?.company_id || user?.company || 'DEMO_TENANT';

            // Insert into 'voyages' table via insertMine
            let { error } = await window.sb.insertMine('voyages', {
                vessel_id: vesselId,
                voyage_number: 'V-' + Date.now().toString().substr(-6), // Auto-gen ID
                origin_port: origin,
                destination_port: dest,
                cargo_type: cargo,
                total_cargo_tons: cargoTons,
                eta: eta ? new Date(eta).toISOString() : null,
                status: 'planned'
            });

            if (error) {
                 console.warn("insertMine failed, trying legacy insert...");
                 let res = await window.sb.from('voyages').insert([{
                    vessel_id: vesselId,
                    company_id: companyId,
                    voyage_number: 'V-' + Date.now().toString().substr(-6),
                    origin_port: origin,
                    destination_port: dest,
                    cargo_type: cargo,
                    total_cargo_tons: cargoTons,
                    eta: eta ? new Date(eta).toISOString() : null,
                    status: 'planned'
                 }]);
                 error = res.error;
            }

            if (error) throw error;

            RiverToast.success("Solicitud de viaje creada correctamente", "Éxito");
            document.getElementById('modal-new-trip').style.display = 'none';
            loadTrips();

        } catch (err) {
            console.error(err);
            // FALLBACK TO TRIPS (Legacy Table) IF VOYAGES FAIL
            if (err.message.includes('relation "voyages" does not exist')) {
                console.warn("Table voyages not found, trying legacy 'trips'...");
                // ... try legacy insert or show error
                RiverToast.error("Error crítico: La tabla de viajes no existe en BD. Contacte a soporte o refresque el esquema.", "Error DB");
            } else {
                RiverToast.error("Error al crear viaje: " + err.message, "Fallo en Guardado");
            }
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    };

    // --- DATA LOADING ---
    const loadTrips = async () => {
        const grid = document.querySelector('.trips-grid-new');
        if (grid) grid.innerHTML = '<div style="color:#fff; padding:20px; text-align:center;"><i class="fas fa-spinner fa-spin"></i> Cargando viajes y flota...</div>';

        try {
            // Fetch from 'voyages'
            let { data: tripsData, error: tripsError } = await window.sb
                .fetchMine('voyages', '*');

            if (tripsError) {
                console.warn("fetchMine failed on voyages, falling back...");
                let res = await window.sb.from('voyages').select('*').order('created_at', { ascending: false });
                tripsData = res.data;
                tripsError = res.error;
            }

            // If voyages is empty or errors, we might want to fail gracefully
            if (tripsError) throw tripsError;

            // Fetch fleet_assets
            let { data: vesselsData } = await window.sb
                .fetchMine('fleet_assets', 'id, name, type');
            if (!vesselsData) {
                let res = await window.sb.from('fleet_assets').select('id, name, type');
                vesselsData = res.data;
            }

            const vesselMap = {};
            if (vesselsData) vesselsData.forEach(v => vesselMap[v.id] = v);

            const combinedTrips = (tripsData || []).map(trip => {
                // Map DB fields to UI fields
                return {
                    id: trip.id,
                    origin: trip.origin_port,
                    destination: trip.destination_port,
                    cargo_type: trip.cargo_type,
                    total_cargo_tons: trip.total_cargo_tons || 0,
                    progress: 0, // Calculate based on status/dates if needed
                    status: trip.status,
                    estimated_arrival: trip.eta,
                    vessels: vesselMap[trip.vessel_id] || { name: 'Buque Desconocido', type: 'N/A' }
                };
            });

            state.trips = combinedTrips;
            renderTrips();

        } catch (err) {
            console.error("Error loading trips:", err);
            // Fallback for legacy 'trips' table if 'voyages' fails? 
            // Better to show empty state/error than mix tables.
            grid.innerHTML = '<div style="text-align:center; padding:40px;">Error al cargar datos.</div>';
        }
    };

    const getDemoTrips = () => {
        return [
            { id: 1, origin: 'Asunción', destination: 'Rosario', cargo_type: 'Soja', progress: 65, vessels: { name: 'TB PARAGUAY 01', type: 'Empujador' }, estimated_arrival: new Date() },
            { id: 2, origin: 'Villeta', destination: 'Palmira', cargo_type: 'Combustible', progress: 30, vessels: { name: 'R/M HERCULES', type: 'Remolcador' }, estimated_arrival: new Date() }
        ];
    };

    // --- REALTIME ---
    const subscribeToTrips = () => {
        // Placeholder for Realtime
        console.log("Viajes: Suscripción a cambios en tiempo real activa.");
        if (window.sb) {
            window.sb
                .channel('trips-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, payload => {
                    console.log('Cambio en viajes detectado:', payload);
                    loadTrips();
                })
                .subscribe();
        }
    };

    const renderTrips = (filter = 'all') => {
        const grid = document.querySelector('.trips-grid-new');
        if (!grid) return;

        grid.innerHTML = '';

        if (state.trips.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; color:#64748b; padding: 60px; background:rgba(15,23,42,0.5); border: 1px dashed #334155; border-radius:16px;">
                    <i class="fas fa-route" style="font-size: 3rem; margin-bottom: 20px; opacity:0.5;"></i>
                    <p style="letter-spacing:1px; font-weight:600;">NO SE ENCONTRARON ACTIVOS EN DISPATCH</p>
                    <button class="btn-new-request" onclick="ViajesModule.openModal()" style="margin:25px auto; width: fit-content;">
                        <i class="fas fa-plus"></i> CREAR NUEVO VIAJE
                    </button>
                </div>
            `;
            return;
        }

        state.trips.forEach(trip => {
            const vesselName = trip.vessels ? trip.vessels.name : 'Desconocido';
            const vesselType = trip.vessels ? (trip.vessels.type || 'Convoy') : 'N/A';
            const progress = trip.progress || 0;
            const eta = trip.estimated_arrival ? new Date(trip.estimated_arrival).toLocaleDateString() : '--/--';
            const status = trip.status || 'pending';
            const isLive = progress > 0 && progress < 100;

            // Status Logic
            let statusBadge = `<span class="status-badge status-pending"><i class="fas fa-clock"></i> PENDIENTE</span>`;
            if (isLive) statusBadge = `<span class="status-badge status-live"><i class="fas fa-broadcast-tower"></i> EN VIVO</span>`;
            if (progress >= 100) statusBadge = `<span class="status-badge status-live" style="color:#a855f7; border-color:#a855f7; background:rgba(168,85,247,0.1);"><i class="fas fa-check"></i> COMPLETADO</span>`;

            const card = document.createElement('div');
            card.className = 'trip-card-pro';
            card.innerHTML = `
                <div class="trip-card-header">
                    <div class="vessel-group">
                        <div class="vessel-icon"><i class="fas fa-ship"></i></div>
                        <div class="vessel-meta">
                            <h4>${vesselName}</h4>
                            <span>${vesselType.toUpperCase()}</span>
                        </div>
                    </div>
                    ${statusBadge}
                </div>

                <div class="trip-body">
                    <div class="trip-route">
                        <div class="route-point">
                            <span class="route-label">ORIGEN</span>
                            <span class="route-val">${trip.origin || 'N/A'}</span>
                        </div>
                        <div class="route-arrow"></div>
                        <div class="route-point" style="text-align:right;">
                            <span class="route-label">DESTINO</span>
                            <span class="route-val">${trip.destination || 'N/A'}</span>
                        </div>
                    </div>

                    <div class="trip-progress">
                        <div class="progress-track">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-labels">
                            <span>PROGRESO</span>
                            <span style="color:#00e5ff;">${progress}%</span>
                        </div>
                    </div>

                    <div class="trip-meta-grid">
                        <div class="tm-item">
                            <span>TIPO DE CARGA</span>
                            <div>${trip.cargo_type || 'N/A'}</div>
                        </div>
                        <div class="tm-item">
                            <span>ESTIMADO (ETA)</span>
                            <div style="font-family:'Roboto Mono';">${eta}</div>
                        </div>
                    </div>
                    <div class="cargo-info" style="display:flex; justify-content:space-between; margin-top:15px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05); font-size:0.8rem;">
                        <span style="color:#64748b; font-weight:700;">ESTADO DE CARGA</span>
                        <span style="color:#fff; font-weight:700;">${trip.total_cargo_tons ? trip.total_cargo_tons.toLocaleString() : '0'} TN</span>
                    </div>
                </div>

                <div class="trip-footer" style="padding: 15px; display:flex; gap:10px; flex-wrap:wrap; border-top:1px solid rgba(255,255,255,0.05);">
                    <button class="btn-trip-action" style="flex:1; border-radius:8px; padding:10px;" onclick="ViajesModule.downloadManifest('${vesselName}', '${trip.origin || 'N/A'}', '${trip.destination || 'N/A'}', '${trip.cargo_type || 'N/A'}', ${trip.total_cargo_tons || 0})"><i class="fas fa-file-invoice"></i> MANIFIESTO</button>
                    <button class="btn-trip-action primary" style="flex:1; border-radius:8px; padding:10px;" onclick="document.getElementById('nav-mapa').click(); if(window.RiverToast) RiverToast.info('Visualizando ruta cartográfica', 'Módulo Mapa')"><i class="fas fa-map-marked-alt"></i> VER RUTA</button>
                    <button class="btn-trip-action" style="width:100%; border-radius:8px; padding:10px; background:rgba(0, 229, 255, 0.1); color:#00e5ff; border:1px solid #00e5ff;" onclick="if(window.RiverToast) RiverToast.info('${vesselName}: ${trip.total_cargo_tons ? trip.total_cargo_tons.toLocaleString() : 0} TN de ${trip.cargo_type || 'carga general'}', 'Maestro de Carga')"><i class="fas fa-th"></i> MAESTRO DE CARGA</button>
                </div>
            `;
            grid.appendChild(card);
        });
    };

    const openModal = async () => {
        const modal = document.getElementById('modal-new-trip');
        const vesselSelect = document.getElementById('new-trip-vessel');
        if (!modal) return;

        modal.style.display = 'flex';

        // Refresh Vessels in Dropdown
        if (vesselSelect && vesselSelect.options.length <= 1) {
            let { data } = await window.sb.fetchMine('fleet_assets', 'id, name, type');
            if (!data) {
                let res = await window.sb.from('fleet_assets').select('id, name, type');
                data = res.data;
            }
            if (data) {
                vesselSelect.innerHTML = data.map(v => `<option value="${v.id}">${v.name} (${v.type || 'N/A'})</option>`).join('');
            }
        }
    };

    // --- TAB LOGIC ---
    const initTabs = () => {
        const tabs = document.querySelectorAll('.dispatch-tabs .tab-link');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Remove active class from all
                tabs.forEach(t => {
                    t.classList.remove('active');
                    t.style.borderBottom = 'none';
                    t.style.color = '#64748b';
                });

                // Add to click
                e.target.classList.add('active');
                e.target.style.borderBottom = '2px solid #00e5ff';
                e.target.style.color = '#00e5ff';

                // Filter logic could go here
                // renderTrips(e.target.innerText);
                console.log("Tab changed:", e.target.innerText);
            });
        });
    }

    // Extended Init
    const init = async () => {
        console.log("Módulo Gestión de Viajes activo (Supabase + Robust).");
        state.currentUser = window.AuthModule ? window.AuthModule.getCurrentUser() : null;
        initTabs();
        await loadTrips();
        subscribeToTrips();
    };

    const downloadManifest = (vessel, origin, dest, cargo, tons) => {
        try {
            const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
            if (!jsPDFClass) {
                RiverToast.error('Motor PDF no cargado. Recargue la página.', 'Error de Exportación');
                return;
            }
            const doc = new jsPDFClass();
            // Header
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.text('RIVERHUB ELITE', 15, 20);
            doc.setFontSize(10);
            doc.setTextColor(0, 229, 255);
            doc.text('MANIFIESTO DE CARGA', 15, 30);
            doc.setTextColor(200, 200, 200);
            doc.text(new Date().toLocaleDateString('es-ES'), 170, 30);
            // Body
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            let y = 55;
            const row = (label, value) => {
                doc.setFont(undefined, 'bold');
                doc.text(label, 20, y);
                doc.setFont(undefined, 'normal');
                doc.text(String(value), 80, y);
                y += 10;
            };
            row('Embarcación:', vessel);
            row('Origen:', origin);
            row('Destino:', dest);
            row('Tipo Carga:', cargo);
            row('Tonelaje:', tons.toLocaleString() + ' TN');
            row('Fecha:', new Date().toLocaleDateString('es-ES'));
            row('Estado:', 'VERIFICADO');
            // Footer bar
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 280, 210, 17, 'F');
            doc.setTextColor(0, 229, 255);
            doc.setFontSize(8);
            doc.text('RiverHub Elite 360 — Documento generado automáticamente', 15, 289);
            doc.save(`Manifiesto_${vessel.replace(/\\s/g, '_')}.pdf`);
            RiverToast.success('Manifiesto PDF descargado correctamente.', 'Exportación');
        } catch (e) {
            console.error('PDF Error:', e);
            RiverToast.error('Error al generar PDF: ' + e.message);
        }
    };

    return { init, submitNewTrip, openModal, downloadManifest };
})();

window.ViajesModule = viajesLogic;
