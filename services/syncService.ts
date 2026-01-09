import { productDB } from './storageService';

export type SyncStatus = 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';

class SyncService {
    private isAutoSyncEnabled: boolean = false;
    private vaultId: string = '';
    private apiUrl: string = '';
    private lastSync: string = '';

    constructor() {
        this.loadConfig();
    }

    private loadConfig() {
        const saved = localStorage.getItem('ferrecloud_sync_config');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                this.isAutoSyncEnabled = config.enabled || false;
                this.vaultId = config.vaultId || '';
                this.apiUrl = config.apiUrl || '';
                this.lastSync = config.lastSync || 'Nunca';
            } catch (e) {
                console.error("Error al cargar configuración de sincronización");
            }
        }
    }

    // Método principal para subir datos a la nube
    async pushToCloud(data: any, type: string) {
        this.loadConfig(); // Recargar config por si cambió
        if (!this.isAutoSyncEnabled || !this.apiUrl || !this.vaultId) return;

        console.log(`[CloudSync] Sincronizando ${type} con Vault: ${this.vaultId}...`);
        
        try {
            // Simulación de envío a API REST
            // En una implementación real: await fetch(`${this.apiUrl}/sync/${this.vaultId}/${type}`, { method: 'POST', body: JSON.stringify(data) })
            await new Promise(resolve => setTimeout(resolve, 500));
            
            this.lastSync = new Date().toLocaleString();
            this.updateLastSync();
            return true;
        } catch (error) {
            console.error(`[CloudSync] Error en tipo ${type}:`, error);
            return false;
        }
    }

    // Sincronización total solicitada: Junta todos los datos del sistema
    async syncEverything() {
        if (!this.isAutoSyncEnabled) return;

        // 1. Sincronizar Configuración de Empresa y Licencia
        const config = localStorage.getItem('company_config');
        if (config) await this.pushToCloud(JSON.parse(config), 'COMPANY_CONFIG');

        // 2. Sincronizar Clientes y Proveedores
        const clients = localStorage.getItem('ferrecloud_clients');
        if (clients) await this.pushToCloud(JSON.parse(clients), 'CLIENTS');
        
        const providers = localStorage.getItem('ferrecloud_providers');
        if (providers) await this.pushToCloud(JSON.parse(providers), 'PROVIDERS');

        // 3. Sincronizar Historiales (Ventas, Compras, Movimientos)
        const sales = localStorage.getItem('ferrecloud_sales_history');
        if (sales) await this.pushToCloud(JSON.parse(sales), 'SALES');

        const movements = localStorage.getItem('ferrecloud_movements');
        if (movements) await this.pushToCloud(JSON.parse(movements), 'MOVEMENTS');

        // 4. Sincronizar Base de Datos de Artículos (Manejo de 140k registros)
        await this.syncMasterDatabase();
        
        console.log("[CloudSync] Sincronización global completada.");
    }

    // Sincronización inteligente de artículos por bloques
    async syncMasterDatabase() {
        const products = await productDB.getAll();
        const chunks = this.chunkArray(products, 5000);
        
        for (let i = 0; i < chunks.length; i++) {
            console.log(`[CloudSync] Subiendo bloque de artículos ${i+1}/${chunks.length}`);
            await this.pushToCloud(chunks[i], `PRODUCTS_PART_${i}`);
        }
    }

    async pullFromCloud() {
        this.loadConfig();
        if (!this.isAutoSyncEnabled || !this.apiUrl || !this.vaultId) return null;

        console.log("[CloudSync] Verificando actualizaciones en la nube...");
        try {
            // Simulación de descarga
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { status: 'ok', timestamp: new Date().toISOString() };
        } catch (error) {
            return null;
        }
    }

    private updateLastSync() {
        const config = JSON.parse(localStorage.getItem('ferrecloud_sync_config') || '{}');
        config.lastSync = this.lastSync;
        localStorage.setItem('ferrecloud_sync_config', JSON.stringify(config));
        window.dispatchEvent(new Event('ferrecloud_sync_updated'));
    }

    private chunkArray(array: any[], size: number) {
        const result = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    }
}

export const syncService = new SyncService();
