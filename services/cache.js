// ============================================
// FluviaFleet — Cache Service (TTL in-memory)
// ============================================

const store = new Map();

const cache = {
    get(key) {
        const entry = store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            store.delete(key);
            return null;
        }
        return entry.value;
    },

    set(key, value, ttlSeconds = 300) {
        store.set(key, {
            value,
            expiresAt: Date.now() + ttlSeconds * 1000,
            createdAt: Date.now()
        });
    },

    del(key) {
        store.delete(key);
    },

    clear() {
        store.clear();
    },

    stats() {
        let valid = 0, expired = 0;
        const now = Date.now();
        for (const [, entry] of store) {
            if (now > entry.expiresAt) expired++;
            else valid++;
        }
        return { total: store.size, valid, expired };
    }
};

module.exports = cache;
