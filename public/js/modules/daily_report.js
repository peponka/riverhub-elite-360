// js/modules/daily_report.js

const DailyReportModule = (() => {

    const init = () => {
        console.log("Briefing Module Loaded 📰");
        injectOverlay();
    };

    const injectOverlay = () => {
        const html = `
            <div id="daily-report-overlay" class="daily-report-overlay">
                <div class="report-actions">
                    <div class="action-btn" onclick="DailyReportModule.sendEmail()" title="Enviar Email"><i class="fas fa-paper-plane"></i></div>
                    <div class="action-btn" onclick="DailyReportModule.print()" title="Imprimir PDF"><i class="fas fa-print"></i></div>
                    <div class="action-btn" onclick="DailyReportModule.close()" title="Cerrar"><i class="fas fa-times"></i></div>
                </div>
                
                <div class="daily-report-page" id="report-content">
                    <!-- Dynamic Content Goes Here -->
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    };

    const open = () => {
        generateContent();
        document.getElementById('daily-report-overlay').classList.add('active');
    };

    const close = () => {
        document.getElementById('daily-report-overlay').classList.remove('active');
    };

    const generateContent = () => {
        const date = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();

        // Mock Data Aggegation (In real app, pull from Modules)
        const activeVessels = 14;
        const alerts = 2; // Critical
        const fuel = "45,200 L";

        const html = `
            <header class="report-header">
                <div class="report-brand">
                    <h1>River<span>Hub</span></h1>
                    <div style="color: #64748b; font-size: 0.8rem; margin-top: 5px;">EXECUTIVE DAILY BRIEFING</div>
                </div>
                <div class="report-meta">
                    <div>FECHA: ${date}</div>
                    <div>ID: #${Math.floor(Math.random() * 9000) + 1000}</div>
                    <div>USER: CAP. PEDRO</div>
                </div>
            </header>

            <div class="report-ticker">
                <div class="ticker-content">
                     RIVERHUB SYSTEM STATUS: ONLINE • ACTIVOS: 14 BARCAZAS • TIEMPO EN HIDROVÍA: MAYORMENTE DESPEJADO • ALERTAS DE CALADO: 2 ACTIVAS • COMBUSTIBLE TOTAL: 45,200 LTS • PROXIMO MANTENIMIENTO: TUG-ALPHA •
                </div>
            </div>

            <div class="report-body">
                <div class="main-column">
                    <section class="report-section">
                        <div class="section-title">Resumen de Operaciones</div>
                        <div class="metrics-grid">
                            <div class="metric-card good">
                                <div class="metric-val">${activeVessels}</div>
                                <div class="metric-label">Activos en Misión</div>
                            </div>
                            <div class="metric-card alert">
                                <div class="metric-val">${alerts}</div>
                                <div class="metric-label">Alertas Críticas</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-val">98%</div>
                                <div class="metric-label">Eficiencia Flota</div>
                            </div>
                        </div>
                    </section>

                    <section class="report-section">
                        <div class="section-title">Movimientos Recientes</div>
                        <table class="report-table">
                            <thead>
                                <tr>
                                    <th>Barcaza</th>
                                    <th>Estado</th>
                                    <th>Carga</th>
                                    <th>Destino</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>TUG-ALPHA</strong></td>
                                    <td><span class="status-dot bg-green"></span>Navegando</td>
                                    <td>Soja (2000t)</td>
                                    <td>Rosario</td>
                                </tr>
                                <tr>
                                    <td><strong>BARGE-04</strong></td>
                                    <td><span class="status-dot bg-yellow"></span>En Puerto</td>
                                    <td>Vacío</td>
                                    <td>Asunción</td>
                                </tr>
                                <tr>
                                    <td><strong>TUG-BETA</strong></td>
                                    <td><span class="status-dot bg-red"></span>Mantenimiento</td>
                                    <td>-</td>
                                    <td>Dique Seco</td>
                                </tr>
                                <tr>
                                    <td><strong>BARGE-12</strong></td>
                                    <td><span class="status-dot bg-green"></span>Cargando</td>
                                    <td>Mineral</td>
                                    <td>Corumbá</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>
                </div>

                <div class="side-column">
                    <div class="sidebar-box">
                        <div class="section-title">Noticias del Día</div>
                        <p class="highlight-text">
                            <strong>Niveles de Río:</strong> Tendencia bajante en tramo norte. Se recomienda precaución en Km 1240.<br><br>
                            <strong>Combustible:</strong> Reabastecimiento programado para TUG-CHARLIE mañana a las 08:00 hrs.<br><br>
                            <strong>Tripulación:</strong> Cambio de guardia completado sin novedades.
                        </p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('report-content').innerHTML = html;
    };

    const sendEmail = () => {
        alert("📧 Simultando envío a operaciones@riverhub.com...\n\nEl reporte ha sido enviado exitosamente.");
    };

    const print = () => {
        window.print();
    };

    return {
        init,
        open,
        close,
        sendEmail,
        print
    };
})();

window.DailyReportModule = DailyReportModule;
