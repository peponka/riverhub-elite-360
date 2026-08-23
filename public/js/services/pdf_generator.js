
// GENERADOR PDF SIMPLIFICADO Y ROBUSTO
// Usa sintaxis ES5 compatible para evitar problemas de módulos

function descargarPDF() {
    void("Iniciando generación de PDF...");

    // Verificar si la librería cargó
    if (typeof jsPDF === 'undefined') {
        if (window.RiverToast) {
            RiverToast.error("Error: La librería PDF no se cargó correctamente. Intenta recargar la página.", "Error de Generación");
        } else {
            console.error("Error: La librería PDF no se cargó correctamente.");
        }
        return;
    }

    try {
        // 1. Crear documento
        var doc = new jsPDF();

        // 2. Colores y Estilo
        var azulOscuro = [15, 23, 42];
        var cian = [0, 229, 255];

        // 3. Encabezado
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFontType("bold");
        doc.text(15, 25, 'VIABARCAZAS');

        doc.setFontSize(10);
        doc.setTextColor(0, 229, 255);
        doc.text(150, 25, 'COTIZACION OFICIAL');

        // 4. Datos del Cliente
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFontType("normal");

        var fecha = new Date().toLocaleDateString();
        var nombreCliente = document.getElementById('reg-name') ? document.getElementById('reg-name').value : "Cliente Invitado";
        if (nombreCliente === "") nombreCliente = "Usuario Demo";

        doc.text(15, 55, "FECHA: " + fecha);
        doc.text(15, 62, "CLIENTE: " + nombreCliente);

        // 5. Captura de datos del Cotizador
        var origen = getValor('cot-origin') || "N/A";
        var destino = getValor('cot-dest') || "N/A";
        var nivelRio = getValor('rio-slider') || "3.5";
        var bunker = getValor('cot-bunker') || "---";
        var precioFinal = document.getElementById('precio-magico-indestructible')
            ? document.getElementById('precio-magico-indestructible').innerText
            : "PENDIENTE";

        // 6. Tabla Simple (Dibujada a mano para no depender de librerías extra como autotable)
        var startY = 80;
        var rowHeight = 10;

        // Cabecera Tabla
        doc.setFillColor(240, 240, 240);
        doc.rect(15, startY, 180, 10, 'F');
        doc.setFontType("bold");
        doc.text(20, startY + 7, "CONCEPTO");
        doc.text(140, startY + 7, "DETALLE");

        // Filas
        dibujarFila(doc, startY + 10, "Ruta Fluvial", origen + " -> " + destino);
        dibujarFila(doc, startY + 20, "Nivel Hidrométrico", nivelRio + " Metros (Ref. Puerto)");
        dibujarFila(doc, startY + 30, "Precio Búnker Ref.", "USD " + bunker + " / Litro");
        dibujarFila(doc, startY + 40, "Carga Estimada", "15,000 Toneladas Básicas");

        // Total destacado
        doc.setFillColor(15, 23, 42); // Fondo oscuro
        doc.rect(15, startY + 55, 180, 15, 'F');
        doc.setTextColor(0, 229, 255); // Texto Cian
        doc.setFontSize(14);
        doc.text(20, startY + 65, "TARIFA FINAL ESTIMADA:");
        doc.setFontSize(18);
        doc.text(140, startY + 65, precioFinal);

        // Footer
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(9);
        doc.text(15, 280, "Generado por ViaBarcazas AI Engine. Valido por 24hs.");

        // 7. Guardar
        doc.save('ViaBarcazas_Cotizacion_' + Date.now() + '.pdf');

    } catch (e) {
        console.error(e);
        if (window.RiverToast) {
            RiverToast.error("Error al generar PDF: " + e.message, "Fallo en PDF");
        } else {
            console.error("Error al generar PDF:", e);
        }
    }
}

// Helpers
function getValor(id) {
    var el = document.getElementById(id);
    return el ? el.value : null;
}

function dibujarFila(doc, y, label, value) {
    doc.setFontType("normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(20, y + 7, label);
    doc.text(140, y + 7, value);
    // Linea
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y + 10, 195, y + 10);
}

// Hacer global
window.descargarPDF = descargarPDF;
