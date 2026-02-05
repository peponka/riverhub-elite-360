const DocsModule = (() => {
    // Datos Simulados (Mock Data)
    const mockDocs = [
        { id: 'RH-8829', title: 'MANIFIESTO DE CARGA', type: 'PDF', date: '20/01/2026', size: '2.4 MB', status: 'FIRMADO', barge: 'B-001 GRANEL', prod: 'Soja', qty: '1500 TN', dest: 'Rosario' },
        { id: 'RH-7731', title: 'BILL OF LADING T-55', type: 'PDF', date: '18/01/2026', size: '1.1 MB', status: 'ENVIADO', barge: 'B-045 MINERAL', prod: 'Hierro', qty: '2200 TN', dest: 'San Nicolas' },
        { id: 'RH-5521', title: 'CERTIFICADO MATRÍCULA', type: 'PDF', date: '15/01/2026', size: '4.8 MB', status: 'ARCHIVADO', barge: 'B-102 QUERY', prod: 'Maíz', qty: '1800 TN', dest: 'Asunción' },
        { id: 'RH-1102', title: 'PLANILLA BUNKERING', type: 'XLS', date: '12/01/2026', size: '0.5 MB', status: 'FIRMADO', barge: 'M-TUG ALPHA', prod: 'Combustible', qty: '500 L', dest: 'Puerto' },
        { id: 'RH-9912', title: 'DECLARACIÓN ADUANA', type: 'PDF', date: '10/01/2026', size: '3.2 MB', status: 'FIRMADO', barge: 'B-001 GRANEL', prod: 'Soja', qty: '1500 TN', dest: 'Rosario' },
        { id: 'RH-3321', title: 'INFORME DE CALADO', type: 'XLS', date: '05/01/2026', size: '0.8 MB', status: 'BORRADOR', barge: '-', prod: '-', qty: '-', dest: '-' },
        { id: 'RH-2210', title: 'PERMISO DE NAVEGACIÓN', type: 'PDF', date: '02/01/2026', size: '1.2 MB', status: 'VENCIDO', barge: 'B-045 MINERAL', prod: 'Hierro', qty: '2200 TN', dest: 'San Nicolas' },
        { id: 'RH-0051', title: 'SOLICITUD DE AMARRE', type: 'PDF', date: '28/12/2025', size: '0.9 MB', status: 'APROBADO', barge: 'B-102 QUERY', prod: 'Maíz', qty: '1800 TN', dest: 'Asunción' }
    ];

    const init = () => {
        console.log("DocsModule: Initializing...");

        // 1. Grid Logic (Scoped to Grid)
        const grid = document.querySelector('.docs-grid');
        if (grid) {
            grid.addEventListener('click', handleGridClick);
            renderDocuments();
        }

        // 2. Toolbar Logic (Global Delegation with Omni-Selector)
        if (!window.docsToolbarAttached) {

            // Create Hidden Input for Simulation
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'file';
            hiddenInput.style.display = 'none';
            hiddenInput.id = 'sim-upload-input';
            document.body.appendChild(hiddenInput);

            hiddenInput.onchange = (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    simulateUpload(file.name, (file.size / 1024 / 1024).toFixed(1) + " MB");
                }
            };

            document.addEventListener('click', (e) => {
                const target = e.target;
                const btn = target.closest('button') || target; // Handle clicks on icon inside button
                const text = btn.innerText ? btn.innerText.toUpperCase().trim() : '';

                // Upload Button Logic
                if (
                    target.closest('.btn-upload') ||
                    target.closest('.btn-subir') ||
                    text.includes('SUBIR')
                ) {
                    // Filter out unrelated buttons
                    if (text.length < 20) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("DocsModule: Upload Clicked (Omni-match)");
                        hiddenInput.click(); // Trigger File Picker
                    }
                }


            });
            window.docsToolbarAttached = true;
            console.log("DocsModule: Toolbar listeners attached globally (Omni-mode + LiveSim).");
        }
    };

    const handleGridClick = (e) => {
        // Find closest button with action class
        const btn = e.target.closest('.action-download');
        if (!btn) return;

        e.stopPropagation(); // Prevent card click if any

        const { barge, prod, qty, dest } = btn.dataset;
        triggerDownload(barge, prod, qty, dest);
    };

    const simulateUpload = (filename, size) => {
        // Find Header to show progress or just alert? No, let's add card with spinner
        addDocumentToGrid(filename, "PDF", "Subiendo...", size, "SYNC");

        // Simulate completion after 2 seconds
        setTimeout(() => {
            const grid = document.querySelector('.docs-grid');
            if (grid && grid.firstChild) { // Use firstChild because addDocumentToGrid prepends
                const badge = grid.firstChild.querySelector('.doc-badge');
                if (badge) {
                    badge.className = 'doc-badge badge-signed';
                    badge.innerText = 'CARGADO';
                }
                const dateDiv = grid.firstChild.querySelector('.doc-id');
                if (dateDiv) dateDiv.innerText = `REF: NEW-${Math.floor(Math.random() * 1000)} • ${new Date().toLocaleDateString()}`;
            }
            alert("✅ Archivo cargado correctamente al repositorio seguro.");
        }, 1500);
    };

    const addDocumentToGrid = (title, type, date, size, status) => {
        const grid = document.querySelector('.docs-grid');
        if (!grid) return;

        const doc = {
            id: `NEW-${Math.floor(Math.random() * 1000)}`,
            title: title,
            type: type,
            date: date === 'Ahora' ? new Date().toLocaleDateString() : date,
            size: size,
            status: status,
            barge: '-', prod: '-', qty: '-', dest: '-'
        };

        const card = document.createElement('div');
        card.className = 'doc-card';
        // Add fade-in animation style
        card.style.animation = "fadeIn 0.5s ease-out";

        let badgeClass = 'badge-signed';
        if (doc.status === 'SYNC') badgeClass = 'badge-sent';
        if (doc.status === 'BORRADOR') badgeClass = 'badge-archived';
        if (doc.status === 'ENVIADO') badgeClass = 'badge-sent';
        if (doc.status === 'ARCHIVADO') badgeClass = 'badge-archived';
        if (doc.status === 'VENCIDO') badgeClass = 'badge-archived';
        if (doc.status === 'APROBADO') badgeClass = 'badge-approved';


        const iconClass = doc.type === 'PDF' ? 'icon-pdf' : 'icon-xls';

        card.innerHTML = `
            <span class="doc-badge ${badgeClass}">${doc.status}</span>
            <div class="file-icon ${iconClass}">
                ${doc.type}
            </div>
            <div class="doc-title">${doc.title}</div>
            <div class="doc-id">REF: ${doc.id} • ${doc.date}</div>
            
            <div class="card-footer">
                <span>${doc.size}</span>
                <div class="doc-actions">
                    <i class="fas fa-eye" title="Vista Previa"></i>
                    <i class="fas fa-download action-download" title="Descargar" 
                       data-barge="${doc.barge}" 
                       data-prod="${doc.prod}" 
                       data-qty="${doc.qty}" 
                       data-dest="${doc.dest}"></i>
                    <i class="fas fa-ellipsis-v"></i>
                </div>
            </div>
        `;

        // Insert at beginning
        grid.prepend(card);
    };

    const renderDocuments = () => {
        const grid = document.querySelector('.docs-grid');
        if (!grid) return;

        // Only render if empty to avoid wiping successful uploads on re-init
        if (grid.children.length > 0) return;

        grid.innerHTML = ''; // Limpiar mocks viejos

        mockDocs.forEach(doc => {
            const card = document.createElement('div');
            card.className = 'doc-card';

            // Badge logic
            let badgeClass = 'badge-signed';
            if (doc.status === 'ENVIADO') badgeClass = 'badge-sent';
            if (doc.status === 'ARCHIVADO') badgeClass = 'badge-archived';
            if (doc.status === 'BORRADOR') badgeClass = 'badge-archived';
            if (doc.status === 'VENCIDO') badgeClass = 'badge-archived';
            if (doc.status === 'APROBADO') badgeClass = 'badge-approved';

            // Icon Logic
            const iconClass = doc.type === 'PDF' ? 'icon-pdf' : 'icon-xls';

            card.innerHTML = `
                <span class="doc-badge ${badgeClass}">${doc.status}</span>
                <div class="file-icon ${iconClass}">
                    ${doc.type}
                </div>
                <div class="doc-title">${doc.title}</div>
                <div class="doc-id">REF: ${doc.id} • ${doc.date}</div>
                
                <div class="card-footer">
                    <span>${doc.size}</span>
                    <div class="doc-actions">
                        <i class="fas fa-eye" title="Vista Previa"></i>
                        <!-- Attributes for Data Delegation -->
                        <i class="fas fa-download action-download" title="Descargar" 
                           data-barge="${doc.barge}" 
                           data-prod="${doc.prod}" 
                           data-qty="${doc.qty}" 
                           data-dest="${doc.dest}"></i>
                        <i class="fas fa-ellipsis-v"></i>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    };

    // RE-IMPLEMENT renderDocuments fully to be safe with replace_tool
    // ... wait, I can't call addDocumentToGrid inside renderDocuments easily if I want to append vs prepend.
    // I'll rewrite renderDocuments explicitly.


    const triggerDownload = (barge, prod, qty, dest) => {
        console.log(`DocsModule: Requesting PDF for ${barge}`);

        // Try to find TrackingModule in window
        if (window.TrackingModule && window.TrackingModule.quickDownload) {
            window.TrackingModule.quickDownload(barge, prod, qty, dest);
            console.log("DocsModule: PDF Generation triggered.");
        } else {
            console.error("DocsModule: TrackingModule not found!");
            // Fallback attempt to get it again
            if (window.trackingLogic) {
                window.trackingLogic.quickDownload(barge, prod, qty, dest);
            } else {
                alert("Error: El motor de PDF no está listo. Por favor visita la pestaña 'Tracking' primero para iniciarlo.");
            }
        }
    };

    return {
        init,
        triggerDownload
    };
})();

// EXPOSE TO WINDOW EXPLICITLY
window.DocsModule = DocsModule;

document.addEventListener('DOMContentLoaded', () => {
    // Force Init
    if (window.DocsModule) window.DocsModule.init();
});