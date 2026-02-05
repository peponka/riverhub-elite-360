const BillingModule = (() => {

    const init = () => {
        console.log("💳 Inicializando Módulo de Facturación (Precios v2)...");
        const container = document.getElementById('view-billing');
        if (!container) {
            console.error("Critical: #view-billing container not found!");
            return;
        }
        renderView(container);
    };

    const renderView = (container) => {
        container.innerHTML = `
            <div class="billing-container" style="display:block; text-align:center; padding: 0; width: 100%; max-width: 100%; height: auto; overflow: visible; background: transparent; border: none; box-shadow: none;">
                
                <div style="text-align: left; margin-bottom: 20px;">
                     <a href="/" class="btn-ghost-blue" style="text-decoration: none; font-size: 0.9rem;">
                        <i class="fas fa-arrow-left"></i> Volver al Inicio (Landing)
                     </a>
                </div>

                <h2 style="font-family:'Rajdhani'; font-size:2.5rem; color:#fff; margin-bottom:10px;">
                    Elige el Potencial de tu Flota
                </h2>
                <p style="color:#94a3b8; font-size:1.1rem; max-width:600px; margin:0 auto 40px auto;">
                    Tecnología de punta escalada a tu operación. Paga solo por lo que usas.
                </p>

                <div class="pricing-grid" style="display:flex; justify-content:center; gap:25px; flex-wrap:wrap; padding-bottom:50px;">
                    
                    <!-- PLAN 1: SOLIST (UNITARIO) -->
                    <div class="pricing-card" style="background:#0f172a; border:1px solid #334155; border-radius:15px; padding:30px; width:300px; position:relative; min-width:280px;">
                        <div style="font-size:1.2rem; color:#94a3b8; font-weight:bold; letter-spacing:2px;">SOLIST</div>
                        
                        <!-- Price Display -->
                        <div id="price-display-flex" style="font-size:3rem; color:#fff; font-weight:bold; margin:15px 0;">$150<span style="font-size:1rem; color:#64748b">/mes</span></div>
                        
                        <!-- Quantity Selector -->
                        <div style="background:#1e293b; border-radius:8px; padding:10px; display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; border:1px solid #334;">
                            <span style="color:#cbd5e1; font-size:0.9rem;">Embarcaciones:</span>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <button onclick="BillingModule.updateFlexPrice(-1)" style="background:#334155; border:none; color:#fff; width:30px; height:30px; border-radius:50%; cursor:pointer; font-weight:bold;">-</button>
                                <span id="vessel-count-flex" style="color:#00e5ff; font-weight:bold; font-size:1.2rem;">1</span>
                                <button onclick="BillingModule.updateFlexPrice(1)" style="background:#00e5ff; border:none; color:#000; width:30px; height:30px; border-radius:50%; cursor:pointer; font-weight:bold;">+</button>
                            </div>
                        </div>

                        <p style="color:#cbd5e1; font-size:0.9rem; margin-bottom:25px;">Ideal para propietarios independientes.</p>
                        
                        <ul style="text-align:left; color:#cbd5e1; list-style:none; padding:0; margin-bottom:30px; line-height:2;">
                            <li><i class="fas fa-check" style="color:#34d399; margin-right:10px;"></i> Tracking GPS en vivo</li>
                            <li><i class="fas fa-check" style="color:#34d399; margin-right:10px;"></i> Bitácora Digital</li>
                            <li><i class="fas fa-check" style="color:#34d399; margin-right:10px;"></i> 1 Usuario Admin</li>
                        </ul>

                        <button onclick="BillingModule.selectPlan('flex')" class="btn-price" style="width:100%; padding:15px; background:transparent; border:1px solid #3b82f6; color:#3b82f6; border-radius:8px; font-weight:bold; cursor:pointer; transition:all 0.3s;" onmouseover="this.style.background='rgba(59,130,246,0.1)'" onmouseout="this.style.background='transparent'">
                            COMENZAR AHORA
                        </button>
                    </div>

                    <!-- PLAN 2: SQUAD (PACK 3) -->
                    <div class="pricing-card" style="background:#0f172a; border:1px solid #334; border-radius:15px; padding:30px; width:300px; position:relative; min-width:280px;">
                        <div style="font-size:1.2rem; color:#94a3b8; font-weight:bold; letter-spacing:2px;">SQUAD</div>
                        <div style="font-size:3rem; color:#fff; font-weight:bold; margin:15px 0;">$450<span style="font-size:1rem; color:#64748b">/mes</span></div>
                        <p style="color:#cbd5e1; font-size:0.9rem; margin-bottom:25px;">Tu pequeña flota 100% digitalizada.</p>
                        
                        <ul style="text-align:left; color:#cbd5e1; list-style:none; padding:0; margin-bottom:30px; line-height:2;">
                            <li><i class="fas fa-check" style="color:#34d399; margin-right:10px;"></i> Hasta <b>3 Embarcaciones</b></li>
                            <li><i class="fas fa-check" style="color:#34d399; margin-right:10px;"></i> Todo lo del Plan Individual</li>
                            <li><i class="fas fa-plus" style="color:#00e5ff; margin-right:10px;"></i> <b>Gestión Tripulación Basic</b></li>
                        </ul>

                        <button onclick="BillingModule.selectPlan('start')" class="btn-price" style="width:100%; padding:15px; background:transparent; border:1px solid #34d399; color:#34d399; border-radius:8px; font-weight:bold; cursor:pointer; transition:all 0.3s;" onmouseover="this.style.background='rgba(52, 211, 153, 0.1)'" onmouseout="this.style.background='transparent'">
                            CONTRATAR PACK
                        </button>
                    </div>

                    <!-- PLAN 3: EXPANSION (RECOMMENDED) -->
                    <div class="pricing-card recommended" style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border:1px solid #00e5ff; border-radius:15px; padding:30px; width:320px; position:relative; transform:scale(1.05); box-shadow:0 0 30px rgba(0,229,255,0.15); min-width:300px; z-index:10;">
                        <div style="position:absolute; top:-12px; left:50%; transform:translateX(-50%); background:#00e5ff; color:#000; padding:4px 12px; border-radius:20px; font-size:0.75rem; font-weight:bold;">MÁS ELEGIDO</div>
                        <div style="font-size:1.2rem; color:#00e5ff; font-weight:bold; letter-spacing:2px;">PACK EXPANSIÓN</div>
                        <div style="font-size:3rem; color:#fff; font-weight:bold; margin:15px 0;">$1,200<span style="font-size:1rem; color:#64748b">/mes</span></div>
                        <p style="color:#cbd5e1; font-size:0.9rem; margin-bottom:25px;">Control total para flotas en crecimiento.</p>
                        
                        <ul style="text-align:left; color:#fff; list-style:none; padding:0; margin-bottom:30px; line-height:2;">
                            <li><i class="fas fa-check" style="color:#00e5ff; margin-right:10px;"></i> Hasta <b>10 Embarcaciones</b></li>
                            <li><i class="fas fa-check" style="color:#00e5ff; margin-right:10px;"></i> <b>Gestión FULL Tripulación</b></li>
                            <li><i class="fas fa-check" style="color:#00e5ff; margin-right:10px;"></i> Alertas de Mantenimiento</li>
                            <li><i class="fas fa-check" style="color:#00e5ff; margin-right:10px;"></i> Reportes PDF Automáticos</li>
                            <li><i class="fas fa-check" style="color:#00e5ff; margin-right:10px;"></i> 5 Usuarios Admin</li>
                        </ul>

                        <button onclick="BillingModule.selectPlan('expansion')" class="btn-price-main" style="width:100%; padding:15px; background:#00e5ff; border:none; color:#000; border-radius:8px; font-weight:bold; cursor:pointer; box-shadow:0 0 15px rgba(0,229,255,0.4);" onmouseover="this.style.boxShadow='0 0 25px rgba(0,229,255,0.6)'" onmouseout="this.style.boxShadow='0 0 15px rgba(0,229,255,0.4)'">
                            CONTRATAR PACK
                        </button>
                    </div>

                    <!-- PLAN 4: ADMIRAL -->
                    <div class="pricing-card" style="background:#0f172a; border:1px solid #a855f7; border-radius:15px; padding:30px; width:300px; position:relative; min-width:280px;">
                        <div style="font-size:1.2rem; color:#a855f7; font-weight:bold; letter-spacing:2px;">ADMIRAL</div>
                        <div style="font-size:3rem; color:#fff; font-weight:bold; margin:15px 0;">$1800<span style="font-size:1rem; color:#64748b">/mes</span></div>
                        <p style="color:#cbd5e1; font-size:0.9rem; margin-bottom:25px;">Infraestructura dedicada para grandes operadores.</p>
                        
                        <ul style="text-align:left; color:#cbd5e1; list-style:none; padding:0; margin-bottom:30px; line-height:2;">
                            <li><i class="fas fa-check" style="color:#a855f7; margin-right:10px;"></i> <b>Flota Ilimitada</b></li>
                            <li><i class="fas fa-check" style="color:#a855f7; margin-right:10px;"></i> <b>Usuarios Ilimitados</b></li>
                            <li><i class="fas fa-check" style="color:#a855f7; margin-right:10px;"></i> Soporte 24/7 Prioritario</li>
                        </ul>

                        <button onclick="BillingModule.selectPlan('admiral')" class="btn-price" style="width:100%; padding:15px; background:transparent; border:1px solid #a855f7; color:#a855f7; border-radius:8px; font-weight:bold; cursor:pointer; transition:all 0.3s;" onmouseover="this.style.background='rgba(168,85,247,0.1)'" onmouseout="this.style.background='transparent'">
                            CONTRATAR ADMIRAL
                        </button>
                    </div>

                </div>
                
                <div style="margin-top:40px; color:#64748b; font-size:0.8rem; padding-bottom:20px;">
                    <i class="fas fa-lock"></i> Pagos procesados de forma segura vía <b>dLocal Go</b> (Redirección Externa). Cancelación flexible.
                </div>
            </div>
        `;
    };

    // --- Dynamic Logic ---
    let flexCount = 1;

    const updateFlexPrice = (delta) => {
        const newCount = flexCount + delta;
        if (newCount < 1) return; // Min 1

        // Removed the up-sell check for simplicity as requested, 
        // user can now add more to Solist freely if they want.

        flexCount = newCount;
        const total = flexCount * 150;

        // Update DOM
        const countDisplay = document.getElementById('vessel-count-flex');
        const priceDisplay = document.getElementById('price-display-flex');

        if (countDisplay) countDisplay.innerText = flexCount;
        if (priceDisplay) priceDisplay.innerHTML = `$${total}<span style="font-size:1rem; color:#64748b">/mes</span>`;
    };

    const selectPlan = (planId) => {
        let url = '';
        let planName = '';

        // CONFIGURACIÓN DE LINKS DE PAGO (dLocal Go)
        switch (planId) {
            case 'flex':
                planName = `Plan Individual (${flexCount} Embarcación${flexCount > 1 ? 'es' : ''})`;
                // if (flexCount === 1) url = 'LINK_DLOCAL_150';
                // if (flexCount === 2) url = 'LINK_DLOCAL_300';
                break;
            case 'start':
                planName = 'Pack Inicio ($450)';
                // url = 'LINK_DLOCAL_450';
                break;
            case 'expansion':
                planName = 'Pack Expansión ($1,200)';
                // url = 'LINK_DLOCAL_1200';
                break;
            case 'admiral':
                planName = 'Plan Admiral ($1800)';
                // Direct link logic
                break;
        }

        const btn = event.target || event.currentTarget;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> REDIRIGIENDO...';
        btn.disabled = true;

        setTimeout(() => {
            if (url) {
                window.open(url, '_blank');
            } else {
                alert(`🚀 Redirigiendo al checkout seguro de dLocal Go para: ${planName}\n\n(Valor a pagar: $${planId === 'flex' ? flexCount * 150 : '---'})`);
            }
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 1200);
    };

    return {
        init,
        updateFlexPrice,
        selectPlan
    };
})();

window.BillingModule = BillingModule;
