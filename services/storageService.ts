
import { Product, ReplenishmentItem } from '../types';

const DB_NAME = 'FerreCloudDB';
const STORE_NAME = 'products';
const DB_VERSION = 2;

// --- CLOUD SIMULATOR (IndexedDB alternativo para simular la nube sin límites de 5MB) ---
const CLOUD_DB_NAME = 'FerreCloud_VirtualVault';
const CLOUD_STORE_NAME = 'vault_data';

class CloudSimulatorDB {
    private db: IDBDatabase | null = null;

    async init(): Promise<IDBDatabase> {
        if (this.db) return this.db;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CLOUD_DB_NAME, 1);
            request.onupgradeneeded = (e) => {
                const db = (e.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(CLOUD_STORE_NAME)) {
                    db.createObjectStore(CLOUD_STORE_NAME, { keyPath: 'vaultId' });
                }
            };
            request.onsuccess = () => { this.db = request.result; resolve(request.result); };
            request.onerror = () => reject(request.error);
        });
    }

    async saveToVault(vaultId: string, data: any): Promise<void> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(CLOUD_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(CLOUD_STORE_NAME);
            const request = store.put({ vaultId, ...data, timestamp: new Date().toISOString() });
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async getFromVault(vaultId: string): Promise<any> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(CLOUD_STORE_NAME, 'readonly');
            const store = transaction.objectStore(CLOUD_STORE_NAME);
            const request = store.get(vaultId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

export const cloudSimDB = new CloudSimulatorDB();

// --- LOCAL PRODUCT DATABASE ---
class ProductDB {
    private db: IDBDatabase | null = null;

    async init(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('brand', 'brand', { unique: false });
                    store.createIndex('webPropia', 'ecommerce.webPropia', { unique: false });
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(request.result);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async getStats(): Promise<{ count: number }> {
        const db = await this.init();
        return new Promise((resolve) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.count();
            request.onsuccess = () => resolve({ count: request.result });
            request.onerror = () => resolve({ count: 0 });
        });
    }

    async getAll(limit?: number): Promise<Product[]> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = limit ? store.getAll(null, limit) : store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async getPublished(): Promise<Product[]> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('webPropia');
            const request = index.getAll(true as any);
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async search(term: string): Promise<Product[]> {
        const db = await this.init();
        const termLower = term.toLowerCase().trim();
        if (!termLower) return this.getAll(50);

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const results: Product[] = [];
            const request = store.openCursor();

            request.onsuccess = (event) => {
                const cursor = request.result;
                if (cursor && results.length < 50) {
                    const p = cursor.value as Product;
                    const matches = 
                        (p.name && p.name.toLowerCase().includes(termLower)) || 
                        (p.internalCodes && p.internalCodes.some(c => c.toLowerCase().includes(termLower))) ||
                        (p.barcodes && p.barcodes.some(c => c.toLowerCase().includes(termLower)));
                    
                    if (matches) results.push(p);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async save(product: Product): Promise<void> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(product);
            request.onsuccess = () => {
                window.dispatchEvent(new CustomEvent('ferrecloud_products_updated'));
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    async saveBulk(products: Product[]): Promise<void> {
        const db = await this.init();
        const CHUNK_SIZE = 10000;
        
        for (let i = 0; i < products.length; i += CHUNK_SIZE) {
            const chunk = products.slice(i, i + CHUNK_SIZE);
            await new Promise<void>((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                
                chunk.forEach(p => {
                    store.put(p);
                });

                transaction.oncomplete = () => {
                    const progress = Math.round(((i + chunk.length) / products.length) * 100);
                    window.dispatchEvent(new CustomEvent('ferrecloud_sync_progress', { detail: { progress } }));
                    resolve();
                };
                transaction.onerror = () => reject(transaction.error);
            });
        }
        
        window.dispatchEvent(new CustomEvent('ferrecloud_products_updated'));
    }

    async clearAll(): Promise<void> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async delete(id: string): Promise<void> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);
            request.onsuccess = () => {
                window.dispatchEvent(new CustomEvent('ferrecloud_products_updated'));
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }
}

export const productDB = new ProductDB();

export const addToReplenishmentQueue = (product: Product, quantity?: number) => {
    const saved = localStorage.getItem('ferrecloud_replenishment_queue');
    const queue: ReplenishmentItem[] = saved ? JSON.parse(saved) : [];
    
    const existing = queue.find(i => i.product.id === product.id);
    if (!existing) {
        queue.push({
            product,
            quantity: quantity || Math.max(1, (product.stockMaximo || 0) - product.stock),
            selectedProviderId: '',
            selectedProviderName: product.provider
        });
        localStorage.setItem('ferrecloud_replenishment_queue', JSON.stringify(queue));
        window.dispatchEvent(new Event('replenishment_queue_updated'));
        return true;
    }
    return false;
};
