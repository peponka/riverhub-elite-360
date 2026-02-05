// js/modules/comunicaciones.js

var CommsModule = (() => {
    const state = {
        activeChannel: 'CH-16',
        messages: [],
        subscription: null,
        currentUser: null
    };

    const init = async () => {
        console.log("Módulo Comunicaciones Activo (Supabase Realtime).");
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

        const { data, error } = await window.sb
            .from('comms') // Table Name: comms (The Fresh Start)
            .select('*')
            .eq('channel', state.activeChannel)
            .order('created_at', { ascending: true })
            .limit(50);

        if (error) {
            console.error(error);
            return;
        }

        state.messages = data || [];
        renderMessages();
        scrollToBottom();
    };

    const renderMessages = () => {
        const chatArea = document.getElementById('comm-chat-area');
        if (!chatArea) return;

        chatArea.innerHTML = '';
        state.messages.forEach(msg => appendMessageDOM(msg));
    };

    const appendMessageDOM = (msg) => {
        const chatArea = document.getElementById('comm-chat-area');
        if (!chatArea) return;

        // Check if message is from current user
        const isMe = state.currentUser ? (state.currentUser.id === msg.user_id) : false;

        const date = new Date(msg.created_at);
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

        const { error } = await window.sb
            .from('comms') // Table Name: comms
            .insert([{
                channel: state.activeChannel,
                sender: senderName, // In real app, fetch from profile
                user_id: state.currentUser ? state.currentUser.id : null,
                content: text,
                type: 'VHF'
            }]);

        if (error) {
            console.error("Send error:", error);
            alert("Error Supabase: " + (error.message || JSON.stringify(error)));
        } else {
            // SUCCESS - TRIGGER AUTO REPLY SIMULATION IF NOT A BOT
            if (!senderName.includes('CAPITAN')) {
                setTimeout(async () => {
                    const replies = ['Copiado Central.', 'Afirmativo, procedemos.', 'Enterado, mantengo escucha.', 'Recibido, ETA confirmado.', 'Negativo, viento fuerte en zona.'];
                    const randomReply = replies[Math.floor(Math.random() * replies.length)];

                    await window.sb
                        .from('comms')
                        .insert([{
                            channel: state.activeChannel,
                            sender: 'CAPITAN TB-101',
                            user_id: 'bot-101',
                            content: randomReply,
                            type: 'VHF'
                        }]);
                }, 3500);
            }
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
                console.log('New Msg:', payload);
                appendMessageDOM(payload.new);
                scrollToBottom();
            })
            .subscribe();
    };

    return { init };
})();

window.CommsModule = CommsModule;
