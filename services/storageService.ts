
import { Product, SyncLogEntry } from '../types';

const DB_NAME = 'ferrecloud_db';
const DB_VERSION = 1;
const PRODUCT_STORE = 'products';
const LOG_STORE = 'product_logs';
const CLOUD_STORE = 'cloud_vaults';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event: any) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(PRODUCT_STORE)) {
        const productStore = db.createObjectStore(PRODUCT_STORE, { keyPath: 'id' });
        productStore.createIndex('name', 'name', { unique: false });
        productStore.createIndex('internalCodes', 'internalCodes', { unique: false, multiEntry: true });
        productStore.createIndex('brand', 'brand', { unique: false });
      }
      if (!db.objectStoreNames.contains(LOG_STORE)) {
        db.createObjectStore(LOG_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(CLOUD_STORE)) {
        db.createObjectStore(CLOUD_STORE, { keyPath: 'vaultId' });
      }
    };
  });
};

export const productDB = {
  async getAll(limit?: number): Promise<Product[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PRODUCT_STORE, 'readonly');
      const store = transaction.objectStore(PRODUCT_STORE);
      // Si hay 140k, limitamos siempre para no romper el navegador
      const request = store.getAll(null, limit || 100);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getById(id: string): Promise<Product | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PRODUCT_STORE, 'readonly');
      const store = transaction.objectStore(PRODUCT_STORE);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async save(product: Product, isRemoteSync = false): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PRODUCT_STORE, LOG_STORE], 'readwrite');
      const store = transaction.objectStore(PRODUCT_STORE);
      const logStore = transaction.objectStore(LOG_STORE);
      
      store.put(product);
      
      if (!isRemoteSync) {
        const log: SyncLogEntry = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          terminalName: localStorage.getItem('ferrecloud_terminal_name') || 'TERM-01',
          type: 'STOCK_ADJUST',
          description: `Cambio en artículo: ${product.name}`,
          payload: { productId: product.id, ...product }
        };
        logStore.add(log);
      }

      transaction.oncomplete = () => {
        window.dispatchEvent(new Event('ferrecloud_products_updated'));
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  },

  async saveBulk(products: Product[]): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PRODUCT_STORE, 'readwrite');
      const store = transaction.objectStore(PRODUCT_STORE);
      products.forEach(p => store.put(p));
      transaction.oncomplete = () => {
        window.dispatchEvent(new Event('ferrecloud_products_updated'));
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  },

  /**
   * BUSQUEDA OPTIMIZADA CON CURSOR
   * No carga todo el array, recorre el disco y se detiene en 50 coincidencias.
   */
  async search(term: string): Promise<Product[]> {
    const db = await openDB();
    const upperTerm = term.toUpperCase().trim();
    if (upperTerm.length < 2) return [];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PRODUCT_STORE, 'readonly');
      const store = transaction.objectStore(PRODUCT_STORE);
      const results: Product[] = [];
      const request = store.openCursor();

      request.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor && results.length < 50) {
          const product = cursor.value as Product;
          const match = 
            (product.name && product.name.toUpperCase().includes(upperTerm)) || 
            (product.internalCodes && product.internalCodes.some(c => c.toUpperCase().includes(upperTerm))) ||
            (product.barcodes && product.barcodes.some(b => b.toUpperCase().includes(upperTerm))) ||
            (product.brand && product.brand.toUpperCase().includes(upperTerm));

          if (match) results.push(product);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  },

  async getStats(): Promise<{ count: number }> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PRODUCT_STORE, 'readonly');
      const store = transaction.objectStore(PRODUCT_STORE);
      const request = store.count();
      request.onsuccess = () => resolve({ count: request.result });
      request.onerror = () => reject(request.error);
    });
  },

  async getPublished(): Promise<Product[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(PRODUCT_STORE, 'readonly');
        const store = transaction.objectStore(PRODUCT_STORE);
        const results: Product[] = [];
        const request = store.openCursor();
        
        request.onsuccess = (event: any) => {
            const cursor = event.target.result;
            if (cursor && results.length < 100) {
                if (cursor.value.ecommerce?.isPublished) results.push(cursor.value);
                cursor.continue();
            } else {
                resolve(results);
            }
        };
        request.onerror = () => reject(request.error);
    });
  },

  async getPendingLogs(): Promise<SyncLogEntry[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(LOG_STORE, 'readonly');
      const store = transaction.objectStore(LOG_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async clearLogs(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(LOG_STORE, 'readwrite');
      const store = transaction.objectStore(LOG_STORE);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clearAll(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PRODUCT_STORE, LOG_STORE], 'readwrite');
      transaction.objectStore(PRODUCT_STORE).clear();
      transaction.objectStore(LOG_STORE).clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
};

export const cloudSimDB = {
  async getFromVault(vaultId: string): Promise<any> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CLOUD_STORE, 'readonly');
      const store = transaction.objectStore(CLOUD_STORE);
      const request = store.get(vaultId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async saveToVault(vaultId: string, data: any): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CLOUD_STORE, 'readwrite');
      const store = transaction.objectStore(CLOUD_STORE);
      store.put({ ...data, vaultId });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
};

export const addToReplenishmentQueue = (product: Product): boolean => {
    const saved = localStorage.getItem('ferrecloud_replenishment_queue');
    const queue = saved ? JSON.parse(saved) : [];
    if (queue.some((i: any) => i.product.id === product.id)) return false;
    
    queue.push({
        product,
        quantity: Math.max(1, (product.stockMaximo || 0) - (product.stock || 0)),
        selectedProviderId: '',
        selectedProviderName: product.provider
    });
    localStorage.setItem('ferrecloud_replenishment_queue', JSON.stringify(queue));
    window.dispatchEvent(new Event('replenishment_queue_updated'));
    return true;
};
