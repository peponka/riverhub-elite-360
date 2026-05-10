// js/modules/share.js

const ShareModule = (() => {

    let isModalOpen = false;

    const init = () => {
        void("Share Module Initialized");
        injectModal();
    };

    const injectModal = () => {
        const modalHTML = `
            <div class="share-modal-overlay" id="share-modal-overlay">
                <div class="share-modal">
                    <i class="fas fa-times close-modal" onclick="ShareModule.close()"></i>
                    <h2 class="share-title">Smart Share</h2>
                    <p class="share-subtitle">Exporta o comparte esta vista al instante</p>
                    
                    <div class="share-grid" style="grid-template-columns: 1fr 1fr;">
                        <div class="share-option" onclick="ShareModule.generateLink()">
                            <i class="fas fa-link option-icon" style="color:#a855f7"></i>
                            <span class="option-label">Magic Link</span>
                        </div>
                        <div class="share-option" onclick="ShareModule.sendEmail()">
                            <i class="fas fa-envelope option-icon" style="color:#f59e0b"></i>
                            <span class="option-label">Email PDF</span>
                        </div>
                        <div class="share-option premium-option" onclick="ShareModule.triggerAI()">
                            <i class="fas fa-robot option-icon"></i>
                            <span class="option-label">AI Briefing</span>
                        </div>
                        <div class="share-option" onclick="DailyReportModule.open()" style="border-color: #0ea5e9; background: rgba(14, 165, 233, 0.1);">
                            <i class="fas fa-newspaper option-icon" style="color:#0ea5e9"></i>
                            <span class="option-label">Daily Brief</span>
                        </div>
                    </div>

                    <div id="magic-link-section" class="share-link-container" style="display:none;">
                        <input type="text" value="https://fluviafleet.com/s/xe92-a1" class="share-link-input" readonly id="share-input">
                        <button class="btn-copy" onclick="ShareModule.copyLink()">COPIAR</button>
                    </div>

                    <div id="ai-section" class="ai-visualizer">
                        <div class="ai-wave">
                            <div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div>
                            <div class="wave-bar"></div><div class="wave-bar"></div>
                        </div>
                        <div class="ai-text" id="ai-status">Analizando datos de la flota...</div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Click outside to close
        document.getElementById('share-modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'share-modal-overlay') ShareModule.close();
        });
    };

    const open = () => {
        document.getElementById('share-modal-overlay').classList.add('active');
        resetUI();
    };

    const close = () => {
        document.getElementById('share-modal-overlay').classList.remove('active');
        resetUI();
    };

    const resetUI = () => {
        document.getElementById('magic-link-section').style.display = 'none';
        document.getElementById('ai-section').style.display = 'none';
    };

    const generateLink = () => {
        // Simulate Link Generation
        const linkSection = document.getElementById('magic-link-section');
        const input = document.getElementById('share-input');

        // Generate random hash
        const hash = Math.random().toString(36).substring(7);
        input.value = `https://fluviafleet.com/v/${hash}`;

        linkSection.style.display = 'flex';
        // Hide AI if open
        document.getElementById('ai-section').style.display = 'none';
    };

    const copyLink = () => {
        const input = document.getElementById('share-input');
        input.select();
        document.execCommand('copy');

        const btn = document.querySelector('.btn-copy');
        const oldText = btn.innerText;
        btn.innerText = 'LISTO';
        setTimeout(() => btn.innerText = oldText, 2000);
    };

    const sendEmail = () => {
        // Piggyback on Reports logic if available, or mock
        if (window.ReportesModule) {
            RiverToast.info('Preparando reporte para envío por email...', 'Exportación');
            window.ReportesModule.printReport(); // For demo, just triggers download
        } else {
            RiverToast.success('Reporte enviado a cliente@empresa.com', 'Email Enviado');
        }
        close();
    };

    const triggerAI = () => {
        const aiSection = document.getElementById('ai-section');
        const statusText = document.getElementById('ai-status');

        aiSection.style.display = 'block';
        document.getElementById('magic-link-section').style.display = 'none';

        // Simulation Step 1
        statusText.innerText = "Conectando con Neural Engine...";

        setTimeout(() => {
            statusText.innerText = "Analizando métricas clave...";
        }, 1000);

        setTimeout(() => {
            statusText.innerText = "Generando resumen de voz...";
            speak("Hola Capitán. El sistema River Hub está operando al 100%. Tienes 3 convoyes activos y 0 alertas críticas. El clima en la hidrovía es favorable.");
        }, 2500);

        setTimeout(() => {
            statusText.innerText = "Reproduciendo Audio Briefing 🔊";
        }, 3000);
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            // Cancel previous speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES'; // Spanish
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            // Try to find a good voice
            const voices = window.speechSynthesis.getVoices();
            // Google/Microsoft Spanish voices usually found here
            const esVoice = voices.find(v => v.lang.includes('es') && (v.name.includes('Google') || v.name.includes('Microsoft')));
            if (esVoice) utterance.voice = esVoice;

            window.speechSynthesis.speak(utterance);
        } else {
            console.warn("Text-to-Speech not supported in this browser.");
        }
    };

    return {
        init,
        open,
        close,
        generateLink,
        copyLink,
        sendEmail,
        triggerAI
    };

})();

window.ShareModule = ShareModule;
