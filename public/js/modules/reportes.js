const ReportesModule = (() => {
    let charts = {}; // Store chart instances

    const init = () => {
        console.log("ReportesModule: Initializing BI Dashboard...");

        // Ensure Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error("Chart.js not loaded!");
            return;
        }

        renderPnlChart();
        renderFuelChart();
        renderOpsChart();
        console.log("ReportesModule: Charts rendered.");
    };

    // 1. P&L Chart (Bar & Line Combo)
    const renderPnlChart = () => {
        // SIMULATED DATA FALLBACK if empty
        const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const revenue = [120, 150, 180, 220, 260, 300, 310, 350, 400, 450, 480, 520];
        const costs = [80, 90, 100, 110, 130, 140, 150, 160, 180, 190, 200, 210];

        const ctx = document.getElementById('chartPnl');
        if (!ctx) return;

        const context = ctx.getContext('2d');
        const gradientProfit = context.createLinearGradient(0, 0, 0, 400);
        gradientProfit.addColorStop(0, 'rgba(16, 185, 129, 0.5)'); // Green
        gradientProfit.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

        if (charts.pnl) charts.pnl.destroy();

        charts.pnl = new Chart(context, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ingresos (USD)',
                        data: revenue,
                        borderColor: '#10b981', // Green
                        backgroundColor: gradientProfit,
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Costos Operativos',
                        type: 'bar',
                        data: costs,
                        backgroundColor: 'rgba(59, 130, 246, 0.6)', // Blue
                        borderRadius: 4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: { labels: { color: '#cbd5e1' } },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8' }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8', callback: (val) => '$' + val + 'k' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: { display: false }
                    }
                }
            }
        });
    };

    // 2. Fuel Efficiency (Line)
    const renderFuelChart = () => {
        // SIMULATED DATA
        const labels = ['S1', 'S2', 'S3', 'S4'];
        const data = [4.2, 4.0, 3.8, 3.5];

        const ctx = document.getElementById('chartFuel');
        if (!ctx) return;

        if (charts.fuel) charts.fuel.destroy();

        charts.fuel = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels, // Weeks
                datasets: [{
                    label: 'Consumo (L/km)',
                    data: data, // Improving trend
                    borderColor: '#f59e0b', // Amber
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    };

    // 3. Operational Status (Doughnut)
    const renderOpsChart = () => {
        // SIMULATED DATA
        const data = [65, 25, 10];

        const ctx = document.getElementById('chartOps');
        if (!ctx) return;

        if (charts.ops) charts.ops.destroy();

        charts.ops = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Navegando', 'En Puerto', 'Mantenimiento'],
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#3b82f6', // Blue
                        '#10b981', // Green
                        '#f43f5e'  // Red
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#cbd5e1', usePointStyle: true }
                    }
                },
                cutout: '70%'
            }
        });
    };

    const printReport = () => {
        if (!window.jspdf) {
            alert("⚠️ Error: El motor PDF no ha cargado aún. Verifique su conexión.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const date = new Date().toLocaleDateString();

        // 1. Header Frame
        doc.setFillColor(15, 23, 42); // Dark Navy
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(0, 229, 255); // Cyan
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("RIVERHUB", 15, 20);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("BUSINESS INTELLIGENCE UNIT", 15, 28);

        doc.setFontSize(10);
        doc.text(`REPORTE: #${Math.floor(Math.random() * 10000)}`, pageWidth - 60, 20);
        doc.text(`FECHA: ${date}`, pageWidth - 60, 28);

        // 2. Executive Summary
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("RESUMEN EJECUTIVO", 15, 55);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("A continuación se presenta el análisis consolidado de las operaciones fluviales.", 15, 62);

        let yPos = 70;

        // 3. Capturing Charts
        // Helper to add chart
        const addChartToPdf = (chartId, title, y) => {
            const canvas = document.getElementById(chartId);
            if (canvas) {
                doc.setFontSize(11);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(50, 50, 50);
                doc.text(title, 15, y);

                // Add Image
                // NOTE: Canvas must have white background for PDF usually, but dark looks weird on white paper.
                // WE will draw a dark rect behind it to preserve styling or filter?
                // Actually the canvas is transparent mostly. Let's just put it.
                // Ideally we'd invert colors for print but let's keep "Dark Mode" screenshot look for now.

                // Add background for Dark Mode charts
                doc.setFillColor(30, 41, 59); // Slate 800
                doc.rect(15, y + 5, 180, 90, 'F');

                try {
                    const imgData = canvas.toDataURL("image/png", 1.0);
                    doc.addImage(imgData, 'PNG', 15, y + 5, 180, 90);
                } catch (e) {
                    doc.text("(Error rendering chart image)", 15, y + 15);
                    console.error(e);
                }
            }
        };

        // Chart 1: P&L
        addChartToPdf('chartPnl', '1. ANÁLISIS FINANCIERO (P&L)', yPos);

        // Chart 2: Combustible
        yPos += 110;
        // Check page break mechanism roughly (A4 is ~297mm)
        // 70 + 100 = 170. 170 + 110 = 280. It fits barely.

        // We might want to put smaller charts side by side
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("2. INDICADORES OPERATIVOS", 15, yPos);

        const canvasFuel = document.getElementById('chartFuel');
        const canvasOps = document.getElementById('chartOps');

        if (canvasFuel && canvasOps) {
            const imgFuel = canvasFuel.toDataURL("image/png");
            const imgOps = canvasOps.toDataURL("image/png");

            // Backgrounds
            doc.setFillColor(30, 41, 59);
            doc.rect(15, yPos + 10, 85, 60, 'F');
            doc.rect(110, yPos + 10, 85, 60, 'F');

            doc.addImage(imgFuel, 'PNG', 15, yPos + 10, 85, 60);
            doc.addImage(imgOps, 'PNG', 110, yPos + 10, 85, 60);

            doc.setFontSize(9);
            doc.setTextColor(50, 50, 50); // Reset for labels
            doc.setFont("helvetica", "italic");
            doc.text("Fig 2.1: Eficiencia Combustible", 15, yPos + 75);
            doc.text("Fig 2.2: Disponibilidad Flota", 110, yPos + 75);
        }

        doc.save(`RiverHub_Reporte_BI_${date.replace(/\//g, '-')}.pdf`);
    };

    return {
        init,
        printReport
    };
})();

window.ReportesModule = ReportesModule;

// Auto-recovery
if (document.getElementById('view-reportes') && document.getElementById('view-reportes').style.display !== 'none') {
    ReportesModule.init();
}