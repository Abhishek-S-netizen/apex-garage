// ══════════════════════════════════════════════════════════════════
// APEX — SUPABASE CLOUD SYNC & MEDIA CLIENT
// Native REST & Storage Integration (Zero External Dependencies)
// ══════════════════════════════════════════════════════════════════

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
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
 * Auto-optimizes, resizes, and converts any photo (including iOS HEIC/large camera photos)
 * into a lightweight web-ready JPEG Blob before uploading to Supabase.
 */
async function optimizeAndCompressImage(file) {
    return new Promise((resolve) => {
        if (typeof window === 'undefined' || !window.FileReader || !window.Image) {
            return resolve(file);
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_WIDTH = 1600;
                const MAX_HEIGHT = 1600;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round((width * MAX_HEIGHT) / height);
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        resolve(blob || file);
                    },
                    'image/jpeg',
                    0.86
                );
            };
            img.onerror = () => resolve(file);
            img.src = e.target.result;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
}

/**
 * Upload a car photo to Supabase Storage bucket ('garage-photos')
 * Returns the permanent public CDN URL.
 */
export async function uploadVehiclePhoto(file) {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase credentials not configured in .env');
    }

    // Auto-optimize and convert (vital for iPhone camera shots)
    const processedBlob = await optimizeAndCompressImage(file);
    const arrayBuffer = await processedBlob.arrayBuffer();

    const fileName = `apex_car_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
    const cleanUrl = SUPABASE_URL.replace(/\/+$/, '');
    const uploadEndpoint = `${cleanUrl}/storage/v1/object/garage-photos/${fileName}`;

    const res = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'image/jpeg',
            'x-upsert': 'true'
        },
        body: arrayBuffer
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Upload failed: ${res.statusText} (${errText})`);
    }

    // Construct permanent public CDN URL
    const publicUrl = `${cleanUrl}/storage/v1/object/public/garage-photos/${fileName}`;
    return publicUrl;
}
