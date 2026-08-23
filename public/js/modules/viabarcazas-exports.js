// ═══════════════════════════════════════════
// VIABARCAZAS — Export Engine (PDF & Excel)
// Extracted from viabarcazas.js for modularity
// ═══════════════════════════════════════════

function exportToExcel(data, sheetName, fileName){
    if(!data||!data.length){alert('No hay datos para exportar');return;}
    var ws=XLSX.utils.json_to_sheet(data);
    var wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,sheetName||'Datos');
    XLSX.writeFile(wb,(fileName||'export')+'.xlsx');
}

function exportToPDF(title, columns, rows, fileName){
    if(!rows||!rows.length){alert('No hay datos para exportar');return;}
    var doc=new jspdf.jsPDF({orientation:'landscape'});
    // Header
    doc.setFontSize(18);doc.text('ViaBarcazas',14,15);
    doc.setFontSize(12);doc.text(title,14,24);
    doc.setFontSize(8);doc.setTextColor(128);doc.text('Generado: '+new Date().toLocaleString('es'),14,30);
    doc.setTextColor(0);
    // Table
    doc.autoTable({head:[columns],body:rows,startY:36,styles:{fontSize:8,cellPadding:3},headStyles:{fillColor:[30,30,30],textColor:255,fontStyle:'bold'},alternateRowStyles:{fillColor:[248,248,248]},margin:{left:14,right:14}});
    doc.save((fileName||'reporte')+'.pdf');
}

