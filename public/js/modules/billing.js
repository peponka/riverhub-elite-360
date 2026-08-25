// Facturacion comercial: los contratos se gestionan con ventas, no por checkout online.
const BillingModule = (() => {
    const init = () => {
        const container = document.getElementById('view-billing') || document.getElementById('content-area');
        if (!container) return;
        container.innerHTML = `<section class="bill-container" style="max-width:1050px;margin:auto;padding:32px"><div class="bill-hero"><h1 class="bill-hero-title">PLANES POR FLOTA</h1><p class="bill-hero-sub">Cada barcaza y cada remolcador ocupan una unidad del plan. Elegi segun el tamano real de tu operacion.</p></div><div id="fleet-plan-cards" class="bill-plans-grid"></div><div class="bill-trust"><div class="bill-trust-item"><i class="fas fa-calendar"></i><span>Compromiso anual de 12 meses</span></div><div class="bill-trust-item"><i class="fas fa-handshake"></i><span>Facturacion mensual o prepago anual con hasta 10%</span></div><div class="bill-trust-item"><i class="fas fa-ship"></i><span>Piloto: 60 dias, hasta 15 embarcaciones</span></div></div><p style="text-align:center"><a class="bill-select-btn" href="/pricing.html#contacto">SOLICITAR PROPUESTA COMERCIAL</a></p></section>`;
        loadPlans();
    };
    const loadPlans = async () => {
        const target = document.getElementById('fleet-plan-cards');
        if (!target) return;
        try {
            const response = await fetch('/api/pricing');
            const { plans } = await response.json();
            target.innerHTML = plans.map((plan) => `<article class="bill-plan-card ${plan.popular ? 'popular' : ''}">${plan.popular ? '<div class="bill-popular-tag">MAS ELEGIDO</div>' : ''}<h3 class="bill-plan-name">${plan.name}</h3><div class="bill-plan-price"><span class="bill-currency">USD</span><span class="bill-amount">${plan.monthlyPrice.toLocaleString('en-US')}</span><span class="bill-period">/ mes</span></div><div class="bill-plan-limits"><span><i class="fas fa-ship"></i> Hasta ${plan.capacity} embarcaciones</span></div><p>Cada unidad puede ser una barcaza o un remolcador.</p><a class="bill-select-btn" href="/pricing.html#contacto">Solicitar demo</a></article>`).join('');
        } catch (_) { target.innerHTML = '<p>No se pudo cargar el catalogo. Volve a intentarlo.</p>'; }
    };
    return { init };
})();
window.BillingModule = BillingModule;
