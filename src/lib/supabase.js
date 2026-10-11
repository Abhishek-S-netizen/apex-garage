// ══════════════════════════════════════════════════════════════════
// APEX — SUPABASE CLOUD SYNC & MEDIA CLIENT
// Native REST & Storage Integration (Zero External Dependencies)
// ══════════════════════════════════════════════════════════════════

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

/**
 * Check if the user has provided real Supabase credentials
 */
export function isSupabaseConfigured() {
    return Boolean(
        SUPABASE_URL &&
        SUPABASE_KEY &&
        !SUPABASE_URL.includes('your-project-id') &&
        !SUPABASE_KEY.includes('your-anon-public-key')
    );
}

const getHeaders = () => ({
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
});

/**
 * Fetch remote garage data from Supabase
 */
export async function fetchRemoteGarage() {
    if (!isSupabaseConfigured()) return null;

    try {
        const endpoint = `${SUPABASE_URL}/rest/v1/apex_vault?id=eq.main_garage&select=payload`;
        const res = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            cache: 'no-cache'
        });

        if (!res.ok) {
            console.warn('[APEX Sync] Remote fetch status:', res.status, res.statusText);
            return null;
        }

        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0 && rows[0].payload) {
            return rows[0].payload;
        }
        return null;
    } catch (err) {
        console.warn('[APEX Sync] Remote fetch failed, using local cache:', err);
        return null;
    }
}

/**
 * Save complete garage state to Supabase (Atomic Upsert)
 */
export async function saveRemoteGarage(garageData) {
    if (!isSupabaseConfigured()) return false;

    try {
        const endpoint = `${SUPABASE_URL}/rest/v1/apex_vault?on_conflict=id`;
        const payload = {
            id: 'main_garage',
            payload: garageData,
            updated_at: new Date().toISOString()
        };

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                ...getHeaders(),
                'Prefer': 'resolution=merge-duplicates,return=minimal'
            },
            body: JSON.stringify(payload)
        });

        return res.ok;
    } catch (err) {
        console.warn('[APEX Sync] Remote save failed:', err);
        return false;
    }
}

/**
 * Upload a car photo to Supabase Storage bucket ('garage-photos')
 * Returns the permanent public CDN URL.
 */
export async function uploadVehiclePhoto(file) {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase credentials not configured in .env');
    }

    // Clean file extension and create unique filename
    const ext = file.name ? file.name.split('.').pop().toLowerCase() : 'jpg';
    const safeExt = ['png', 'jpg', 'jpeg', 'webp', 'heic'].includes(ext) ? ext : 'jpg';
    const fileName = `apex_car_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${safeExt}`;

    const uploadEndpoint = `${SUPABASE_URL}/storage/v1/object/garage-photos/${fileName}`;

    const res = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': file.type || 'image/jpeg'
        },
        body: file
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Upload failed: ${res.statusText} (${errText})`);
    }

    // Construct public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/garage-photos/${fileName}`;
    return publicUrl;
}
