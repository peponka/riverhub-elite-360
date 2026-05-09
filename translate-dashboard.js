const fs = require('fs');
const path = require('path');
const dir = 'public';

const dict = {
    // Login
    'Iniciar Sesion': 'Log In',
    'Crear nueva cuenta': 'Create new account',
    '¿Olvidaste tu contraseña?': 'Forgot password?',
    'usuario@empresa.com': 'user@company.com',
    'Tu contrasena': 'Your password',
    'Hidrovia Paraguay-Parana': 'Paraguay-Parana Waterway',
    
    // Sidebar
    'Panel de Control': 'Dashboard',
    'Mapa de Flota': 'Fleet Map',
    'Gestion de Flota': 'Fleet Management',
    'Copiloto IA': 'AI Copilot',
    'Armador de Convoy': 'Convoy Builder',
    'Gestion de Viajes': 'Trip Management',
    'Bitacora Digital': 'Digital Logbook',
    'Comunicaciones': 'Communications',
    'Tripulacion &amp; Safety': 'Crew &amp; Safety',
    'Tripulación': 'Crew',
    'Combustible': 'Fuel',
    'Calados &amp; Hidrometria': 'Drafts &amp; Hydrometry',
    'Mantenimiento': 'Maintenance',
    'Panol (Inventario)': 'Inventory (Store)',
    'Incidentes': 'Incidents',
    'Pronostico Hidrovia': 'Waterway Forecast',
    'Reportes &amp; Analytics': 'Reports &amp; Analytics',
    'Briefing Diario': 'Daily Briefing',
    'Tracking de Cargas': 'Cargo Tracking',
    'Planes &amp; Facturacion': 'Plans &amp; Billing',
    'Panel Admin': 'Admin Panel',
    'Cerrar Sesion': 'Log Out',
    'Cargando...': 'Loading...',
    'PRINCIPAL': 'MAIN',
    'OPERATIVA': 'OPERATIONAL',
    'GESTION': 'MANAGEMENT',
    'INTELIGENCIA': 'INTELLIGENCE',
    'CUENTA': 'ACCOUNT',
    
    // Topbar
    'Notificaciones': 'Notifications',
    'Sin notificaciones nuevas': 'No new notifications',
    
    // Dashboard Status
    'CENTRO UNIFICADO': 'UNIFIED CENTER',
    'NIVEL DE SERVICIO': 'SERVICE LEVEL',
    'ÓPTIMO': 'OPTIMAL',
    'FLOTA SINCRONIZADA HACE': 'FLEET SYNCHRONIZED',
    'SEMANA': 'WEEK',
    'Exportar': 'Export',
    
    // Buttons & Actions
    'Guardar': 'Save',
    'Cancelar': 'Cancel',
    'Eliminar': 'Delete',
    'Editar': 'Edit',
    'Nuevo': 'New',
    'Nueva': 'New',
    'Agregar': 'Add',
    'Buscar...': 'Search...',
    'Filtrar': 'Filter',
    'Confirmar': 'Confirm',
    'Seleccionar': 'Select',
    
    // Generic table headers
    'Embarcación': 'Vessel',
    'Tipo': 'Type',
    'Estado': 'Status',
    'Fecha': 'Date',
    'Usuario': 'User',
    'Acciones': 'Actions',
    'Descripción': 'Description',
    'Origen': 'Origin',
    'Destino': 'Destination',
    
    // Types
    'Remolcador': 'Tugboat',
    'Barcaza': 'Barge',
    'Activo': 'Active',
    'Inactivo': 'Inactive',
    'En Viaje': 'In Transit',
    'En Puerto': 'In Port',
    'Mantenimiento': 'Maintenance',
    
    // Fluvia JS messages
    'Ingresa email y contraseña': 'Enter email and password',
    'Error de inicio de sesión': 'Login error',
    'Cerrando sesión...': 'Logging out...',
    'Error al cerrar sesión': 'Logout error',
    'Sesión finalizada': 'Session ended',
    'Bienvenido de nuevo': 'Welcome back',
    'Datos guardados': 'Data saved successfully',
    'Error al guardar': 'Error saving data'
};

const files = fs.readdirSync(dir).filter(f => f.endsWith('-en.html') || f === 'fluvia-en.js');

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Apply dictionary replacements
    for (const [es, en] of Object.entries(dict)) {
        content = content.split(es).join(en);
    }
    
    // Handle specific index.html redirect in fluvia-en.html
    if (file === 'fluvia-en.html') {
        content = content.replace(/href="index\.html"/g, 'href="index-en.html"');
        content = content.replace('<script src="fluvia.js"></script>', '<script src="fluvia-en.js"></script>');
    }
    
    fs.writeFileSync(filePath, content);
}
console.log('Translation complete on ' + files.length + ' files');
