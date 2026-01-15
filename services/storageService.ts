import { Product } from '../types';

const DB_NAME = 'ferrecloud_db';
const DB_VERSION = 1;
const PRODUCT_STORE = 'products';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event: any) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(PRODUCT_STORE)) {
        const productStore = db.createObjectStore(PRODUCT_STORE, { keyPath: 'id' });
        productStore.createIndex('internalCodes', 'internalCodes', { multiEntry: true });
        productStore.createIndex('name', 'name', { unique: false });
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
      const request = store.getAll(null, limit);
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
      const transaction = db.transaction(PRODUCT_STORE, 'readwrite');
      const store = transaction.objectStore(PRODUCT_STORE);
      store.put(product);
      
      transaction.oncomplete = () => {
        // Notificar al sistema de sincronización mediante eventos para evitar dependencia circular
        if (!isRemoteSync) {
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_out', { 
                detail: { type: 'PRODUCT_UPDATE', payload: product } 
            }));
        }
        window.dispatchEvent(new Event('ferrecloud_products_updated'));
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  },

  async delete(id: string, isRemoteSync = false): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PRODUCT_STORE, 'readwrite');
      const store = transaction.objectStore(PRODUCT_STORE);
      store.delete(id);
      
      transaction.oncomplete = () => {
        if (!isRemoteSync) {
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_out', { 
                detail: { type: 'PRODUCT_DELETE', payload: { id } } 
            }));
        }
        window.dispatchEvent(new Event('ferrecloud_products_updated'));
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  },

  async saveBulk(products: Product[]): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(PRODUCT_STORE, 'readwrite');
    const store = transaction.objectStore(PRODUCT_STORE);
    products.forEach(p => store.put(p));
    return new Promise<void>(resolve => {
        transaction.oncomplete = () => resolve();
    });
  },

  async search(term: string): Promise<Product[]> {
    const db = await openDB();
    const upperTerm = term.toUpperCase().trim();
    return new Promise((resolve) => {
      const transaction = db.transaction(PRODUCT_STORE, 'readonly');
      const store = transaction.objectStore(PRODUCT_STORE);
      const results: Product[] = [];
      const request = store.openCursor();
      request.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor && results.length < 50) {
          const p = cursor.value;
          if (p.name?.includes(upperTerm) || p.internalCodes?.some((c:string) => c.includes(upperTerm))) {
            results.push(p);
          }
          cursor.continue();
        } else resolve(results);
      };
    });
  },

  async getPublished(): Promise<Product[]> {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(PRODUCT_STORE, 'readonly');
      const store = transaction.objectStore(PRODUCT_STORE);
      const request = store.getAll();
      request.onsuccess = () => {
        const results: Product[] = request.result;
        resolve(results.filter(p => p.ecommerce?.isPublished));
      };
    });
  },

  async getStats() {
    const db = await openDB();
    const transaction = db.transaction(PRODUCT_STORE, 'readonly');
    const request = transaction.objectStore(PRODUCT_STORE).count();
    return new Promise<{count: number}>(resolve => {
        request.onsuccess = () => resolve({count: request.result});
    });
  },

  async clearAll() {
    const db = await openDB();
    const transaction = db.transaction(PRODUCT_STORE, 'readwrite');
    transaction.objectStore(PRODUCT_STORE).clear();
    return new Promise<void>(resolve => transaction.oncomplete = () => resolve());
  }
};

export const addToReplenishmentQueue = (product: Product) => {
    const queue = JSON.parse(localStorage.getItem('ferrecloud_replenishment_queue') || '[]');
    if (queue.some((i: any) => i.product.id === product.id)) return false;
    queue.push({ product, quantity: 1, selectedProviderName: product.provider });
    localStorage.setItem('ferrecloud_replenishment_queue', JSON.stringify(queue));
    window.dispatchEvent(new Event('replenishment_queue_updated'));
    return true;
};
