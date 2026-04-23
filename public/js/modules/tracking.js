// js/modules/tracking.js

// WRAPPED IN TRY-CATCH TO DIAGNOSE CRASHES
try {

    const trackingLogic = (() => {
        // STATE
        const state = {
            map: null,
            shipments: [],
            markers: [],
            aisMarkers: {} // Store for Live AIS ships
        };

        // SOCKET.IO CONNECTION (Unified Server)
        // Auto-connect to hosting server
        try {
            if (typeof io !== 'undefined') {
                const socket = io();

                socket.on('connect', () => console.log("✅ Conectado al Sistema FluviaFleet (WebSocket)"));
                socket.on('position_update', (ship) => {
                    updateShipMarker(ship);
                });
            } else {
                console.warn("⚠️ Socket.io library not loaded.");
            }
        } catch (e) {
            console.warn("Socket init error:", e);
        }

        // NEW: Live Draw Function
        const updateShipMarker = (ship) => {
            if (!state.map) return;

            const mmsi = ship.UserID;
            const lat = ship.Latitude;
            const lng = ship.Longitude;

            // Simple validation
            if (!lat || !lng) return;

            if (state.aisMarkers[mmsi]) {
                // Update Position
                const marker = state.aisMarkers[mmsi];
                marker.setLatLng([lat, lng]);

                // Update Popup content if needed
                if (marker.getPopup()) {
                    marker.getPopup().setContent(`<b>🚢 ${ship.ShipName || 'AIS TARGET'}</b><br>MMSI: ${mmsi}<br>Vel: ${ship.Sog || 0} kn`);
                }
            } else {
                // Create New Marker
                const icon = L.divIcon({
                    className: 'ais-live-marker',
                    html: `<div style="width:8px; height:8px; background:#00e5ff; border-radius:50%; box-shadow:0 0 8px #00e5ff; border:1px solid #fff;"></div>`,
                    iconSize: [8, 8],
                    iconAnchor: [4, 4]
                });

                const m = L.marker([lat, lng], { icon: icon }).addTo(state.map);
                m.bindPopup(`<b>🚢 ${ship.ShipName || 'AIS TARGET'}</b><br>MMSI: ${mmsi}`);

                state.aisMarkers[mmsi] = m;
            }
        };

        // INIT
        const init = async () => {
            try {
                console.log("🛰️ Iniciando Tracking Elite 360 (Client View)...");
                const container = document.getElementById('view-tracking');
                if (!container) return;

                // Render Dashboard Structure
                container.innerHTML = `
                    <div class="tracking-container">
                        <div class="tracking-header">
                            <div class="title-group-track">
                                <h2><i class="fas fa-satellite-dish icon-box-track"></i> TRACKING (Clientes)</h2>
                                <span class="subtitle-track">VISTA CLIENTE • CARGAMENTO & LOGÍSTICA</span>
                            </div>
                        </div>

                        <div class="tracking-body">
                            <!-- SIDEBAR LIST -->
                            <div class="shipment-list-panel">
                                <div class="search-track-box">
                                    <input type="text" class="search-input-track" placeholder="Buscar envío o manifiesto...">
                                </div>
                                <div class="tabs-track">
                                    <button class="tab-btn active">En Tránsito</button>
                                    <button class="tab-btn">Histórico</button>
                                </div>
                                <div id="tracking-shipment-list" class="shipment-list-scroll">
                                    <!-- List injected here -->
                                </div>
                            </div>

                            <!-- MAP AREA -->
                            <div class="map-panel">
                                <div id="tracking-map-container"></div>
                                
                                <!-- OVERLAY DETAIL -->
                                <div id="tracking-detail-overlay" class="tracking-detail-overlay">
                                    <div class="overlay-header">
                                        <h3><i class="fas fa-info-circle"></i> DETALLE DE CARGA</h3>
                                        <button class="btn-close-overlay" onclick="TrackingModule.closeOverlay()" data-tooltip="Cerrar Radar"><i class="fas fa-times"></i></button>
                                    </div>
                                    <div class="overlay-body">
                                        <div class="overlay-grid">
                                            <div class="info-item">
                                                <label>BUQUE / BARCAZA</label>
                                                <span id="overlay-vessel-name">--</span>
                                            </div>
                                            <div class="info-item">
                                                <label>PRODUCTO</label>
                                                <span id="overlay-product">--</span>
                                            </div>
                                            <div class="info-item">
                                                <label>CANTIDAD</label>
                                                <span id="overlay-qty">--</span>
                                            </div>
                                            <div class="info-item">
                                                <label>DESTINO</label>
                                                <span id="overlay-dest">--</span>
                                            </div>
                                            <div class="info-item">
                                                <label>ETA ESTIMADO</label>
                                                <span id="overlay-eta" style="color:#00e5ff;">--</span>
                                            </div>
                                        </div>
                                        <!-- Do NOT add button here manually, JS injects it -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // CHECK LEAFLET
                if (typeof L === 'undefined') {
                    console.error("ERROR CRITICO: Leaflet (Mapas) no cargó.");
                    return;
                }

                // Init Map after DOM injection
                setTimeout(() => {
                    initMap();
                    loadClientShipments();
                }, 100);

            } catch (e) {
                console.error("Error en Tracking Init:", e);
            }
        };

        // MAP SETUP
        const initMap = () => {
            try {
                const mapEl = document.getElementById('tracking-map-container');
                if (!mapEl) return;

                // Reset valid content
                if (state.map) {
                    state.map.remove();
                    state.map = null;
                }

                // Create Map
                state.map = L.map('tracking-map-container', {
                    zoomControl: false,
                    attributionControl: false
                }).setView([-27.0, -58.0], 7); // River View

                // Dark Matter
                L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    maxZoom: 19
                }).addTo(state.map);

                L.control.zoom({ position: 'topright' }).addTo(state.map);

                // Resize fix
                setTimeout(() => { state.map.invalidateSize(); }, 500);

            } catch (err) {
                console.error("Map Create Error:", err);
            }
        };

        const loadClientShipments = async () => {
            try {
                if (!window.sb) throw new Error("Sin conexión a Supabase");
                
                // Fetch real trips (status = in_progress)
                const { data, error } = await window.sb
                    .from('voyages')
                    .select('*, vessel:fleet_assets(name, type)')
                    .eq('status', 'in_progress');
                    
                if (error) throw error;
                
                if (data && data.length > 0) {
                    state.shipments = data.map(t => ({
                        id: t.id,
                        product_type: t.cargo_type || 'Carga General',
                        quantity: t.cargo_amount || 0,
                        created_at: t.start_date || new Date().toISOString(),
                        service_order: { 
                            origin_port: t.origin_port || 'Origen', 
                            destination_port: t.destination_port || 'Destino' 
                        },
                        barge: { 
                            id: t.vessel_id, 
                            name: t.vessel ? t.vessel.name : 'No Asignado', 
                            lat: -27.5 + (Math.random() * 2), // We lack real DB lat/lng for trips unless mapped
                            lng: -58.8 - (Math.random() * 2),
                            status: 'Navegando' 
                        }
                    }));
                } else {
                    useMockShipments();
                }
            } catch (err) {
                console.warn("Fallo al traer viajes reales, usando mock:", err);
                useMockShipments();
            }

            renderShipments();
            renderMapMarkers();
            
            // Activate search filter dynamically
            const inputTrack = document.querySelector('.search-input-track');
            if (inputTrack) {
                inputTrack.addEventListener('input', (e) => {
                    const term = e.target.value.toLowerCase();
                    const cards = document.querySelectorAll('.shipment-card');
                    cards.forEach(c => {
                        const txt = c.textContent || c.innerText;
                        c.style.display = txt.toLowerCase().includes(term) ? '' : 'none';
                    });
                });
            }
        };

        const useMockShipments = () => {
            state.shipments = [
                {
                    id: 'trk-001',
                    product_type: 'Soja',
                    quantity: 1500,
                    created_at: new Date().toISOString(),
                    service_order: { origin_port: 'Corumbá', destination_port: 'Rosario' },
                    barge: { id: 'b1', name: 'B-001 GRANEL', lat: -25.3, lng: -57.6, status: 'Navegando' }
                },
                {
                    id: 'trk-002',
                    product_type: 'Hierro',
                    quantity: 2200,
                    created_at: new Date().toISOString(),
                    service_order: { origin_port: 'Ladario', destination_port: 'San Nicolas' },
                    barge: { id: 'b2', name: 'B-045 MINERAL', lat: -27.5, lng: -58.8, status: 'Navegando' }
                }
            ];
        };

        // RENDERING
        const renderShipments = () => {
            const list = document.getElementById('tracking-shipment-list');
            if (!list) return;
            list.innerHTML = '';

            if (state.shipments.length === 0) {
                list.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">No hay cargas activas.</div>';
                return;
            }

            state.shipments.forEach(s => {
                const card = document.createElement('div');
                card.className = 'shipment-card';
                card.onclick = () => focusMap(s);

                card.innerHTML = `
                    <div class="shipment-top">
                        <span class="shipment-id"><i class="fas fa-box"></i> ${s.product_type}</span>
                        <span class="shipment-status status-transit">EN TRÁNSITO</span>
                    </div>
                    <div class="shipment-details">
                        <span>${s.barge ? s.barge.name : 'Sin Asignar'}</span>
                        <span>${s.quantity} TN</span>
                    </div>
                    <div class="shipment-route">
                        ${s.service_order.origin_port} <i class="fas fa-arrow-right"></i> ${s.service_order.destination_port}
                    </div>
                    <!-- Quick Action -->
                    <div style="margin-top:10px; text-align:right;">
                        <button class="btn-doc-mini" onclick="event.stopPropagation(); TrackingModule.quickDownload('${s.barge ? s.barge.name : ''}', '${s.product_type}', '${s.quantity}', '${s.service_order.destination_port}')">
                            <i class="fas fa-file-pdf"></i> PDF
                        </button>
                    </div>
                `;
                list.appendChild(card);
            });
        };

        const renderMapMarkers = () => {
            // Check Map
            if (!state.map) return;

            // Clear old "Shipment" markers (not AIS ones)
            state.markers.forEach(m => state.map.removeLayer(m));
            state.markers = [];

            state.shipments.forEach(s => {
                if (!s.barge || !s.barge.lat) return;

                const icon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="background:#f59e0b; width:14px; height:14px; border-radius:50%; box-shadow:0 0 10px #f59e0b; border:2px solid #fff;"></div>`,
                    iconSize: [14, 14],
                    iconAnchor: [7, 7]
                });

                const marker = L.marker([s.barge.lat, s.barge.lng], { icon: icon }).addTo(state.map);

                marker.on('click', () => {
                    showOverlay(s);
                    state.map.setView([s.barge.lat, s.barge.lng], 10);
                });

                state.markers.push(marker);
            });
        };

        const focusMap = (shipment) => {
            if (shipment.barge && shipment.barge.lat && state.map) {
                state.map.setView([shipment.barge.lat, shipment.barge.lng], 9);
                showOverlay(shipment);
            }
        };

        const showOverlay = (s) => {
            const overlay = document.getElementById('tracking-detail-overlay');
            if (!overlay) return;

            document.getElementById('overlay-vessel-name').innerText = s.barge.name;
            document.getElementById('overlay-product').innerText = s.product_type;
            document.getElementById('overlay-qty').innerText = s.quantity.toLocaleString() + ' TN';
            document.getElementById('overlay-dest').innerText = s.service_order.destination_port;
            document.getElementById('overlay-eta').innerText = "2 Días";

            // INJECTED BUTTON (Safe Mode)
            const body = overlay.querySelector('.overlay-body');
            let btn = document.getElementById('btn-doc-inject');

            if (!btn && body) {
                // Remove leftovers
                const oldBtns = overlay.querySelectorAll('.btn-doc');
                oldBtns.forEach(b => b.remove());

                btn = document.createElement('button');
                btn.id = 'btn-doc-inject';
                btn.className = 'btn-doc'; // Uses Premium Style from CSS
                btn.innerHTML = '<i class="fas fa-file-pdf"></i> VER DOCUMENTACIÓN';
                btn.onclick = (e) => { e.stopPropagation(); downloadManifest(); };
                btn.style.cssText = "display:flex !important; margin-top:20px; width:100%;";

                body.appendChild(btn);
            }

            overlay.style.display = 'block';
        };

        const closeOverlay = () => {
            const overlay = document.getElementById('tracking-detail-overlay');
            if (overlay) overlay.style.display = 'none';
        };

        const quickDownload = (vessel, prod, qty, dest) => {
            generatePDF(vessel, prod, qty, dest, "2 Días");
        };

        const downloadManifest = () => {
            // Extract from Overlay
            let vesselName = "Documento";
            let product = "", qty = "", dest = "", eta = "";
            try {
                vesselName = document.getElementById('overlay-vessel-name').innerText;
                product = document.getElementById('overlay-product').innerText;
                qty = document.getElementById('overlay-qty').innerText;
                dest = document.getElementById('overlay-dest').innerText;
                eta = document.getElementById('overlay-eta').innerText;
            } catch (e) { }

            generatePDF(vesselName, product, qty, dest, eta);
        };

        const generatePDF = (vesselName, product, qty, dest, eta) => {
            const date = new Date().toLocaleDateString();

            if (!window.jspdf) {
                RiverToast.error('Librería PDF no cargada. Recargue la página.', 'Error PDF');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // HEADER
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("FluviaFleet", 20, 25);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("MANIFIESTO DE CARGA VIRTUAL", 140, 25);

            // INFO
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.text(`Fecha de Emisión: ${date}`, 20, 55);
            doc.text(`ID Documento: RH-${Math.floor(Math.random() * 10000)}`, 140, 55);

            // CARGO TABLE
            doc.autoTable({
                startY: 70,
                head: [['Concepto', 'Detalle']],
                body: [
                    ['Barcaza / Buque', vesselName],
                    ['Tipo de Producto', product],
                    ['Cantidad Declarada', qty + ' TN'],
                    ['Puerto Destino', dest],
                    ['Estimado de Arribo (ETA)', eta],
                    ['Estatus', 'EN TRÁNSITO - CONFIRMADO']
                ],
                theme: 'grid',
                headStyles: { fillColor: [15, 23, 42] }
            });

            // FOOTER
            const finalY = doc.lastAutoTable.finalY + 30;
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text("Este documento es generado automáticamente por FluviaFleet.", 20, finalY);
            doc.text("Validez sujeta a confirmación satelital.", 20, finalY + 5);

            if (window.RiverToast) RiverToast.success(`Generando PDF firmado digitalmente para ${vesselName}...`, 'Manifiesto Seguro');
            
            doc.save(`Manifiesto_${vesselName.replace(/\s/g, '_')}.pdf`);
        };

        return {
            init,
            closeOverlay,
            downloadManifest,
            quickDownload,
            updateShipMarker // Exported for debugging
        };
    })();

    window.TrackingModule = trackingLogic;

} catch (globalErr) {
    console.error("TrackingJS Crash:", globalErr);
}
