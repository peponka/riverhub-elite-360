const ShipfinderService = {
    // CONFIG
    API_KEY: 'userkey', // REPLACE THIS
    BASE_URL: 'https://api.shipfinder.com/apicall',

    /**
     * Fetch positions for a specific list of Ship IDs.
     * @param {Array<string|number>} shipIds - List of MMSI or ShipIDs
     */
    getShips: async function (shipIds) {
        if (!shipIds || shipIds.length === 0) return [];

        // Join IDs
        const idString = shipIds.join(',');
        const url = `${this.BASE_URL}/GetManyShip?v=2&k=${this.API_KEY}&enc=1&id=${idString}`;

        try {
            void(`📡 Shipfinder: Requesting ${shipIds.length} ships...`);
            const response = await fetch(url);
            const data = await response.json();

            if (data.status !== 0 || !data.data) {
                console.warn("Shipfinder Error:", data.msg || "Unknown status");
                return [];
            }

            // Transform to Standard Format (similar to what Map expects)
            return data.data.map(ship => ({
                uuid: ship.ShipID.toString(), // Unique ID
                name: ship.name,
                type: this.mapShipType(ship.shiptype),
                lat: ship.lat / 1000000,
                lon: ship.lon / 1000000,
                speed: ship.sog / 10, // Assuming 1/10th knot precision
                course: ship.cog / 100, // Assuming 1/100 degree precision or raw? Example 14310 -> 143.1
                heading: ship.hdg / 100,
                timestamp: ship.lasttime, // Unix Timestamp
                source: 'shipfinder'
            }));

        } catch (err) {
            console.error("Shipfinder Fetch Failed:", err);
            return [];
        }
    },

    /**
     * Helper to map numeric ship types to strings
     */
    mapShipType: function (typeId) {
        // Simple mapping based on common AIS types
        if (typeId >= 60 && typeId < 70) return 'Passenger';
        if (typeId >= 70 && typeId < 80) return 'Cargo';
        if (typeId >= 80 && typeId < 90) return 'Tanker';
        if (typeId >= 30 && typeId < 40) return 'Tug'; // Example
        if (typeId === 54) return 'Industrial'; // As per user sample
        return 'Other';
    }
};

// Expose
window.ShipfinderService = ShipfinderService;
