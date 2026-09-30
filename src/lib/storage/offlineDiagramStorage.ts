/**
 * Offline Local-First Storage for 3D Diagrams using native IndexedDB API.
 * Database: Diagram3D_DB
 * Store: diagram_drafts
 */

const DB_NAME = 'Diagram3D_DB';
const DB_VERSION = 1;
const STORE_NAME = 'diagram_drafts';
const ACTIVE_DRAFT_KEY = 'current_draft';

export interface OfflineDraftRecord {
  id: string;
  name: string;
  data: any;
  updatedAt: string;
}

/**
 * Initializes and opens the Diagram3D_DB IndexedDB database.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB não está disponível neste ambiente.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Falha ao abrir IndexedDB.'));
    };
  });
}

/**
 * Saves a diagram draft locally into IndexedDB.
 * Updates both the 'current_draft' pointer and the specific diagram draft record.
 *
 * @param diagram The diagram object to persist offline
 */
export async function saveDraftOffline(diagram: any): Promise<void> {
  if (typeof window === 'undefined' || !diagram) return;

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const now = new Date().toISOString();
      const record: OfflineDraftRecord = {
        id: ACTIVE_DRAFT_KEY,
        name: diagram.name || 'Rascunho Local 3D',
        data: diagram,
        updatedAt: now,
      };

      const putRequest = store.put(record);

      putRequest.onsuccess = () => {
        // Also persist by diagram.id if available so multiple drafts can be listed
        if (diagram.id && diagram.id !== ACTIVE_DRAFT_KEY) {
          const idRecord: OfflineDraftRecord = {
            id: diagram.id,
            name: diagram.name || 'Rascunho Local 3D',
            data: diagram,
            updatedAt: now,
          };
          store.put(idRecord);
        }
      };

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error || new Error('Erro na transação IndexedDB.'));
      };
    });
  } catch (err) {
    console.warn('[IndexedDB saveDraftOffline Warning]:', err);
  }
}

/**
 * Loads the active offline draft from IndexedDB.
 * Returns null if no draft is found or during SSR.
 */
export async function loadDraftOffline(): Promise<any | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return null;

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.get(ACTIVE_DRAFT_KEY);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.data) {
          resolve(result.data);
        } else {
          // If no active draft found by key, try reading the most recent record
          const getAllRequest = store.getAll();
          getAllRequest.onsuccess = () => {
            const all = getAllRequest.result || [];
            if (all.length > 0) {
              all.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
              resolve(all[0].data || all[0]);
            } else {
              resolve(null);
            }
          };
          getAllRequest.onerror = () => resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB loadDraftOffline Warning]:', err);
    return null;
  }
}

/**
 * Lists all offline drafts stored in IndexedDB.
 */
export async function listOfflineDrafts(): Promise<any[]> {
  if (typeof window === 'undefined' || !window.indexedDB) return [];

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.getAll();

      request.onsuccess = () => {
        const list = request.result || [];
        resolve(list.map((r) => r.data || r));
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB listOfflineDrafts Warning]:', err);
    return [];
  }
}
