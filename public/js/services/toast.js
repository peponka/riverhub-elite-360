// ============================================
// FLUVIAFLEET - Toast Notification System
// Replaces ALL native alert() calls
// ============================================
(function () {
    'use strict';

    // Create container on DOM ready
    function ensureContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    const ICONS = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const TITLES = {
        success: 'Operación Exitosa',
        error: 'Error',
        warning: 'Atención',
        info: 'Información'
    };

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - 'success' | 'error' | 'warning' | 'info'
     * @param {number} duration - Duration in ms (default 4000)
     * @param {string} title - Custom title (optional)
     */
    function showToast(message, type = 'info', duration = 4000, title = null) {
        const container = ensureContainer();

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.style.setProperty('--toast-duration', `${duration}ms`);

        const displayTitle = title || TITLES[type] || 'Notificación';
        const iconClass = ICONS[type] || ICONS.info;

        // Clean up message (remove emojis at start that look weird in toasts)
        let cleanMsg = message.replace(/^[✅⚠️❌📧🔌💀⛔📡🚀]+\s*/, '');
        if (!cleanMsg) cleanMsg = message;

        toast.innerHTML = `
            <div class="toast-icon"><i class="fas ${iconClass}"></i></div>
            <div class="toast-body">
                <div class="toast-title">${displayTitle}</div>
                <div class="toast-message">${cleanMsg}</div>
            </div>
            <button class="toast-close" aria-label="Cerrar"><i class="fas fa-times"></i></button>
        `;

        // Close on click
        toast.addEventListener('click', () => dismissToast(toast));
        toast.querySelector('.toast-close').addEventListener('click', (e) => {
            e.stopPropagation();
            dismissToast(toast);
        });

        container.appendChild(toast);

        // Auto dismiss
        const timer = setTimeout(() => dismissToast(toast), duration);
        toast._timer = timer;

        // Limit max toasts on screen
        const toasts = container.querySelectorAll('.toast-notification:not(.toast-exit)');
        if (toasts.length > 5) {
            dismissToast(toasts[0]);
        }

        return toast;
    }

    function dismissToast(toast) {
        if (!toast || toast.classList.contains('toast-exit')) return;
        clearTimeout(toast._timer);
        toast.classList.add('toast-exit');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 350);
    }

    // === GLOBAL API ===
    window.RiverToast = {
        success: (msg, title, duration) => showToast(msg, 'success', duration || 3500, title),
        error: (msg, title, duration) => showToast(msg, 'error', duration || 5000, title),
        warning: (msg, title, duration) => showToast(msg, 'warning', duration || 4500, title),
        info: (msg, title, duration) => showToast(msg, 'info', duration || 4000, title),
        show: showToast
    };

    // === INTERCEPT native alert() ===
    const originalAlert = window.alert;
    window.alert = function (message) {
        if (!message) return;
        const msg = String(message);

        // Auto-detect type based on content
        let type = 'info';
        if (msg.match(/error|fallo|no se pudo|no existe|sin conexión|no carg/i)) {
            type = 'error';
        } else if (msg.match(/✅|exitosa|correcto|creada|guardad|actualiz|éxito/i)) {
            type = 'success';
        } else if (msg.match(/⚠️|atención|insuficiente|inválid|completa|por favor/i)) {
            type = 'warning';
        }

        showToast(msg, type);
    };

    // Init container when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureContainer);
    } else {
        ensureContainer();
    }

    void('🔔 FluviaFleet Toast System Active');
})();
