// js/modules/integraciones.js

const apiLogic = {
    init: function () {
        console.log("Módulo Integraciones activo.");
        this.addLog("SYSTEM", "Centro de Conectividad inicializado.");
        this.bindEvents();
        this.initTabs();
    },

    bindEvents: function () {
        const buttons = document.querySelectorAll('.btn-link-api');

        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.api-card');
                const providerName = card.querySelector('h3').innerText;
                const statusDot = card.querySelector('.status-dot');
                const statusText = card.querySelector('.status-text');
                const input = card.querySelector('.api-key-input');

                if (input.value.length < 5) {
                    RiverToast.warning('Por favor ingrese una API KEY válida.', 'Validación');
                    return;
                }

                // Simulate Connection Process
                this.addLog("CONNECT", `Iniciando handshake con ${providerName}...`);
                btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
                btn.disabled = true;

                setTimeout(() => {
                    this.addLog("AUTH", `Verificando credenciales para ${input.value.substring(0, 4)}***...`);
                }, 800);

                setTimeout(() => {
                    // Success Mock
                    this.addLog("SUCCESS", `Conexión establecida con ${providerName}. Latencia: 45ms.`);

                    statusDot.classList.remove('error');
                    statusDot.classList.add('online');
                    statusText.innerText = 'ONLINE';
                    statusText.style.color = '#10b981';

                    btn.innerHTML = 'VINCULADO';
                    btn.style.background = '#10b981';
                    btn.style.color = '#000';
                    btn.style.borderColor = '#10b981';

                    input.disabled = true;
                    input.type = "password"; // Hide key

                    // Trigger global notification if available (optional)
                }, 2000);
            });
        });
    },

    initTabs: function () {
        const tabConnect = document.getElementById('tab-connect');
        const tabMyApi = document.getElementById('tab-my-api');
        const contentConnect = document.getElementById('content-connect');
        const contentMyApi = document.getElementById('content-my-api');

        if (tabConnect && tabMyApi) {
            tabConnect.onclick = () => {
                tabConnect.classList.add('active');
                tabMyApi.classList.remove('active');
                contentConnect.style.display = 'grid'; // Grid for cards
                contentMyApi.style.display = 'none';
            };

            tabMyApi.onclick = () => {
                tabMyApi.classList.add('active');
                tabConnect.classList.remove('active');
                contentConnect.style.display = 'none';
                contentMyApi.style.display = 'block';
            };
        }
    },

    generateKey: function () {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; // No special chars for ease
        let key = 'sk_live_';
        for (let i = 0; i < 32; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        document.getElementById('my-api-key').value = key;
        this.addLog("KEYGEN", "Nueva API Key generada con éxito.");
        RiverToast.success('Nueva API Key generada. Recuerda guardarla en un lugar seguro.', 'API Key');
    },

    toggleVisibility: function () {
        const input = document.getElementById('my-api-key');
        const btn = input.nextElementSibling.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            btn.classList.remove('fa-eye');
            btn.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            btn.classList.add('fa-eye');
            btn.classList.remove('fa-eye-slash');
        }
    },

    addLog: function (type, msg) {
        const term = document.getElementById('terminal-output');
        if (!term) return;

        const time = new Date().toLocaleTimeString('es-AR', { hour12: false });
        const line = document.createElement('div');
        line.className = 'log-line';
        line.innerHTML = `<span class="log-time">[${time}]</span> <span style="color:#00e5ff;">${type}</span>: ${msg}`;

        term.appendChild(line);
        term.scrollTop = term.scrollHeight;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => apiLogic.init(), 1000); // Init after view load simulation
});
