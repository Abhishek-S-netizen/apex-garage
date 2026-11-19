// Linked Garage File: reads/writes a real cars.json on the laptop disk
// using the browser File System Access API (Chrome / Edge desktop).
// The file handle (not the data) is remembered in IndexedDB.

const DB_NAME = 'apex_garage_file';
const STORE = 'handles';
const KEY = 'carsJson';

export const isFileAccessSupported =
    typeof window !== 'undefined' &&
    'showSaveFilePicker' in window &&
    'showOpenFilePicker' in window;

const JSON_TYPES = [{
    description: 'APEX Garage JSON',
    accept: { 'application/json': ['.json'] }
}];

function openDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function idb(mode, fn) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(req ? req.result : undefined);
        tx.onerror = () => reject(tx.error);
    });
}

export const getStoredHandle = () => idb('readonly', s => s.get(KEY)).catch(() => null);
export const storeHandle = (handle) => idb('readwrite', s => s.put(handle, KEY));
export const clearStoredHandle = () => idb('readwrite', s => s.delete(KEY));

// Returns true if read/write access is granted.
// Pass request=true only from a click handler (browsers require a user gesture).
export async function ensurePermission(handle, request = false) {
    const opts = { mode: 'readwrite' };
    if ((await handle.queryPermission(opts)) === 'granted') return true;
    if (request && (await handle.requestPermission(opts)) === 'granted') return true;
    return false;
}

export async function readGarageFile(handle) {
    const file = await handle.getFile();
    const text = await file.text();
    if (!text.trim()) return null; // brand-new empty file
    return JSON.parse(text);
}

export async function writeGarageFile(handle, data) {
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
}

// Pick a location and create a new cars.json
export function pickNewGarageFile() {
    return window.showSaveFilePicker({ suggestedName: 'cars.json', types: JSON_TYPES });
}

// Pick an existing cars.json
export async function pickExistingGarageFile() {
    const [handle] = await window.showOpenFilePicker({ types: JSON_TYPES, multiple: false });
    return handle;
}
