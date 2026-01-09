
import { productDB } from './storageService';

export type SyncStatus = 'OFFLINE' | 'CONNECTING' | 'SYNCED' | 'DOWNLOADING' | 'ERROR';

class SyncService {
    private isAutoSyncEnabled: boolean = false;
    private vaultId: string = '';
    private apiUrl: string = '';
    private pollInterval: any = null;

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
                this.apiUrl = config.apiUrl || 'https://cloud.ferrebruzzone.cloud/api/v1';
            } catch (e) {
                console.error("Error al cargar configuración");
            }
        }
    }

    // Inicia el monitoreo de cambios externos (Ventas en otras PCs, etc)
    startBackgroundMonitor() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        if (!this.isAutoSyncEnabled || !this.vaultId) return;

        console.log("[Cloud] Monitor de Latido iniciado...");
        this.pollInterval = setInterval(() => {
            this.checkForRemoteChanges();
        }, 30000); // Cada 30 segundos verifica si otras PCs trabajaron
    }

    private async checkForRemoteChanges() {
        if (!this.isAutoSyncEnabled) return;
        
        // Simulación: Pregunta al servidor si el "hash" de la boveda cambió
        // En una app real: fetch(`${this.apiUrl}/vault/${this.vaultId}/status`)
        const hasChanges = Math.random() > 0.8; // Simula que el 20% de las veces hay algo nuevo

        if (hasChanges) {
            console.log("[Cloud] Detectados cambios en otra terminal. Sincronizando...");
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse'));
            await this.pullDeltas();
        }
    }

    async linkTerminal(newVaultId: string): Promise<boolean> {
        if (!newVaultId || newVaultId.length < 5) return false;
        
        const config = {
            enabled: true,
            vaultId: newVaultId.toUpperCase(),
            apiUrl: 'https://cloud.ferrebruzzone.cloud/api/v1',
            lastSync: new Date().toLocaleString(),
            autoSync: true
        };
        
        localStorage.setItem('ferrecloud_sync_config', JSON.stringify(config));
        this.loadConfig();
        window.dispatchEvent(new Event('ferrecloud_sync_config_updated'));
        
        const success = await this.pullFullDatabase();
        if (success) this.startBackgroundMonitor();
        return success;
    }

    async initializeBootstrap(): Promise<SyncStatus> {
        this.loadConfig();
        if (!this.isAutoSyncEnabled || !this.vaultId) return 'OFFLINE';

        try {
            const localCount = (await productDB.getAll(1)).length;
            if (localCount === 0) {
                await this.pullFullDatabase();
            } else {
                await this.pullDeltas();
            }
            this.startBackgroundMonitor();
            return 'SYNCED';
        } catch (error) {
            return 'ERROR';
        }
    }

    async pullFullDatabase(): Promise<boolean> {
        for (let i = 0; i <= 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 150));
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_progress', { detail: { progress: i * 10 } }));
        }
        window.dispatchEvent(new Event('ferrecloud_products_updated'));
        return true;
    }

    async pullDeltas() {
        // Trae solo ventas nuevas o cambios de stock de otras PCs
        await new Promise(resolve => setTimeout(resolve, 300));
        window.dispatchEvent(new Event('ferrecloud_products_updated'));
        window.dispatchEvent(new Event('ferrecloud_sales_updated'));
        return true;
    }

    async pushToCloud(data: any, type: string) {
        this.loadConfig();
        if (!this.isAutoSyncEnabled || !this.vaultId) return false;
        
        console.log(`[CloudPush] Enviando ${type} a la nube...`);
        // En producción: await fetch(..., { method: 'POST', body: JSON.stringify(data) })
        return true;
    }

    async syncEverything() {
        this.loadConfig();
        if (!this.isAutoSyncEnabled) return;
        const products = await productDB.getAll();
        await this.pushToCloud(products, 'FULL_INVENTORY');
        const sales = localStorage.getItem('ferrecloud_sales_history');
        await this.pushToCloud(sales ? JSON.parse(sales) : [], 'SALES_HISTORY');
    }
}

export const syncService = new SyncService();
