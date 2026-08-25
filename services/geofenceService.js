'use strict';

/**
 * Evaluates live vessel positions against each company's active geofences.
 * State is kept per vessel/geofence so an alert is inserted only on a real
 * entry or exit transition, not on every AIS update.
 */
class GeofenceService {
    constructor(supabase) {
        this.supabase = supabase;
        this.state = new Map();
        this.cache = new Map();
    }

    async processPosition(position) {
        if (!this.supabase || !position?.mmsi || !Number.isFinite(position.lat) || !Number.isFinite(position.lon)) return;
        const { data: vessel } = await this.supabase.from('vessels')
            .select('id, company_id, name').eq('mmsi', String(position.mmsi)).maybeSingle();
        if (!vessel?.company_id) return;

        const geofences = await this._geofencesFor(vessel.company_id);
        for (const geofence of geofences) {
            const inside = contains(geofence.coordinates, position.lat, position.lon);
            if (inside === null) continue;
            const key = `${vessel.id}:${geofence.id}`;
            const previous = this.state.get(key);
            this.state.set(key, inside);
            if (previous === undefined || previous === inside) continue;

            const entering = inside;
            if ((entering && !geofence.alert_on_enter) || (!entering && !geofence.alert_on_exit)) continue;
            const action = entering ? 'ingresó' : 'salió';
            await this.supabase.from('alerts').insert({
                company_id: vessel.company_id,
                alert_type: entering ? 'GEOFENCE_ENTER' : 'GEOFENCE_EXIT',
                title: `Geocerca: ${vessel.name || position.mmsi}`,
                description: `${vessel.name || 'La embarcación'} ${action} de ${geofence.name}.`,
                severity: 'WARNING',
                vessel_id: vessel.id,
                geofence_id: geofence.id,
                metadata: { lat: position.lat, lon: position.lon, speed: position.speed || 0, observed_at: position.timestamp }
            });
        }
    }

    async _geofencesFor(companyId) {
        const cached = this.cache.get(companyId);
        if (cached && Date.now() - cached.at < 60000) return cached.data;
        const { data, error } = await this.supabase.from('geofences')
            .select('id, name, coordinates, alert_on_enter, alert_on_exit')
            .eq('company_id', companyId).eq('is_active', true);
        if (error) throw error;
        const geofences = data || [];
        this.cache.set(companyId, { at: Date.now(), data: geofences });
        return geofences;
    }
}

function contains(coordinates, lat, lon) {
    if (!coordinates) return null;
    if (coordinates.center && Number.isFinite(coordinates.radiusMeters)) {
        const center = coordinates.center;
        return distanceMeters(lat, lon, Number(center.lat), Number(center.lng ?? center.lon)) <= Number(coordinates.radiusMeters);
    }
    const raw = Array.isArray(coordinates[0]?.[0]) ? coordinates[0] : coordinates;
    if (!Array.isArray(raw) || raw.length < 3) return null;
    const points = raw.map(point => Array.isArray(point) ? { lat: Number(point[0]), lon: Number(point[1]) } : point);
    if (points.some(point => !Number.isFinite(point.lat) || !Number.isFinite(point.lon))) return null;
    return pointInPolygon({ lat, lon }, points) || pointInPolygon({ lat, lon }, points.map(point => ({ lat: point.lon, lon: point.lat })));
}

function pointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const a = polygon[i], b = polygon[j];
        const intersect = ((a.lat > point.lat) !== (b.lat > point.lat)) &&
            (point.lon < ((b.lon - a.lon) * (point.lat - a.lat)) / (b.lat - a.lat) + a.lon);
        if (intersect) inside = !inside;
    }
    return inside;
}

function distanceMeters(lat1, lon1, lat2, lon2) {
    const toRadians = value => value * Math.PI / 180;
    const dLat = toRadians(lat2 - lat1), dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = GeofenceService;
