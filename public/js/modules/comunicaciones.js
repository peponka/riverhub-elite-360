// js/modules/comunicaciones.js

var CommsModule = (() => {
    const state = {
        activeChannel: 'CH-16',
        messages: [],
        subscription: null,
        currentUser: null
    };

    const init = async () => {
        void("Módulo Comunicaciones Activo (Supabase Realtime).");
        state.currentUser = window.AuthModule ? window.AuthModule.getCurrentUser() : null;

        setupChannelListeners();
        setupInputListeners();

        // Initial Load
        await loadMessages();

        // Subscribe to Realtime
        subscribeToChannel();
    };

    const setupChannelListeners = () => {
        const channels = document.querySelectorAll('.channel-card');
        channels.forEach(ch => {
            ch.addEventListener('click', (e) => {
                channels.forEach(c => c.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');

                const chName = target.querySelector('.ch-number').innerText;
                switchChannel(chName);
            });
        });
    };

    const switchChannel = async (newChannel) => {
        if (state.activeChannel === newChannel) return;
        state.activeChannel = newChannel;

        // Update Title
        const titleEl = document.getElementById('active-ch-title');
        if (titleEl) titleEl.innerText = `CONSOLA DE DESPACHO ${newChannel}`;

        // Clear Chat
        const chatArea = document.getElementById('comm-chat-area');
        if (chatArea) chatArea.innerHTML = '<div style="text-align:center; padding:10px; color:#00e5ff;">Cambiando frecuencia...</div>';

        // Reload & Resubscribe
        await loadMessages();
        subscribeToChannel();
    };

    const loadMessages = async () => {
        const chatArea = document.getElementById('comm-chat-area');

        let res = await window.sb
            .from('comms') 
            .select('*')
            .eq('channel', state.activeChannel)
            .order('created_at', { ascending: true })
            .limit(50);

        if (res.error) {
            console.error(res.error);
            // Ignore error locally and render empty or old state
            state.messages = [];
        } else {
            state.messages = res.data || [];
        }

        renderMessages();
        scrollToBottom();
    };

    const renderMessages = () => {
        const chatArea = document.getElementById('comm-chat-area');
        if (!chatArea) return;

        chatArea.innerHTML = '';
        if (state.messages.length === 0) {
            chatArea.innerHTML = '<div style="text-align:center; padding:10px; color:#64748b; font-size: 0.85rem;">Canal despejado. Sin tráfico de radio reciente.</div>';
        } else {
            state.messages.forEach(msg => appendMessageDOM(msg));
        }
    };

    const appendMessageDOM = (msg) => {
        const chatArea = document.getElementById('comm-chat-area');
        if (!chatArea) return;

        // Check if message is from current user
        const isMe = state.currentUser ? (state.currentUser.id === msg.user_id) : false;

        const date = msg.created_at ? new Date(msg.created_at) : new Date();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Structure matching new 'Elite 360' CSS
        const wrapperClass = isMe ? 'msg-wrapper self' : 'msg-wrapper';
        const senderName = msg.sender || 'ANÓNIMO';
        const senderColor = isMe ? '#06b6d4' : '#ef4444'; // Cyan vs Red

        const html = `
            <div class="${wrapperClass}">
                <div class="msg-meta">
                    <span class="sender-tag" style="color:${senderColor};">● ${senderName}</span>
                    <span>[${timeStr}]</span>
                    <span class="vhf-tag">${msg.type || 'VHF'}</span>
                </div>
                <div class="msg-bubble">
                    ${msg.content}
                </div>
            </div>
        `;

        chatArea.insertAdjacentHTML('beforeend', html);
    };

    const scrollToBottom = () => {
        const chatArea = document.getElementById('comm-chat-area');
        if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
    };

    const setupInputListeners = () => {
        const input = document.getElementById('comm-input');
        const btn = document.getElementById('btn-ptt');

        if (input) {
            input.onkeypress = (e) => {
                if (e.key === 'Enter') sendMessage();
            };
        }

        if (btn) btn.onclick = sendMessage;
    };

    const sendMessage = async () => {
        const input = document.getElementById('comm-input');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';

        const senderName = state.currentUser
            ? (state.currentUser.email.split('@')[0].toUpperCase()) // Fallback name
            : 'OPERADOR';

        // N8N Alert Trigger if distress words
        const lowText = text.toLowerCase();
        if (lowText.includes('sos') || lowText.includes('mayday') || lowText.includes('emergencia')) {
            fetch('/api/n8n/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'distress', payload: { channel: state.activeChannel, user: senderName, message: text } })
            }).catch(()=>{});
        }

        try {
            let res = await window.sb.insertMine('comms', {
                channel: state.activeChannel,
                sender: senderName,
                user_id: state.currentUser ? state.currentUser.id : null,
                content: text,
                type: 'VHF'
            });

            if (res.error) {
                console.warn("insertMine error, falling back...", res.error.message);
                res = await window.sb.from('comms').insert([{
                    channel: state.activeChannel,
                    sender: senderName,
                    user_id: state.currentUser ? state.currentUser.id : null,
                    content: text,
                    type: 'VHF'
                }]);
                if (res.error) throw res.error;
            }

            // Trigger AI Bot Reply on successful DB insert
            if (!senderName.includes('CAPITAN')) {
                setTimeout(async () => {
                    const replies = ['Copiado Central.', 'Afirmativo, procedemos.', 'Enterado, mantengo escucha.', 'Recibido, ETA confirmado.', 'Negativo, viento fuerte en zona.'];
                    const randomReply = replies[Math.floor(Math.random() * replies.length)];

                    await window.sb.from('comms').insert([{
                        channel: state.activeChannel,
                        sender: 'CAPITAN TB-101',
                        user_id: 'bot-101',
                        content: randomReply,
                        type: 'VHF'
                    }]);
                }, 3500);
            }
        } catch (error) {
            // Local fallback simulation if DB RLS blocks us
            console.warn("⚠️ RLS/Network Error. Mensaje insertado modo local DEMO.");
            
            const fakeMsg = {
                channel: state.activeChannel,
                sender: senderName,
                user_id: state.currentUser ? state.currentUser.id : 'demo',
                content: text,
                type: 'LOCAL',
                created_at: new Date().toISOString()
            };
            
            state.messages.push(fakeMsg);
            appendMessageDOM(fakeMsg);
            scrollToBottom();

            // Fake bot reply
            setTimeout(() => {
                const fakeBotMsg = {
                    channel: state.activeChannel,
                    sender: 'CAPITAN TB-101 (BOT)',
                    user_id: 'bot-101',
                    content: 'Recibido en modo Local (No guardado en nube).',
                    type: 'VHF',
                    created_at: new Date().toISOString()
                };
                state.messages.push(fakeBotMsg);
                appendMessageDOM(fakeBotMsg);
                scrollToBottom();
            }, 2500);
        }

        await loadMessages();
    };

    const subscribeToChannel = () => {
        // Remove previous sub
        if (state.subscription) {
            window.sb.removeChannel(state.subscription);
        }

        state.subscription = window.sb
            .channel('public:comms')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'comms',
                filter: `channel=eq.${state.activeChannel}`
            }, (payload) => {
                void('New Msg:', payload);
                // Don't duplicate if we just sent it and appended locally (though loadMessages handles sync ideally)
                // We just append to end and scroll over
                state.messages.push(payload.new);
                appendMessageDOM(payload.new);
                scrollToBottom();
            })
            .subscribe();
    };

    return { init };
})();

window.CommsModule = CommsModule;

