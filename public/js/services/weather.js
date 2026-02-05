const WeatherService = (() => {
    // Open-Meteo API (Free, No Key)
    const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

    /**
     * Fetch current weather for a specific location
     * @param {number} lat Latitude
     * @param {number} lng Longitude
     */
    const getWeather = async (lat, lng) => {
        try {
            const url = `${BASE_URL}?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code&hourly=temperature_2m,precipitation_probability&forecast_days=1`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Weather API Error');

            const data = await response.json();

            // Normalize Data
            return {
                temp: data.current.temperature_2m,
                windSpeed: data.current.wind_speed_10m,
                windDir: data.current.wind_direction_10m,
                precip: data.current.precipitation,
                code: data.current.weather_code,
                unitTemp: data.current_units.temperature_2m,
                unitSpeed: data.current_units.wind_speed_10m
            };

        } catch (error) {
            console.warn("Weather API Error (Using Fallback Data)");
            return {
                temp: 28,
                windSpeed: 10,
                windDir: 90,
                precip: 0,
                code: 1, // Despejado
                unitTemp: '°C',
                unitSpeed: 'km/h'
            };
        }
    };

    /**
     * Get Weather Description based on WMO Code
     */
    const getWeatherDesc = (code) => {
        const codes = {
            0: 'Cielo Despejado',
            1: 'Mayormente Despejado', 2: 'Parcialmente Nublado', 3: 'Nublado',
            45: 'Niebla', 48: 'Niebla con Escarcha',
            51: 'Llovizna Ligera', 53: 'Llovizna Moderada', 55: 'Llovizna Densa',
            61: 'Lluvia Ligera', 63: 'Lluvia Moderada', 65: 'Lluvia Fuerte',
            80: 'Chubascos Ligeros', 81: 'Chubascos Moderados', 82: 'Chubascos Violentos',
            95: 'Tormenta Eléctrica', 96: 'Tormenta con Granizo', 99: 'Tormenta Fuerte'
        };
        return codes[code] || 'Desconocido';
    };

    /**
     * Get Icon Class (FontAwesome) based on WMO Code
     */
    const getWeatherIcon = (code) => {
        // Simple mapping
        if (code === 0) return 'fa-sun';
        if (code >= 1 && code <= 3) return 'fa-cloud-sun';
        if (code >= 45 && code <= 48) return 'fa-smog';
        if (code >= 51 && code <= 67) return 'fa-cloud-rain';
        if (code >= 71 && code <= 86) return 'fa-snowflake';
        if (code >= 95) return 'fa-bolt';
        return 'fa-cloud';
    };

    /**
     * Get Past Precipitation (for Hydrology Models)
     * Limit: 30 days
     */
    const getHistoricalRain = async (lat, lng, days = 14) => {
        try {
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const startStr = startDate.toISOString().split('T')[0];

            // Open-Meteo Historical / Forecast endpoint that allows past days
            // Actually, we can use the forecast endpoint with 'past_days' parameter
            const url = `${BASE_URL}?latitude=${lat}&longitude=${lng}&daily=precipitation_sum,river_discharge&past_days=${days}&forecast_days=1`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('Weather History Error');
            const data = await res.json();

            // Return array of { date, rain_mm }
            return data.daily.time.map((t, i) => ({
                date: t,
                rain: data.daily.precipitation_sum[i] || 0,
                discharge: data.daily.river_discharge ? data.daily.river_discharge[i] : null
            }));

        } catch (e) {
            console.warn("History Fail, returning mock:", e);
            // Fallback mock
            return Array.from({ length: days }, (_, i) => ({
                date: '2025-01-01',
                rain: Math.random() * 5
            }));
        }
    };

    /**
     * Get Real River Discharge (Flow) from Open-Meteo Flood API
     * @param {number} lat Latitude
     * @param {number} lng Longitude
     * @param {number} days Days to look back
     */
    const getRiverDischarge = async (lat, lng, days = 30) => {
        try {
            // FLOOD API Endpoint
            const BASE_FLOOD_URL = 'https://flood-api.open-meteo.com/v1/flood';

            const url = `${BASE_FLOOD_URL}?latitude=${lat}&longitude=${lng}&daily=river_discharge,river_discharge_median&past_days=${days}&forecast_days=7`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('Flood API Error');
            const data = await res.json();

            // Map to usable array
            return data.daily.time.map((t, i) => ({
                date: t,
                discharge: data.daily.river_discharge[i], // Caudal Real m3/s
                median: data.daily.river_discharge_median[i] // Media histórica
            }));

        } catch (e) {
            console.warn("River Discharge API Failed:", e);
            return null;
        }
    };

    return {
        getWeather,
        getWeatherDesc,
        getWeatherIcon,
        getHistoricalRain,
        getRiverDischarge // NEW REAL DATA METHOD
    };
})();

window.WeatherService = WeatherService;
