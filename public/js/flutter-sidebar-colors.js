/**
 * Flutter AppDrawer Sidebar Color Injector
 * Applies individual icon colors to match the Flutter mobile app's drawer exactly.
 * Each module gets its own color from the Flutter _buildDrawerItem definitions.
 */
(function () {
    'use strict';

    // Flutter AppDrawer exact icon colors (from app_drawer.dart)
    const FLUTTER_ICON_COLORS = {
        'nav-dashboard': '#3B82F6',  // Blue
        'nav-mapa': '#00E5FF',  // Cyan
        'nav-fleet-reboot': '#00E5FF',  // Cyan (Gestión de Flota)
        'nav-combustible': '#8B5CF6',  // Purple
        'nav-calado': '#3B82F6',  // Blue
        'nav-hidrologia': '#06B6D4',  // Teal
        'nav-convoys': '#10B981',  // Green
        'nav-loadmaster': '#F59E0B',  // Amber
        'nav-tracking': '#EF4444',  // Red
        'nav-viajes': '#F97316',  // Orange
        'nav-cotizador': '#10B981',  // Green
        'nav-commercial': '#8B5CF6',  // Purple
        'nav-docs': '#3B82F6',  // Blue
        'nav-mantenimiento': '#F59E0B',  // Amber
        'nav-panol': '#06B6D4',  // Teal
        'nav-incidentes': '#EF4444',  // Red
        'nav-tripulacion': '#10B981',  // Green
        'nav-comunicaciones': '#00E5FF',  // Cyan
        'nav-bitacora': '#F97316',  // Orange
        'nav-reportes': '#F97316',  // Orange
        'nav-integraciones': '#10B981',  // Green
        'nav-billing': '#3B82F6',  // Blue
        'nav-auditoria': '#64748B',  // Grey
        'nav-admin-console': '#8B5CF6',  // Purple
        'nav-backoffice': '#EF4444',  // Red
    };

    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function applyFlutterColors() {
        for (const [navId, color] of Object.entries(FLUTTER_ICON_COLORS)) {
            const navEl = document.getElementById(navId);
            if (!navEl) continue;

            const icon = navEl.querySelector('i');
            if (!icon) continue;

            // Apply Flutter _buildDrawerItem styling:
            // Container: padding 6, borderRadius 8, color at 15% opacity
            // Icon: full color, size 18
            icon.style.cssText = `
                color: ${color} !important;
                background: ${hexToRgba(color, 0.15)} !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 30px !important;
                height: 30px !important;
                border-radius: 8px !important;
                font-size: 14px !important;
                margin-right: 12px !important;
                text-shadow: none !important;
                flex-shrink: 0 !important;
            `;
        }
        console.log('🎨 Flutter sidebar colors applied');
    }

    // Apply on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(applyFlutterColors, 100);
        });
    } else {
        setTimeout(applyFlutterColors, 100);
    }

    // Re-apply after auth login (when sidebar becomes visible)
    const origApply = applyFlutterColors;
    window._applyFlutterSidebarColors = origApply;

    // MutationObserver to re-apply colors when sidebar content changes
    const observer = new MutationObserver(function () {
        setTimeout(applyFlutterColors, 200);
    });

    // Observe changes to app-container visibility
    setTimeout(function () {
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            observer.observe(appContainer, { attributes: true, attributeFilter: ['style'] });
        }
    }, 500);
})();
