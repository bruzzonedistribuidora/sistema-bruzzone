
import { Product } from '../types';

const DB_NAME = 'FerreCloudDB';
const STORE_NAME = 'products';
const DB_VERSION = 1;

/**
 * Motor de persistencia IndexedDB para 140.000+ artículos.
 * Diseñado para evitar bloqueos de memoria y pérdida de datos.
 */
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
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(request.result);
            };

            request.onerror = () => reject(request.error);
        });
    }

    // Retorna una muestra limitada o todos (con precaución)
    async getAll(limit?: number): Promise<Product[]> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = limit ? store.getAll(null, limit) : store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Búsqueda eficiente en la DB para no saturar la RAM
    async search(term: string): Promise<Product[]> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll(); // IndexedDB no tiene full-text search nativo simple, filtramos aquí pero de forma asíncrona
            
            request.onsuccess = () => {
                const termLower = term.toLowerCase();
                const filtered = request.result.filter(p => 
                    (p.name || '').toLowerCase().includes(termLower) || 
                    (p.internalCodes || []).some(c => c.toLowerCase().includes(termLower)) ||
                    (p.barcodes || []).some(c => c.toLowerCase().includes(termLower))
                ).slice(0, 50); // Siempre limitar resultados de UI
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
            const astore = transaction.objectStore(STORE_NAME);
            products.forEach(p => store.put(p));
            transaction.oncomplete = () => {
                window.dispatchEvent(new CustomEvent('ferrecloud_products_updated'));
                resolve();
            };
            transaction.onerror = () => reject(transaction.error);
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
