// CONFIGURACIÓN CENTRALIZADA DE APIS
// Aquí se definen las claves y endpoints para los servicios externos.

const AppConfig = {
    // 1. SISTEMA (Modo de Operación)
    environment: 'production', // 'development' | 'production'
    useMockData: false,        // Forzar datos falsos si no hay API Keys

    // 2. NAVEGACIÓN (Barcos en tiempo real)
    navigation: {
        provider: 'aisstream', // 'aisstream' - ÚNICO PROVEEDOR ACTIVO

        // AISStream (Websocket Gratuito/Pago)
        // Se conecta al servidor local (server.js) que hace de puente con AISStream
        socketUrl: window.location.hostname === 'localhost' ? 'ws://localhost:3000' : 'wss://' + window.location.host,

        // Datalastic (DESACTIVADO - YA NO SE USA)
        datalasticKey: null,

        // ShipFinder (Opcional)
        shipfinderKey: ''
    },

    // 3. HIDROLOGÍA Y CLIMA
    weather: {
        provider: 'open-meteo', // 'open-meteo' (Gratis, excelente calidad)
        endpoints: {
            forecast: 'https://api.open-meteo.com/v1/forecast',
            flood: 'https://flood-api.open-meteo.com/v1/flood'
        }
    },

    // 4. MAPAS
    maps: {
        tileLayer: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', // Carto Dark (Gratis)
        attribution: '&copy; OpenStreetMap &copy; CARTO'
    },

    // 5. INTELIGENCIA ARTIFICIAL
    ai: {
        provider: 'openai', // 'openai' | 'gemini'
        apiKey: '' // Dejar vacío para usar backend proxy si existe
    },

    // 6. BACKEND (Supabase)
    database: {
        url: 'https://nfybnnpdrvyxucgpqmmo.supabase.co',
        // La Key pública está en supabase.js
    }
};

// Exponer al scope global
window.AppConfig = AppConfig;
console.log("⚙️ AppConfig Cargado: Datalastic DESACTIVADO, usando AISStream.");
