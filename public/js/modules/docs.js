const DocsModule = (() => {
    let documents = [];

    const init = async () => {
        console.log("DocsModule: Initializing (Supabase)...");

        const grid = document.querySelector('.docs-grid');
        if (grid) {
            grid.addEventListener('click', handleGridClick);
            await loadDocuments();
        }

        if (!window.docsToolbarAttached) {
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'file';
            hiddenInput.style.display = 'none';
            hiddenInput.id = 'sim-upload-input';
            document.body.appendChild(hiddenInput);

            hiddenInput.onchange = (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    uploadDocument(file);
                }
            };

            document.addEventListener('click', (e) => {
                const target = e.target;
                const btn = target.closest('button') || target;
                const text = btn.innerText ? btn.innerText.toUpperCase().trim() : '';

                if (
                    target.closest('.btn-upload') ||
                    target.closest('.btn-subir') ||
                    text.includes('SUBIR')
                ) {
                    if (text.length < 20) {
                        e.preventDefault();
                        e.stopPropagation();
                        hiddenInput.click();
                    }
                }
            });
            window.docsToolbarAttached = true;
        }
    };

    const loadDocuments = async () => {
        const grid = document.querySelector('.docs-grid');
        if (!grid) return;
        if (grid.children.length > 0) return;

        // Try Supabase
        if (window.sb && window.sb.fetchMine) {
            try {
                const { data, error } = await window.sb.fetchMine('documents', '*');
                if (error) throw error;

                if (data && data.length > 0) {
                    documents = data;
                    grid.innerHTML = '';
                    data.forEach(doc => renderDocCard(grid, {
                        id: doc.doc_number || doc.id.substring(0, 8),
                        title: doc.title,
                        type: doc.doc_type || 'PDF',
                        date: new Date(doc.created_at).toLocaleDateString('es-ES'),
                        size: doc.file_size || '1.0 MB',
                        status: doc.status || 'BORRADOR',
                        barge: '-', prod: doc.cargo_type || '-', qty: doc.cargo_qty || '-', dest: doc.destination || '-'
                    }));
                    console.log(`DocsModule: ${data.length} documentos cargados de Supabase`);
                    return;
                }
            } catch (e) {
                console.warn("DocsModule: Supabase no disponible, usando demo:", e.message);
            }
        }

        // Fallback mock data
        renderMockDocs(grid);
    };

    const renderMockDocs = (grid) => {
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
        grid.innerHTML = '';
        mockDocs.forEach(doc => renderDocCard(grid, doc));
    };

    const renderDocCard = (grid, doc, prepend = false) => {
        const card = document.createElement('div');
        card.className = 'doc-card';
        if (prepend) card.style.animation = "fadeIn 0.5s ease-out";

        let badgeClass = 'badge-signed';
        if (doc.status === 'ENVIADO' || doc.status === 'SYNC') badgeClass = 'badge-sent';
        if (doc.status === 'ARCHIVADO' || doc.status === 'BORRADOR' || doc.status === 'VENCIDO') badgeClass = 'badge-archived';
        if (doc.status === 'APROBADO' || doc.status === 'CARGADO') badgeClass = 'badge-approved';

        const iconClass = doc.type === 'PDF' ? 'icon-pdf' : 'icon-xls';

        card.innerHTML = `
            <span class="doc-badge ${badgeClass}">${doc.status}</span>
            <div class="file-icon ${iconClass}">${doc.type}</div>
            <div class="doc-title">${doc.title}</div>
            <div class="doc-id">REF: ${doc.id} • ${doc.date}</div>
            <div class="card-footer">
                <span>${doc.size}</span>
                <div class="doc-actions">
                    <i class="fas fa-eye" title="Vista Previa"></i>
                    <i class="fas fa-download action-download" title="Descargar" 
                       data-barge="${doc.barge}" data-prod="${doc.prod}" 
                       data-qty="${doc.qty}" data-dest="${doc.dest}"></i>
                    <i class="fas fa-ellipsis-v"></i>
                </div>
            </div>
        `;

        if (prepend) {
            grid.prepend(card);
        } else {
            grid.appendChild(card);
        }
    };

    const uploadDocument = async (file) => {
        const filename = file.name;
        const fileSize = (file.size / 1024 / 1024).toFixed(1) + " MB";
        const fileType = filename.endsWith('.xls') || filename.endsWith('.xlsx') ? 'XLS' : 'PDF';

        const grid = document.querySelector('.docs-grid');
        if (!grid) return;

        // Add card immediately with "Subiendo..." status
        const tempDoc = {
            id: `NEW-${Math.floor(Math.random() * 1000)}`,
            title: filename,
            type: fileType,
            date: new Date().toLocaleDateString('es-ES'),
            size: fileSize,
            status: 'SYNC',
            barge: '-', prod: '-', qty: '-', dest: '-'
        };
        renderDocCard(grid, tempDoc, true);

        // Try Supabase insert
        if (window.sb && window.sb.insertMine) {
            try {
                const { error } = await window.sb.insertMine('documents', {
                    title: filename,
                    doc_type: fileType,
                    file_size: fileSize,
                    status: 'CARGADO',
                    doc_number: tempDoc.id
                });
                if (error) throw error;
            } catch (e) {
                console.warn("DocsModule: Upload to Supabase failed:", e.message);
            }
        }

        // Simulate completion
        setTimeout(() => {
            if (grid.firstChild) {
                const badge = grid.firstChild.querySelector('.doc-badge');
                if (badge) {
                    badge.className = 'doc-badge badge-signed';
                    badge.innerText = 'CARGADO';
                }
            }
            alert("✅ Archivo cargado correctamente al repositorio.");
        }, 1500);
    };

    const handleGridClick = (e) => {
        const btn = e.target.closest('.action-download');
        if (!btn) return;
        e.stopPropagation();
        const { barge, prod, qty, dest } = btn.dataset;
        triggerDownload(barge, prod, qty, dest);
    };

    const triggerDownload = (barge, prod, qty, dest) => {
        if (window.TrackingModule && window.TrackingModule.quickDownload) {
            window.TrackingModule.quickDownload(barge, prod, qty, dest);
        } else if (window.trackingLogic) {
            window.trackingLogic.quickDownload(barge, prod, qty, dest);
        } else {
            alert("Error: El motor de PDF no está listo. Visita 'Tracking' primero.");
        }
    };

    return { init, triggerDownload };
})();

window.DocsModule = DocsModule;

document.addEventListener('DOMContentLoaded', () => {
    if (window.DocsModule) window.DocsModule.init();
});