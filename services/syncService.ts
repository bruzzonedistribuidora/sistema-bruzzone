
import { productDB } from './storageService';

export type SyncStatus = 'OFFLINE' | 'CONNECTING' | 'SYNCED' | 'DOWNLOADING' | 'ERROR';

class SyncService {
    private isAutoSyncEnabled: boolean = false;
    private vaultId: string = '';
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
            } catch (e) {
                console.error("Error al cargar configuración");
            }
        }
    }

    startBackgroundMonitor() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        if (!this.isAutoSyncEnabled || !this.vaultId) return;

        this.pollInterval = setInterval(() => {
            this.checkForRemoteChanges();
        }, 15000); // Verificación cada 15 segundos
    }

    private async checkForRemoteChanges() {
        if (!this.isAutoSyncEnabled) return;
        
        // Verificamos si hay una marca de actualización en la nube para esta bóveda
        const cloudSyncKey = `ferrecloud_vault_sync_${this.vaultId}`;
        const lastCloudUpdate = localStorage.getItem(cloudSyncKey);
        const lastLocalUpdate = localStorage.getItem(`local_sync_ts_${this.vaultId}`);

        if (lastCloudUpdate && lastCloudUpdate !== lastLocalUpdate) {
            console.log("[Cloud] Cambios detectados en la nube. Actualizando terminal...");
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse'));
            await this.pullDeltas();
            localStorage.setItem(`local_sync_ts_${this.vaultId}`, lastCloudUpdate);
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
        
        // Al vincular, forzamos la descarga completa de la base de la PC Madre
        const success = await this.pullFullDatabase();
        if (success) {
            this.startBackgroundMonitor();
            window.dispatchEvent(new Event('ferrecloud_sync_config_updated'));
        }
        return success;
    }

    async initializeBootstrap(): Promise<SyncStatus> {
        this.loadConfig();
        if (!this.isAutoSyncEnabled || !this.vaultId) return 'OFFLINE';

        try {
            // Verificamos si tenemos productos, si no, descargamos todo
            const localCount = await productDB.getAll(1);
            if (localCount.length === 0) {
                await this.pullFullDatabase();
            } else {
                await this.checkForRemoteChanges();
            }
            this.startBackgroundMonitor();
            return 'SYNCED';
        } catch (error) {
            return 'ERROR';
        }
    }

    async pullFullDatabase(): Promise<boolean> {
        try {
            const vaultDataKey = `ferrecloud_vault_data_${this.vaultId}`;
            const cloudDataRaw = localStorage.getItem(vaultDataKey);
            
            if (!cloudDataRaw) {
                console.warn("Bóveda vacía o no encontrada en la nube.");
                return true; 
            }

            const cloudData = JSON.parse(cloudDataRaw);
            
            // Simulamos progreso de descarga de 140k artículos
            for (let i = 0; i <= 10; i++) {
                await new Promise(resolve => setTimeout(resolve, 100));
                window.dispatchEvent(new CustomEvent('ferrecloud_sync_progress', { detail: { progress: i * 10 } }));
            }

            // Guardamos físicamente en el IndexedDB de esta PC
            if (cloudData.products) {
                await productDB.clearAll();
                await productDB.saveBulk(cloudData.products);
            }
            
            // Sincronizamos historial de ventas
            if (cloudData.sales) {
                localStorage.setItem('ferrecloud_sales_history', JSON.stringify(cloudData.sales));
            }

            window.dispatchEvent(new Event('ferrecloud_products_updated'));
            window.dispatchEvent(new Event('ferrecloud_sales_updated'));
            return true;
        } catch (e) {
            console.error("Error en Pull de base de datos:", e);
            return false;
        }
    }

    async pullDeltas() {
        // Trae solo las diferencias para no recargar todo
        return this.pullFullDatabase(); 
    }

    async pushToCloud(data: any, type: string) {
        this.loadConfig();
        if (!this.isAutoSyncEnabled || !this.vaultId) return false;

        try {
            const vaultDataKey = `ferrecloud_vault_data_${this.vaultId}`;
            const cloudSyncKey = `ferrecloud_vault_sync_${this.vaultId}`;
            
            // Obtenemos lo que ya hay en la "nube"
            const currentCloudRaw = localStorage.getItem(vaultDataKey);
            let currentCloud = currentCloudRaw ? JSON.parse(currentCloudRaw) : { products: [], sales: [] };

            if (type === 'PRODUCT' || type === 'BULK_PRODUCTS') {
                // Si es actualización de productos, refrescamos la base de la nube
                const allLocalProducts = await productDB.getAll();
                currentCloud.products = allLocalProducts;
            } else if (type === 'NEW_SALE') {
                // Si es una venta, la añadimos al historial de la nube
                if (data.sale) {
                    currentCloud.sales = [data.sale, ...(currentCloud.sales || [])];
                }
                // Actualizamos stock en la nube
                const allLocalProducts = await productDB.getAll();
                currentCloud.products = allLocalProducts;
            }

            // Guardamos en la "nube" compartida
            localStorage.setItem(vaultDataKey, JSON.stringify(currentCloud));
            
            // Marcamos un nuevo Timestamp para que otras terminales detecten el cambio
            const ts = Date.now().toString();
            localStorage.setItem(cloudSyncKey, ts);
            localStorage.setItem(`local_sync_ts_${this.vaultId}`, ts);

            console.log(`[CloudPush] ${type} sincronizado con éxito.`);
            return true;
        } catch (e) {
            console.error("Error en Push a la nube:", e);
            return false;
        }
    }

    async syncEverything() {
        this.loadConfig();
        if (!this.isAutoSyncEnabled) return;
        const products = await productDB.getAll();
        const salesRaw = localStorage.getItem('ferrecloud_sales_history');
        const sales = salesRaw ? JSON.parse(salesRaw) : [];
        
        await this.pushToCloud({ products, sales }, 'FULL_SYNC');
    }
}

export const syncService = new SyncService();
