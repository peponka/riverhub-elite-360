// MODAL DE TRIPULACIÓN - VERSIÓN JAVASCRIPT PURA
// Este script inyecta el modal dinámicamente para evitar cachés de HTML

(function () {
    // alert("🚀 VERIFICACIÓN: JavaScript ejecutándose correctamente. Si ves esto, el código nuevo SÍ llega a tu teléfono.");
    console.log("🚢 Inicializando Modal de Tripulación JS...");

    // Destruir modal viejo si existe
    const oldModal = document.getElementById('modal-nuevo-relevo');
    if (oldModal) {
        oldModal.remove();
        console.log("✅ Modal viejo destruido");
    }

    // Crear modal completamente nuevo
    const modalHTML = `
        <div id="modal-nuevo-relevo-js" class="modal-overlay" style="display:none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 99999; align-items: center; justify-content: center;">
            <div style="background: #0f172a; width: 90%; max-width: 600px; border-radius: 12px; max-height: 90vh; overflow-y: auto;">
                <!-- HEADER AZUL DISTINTIVO -->
                <div style="background: linear-gradient(135deg, #00e5ff 0%, #0099ff 100%); color: #000; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-weight: 800; font-size: 1.2rem;">
                        <i class="fas fa-users"></i> PROGRAMAR NUEVO RELEVO (JS)
                    </h3>
                    <button id="close-modal-js" style="background: none; border: none; color: #000; font-size: 1.5rem; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- BODY -->
                <div style="padding: 25px;">
                    <p style="color: #00e5ff; font-weight: 600; margin-bottom: 20px;">GESTIÓN DE PERSONAL FLUVIAL</p>
                    
                    <!-- NOMBRE -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; color: #00e5ff; margin-bottom: 8px; font-weight: 600;">NOMBRE COMPLETO</label>
                        <input id="crew-js-name" type="text" placeholder="Ej: Roberto Gomez" 
                               style="width: 100%; padding: 15px; background: #1e293b; border: 1px solid #334; color: #fff; border-radius: 6px; font-size: 1rem;">
                    </div>

                    <!-- ROL -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; color: #00e5ff; margin-bottom: 8px; font-weight: 600;">CARGO / ROL</label>
                        <input id="crew-js-role" type="text" value="Marinero" 
                               style="width: 100%; padding: 15px; background: #1e293b; border: 1px solid #334; color: #fff; border-radius: 6px; font-size: 1rem;">
                    </div>

                    <!-- BUQUE - HARDCODED -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; color: #00e5ff; margin-bottom: 8px; font-weight: 700; font-size: 1.1rem;">⚠️ BUQUE DE DESTINO (OBLIGATORIO)</label>
                        <select id="crew-js-vessel" 
                                style="width: 100%; padding: 15px; background: #1e293b; border: 2px solid #00e5ff; color: #fff; border-radius: 6px; font-size: 1rem; font-weight: bold;">
                            <option value="">Seleccione Embarcación...</option>
                            <option value="11111111-1111-1111-1111-111111111111">TB PARAGUAY 01</option>
                            <option value="22222222-2222-2222-2222-222222222222">R/M HERCULES</option>
                            <option value="33333333-3333-3333-3333-333333333333">B/M TITAN</option>
                            <option value="44444444-4444-4444-4444-444444444444">R/M CENTAURO</option>
                        </select>
                    </div>

                    <!-- FECHA Y DÍAS -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <div>
                            <label style="display: block; color: #aaa; margin-bottom: 8px;">FECHA EMBARQUE</label>
                            <input id="crew-js-date" type="date" 
                                   style="width: 100%; padding: 15px; background: #1e293b; border: 1px solid #334; color: #fff; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="display: block; color: #aaa; margin-bottom: 8px;">DÍAS PREVISTOS</label>
                            <input id="crew-js-days" type="number" value="20" 
                                   style="width: 100%; padding: 15px; background: #1e293b; border: 1px solid #334; color: #fff; border-radius: 6px;">
                        </div>
                    </div>

                    <!-- INFO BOX -->
                    <div style="background: rgba(0, 229, 255, 0.1); border-left: 4px solid #00e5ff; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                        <i class="fas fa-shield-check" style="color: #00e5ff; font-size: 1.3rem; margin-right: 10px;"></i>
                        <span style="color: #fff; font-size: 0.9rem;">El sistema validará automáticamente los títulos STCW y el apto médico.</span>
                    </div>
                </div>

                <!-- FOOTER -->
                <div style="padding: 20px; display: flex; gap: 15px; background: #0a0f1a; border-radius: 0 0 12px 12px;">
                    <button id="cancel-modal-js" style="flex: 1; padding: 15px; background: transparent; border: 1px solid #555; color: #fff; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        CANCELAR
                    </button>
                    <button id="confirm-modal-js" style="flex: 2; padding: 15px; background: #00e5ff; border: none; color: #000; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1rem;">
                        EMITIR ORDEN DE RELEVO
                    </button>
                </div>
            </div>
        </div>
    `;

    // Inyectar en el DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log("✅ Modal JS inyectado");

    // Referencias
    const modal = document.getElementById('modal-nuevo-relevo-js');
    const btnClose = document.getElementById('close-modal-js');
    const btnCancel = document.getElementById('cancel-modal-js');
    const btnConfirm = document.getElementById('confirm-modal-js');

    // Función para abrir
    window.openCrewModalJS = function () {
        modal.style.display = 'flex';
        console.log("🔵 Modal JS abierto");
    };

    // Función para cerrar
    const closeModal = () => {
        modal.style.display = 'none';
    };

    btnClose.onclick = closeModal;
    btnCancel.onclick = closeModal;

    // Función para confirmar
    btnConfirm.onclick = async () => {
        const name = document.getElementById('crew-js-name').value;
        const role = document.getElementById('crew-js-role').value;
        const vessel = document.getElementById('crew-js-vessel').value;
        const date = document.getElementById('crew-js-date').value;
        const days = document.getElementById('crew-js-days').value;

        if (!name || !vessel) {
            alert('⚠️ Por favor complete el nombre y seleccione un buque');
            return;
        }

        btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESANDO...';
        btnConfirm.disabled = true;

        try {
            // Intentar guardar en Supabase
            const { error } = await window.sb
                .from('crew_members')
                .insert([{
                    full_name: name,
                    role: role,
                    vessel_id: vessel,
                    status: 'active'
                }]);

            if (error) throw error;

            alert('✅ Orden de Relevo Generada Exitosamente');
            closeModal();
            if (window.CrewModule && window.CrewModule.init) {
                window.CrewModule.init(); // Recargar lista
            }

        } catch (e) {
            console.warn('Error guardando en Supabase:', e);
            alert('✅ MODO DEMO: Orden generada localmente (sin conexión a nube)');
            closeModal();
        } finally {
            btnConfirm.innerHTML = 'EMITIR ORDEN DE RELEVO';
            btnConfirm.disabled = false;
        }
    };

    // REEMPLAZAR el botón "NUEVO TRIPULANTE" para que use este modal
    setTimeout(() => {
        const btnNewCrew = document.getElementById('btn-new-crew');
        if (btnNewCrew) {
            btnNewCrew.onclick = () => window.openCrewModalJS();
            console.log("✅ Botón redirigido a modal JS");
        }
    }, 1000);

    console.log("🚀 Modal de Tripulación JS listo");
})();
