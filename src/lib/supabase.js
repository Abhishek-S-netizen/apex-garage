// ══════════════════════════════════════════════════════════════════
// APEX — SUPABASE CLOUD SYNC & MEDIA CLIENT
// Native REST & Storage Integration (Zero External Dependencies)
// ══════════════════════════════════════════════════════════════════

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const SESSION_STORAGE_KEY = 'apex_owner_session';

/**
 * Get stored session from localStorage
 */
export function getStoredSession() {
    try {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

/**
 * Persist active session
 */
export function storeSession(session) {
    try {
        if (session) {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        } else {
            localStorage.removeItem(SESSION_STORAGE_KEY);
        }
    } catch (e) { }
}

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

/**
 * Returns request headers using the active owner JWT if logged in,
 * or the anon key if in viewer mode.
 */
export const getHeaders = () => {
    const session = getStoredSession();
    const token = (session && session.access_token) ? session.access_token : SUPABASE_KEY;
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

/**
 * Sign In with Owner Email & Password (Native REST)
 */
export async function signInWithOwnerEmail(email, password) {
    if (!isSupabaseConfigured()) throw new Error('Supabase is not configured.');

    const endpoint = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.trim(), password })
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error_description || data.msg || data.message || 'Login failed. Please check credentials.');
    }

    storeSession(data);
    return data;
}

/**
 * Sign Up with Owner Email & Password (Native REST)
 */
export async function signUpWithOwnerEmail(email, password) {
    if (!isSupabaseConfigured()) throw new Error('Supabase is not configured.');

    const endpoint = `${SUPABASE_URL}/auth/v1/signup`;
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.trim(), password })
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error_description || data.msg || data.message || 'Sign up failed.');
    }

    if (data.access_token) {
        storeSession(data);
    }
    return data;
}

/**
 * Sign Out Owner
 */
export async function signOutOwner() {
    const session = getStoredSession();
    storeSession(null);

    if (session && session.access_token && isSupabaseConfigured()) {
        try {
            await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
        } catch (e) { }
    }
    return true;
}

/**
 * Validate token or refresh if expired
 */
export async function validateCurrentSession() {
    const session = getStoredSession();
    if (!session || !session.access_token) return null;

    try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${session.access_token}`
            }
        });

        if (res.ok) {
            const user = await res.json();
            return { ...session, user };
        }

        // Token expired, attempt refresh
        if (session.refresh_token) {
            const refreshRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh_token: session.refresh_token })
            });

            if (refreshRes.ok) {
                const refreshed = await refreshRes.json();
                storeSession(refreshed);
                return refreshed;
            }
        }

        // If refresh failed, session is invalid
        storeSession(null);
        return null;
    } catch (e) {
        return session; // Offline or temporary network glitch: preserve session
    }
}

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

    const session = getStoredSession();
    const token = (session && session.access_token) ? session.access_token : SUPABASE_KEY;

    const res = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${token}`,
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
