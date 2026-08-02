/* `vessels.status` está en español ('Activo'), pero este módulo comparaba
   contra 'active'. Sin esto el copiloto respondía "0 unidades operativas". */
function esActivoAg(estado) {
    const s = String(estado || '').toLowerCase().trim();
    return s === 'active' || s === 'activo' || s === 'en viaje' ||
           s === 'navegando' || s === 'en_viaje' || s === 'transito';
}

const AgentChatModule = (() => {

    let chatHistory = [];
    const AGENT_NAME = "Antigravity (AI)";
    const USER_NAME = "Operador";

    const init = () => {
        void("Módulo Agente Virtual Iniciado 🤖");

        // Initial Message if empty
        const chatBody = document.getElementById('agent-chat-body');
        if (chatBody && chatBody.children.length === 0) {
            addMessage(AGENT_NAME, "Hola, soy Antigravity, tu agente de arquitectura y control de FluviaFleet. ¿En qué puedo ayudarte hoy?", 'agent');
        }

        setupListeners();
    };

    const setupListeners = () => {
        const sendBtn = document.getElementById('btn-agent-send');
        const input = document.getElementById('agent-input');

        if (sendBtn) sendBtn.onclick = sendMessage;

        if (input) {
            input.onkeypress = (e) => {
                if (e.key === 'Enter') sendMessage();
            };
        }
    };

    const sendMessage = async () => {
        const input = document.getElementById('agent-input');
        const text = input.value.trim();
        if (!text) return;

        // 1. User Message
        addMessage(USER_NAME, text, 'user');
        input.value = '';

        // 2. Show typing indicator
        showTypingIndicator(true);

        let response;
        try {
            // 3. Try REAL Gemini AI via backend
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, context: 'Chat de operador de flota' })
            });

            if (res.ok) {
                const data = await res.json();
                response = data.response;
                void("🤖 NexoBot: Gemini AI response");
            } else {
                // AI not available, use mock
                response = await generateMockResponse(text);
                void("🤖 NexoBot: Mock response (AI unavailable)");
            }
        } catch (e) {
            // Offline or server down, use mock
            response = await generateMockResponse(text);
            void("🤖 NexoBot: Mock response (offline)");
        }

        showTypingIndicator(false);
        addMessage(AGENT_NAME, response, 'agent');
    };

    const addMessage = (sender, text, type) => {
        const chatBody = document.getElementById('agent-chat-body');
        if (!chatBody) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `agent-msg ${type}`;

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        msgDiv.innerHTML = `
            <div class="agent-avatar">
                ${type === 'agent' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>'}
            </div>
            <div class="agent-bubble">
                <div class="agent-meta">
                    <span class="agent-name">${sender}</span>
                    <span class="agent-time">${time}</span>
                </div>
                <div class="agent-text">${text}</div>
            </div>
        `;

        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    };

    const showTypingIndicator = (show) => {
        const chatBody = document.getElementById('agent-chat-body');
        const existing = document.getElementById('agent-typing');

        if (show) {
            if (existing) return;
            const typingDiv = document.createElement('div');
            typingDiv.id = 'agent-typing';
            typingDiv.className = 'agent-msg agent';
            typingDiv.innerHTML = `
                <div class="agent-avatar"><i class="fas fa-robot"></i></div>
                <div class="agent-bubble typing-bubble">
                    <div class="typing-dots"><span></span><span></span><span></span></div>
                </div>
            `;
            chatBody.appendChild(typingDiv);
            chatBody.scrollTop = chatBody.scrollHeight;
        } else {
            if (existing) existing.remove();
        }
    };

    const generateMockResponse = async (input) => {
        const lower = input.toLowerCase();

        try {
            // INTENT 1: FLOTA / BARCOS
            if (lower.includes('barco') || lower.includes('flota') || lower.includes('buque') || lower.includes('donde')) {
                const { data } = await window.sb.fetchMine('vessels', 'name, status, cargo_percent');
                if (!data || data.length === 0) return "No encuentro embarcaciones registradas en tu flota activa.";

                const actives = data.filter(v => esActivoAg(v.status)).length;
                const total = data.length;
                let msg = `📊 **Estado de Flota:**\nTienes **${activeCount(data)} unidades operativas** de un total de ${total}.\n`;

                // Add detail of first 3 active
                const preview = data.filter(v => esActivoAg(v.status)).slice(0, 3).map(v => `- 🚢 ${v.name} (${v.cargo_percent}% Carga)`).join('\n');
                if (preview) msg += `\nUnidades destacadas:\n${preview}`;
                return msg;
            }

            // INTENT 2: TRIPULACIÓN / GENTE
            if (lower.includes('tripula') || lower.includes('gente') || lower.includes('capitan') || lower.includes('personal')) {
                const { data } = await window.sb.fetchMine('crew_members', 'full_name, role, status');
                if (!data || data.length === 0) return "No hay personal registrado en el sistema.";

                // crew_members guarda 'embarcado' / 'franco' (español), no
                // 'active' / 'leave'. Sin esto el copiloto decía 0 embarcados.
                const estadoTrip = (x) => String(x.status || '').toLowerCase().trim();
                const active = data.filter(c => ['active', 'embarcado', 'activo'].includes(estadoTrip(c))).length;
                const onLeave = data.filter(c => ['leave', 'franco', 'descanso'].includes(estadoTrip(c))).length;

                return `👥 **Reporte de RRHH:**\nActualmente hay **${active} tripulantes embarcados** y ${onLeave} de franco.\n\nRoles destacados: ${countRoles(data)}`;
            }

            // INTENT 3: MANTENIMIENTO / ALERTAS
            if (lower.includes('mantenimiento') || lower.includes('alerta') || lower.includes('roto') || lower.includes('falla')) {
                const { data } = await window.sb.fetchMine('maintenance_logs', 'title, priority, status');
                const pending = data ? data.filter(l => l.status !== 'closed') : [];

                if (pending.length === 0) return "✅ **Todo en orden.** No hay alertas de mantenimiento activas.";

                const critical = pending.filter(p => p.priority === 'critical' || p.priority === 'high').length;
                return `🛠️ **Atención Requerida:**\nTienes **${pending.length} órdenes abiertas** (${critical} de alta prioridad).\n\nÚltima: "${pending[0].title}"`;
            }

            // INTENT 4: INVENTARIO / PAÑOL
            if (lower.includes('stock') || lower.includes('pañol') || lower.includes('repuesto')) {
                const { data } = await window.sb.fetchMine('inventory_items', 'name, stock_current, stock_min_alert');
                const lowStock = data ? data.filter(i => i.stock_current <= i.stock_min_alert) : [];

                if (lowStock.length > 0) {
                    return `⚠️ **Alerta de Stock:**\nHay ${lowStock.length} ítems por debajo del mínimo.\nRevisar: ${lowStock[0].name} (Queda: ${lowStock[0].stock_current})`;
                }
                return "📦 El inventario parece saludable. Todos los ítems están por encima del stock mínimo.";
            }

            // GREETING / FALLBACK
            if (lower.includes('hola') || lower.includes('buenos')) return "¡Hola! Soy Antigravity, tu analista de flota. Pregúntame sobre tus barcos, tripulación o mantenimiento.";
            if (lower.includes('gracias')) return "De nada. Estoy monitoreando la flota 24/7.";

            return "Entiendo tu consulta, pero por seguridad necesito que seas más específico. Prueba preguntar por 'estado de flota', 'tripulación activa' o 'alertas de mantenimiento'.";

        } catch (e) {
            console.error("AI Error:", e);
            return "Lo siento, tuve un error de conexión al consultar la base de datos segura.";
        }
    };

    // Helpers
    const activeCount = (list) => list.filter(x => esActivoAg(x.status)).length;
    const countRoles = (list) => {
        const captains = list.filter(x => x.role.includes('apit')).length;
        const engineers = list.filter(x => x.role.includes('qui')).length;
        return `${captains} Capitanes, ${engineers} Maquinistas.`;
    };

    return { init };
})();

window.AgentChatModule = AgentChatModule;
