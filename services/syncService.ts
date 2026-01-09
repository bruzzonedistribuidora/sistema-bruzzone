
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
            const config = JSON.parse(saved);
            this.isAutoSyncEnabled = config.enabled;
            this.vaultId = config.vaultId;
            this.apiUrl = config.apiUrl;
            this.lastSync = config.lastSync;
        }
    }

    // Simulación de persistencia en la nube (debería conectar con un backend real)
    async pushToCloud(data: any, type: 'PRODUCTS' | 'CLIENTS' | 'CONFIG') {
        if (!this.isAutoSyncEnabled || !this.apiUrl) return;

        console.log(`[CloudSync] Subiendo ${type}...`);
        try {
            // Aquí iría el fetch(this.apiUrl + '/push')
            // Simulamos latencia de red
            await new Promise(resolve => setTimeout(resolve, 800));
            
            this.lastSync = new Date().toLocaleString();
            this.updateLastSync();
            return true;
        } catch (error) {
            console.error("[CloudSync] Error al subir:", error);
            return false;
        }
    }

    async pullFromCloud() {
        if (!this.isAutoSyncEnabled || !this.apiUrl) return null;

        try {
            // Aquí iría el fetch(this.apiUrl + '/pull')
            await new Promise(resolve => setTimeout(resolve, 1500));
            return {
                status: 'ok',
                timestamp: new Date().toISOString()
            };
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

    // Sincronización inteligente de artículos (manejo de 140k registros)
    async syncMasterDatabase() {
        if (!this.isAutoSyncEnabled) return;
        
        const products = await productDB.getAll();
        // Dividimos en trozos para no bloquear el hilo principal
        const chunks = this.chunkArray(products, 5000);
        
        for (const chunk of chunks) {
            await this.pushToCloud(chunk, 'PRODUCTS');
        }
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
