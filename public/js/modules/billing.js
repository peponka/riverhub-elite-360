// ============================================
// BILLING MODULE — Suscripción Premium + Checkout
// FluviaFleet — Pasarela Simulada
// ============================================

const BillingModule = (() => {
    const plans = [
        { id: 'solist', name: 'SOLIST', price: 150, color: '#64748b', icon: 'fa-anchor', vessels: 1, users: 1, features: ['1 Embarcación', '1 Usuario', 'Dashboard Básico', 'Tracking AIS', 'Soporte Email'] },
        { id: 'squad', name: 'SQUAD', price: 450, color: '#10b981', icon: 'fa-ship', vessels: 3, users: 3, popular: true, features: ['3 Embarcaciones', '3 Usuarios', 'Reportes Avanzados', 'Armador de Convoy', 'Soporte Prioritario', 'Bitácora Digital'] },
        { id: 'expansion', name: 'EXPANSIÓN', price: 1200, color: '#00e5ff', icon: 'fa-rocket', vessels: 10, users: 5, features: ['10 Embarcaciones', '5 Usuarios', 'IA Cotizador', 'API Integraciones', 'Load Master', 'Soporte 24/7', 'n8n Automations'] },
        { id: 'admiral', name: 'ADMIRAL', price: 1800, color: '#a855f7', icon: 'fa-crown', vessels: '∞', users: '∞', features: ['Embarcaciones Ilimitadas', 'Usuarios Ilimitados', 'White-Label', 'Gerente de Cuenta', 'SLA Garantizado', 'Deploy Dedicado', 'Todo incluido'] }
    ];

    let selectedPlan = null;

    const init = () => {
        console.log("💳 BillingModule: Initializing...");

        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment');
        if (paymentStatus) {
            if (paymentStatus === 'success_mock') {
                if (window.RiverToast) RiverToast.success('¡Suscripción de prueba activada exitosamente!', 'Pago Aprobado (Simulado)');
            } else if (paymentStatus === 'success') {
                if (window.RiverToast) RiverToast.success('¡El pago se completó exitosamente. Bienvenido a la flota Premium!', 'Suscripción Activa');
            } else if (paymentStatus === 'cancel') {
                if (window.RiverToast) RiverToast.warning('El proceso de pago fue cancelado.', 'Pago Cancelado');
            }
            
            const url = new URL(window.location);
            url.searchParams.delete('payment');
            window.history.replaceState({}, '', url.toString());
        }

        let container = document.getElementById('view-billing');
        const contentArea = document.getElementById('content-area');
        if (!container && contentArea) {
            container = document.createElement('div');
            container.id = 'view-billing';
            container.className = 'view-section';
            container.style.display = 'block';
            contentArea.appendChild(container);
        } else if (container && contentArea && !contentArea.contains(container)) {
            container.style.display = 'block';
            contentArea.appendChild(container);
        }
        if (container) container.style.display = 'block';
        if (!container) return;

        renderPlans(container);
    };

    const renderPlans = (container) => {
        container.innerHTML = `
            <div class="bill-container">
                <div class="bill-hero">
                    <div class="bill-hero-glow"></div>
                    <i class="fas fa-crown bill-hero-icon"></i>
                    <h1 class="bill-hero-title">ELIGE TU PLAN</h1>
                    <p class="bill-hero-sub">Potenciá tu operación fluvial con la tecnología más avanzada</p>
                    <div class="bill-toggle">
                        <span class="bill-toggle-label active" data-period="monthly">Mensual</span>
                        <div class="bill-toggle-switch" onclick="BillingModule.togglePeriod()">
                            <div class="bill-toggle-knob" id="bill-knob"></div>
                        </div>
                        <span class="bill-toggle-label" data-period="annual">Anual <span class="bill-save">-20%</span></span>
                    </div>
                </div>

                <div class="bill-plans-grid" id="bill-plans">
                    ${plans.map(p => `
                        <div class="bill-plan-card ${p.popular ? 'popular' : ''}" style="--plan-c:${p.color};">
                            ${p.popular ? '<div class="bill-popular-tag"><i class="fas fa-fire"></i> MÁS POPULAR</div>' : ''}
                            <div class="bill-plan-icon" style="background:${p.color}15; color:${p.color};"><i class="fas ${p.icon}"></i></div>
                            <h3 class="bill-plan-name">${p.name}</h3>
                            <div class="bill-plan-price">
                                <span class="bill-currency">$</span>
                                <span class="bill-amount" data-monthly="${p.price}" data-annual="${Math.round(p.price * 0.8)}">${p.price}</span>
                                <span class="bill-period">/mes</span>
                            </div>
                            <div class="bill-plan-limits">
                                <span><i class="fas fa-ship"></i> ${p.vessels} embarcaciones</span>
                                <span><i class="fas fa-users"></i> ${p.users} usuarios</span>
                            </div>
                            <ul class="bill-features">
                                ${p.features.map(f => `<li><i class="fas fa-check" style="color:${p.color};"></i> ${f}</li>`).join('')}
                            </ul>
                            <button class="bill-select-btn" style="--btn-c:${p.color};" onclick="BillingModule.selectPlan('${p.id}')">
                                SELECCIONAR ${p.name}
                            </button>
                        </div>
                    `).join('')}
                </div>

                <div class="bill-trust">
                    <div class="bill-trust-item"><i class="fas fa-shield-alt"></i><span>Pago Seguro SSL</span></div>
                    <div class="bill-trust-item"><i class="fas fa-sync-alt"></i><span>Cancelá cuando quieras</span></div>
                    <div class="bill-trust-item"><i class="fas fa-headset"></i><span>Soporte 24/7</span></div>
                    <div class="bill-trust-item"><i class="fas fa-undo"></i><span>30 días de garantía</span></div>
                </div>
            </div>
        `;
    };

    const togglePeriod = () => {
        const knob = document.getElementById('bill-knob');
        const isAnnual = knob.classList.toggle('annual');
        document.querySelectorAll('.bill-toggle-label').forEach(l => l.classList.remove('active'));
        document.querySelector(`.bill-toggle-label[data-period="${isAnnual ? 'annual' : 'monthly'}"]`).classList.add('active');
        document.querySelectorAll('.bill-amount').forEach(el => {
            el.textContent = isAnnual ? el.dataset.annual : el.dataset.monthly;
        });
    };

    const selectPlan = async (planId) => {
        selectedPlan = plans.find(p => p.id === planId);
        if (!selectedPlan) return;
        
        const btnEvent = window.event;
        let originalText = "";
        let btn = null;
        if (btnEvent && btnEvent.target) {
            btn = btnEvent.target.closest('button');
            if (btn) {
                originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> CONECTANDO...';
                btn.disabled = true;
            }
        }

        try {
            const user = AuthModule.getCurrentUser();
            const { data: profile } = await window.sb.from('profiles').select('company_id').eq('id', user.id).single();
            const cid = profile?.company_id || 'demo-company';

            const res = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId,
                    companyId: cid,
                    email: user.email
                })
            });

            if (!res.ok) throw new Error("Error en respuesta del servidor");
            const { url } = await res.json();
            
            // Si es la ruta MOCK, evitamos la recarga completa para no matar la sesión del simulador
            if (url.includes('success_mock')) {
                if (window.RiverToast) RiverToast.success('¡Suscripción de prueba activada exitosamente!', 'Pago Aprobado (Simulado)');
                if (btn) {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
                return;
            }

            window.location.href = url; // Redirige a la pasarela real de Stripe Checkout
        } catch (err) {
            console.error(err);
            if (window.RiverToast) RiverToast.error('Falló la conexión con la pasarela de pago segura.', 'Error de Pago');
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }
    };

    const showCheckout = () => {
        let modal = document.getElementById('bill-checkout-modal');
        if (!modal) { modal = document.createElement('div'); modal.id = 'bill-checkout-modal'; document.body.appendChild(modal); }

        const isAnnual = document.getElementById('bill-knob')?.classList.contains('annual');
        const price = isAnnual ? Math.round(selectedPlan.price * 0.8) : selectedPlan.price;

        modal.innerHTML = `
            <div class="bill-overlay" onclick="if(event.target===this) BillingModule.closeCheckout()">
                <div class="bill-checkout">
                    <div class="bill-checkout-header" style="border-color:${selectedPlan.color};">
                        <button class="bill-close" onclick="BillingModule.closeCheckout()"><i class="fas fa-times"></i></button>
                        <i class="fas ${selectedPlan.icon}" style="color:${selectedPlan.color}; font-size:2rem;"></i>
                        <h2>Plan ${selectedPlan.name}</h2>
                        <div class="bill-checkout-price">$${price}<span>/mes</span></div>
                    </div>

                    <div class="bill-checkout-body">
                        <div class="bill-step">
                            <h3><span class="bill-step-num">1</span> Datos de Facturación</h3>
                            <div class="bill-form-grid">
                                <div class="bill-field full">
                                    <label>Razón Social / Nombre</label>
                                    <input type="text" id="bill-name" placeholder="Mi Empresa S.A.">
                                </div>
                                <div class="bill-field">
                                    <label>RUC / CUIT / NIT</label>
                                    <input type="text" id="bill-ruc" placeholder="80012345-6">
                                </div>
                                <div class="bill-field">
                                    <label>Email de Facturación</label>
                                    <input type="email" id="bill-email" placeholder="admin@empresa.com">
                                </div>
                            </div>
                        </div>

                        <div class="bill-step">
                            <h3><span class="bill-step-num">2</span> Método de Pago</h3>
                            <div class="bill-payment-methods">
                                <label class="bill-method active" onclick="BillingModule.selectMethod(this, 'card')">
                                    <input type="radio" name="method" value="card" checked>
                                    <i class="fas fa-credit-card"></i><span>Tarjeta</span>
                                </label>
                                <label class="bill-method" onclick="BillingModule.selectMethod(this, 'transfer')">
                                    <input type="radio" name="method" value="transfer">
                                    <i class="fas fa-university"></i><span>Transferencia</span>
                                </label>
                            </div>

                            <div id="bill-card-form" class="bill-card-form">
                                <div class="bill-card-visual">
                                    <div class="bill-card-chip"></div>
                                    <div class="bill-card-number" id="bill-card-display">•••• •••• •••• ••••</div>
                                    <div class="bill-card-bottom">
                                        <div><span class="bill-card-label">TITULAR</span><span class="bill-card-holder" id="bill-holder-display">NOMBRE APELLIDO</span></div>
                                        <div><span class="bill-card-label">EXPIRA</span><span class="bill-card-exp" id="bill-exp-display">MM/AA</span></div>
                                    </div>
                                </div>
                                <div class="bill-form-grid">
                                    <div class="bill-field full">
                                        <label>Número de Tarjeta</label>
                                        <input type="text" id="bill-card-num" placeholder="4242 4242 4242 4242" maxlength="19" oninput="BillingModule.formatCard(this)">
                                    </div>
                                    <div class="bill-field full">
                                        <label>Titular</label>
                                        <input type="text" id="bill-card-holder" placeholder="NOMBRE APELLIDO" oninput="BillingModule.updateHolder(this)">
                                    </div>
                                    <div class="bill-field">
                                        <label>Vencimiento</label>
                                        <input type="text" id="bill-card-exp" placeholder="MM/AA" maxlength="5" oninput="BillingModule.formatExp(this)">
                                    </div>
                                    <div class="bill-field">
                                        <label>CVV</label>
                                        <input type="text" id="bill-card-cvv" placeholder="123" maxlength="4">
                                    </div>
                                </div>
                            </div>

                            <div id="bill-transfer-form" style="display:none;">
                                <div class="bill-transfer-info">
                                    <h4><i class="fas fa-university" style="color:#3b82f6;"></i> Datos para Transferencia</h4>
                                    <div class="bill-transfer-row"><span>Banco</span><strong>Banco Nacional de Fomento</strong></div>
                                    <div class="bill-transfer-row"><span>Cuenta</span><strong>123-456789-001</strong></div>
                                    <div class="bill-transfer-row"><span>Titular</span><strong>FluviaFleet Technologies S.A.</strong></div>
                                    <div class="bill-transfer-row"><span>Monto</span><strong style="color:#10b981;">$${price} USD</strong></div>
                                    <div class="bill-transfer-row"><span>Ref.</span><strong>RH-${Date.now().toString(36).toUpperCase()}</strong></div>
                                    <p style="color:#f59e0b; font-size:0.8rem; margin-top:12px;"><i class="fas fa-info-circle"></i> Enviá el comprobante a pagos@fluviafleet.com</p>
                                </div>
                            </div>
                        </div>

                        <div class="bill-summary">
                            <div class="bill-summary-row"><span>Plan ${selectedPlan.name}</span><span>$${price}/mes</span></div>
                            <div class="bill-summary-total"><span>TOTAL</span><span>$${price} USD</span></div>
                        </div>
                    </div>

                    <div class="bill-checkout-footer">
                        <div class="bill-secure"><i class="fas fa-lock"></i> Pago seguro encriptado</div>
                        <button class="bill-pay-btn" id="bill-pay-btn" onclick="BillingModule.processPayment()" style="--btn-c:${selectedPlan.color};">
                            <i class="fas fa-lock"></i> PAGAR $${price} USD
                        </button>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => document.querySelector('.bill-overlay')?.classList.add('show'), 50);
    };

    const selectMethod = (el, method) => {
        document.querySelectorAll('.bill-method').forEach(m => m.classList.remove('active'));
        el.classList.add('active');
        document.getElementById('bill-card-form').style.display = method === 'card' ? 'block' : 'none';
        document.getElementById('bill-transfer-form').style.display = method === 'transfer' ? 'block' : 'none';
    };

    const formatCard = (input) => {
        let val = input.value.replace(/\D/g, '').substring(0, 16);
        val = val.replace(/(.{4})/g, '$1 ').trim();
        input.value = val;
        document.getElementById('bill-card-display').textContent = val || '•••• •••• •••• ••••';
    };

    const formatExp = (input) => {
        let val = input.value.replace(/\D/g, '').substring(0, 4);
        if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
        input.value = val;
        document.getElementById('bill-exp-display').textContent = val || 'MM/AA';
    };

    const updateHolder = (input) => {
        document.getElementById('bill-holder-display').textContent = input.value.toUpperCase() || 'NOMBRE APELLIDO';
    };

    const sendWebhookWithRetry = async (url, payload, maxRetries = 2) => {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-api-key': 'RH_Secure_n8n_X9fL!2026' },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return await res.json();
            } catch (err) {
                if (attempt === maxRetries) {
                    if (window.RiverToast) RiverToast.warning('Retraso en envío de recibo.', 'Red Inestable');
                    throw err;
                }
                await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            }
        }
    };

    const processPayment = async () => {
        const btn = document.getElementById('bill-pay-btn');
        const name = document.getElementById('bill-name')?.value.trim();
        const email = document.getElementById('bill-email')?.value.trim();
        const cardNum = document.getElementById('bill-card-num')?.value.trim();
        const method = document.querySelector('input[name="method"]:checked')?.value;

        if (!name) { if (window.RiverToast) RiverToast.warning('Ingresá la razón social.', 'Billing'); return; }
        if (!email) { if (window.RiverToast) RiverToast.warning('Ingresá el email.', 'Billing'); return; }
        if (method === 'card' && (!cardNum || cardNum.length < 16)) { if (window.RiverToast) RiverToast.warning('Tarjeta inválida.', 'Billing'); return; }

        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> PROCESANDO...';
        btn.disabled = true;

        try {
            await new Promise(r => setTimeout(r, 2000));

            if (window.sb) {
                const { error } = await window.sb.from('payments').insert([{
                    amount: selectedPlan.price, currency: 'USD', payment_method: method,
                    gateway: 'SIMULADO', status: 'completed',
                    invoice_number: 'INV-' + Date.now().toString(36).toUpperCase(),
                    metadata: { plan: selectedPlan.id, name, email }
                }]);
                if (error) {
                    console.warn("Payment save error:", error);
                    throw new Error("No se pudo registrar en la base de datos.");
                }
            }

            try {
                await sendWebhookWithRetry('/api/n8n/webhook', {
                    event: 'PAYMENT_COMPLETED',
                    company: name,
                    email: email,
                    amount: selectedPlan.price,
                    plan: selectedPlan.name,
                    timestamp: new Date().toISOString()
                });
                console.log("n8n Webhook Sent: PAYMENT_COMPLETED");
            } catch (webhookErr) {
                console.warn("Fallo el envío del recibo vía n8n, pero el pago se procesó:", webhookErr);
            }

            showSuccess();
        } catch (err) {
            console.error(err);
            if (window.RiverToast) RiverToast.error('Corte de conexión detectado. Reintenta el pago.', 'Fallo de Red');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    };

    const showSuccess = () => {
        const modal = document.getElementById('bill-checkout-modal');
        if (!modal) return;

        modal.innerHTML = `
            <div class="bill-overlay show">
                <div class="bill-success">
                    <div class="bill-success-check">
                        <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="25" fill="none" stroke="${selectedPlan.color}" stroke-width="2"/><path fill="none" stroke="${selectedPlan.color}" stroke-width="3" stroke-linecap="round" d="M14 27l7 7 16-16"/></svg>
                    </div>
                    <h2>¡Pago Exitoso!</h2>
                    <p>Plan <strong style="color:${selectedPlan.color};">${selectedPlan.name}</strong> activado.</p>
                    <div class="bill-success-details">
                        <div><span>Monto</span><strong>$${selectedPlan.price} USD/mes</strong></div>
                        <div><span>Ref.</span><strong>RH-${Date.now().toString(36).toUpperCase()}</strong></div>
                        <div><span>Estado</span><strong style="color:#10b981;">CONFIRMADO ✓</strong></div>
                    </div>
                    <button class="bill-success-btn" style="--btn-c:${selectedPlan.color};" onclick="BillingModule.closeCheckout();">
                        <i class="fas fa-rocket"></i> EMPEZAR
                    </button>
                </div>
            </div>
        `;
    };

    const closeCheckout = () => {
        const modal = document.getElementById('bill-checkout-modal');
        if (modal) modal.innerHTML = '';
    };

    return { init, selectPlan, togglePeriod, selectMethod, formatCard, formatExp, updateHolder, processPayment, closeCheckout };
})();

window.BillingModule = BillingModule;

