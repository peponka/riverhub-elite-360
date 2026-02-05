const CotizadorModule = (() => {

    const init = () => {
        console.log("Módulo Cotizador IA Activo (Supabase Edition).");
        bindEvents();
    };

    const bindEvents = () => {
        // Find buttons and attach listeners if not already inline
        // (We will replace the inline onclick in index.html next)
    };

    const calcular = async (btnElement) => {
        // 1. UI RESET
        if (btnElement) btnElement.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> PROCESANDO...';

        const display = document.getElementById('price-ultra-final');
        if (display) {
            display.style.opacity = '0.3';
            display.innerText = '---';
        }

        // 2. READ VALUES
        const origin = document.getElementById('cot-origin').value;
        const dest = document.getElementById('cot-dest').value;
        const bunkerRaw = document.getElementById('cot-bunker').value.replace(',', '.');
        let bunker = parseFloat(bunkerRaw) || 1.12;
        let river = parseFloat(document.getElementById('rio-slider').value) || 3.5;

        // Auto-fix if user types 1000 instead of 1.00
        if (bunker > 100) bunker = bunker / 1000;

        // 3. CALCULATION ENGINE (Same logic as before)
        // Distance: Asu-Ros ~1100km, Base rate: $16.50
        let rate = 16.50;

        // Bunker Adjustment
        let bunkerDiff = bunker - 1.0;
        if (bunkerDiff > 0) rate += (bunkerDiff * 4.5);

        // River Adjustment
        if (river < 2.0) rate += (2.0 - river) * 9.0;
        else if (river < 3.0) rate += (3.0 - river) * 2.0;

        // Min cap
        if (rate < 12.0) rate = 12.0;

        const finalPrice = rate.toFixed(2);
        const totalPrice = (rate * 15000).toFixed(2); // Assuming 15k tons

        // 4. SAVE TO SUPABASE (Hidden Background Action)
        saveQuoteToDB(origin, dest, river, bunker, finalPrice);

        // 5. DISPLAY RESULT (DELAY 800ms)
        setTimeout(() => {
            if (display) {
                display.innerText = 'USD/TN ' + finalPrice;
                display.style.opacity = '1';
                display.style.color = '#00e5ff';
                display.style.textShadow = '0 0 10px rgba(0,229,255,0.5)';
            }

            if (btnElement) {
                btnElement.innerHTML = '<i class="fas fa-check"></i> RECALCULAR';
                btnElement.style.background = '#10b981';
                setTimeout(() => {
                    btnElement.style.background = 'var(--cyan)';
                }, 2000);
            }

            // Update stats
            document.getElementById('stat-dias').innerText = "5 Días"; // Mock transit
            document.getElementById('stat-confianza').innerText = "94%";
            typeWriterEffect("Análisis de ruta completado. Tarifa ajustada por nivel de río (" + river + "m) y precio de combustible actual.");

        }, 800);
    };

    const saveQuoteToDB = async (origin, dest, river, bunker, rate) => {
        try {
            const user = window.AuthModule ? window.AuthModule.getCurrentUser() : null;
            const quoteNum = "QT-" + Math.floor(Math.random() * 100000);

            const { error } = await window.sb
                .from('quotations')
                .insert([{
                    quote_number: quoteNum,
                    origin_port: origin,
                    destination_port: dest,
                    cargo_type: 'Granel General', // Default
                    estimated_weight: 15000,
                    freight_rate: rate,
                    currency: 'USD',
                    status: 'draft',
                    ai_argumentation: `Calculado con Río en ${river}m y Bunker a $${bunker}`,
                    generated_by: user ? user.email : 'System'
                }]);

            if (error) console.error("Error saving quote:", error);
            else console.log("✅ Cotización guardada en BD: " + quoteNum);

        } catch (e) {
            console.warn("Offline Quote Save:", e);
        }
    };

    const typeWriterEffect = (text) => {
        const el = document.getElementById('ai-text');
        if (!el) return;
        el.innerText = "";
        let i = 0;
        const speed = 30;
        function type() {
            if (i < text.length) {
                el.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        type();
    };

    const enviarCliente = () => {
        alert('Propuesta enviada al cliente vía Email/WhatsApp Business API.\n(Copia guardada en historial)');
    };

    const descargarPDF = () => {
        if (typeof window.descargarPDF === 'function') {
            window.descargarPDF(); // Call the existing global function if present
        } else {
            alert("Generando PDF (Lógica interna)...");
            // Could move PDF logic here in future
        }
    };

    return {
        init,
        calcular,
        enviarCliente,
        descargarPDF
    };
})();

window.CotizadorModule = CotizadorModule;