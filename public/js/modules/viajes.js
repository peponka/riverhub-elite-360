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
        const eta = document.getElementById('new-trip-eta').value;

        if (!vesselId || !origin || !dest) {
            alert("Por favor complete los campos obligatorios.");
            return;
        }

        const btn = document.querySelector('#modal-new-trip .modal-purple-btn');
        const originalText = btn.innerText;
        btn.innerText = "PROCESANDO...";
        btn.disabled = true;

        try {
            const user = window.AuthModule?.getCurrentUser();
            const companyId = user?.company_id || user?.company || 'DEMO_TENANT';

            // Insert into 'voyages' table (Correct Schema Name)
            const { error } = await window.sb.from('voyages').insert([{
                vessel_id: vesselId,
                company_id: companyId,
                voyage_number: 'V-' + Date.now().toString().substr(-6), // Auto-gen ID
                origin_port: origin,
                destination_port: dest,
                cargo_type: cargo,
                eta: eta ? new Date(eta).toISOString() : null,
                status: 'planned'
            }]);

            if (error) throw error;

            alert("✅ Solicitud de viaje creada correctamente");
            document.getElementById('modal-new-trip').style.display = 'none';
            loadTrips();

        } catch (err) {
            console.error(err);
            // FALLBACK TO TRIPS (Legacy Table) IF VOYAGES FAIL
            if (err.message.includes('relation "voyages" does not exist')) {
                console.warn("Table voyages not found, trying legacy 'trips'...");
                // ... try legacy insert or show error
                alert("Error crítico: La tabla de viajes no existe en DB. Contacte soporte.");
            } else {
                alert("Error al crear viaje: " + err.message);
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
            const { data: tripsData, error: tripsError } = await window.sb
                .from('voyages')
                .select('*')
                .order('created_at', { ascending: false });

            // If voyages is empty or errors, we might want to fail gracefully
            if (tripsError) throw tripsError;

            // Fetch Vessels
            const { data: vesselsData } = await window.sb
                .from('vessels')
                .select('id, name, type');

            const vesselMap = {};
            if (vesselsData) vesselsData.forEach(v => vesselMap[v.id] = v);

            const combinedTrips = (tripsData || []).map(trip => {
                // Map DB fields to UI fields
                return {
                    id: trip.id,
                    origin: trip.origin_port,
                    destination: trip.destination_port,
                    cargo_type: trip.cargo_type,
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
                </div>

                <div class="trip-footer">
                    <button class="btn-trip-action"><i class="fas fa-file-invoice"></i> MANIFIESTO</button>
                    <button class="btn-trip-action primary"><i class="fas fa-map-marked-alt"></i> VER RUTA</button>
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
            const { data } = await window.sb.from('vessels').select('id, name, type');
            if (data) {
                vesselSelect.innerHTML = data.map(v => `<option value="${v.id}">${v.name} (${v.type})</option>`).join('');
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

    return { init, submitNewTrip, openModal };
})();

window.ViajesModule = viajesLogic;
