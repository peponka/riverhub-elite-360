document.addEventListener('DOMContentLoaded', () => {
    console.log("RiverHub: Sistema Global Iniciado ⚓");

    // Init Auth
    if (window.AuthModule) window.AuthModule.init();
    // Init Share Module (Hidden Modal)
    if (window.ShareModule) window.ShareModule.init();
    if (window.DailyReportModule) window.DailyReportModule.init();
    if (window.NotificationCenter) window.NotificationCenter.init();

    // MAPEO COMPLETO: ID del Botón -> ID de la Pantalla
    const navMap = {
        'nav-dashboard': 'view-dashboard',
        'nav-mapa': 'view-mapa',
        'nav-commercial': 'view-commercial',
        'nav-comunicaciones': 'view-comunicaciones',
        'nav-tripulacion': 'view-tripulacion',
        'nav-incidentes': 'view-incidentes',
        'nav-panol': 'view-panol',
        'nav-combustible': 'view-combustible',
        'nav-cotizador': 'view-cotizador',
        'nav-docs': 'view-docs',
        'nav-reportes': 'view-reportes',
        'nav-viajes': 'view-viajes',
        'nav-convoys': 'view-convoys',
        'nav-mantenimiento': 'view-mantenimiento',
        'nav-hidrologia': 'view-hidrologia',
        'nav-integraciones': 'view-integraciones',
        'nav-bitacora': 'view-bitacora',
        'nav-calado': 'view-calado',
        'nav-tracking': 'view-tracking',
        'nav-admin-console': 'view-admin', // REVERT TO STANDARD ID
        'nav-backoffice': 'view-admin-panel', // SEPARATED SUPER ADMIN VIEW
        'nav-billing': 'view-billing',
        'nav-auditoria': 'view-auditoria',
        'nav-loadmaster': 'view-loadmaster'
    };

    const pageTitle = document.getElementById('page-title');

    // Bucle para activar cada botón
    for (const [btnId, viewId] of Object.entries(navMap)) {
        const btn = document.getElementById(btnId);

        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();

                // 1. Apagar todos los botones (sacar luz 'active')
                document.querySelectorAll('.menu a').forEach(el => el.classList.remove('active'));

                // 1.1 CRITICAL: Hide all Modals (User reported getting stuck in screens)
                document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');

                // 2. Ocultar todas las pantallas (STRICT MODE)
                document.querySelectorAll('.view-section').forEach(el => {
                    el.style.display = 'none';
                    el.classList.remove('active-view'); // Helper class if needed
                });

                // 3. Prender el botón que tocaste
                btn.classList.add('active');

                // 3.1 SYNC MOBILE BOTTOM NAV (Fix for active state mismatch)
                const mobileNavMap = {
                    'view-dashboard': 'mobile-nav-inicio',
                    'view-mapa': 'mobile-nav-mapa',
                    'view-convoys': 'mobile-nav-convoys',
                    'view-comunicaciones': 'mobile-nav-chat'
                };

                // Clear all active from bottom nav first if we are switching views
                if (document.querySelector('.mobile-bottom-nav')) {
                    document.querySelectorAll('.mobile-nav-item').forEach(m => m.classList.remove('active'));

                    const mobileId = mobileNavMap[viewId];
                    if (mobileId) {
                        const mBtn = document.getElementById(mobileId);
                        if (mBtn) mBtn.classList.add('active');
                    }
                }

                // 4. Mostrar la pantalla correspondiente
                const view = document.getElementById(viewId);
                if (view) {
                    if (viewId === 'view-tracking' || viewId === 'view-billing' || viewId === 'view-mapa' || viewId === 'view-comunicaciones') {
                        // Billing and Map views use Flex for layout
                        view.style.display = 'flex';
                    } else {
                        view.style.display = 'block';
                    }

                    // --- FULLSCREEN MODE TOGGLE (Fix for Convoys overlap) ---
                    if (viewId === 'view-convoys') {
                        document.body.classList.add('mode-fullscreen-convoys');
                    } else {
                        document.body.classList.remove('mode-fullscreen-convoys');
                    }

                    // Trigger reflow/repaint
                    void view.offsetWidth;
                }

                // 5. Cambiar el título grande de arriba
                if (pageTitle) pageTitle.innerText = btn.innerText;

                // 6. TRUCO DE MAPAS: Si entras al Mapa o al Dashboard, forzamos que se acomode
                if (viewId === 'view-mapa') {
                    document.body.classList.add('mode-map-active');
                    if (window.mapLogic) window.mapLogic.onShow();
                    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
                    setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
                } else {
                    document.body.classList.remove('mode-map-active');
                }

                if (viewId === 'view-dashboard') {
                    // Immediate resize for charts/maps
                    if (window.dashboardLogic && window.dashboardLogic.onShow) {
                        window.dashboardLogic.onShow();
                    } else {
                        window.dispatchEvent(new Event('resize'));
                    }
                } else if (viewId === 'view-bitacora') {
                    if (window.BitacoraModule) window.BitacoraModule.init();
                } else if (viewId === 'view-calado') {
                    if (CaladoModule) CaladoModule.init();
                } else if (viewId === 'view-admin') {
                    // if (window.AdminModule) window.AdminModule.init(); // DISABLED TO PREVENT OVERWRITE
                } else if (viewId === 'view-tripulacion') {
                    if (window.CrewModule) window.CrewModule.init();
                } else if (viewId === 'view-comunicaciones') {
                    if (window.CommsModule) window.CommsModule.init();
                } else if (viewId === 'view-combustible') {
                    if (window.FuelModule) window.FuelModule.init();
                } else if (viewId === 'view-panol') {
                    if (window.PanolModule) window.PanolModule.init();
                } else if (viewId === 'view-incidentes') {
                    if (window.IncidentsModule) window.IncidentsModule.init();
                } else if (viewId === 'view-viajes') {
                    if (window.ViajesModule) window.ViajesModule.init();
                } else if (viewId === 'view-convoys') {
                    if (window.ConvoysModule) window.ConvoysModule.init();
                } else if (viewId === 'view-mantenimiento') {
                    if (window.MaintenanceModule) window.MaintenanceModule.init();
                } else if (viewId === 'view-commercial') {
                    if (window.CommercialModule) window.CommercialModule.init();
                } else if (viewId === 'view-reportes') {
                    if (window.ReportesModule) window.ReportesModule.init();
                } else if (viewId === 'view-docs') {
                    if (window.DocsModule) window.DocsModule.init();
                } else if (viewId === 'view-integraciones') {
                    if (window.apiLogic) window.apiLogic.init();
                } else if (viewId === 'view-admin-panel') {
                    if (window.AdminDashboard) window.AdminDashboard.init();
                } else if (viewId === 'view-billing') {
                    if (window.BillingModule) window.BillingModule.init();
                } else if (viewId === 'view-tracking') {
                    if (window.TrackingModule) window.TrackingModule.init();
                } else if (viewId === 'view-cotizador') {
                    if (window.CotizadorModule) window.CotizadorModule.init();
                } else if (viewId === 'view-auditoria') {
                    if (window.AuditoriaModule) window.AuditoriaModule.init();
                } else if (viewId === 'view-loadmaster') {
                    if (window.LoadMasterModule) window.LoadMasterModule.init();
                }
            });
        }
    }

    // --- RESCUE WATCHDOG --- (Fix Black Screen)
    setTimeout(() => {
        const login = document.getElementById('login-view');
        const app = document.querySelector('.app-container');

        // If both are hidden/none, Force Login
        const loginStyle = window.getComputedStyle(login).display;
        const appStyle = window.getComputedStyle(app).display;

        if (loginStyle === 'none' && appStyle === 'none') {
            console.warn("⚠️ System Hang Detected: Forcing Login View");
            login.style.display = 'flex';
            // Ensure Admin Panel is hidden
            const adminView = document.getElementById('view-admin-panel');
            if (adminView) adminView.style.display = 'none';

            // Shake to indicate rescue
            const card = document.querySelector('.login-card');
            if (card) {
                card.style.animation = 'shake 0.5s';
                card.style.border = '1px solid red'; // Debug indicator
            }
        }
    }, 5000); // Increased to 5s to avoid fighting AuthModule

    // --- MATERIAL RIPPLE EFFECT ---
    document.addEventListener('click', function (e) {
        // Check if the clicked element or its parent is a material button
        const target = e.target.closest('.btn-material, .ripple-effect');

        if (target) {
            const rect = target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const circle = document.createElement('span');
            circle.classList.add('ripple');
            circle.style.left = x + 'px';
            circle.style.top = y + 'px';

            // Remove existing ripples to avoid DOM spam if multiple clicks
            const existingRipple = target.querySelector('.ripple');
            if (existingRipple) {
                existingRipple.remove();
            }

            target.appendChild(circle);

            setTimeout(() => {
                circle.remove();
            }, 600);
        }
    });
});