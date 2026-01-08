import { Product, ReplenishmentItem } from '../types';

const DB_NAME = 'FerreCloudDB';
const STORE_NAME = 'products';
const DB_VERSION = 2; // Incrementado para actualizar índices

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
                } else {
                    const store = (event.target as IDBOpenDBRequest).transaction?.objectStore(STORE_NAME);
                    if (store && !store.indexNames.contains('webPropia')) {
                        store.createIndex('webPropia', 'ecommerce.webPropia', { unique: false });
                    }
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(request.result);
            };

            request.onerror = () => reject(request.error);
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

    // Nuevo método para obtener solo productos publicados de forma eficiente
    async getPublished(): Promise<Product[]> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('webPropia');
            // Fix: Cast 'true' to any as boolean might not be included in the IDBValidKey type definition in some TypeScript environments
            const request = index.getAll(true as any); // Busca donde ecommerce.webPropia === true
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async search(term: string): Promise<Product[]> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll(); 
            
            request.onsuccess = () => {
                const termLower = term.toLowerCase().trim();
                if (!termLower) {
                    resolve(request.result.slice(0, 50));
                    return;
                }
                const filtered = request.result.filter(p => 
                    (p.name && p.name.toLowerCase().includes(termLower)) || 
                    (p.internalCodes && p.internalCodes.some(c => c.toLowerCase().includes(termLower))) ||
                    (p.barcodes && p.barcodes.some(c => c.toLowerCase().includes(termLower)))
                ).slice(0, 50); 
                resolve(filtered);
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
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            products.forEach(p => {
                try {
                    store.put(p);
                } catch (e) {
                    console.error("Error guardando producto en bulk:", p.id, e);
                }
            });

            transaction.oncomplete = () => {
                window.dispatchEvent(new CustomEvent('ferrecloud_products_updated'));
                resolve();
            };
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async clearAll(): Promise<void> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();
            request.onsuccess = () => {
                window.dispatchEvent(new CustomEvent('ferrecloud_products_updated'));
                resolve();
            };
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

// Cola de Reposición (Pedir)
export const addToReplenishmentQueue = (product: Product, quantity?: number) => {
    const saved = localStorage.getItem('ferrecloud_replenishment_queue');
    const queue: ReplenishmentItem[] = saved ? JSON.parse(saved) : [];
    
    const existing = queue.find(i => i.product.id === product.id);
    if (!existing) {
        queue.push({
            product,
            quantity: quantity || Math.max(1, (product.stockMaximo || 0) - product.stock),
            selectedProviderId: '', // Se elige en el módulo
            selectedProviderName: product.provider
        });
        localStorage.setItem('ferrecloud_replenishment_queue', JSON.stringify(queue));
        window.dispatchEvent(new Event('replenishment_queue_updated'));
        return true;
    }
    return false;
};
