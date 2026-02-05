/**
 * NOTIFICATION CENTER MODULE
 * Centralizes system alerts from Hydrology, Maintenance, Load Master, etc.
 */

const NotificationCenter = {
    notifications: [],

    init: function () {
        console.log("🔔 Notification Center Initialized");
        this.renderBadge();
        this.setupListeners();

        // --- MOCK ALERTS FOR DEMO ---
        // Verify if we already have alerts to avoid dupes on re-init
        if (this.notifications.length === 0) {
            this.addNotification({
                id: 1,
                title: "Alerta Hidrológica",
                message: "Nivel del río en baja en Puerto Rosario (-0.5m en 24hs).",
                type: "warning", // critical, warning, info, success
                time: "Hace 10 min",
                module: "hidrologia"
            });

            this.addNotification({
                id: 2,
                title: "Mantenimiento Vencido",
                message: "Motor Auxiliar #2 (R/M HERCULES) requiere service inmediato.",
                type: "critical",
                time: "Hace 2 horas",
                module: "mantenimiento"
            });

            this.addNotification({
                id: 3,
                title: "Carga Completada",
                message: "B/M TITAN finalizó operación de carga de Soja (1,500 TN).",
                type: "success",
                time: "Hace 4 horas",
                module: "tracking"
            });
        }
    },

    setupListeners: function () {
        const btn = document.getElementById('btn-notifications-trigger');
        const panel = document.getElementById('notification-panel');

        if (btn && panel) {
            // Toggle Click
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggle();
            };

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!panel.contains(e.target) && !btn.contains(e.target)) {
                    this.close();
                }
            });
        } else {
            console.warn("Notification Center: UI elements not found.");
        }
    },

    toggle: function () {
        const panel = document.getElementById('notification-panel');
        if (panel) {
            const isVisible = panel.style.display === 'flex';
            if (isVisible) {
                this.close();
            } else {
                this.open();
            }
        }
    },

    open: function () {
        const panel = document.getElementById('notification-panel');
        if (panel) {
            panel.style.display = 'flex';
            // Mark all as read visual loop could go here
        }
    },

    close: function () {
        const panel = document.getElementById('notification-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    },

    addNotification: function (notif) {
        this.notifications.unshift(notif); // Add to top
        this.renderList();
        this.renderBadge();
    },

    clearAll: function () {
        this.notifications = [];
        this.renderList();
        this.renderBadge();
    },

    renderList: function () {
        const listContainer = document.querySelector('.notif-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        if (this.notifications.length === 0) {
            listContainer.innerHTML = '<div class="notif-empty">No hay notificaciones nuevas</div>';
            return;
        }

        this.notifications.forEach(n => {
            const item = document.createElement('div');
            item.className = `notif-item ${n.type} unread`;

            let iconClass = 'fa-info-circle';
            if (n.type === 'critical') iconClass = 'fa-exclamation-triangle';
            if (n.type === 'warning') iconClass = 'fa-exclamation-circle';
            if (n.type === 'success') iconClass = 'fa-check-circle';

            item.innerHTML = `
                <div class="notif-icon">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="notif-content">
                    <span class="notif-title">${n.title}</span>
                    <span class="notif-msg">${n.message}</span>
                    <span class="notif-time">${n.time}</span>
                </div>
            `;

            // Click Handler (Mock navigation)
            item.onclick = () => {
                console.log("Clicked notification for", n.module);
                // Here we could switch views: window.showView('view-' + n.module)
            };

            listContainer.appendChild(item);
        });
    },

    renderBadge: function () {
        const badge = document.getElementById('notification-badge-count');
        if (badge) {
            const count = this.notifications.length;
            if (count > 0) {
                badge.style.display = 'block';
                badge.innerText = count > 9 ? '9+' : count;
            } else {
                badge.style.display = 'none';
            }
        }
    }
};

// Export
window.NotificationCenter = NotificationCenter;