// ─── Module-specific exports ──────────────
async function exportFleet(format){
    var r=await sb.from('vessels').select('*').order('name');var data=r.data||[];
    if(format==='excel'){
        exportToExcel(data.map(function(v){return{Nombre:v.name||'',Tipo:v.type||'',Estado:v.status||'',Ubicacion:v.location||'',IMO:v.imo||'',Bandera:v.flag||''}}), 'Flota','viabarcazas_flota');
    }else{
        exportToPDF('Reporte de Flota',['Nombre','Tipo','Estado','Ubicacion','IMO'],data.map(function(v){return[v.name||'',v.type||'',v.status||'',v.location||'',v.imo||'']}),'viabarcazas_flota');
    }
}
async function exportViajes(format){
    var r=await sb.from('voyages').select('*').order('created_at',{ascending:false}).limit(100);var data=r.data||[];
    if(format==='excel'){
        exportToExcel(data.map(function(v){return{Origen:v.origin||'',Destino:v.destination||'',Estado:v.status||'',Embarcacion:v.vessel_name||'',Carga:v.cargo_type||'',Fecha:v.created_at?new Date(v.created_at).toLocaleDateString('es'):''}}), 'Viajes','viabarcazas_viajes');
    }else{
        exportToPDF('Reporte de Viajes',['Origen','Destino','Estado','Embarcacion','Carga','Fecha'],data.map(function(v){return[v.origin||'',v.destination||'',v.status||'',v.vessel_name||'',v.cargo_type||'',v.created_at?new Date(v.created_at).toLocaleDateString('es'):'']}),'viabarcazas_viajes');
    }
}
async function exportBitacora(format){
    var r=await sb.from('logs').select('*').order('created_at',{ascending:false}).limit(200);var data=r.data||[];
    if(format==='excel'){
        exportToExcel(data.map(function(l){return{Titulo:l.title||'',Tipo:l.action_type||'',Embarcacion:l.vessel_name||'',Descripcion:l.description||'',Fecha:l.created_at?new Date(l.created_at).toLocaleString('es'):''}}), 'Bitacora','viabarcazas_bitacora');
    }else{
        exportToPDF('Bitacora Digital',['Titulo','Tipo','Embarcacion','Descripcion','Fecha'],data.map(function(l){return[l.title||'',l.action_type||'',l.vessel_name||'',(l.description||'').substring(0,60),l.created_at?new Date(l.created_at).toLocaleDateString('es'):'']}),'viabarcazas_bitacora');
    }
}
async function exportCrew(format){
    var r=await sb.from('crew_members').select('*').order('name');var data=r.data||[];
    if(format==='excel'){
        exportToExcel(data.map(function(c){return{Nombre:c.name||'',Rol:c.role||'',Embarcacion:c.vessel_name||'',Estado:c.status||'',Documento:c.document_number||''}}), 'Tripulacion','viabarcazas_tripulacion');
    }else{
        exportToPDF('Tripulacion & Safety',['Nombre','Rol','Embarcacion','Estado','Documento'],data.map(function(c){return[c.name||'',c.role||'',c.vessel_name||'',c.status||'',c.document_number||'']}),'viabarcazas_tripulacion');
    }
}
async function exportFuel(format){
    var r=await sb.from('fuel_logs').select('*').order('created_at',{ascending:false}).limit(200);var data=r.data||[];
    if(format==='excel'){
        exportToExcel(data.map(function(f){return{Embarcacion:f.vessel_name||'',Litros:f.liters||0,Tipo:f.fuel_type||'',Fecha:f.created_at?new Date(f.created_at).toLocaleDateString('es'):''}}), 'Combustible','viabarcazas_combustible');
    }else{
        exportToPDF('Registro de Combustible',['Embarcacion','Litros','Tipo','Fecha'],data.map(function(f){return[f.vessel_name||'',(f.liters||0).toString(),f.fuel_type||'',f.created_at?new Date(f.created_at).toLocaleDateString('es'):'']}),'viabarcazas_combustible');
    }
}
async function exportMaint(format){
    var r=await sb.from('maintenance_tasks').select('*').order('created_at',{ascending:false}).limit(100);var data=r.data||[];
    if(format==='excel'){
        exportToExcel(data.map(function(m){return{Descripcion:m.description||'',Embarcacion:m.vessel_name||'',Prioridad:m.priority||'',Estado:m.status||'',Fecha:m.created_at?new Date(m.created_at).toLocaleDateString('es'):''}}), 'Mantenimiento','viabarcazas_mantenimiento');
    }else{
        exportToPDF('Ordenes de Mantenimiento',['Descripcion','Embarcacion','Prioridad','Estado','Fecha'],data.map(function(m){return[(m.description||'').substring(0,50),m.vessel_name||'',m.priority||'',m.status||'',m.created_at?new Date(m.created_at).toLocaleDateString('es'):'']}),'viabarcazas_mantenimiento');
    }
}
async function exportPanol(format){
    var r=await sb.from('inventory_items').select('*').order('name');var data=r.data||[];
    if(format==='excel'){
        exportToExcel(data.map(function(p){return{SKU:p.sku||'',Repuesto:p.name||'',Categoria:p.category||'',Cantidad:p.stock_current||0,Ubicacion:p.location||'',StockMinimo:p.stock_min_alert||0}}), 'Inventario','viabarcazas_panol');
    }else{
        exportToPDF('Panol (Inventario)',['SKU','Repuesto','Categoria','Cantidad','Ubicacion','Stock Min'],data.map(function(p){return[p.sku||'',p.name||'',p.category||'',(p.stock_current||0).toString(),p.location||'',(p.stock_min_alert||0).toString()]}),'viabarcazas_panol');
    }
}
async function exportCalado(format){
    var r=await sb.from('logs').select('*').eq('action_type','DRAFT_READING').order('created_at',{ascending:false}).limit(100);var data=r.data||[];
    if(format==='excel'){
        exportToExcel(data.map(function(d){var det=typeof d.details==='string'?JSON.parse(d.details||'{}'):d.details||{};return{Embarcacion:d.vessel_name||'',Calado:(det.draft||0).toFixed(2),CaladoMax:(det.max_draft||3.5).toFixed(2),Observaciones:d.description||'',Fecha:d.created_at?new Date(d.created_at).toLocaleString('es'):''}}), 'Calados','viabarcazas_calados');
    }else{
        exportToPDF('Lecturas de Calado',['Embarcacion','Calado (m)','Max (m)','Observaciones','Fecha'],data.map(function(d){var det=typeof d.details==='string'?JSON.parse(d.details||'{}'):d.details||{};return[d.vessel_name||'',(det.draft||0).toFixed(2),(det.max_draft||3.5).toFixed(2),(d.description||'').substring(0,40),d.created_at?new Date(d.created_at).toLocaleDateString('es'):'']}),'viabarcazas_calados');
    }
}
async function exportIncidentes(format){
    var r=await sb.from('logs').select('*').eq('action_type','INCIDENTE').order('created_at',{ascending:false}).limit(100);var data=r.data||[];
    if(format==='excel'){
        exportToExcel(data.map(function(i){var det=typeof i.details==='string'?JSON.parse(i.details||'{}'):i.details||{};return{Titulo:i.title||'',Embarcacion:i.vessel_name||'',Severidad:det.severity||'',Tipo:det.type||'',Estado:det.status||'Abierto',Descripcion:i.description||'',Fecha:i.created_at?new Date(i.created_at).toLocaleString('es'):''}}), 'Incidentes','viabarcazas_incidentes');
    }else{
        exportToPDF('Registro de Incidentes',['Titulo','Embarcacion','Severidad','Tipo','Estado','Fecha'],data.map(function(i){var det=typeof i.details==='string'?JSON.parse(i.details||'{}'):i.details||{};return[(i.title||'').substring(0,35),i.vessel_name||'',det.severity||'',det.type||'',det.status||'Abierto',i.created_at?new Date(i.created_at).toLocaleDateString('es'):'']}),'viabarcazas_incidentes');
    }
}
