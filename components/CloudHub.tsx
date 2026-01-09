
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

    // Genera un "Paquete ADN" con toda la base de datos para mover entre PCs
    async generateSyncPackage(): Promise<string> {
        const products = await productDB.getAll();
        const config = localStorage.getItem('company_config');
        const clients = localStorage.getItem('ferrecloud_clients');
        
        const packageData = {
            ts: Date.now(),
            vaultId: this.vaultId,
            products,
            clients: clients ? JSON.parse(clients) : [],
            config: config ? JSON.parse(config) : {}
        };

        // Comprimimos mínimamente convirtiendo a base64 para evitar errores de pegado
        return btoa(unescape(encodeURIComponent(JSON.stringify(packageData))));
    }

    // Restaura un paquete ADN recibido de otra PC
    async importSyncPackage(base64Data: string): Promise<boolean> {
        try {
            const jsonStr = decodeURIComponent(escape(atob(base64Data)));
            const data = JSON.parse(jsonStr);

            if (!data.products) return false;

            await productDB.clearAll();
            await productDB.saveBulk(data.products);
            
            if (data.clients) localStorage.setItem('ferrecloud_clients', JSON.stringify(data.clients));
            if (data.config) localStorage.setItem('company_config', JSON.stringify(data.config));

            window.dispatchEvent(new Event('ferrecloud_products_updated'));
            window.dispatchEvent(new Event('company_config_updated'));
            return true;
        } catch (e) {
            console.error("Error al importar paquete:", e);
            return false;
        }
    }

    async pullFullDatabase(): Promise<boolean> {
        // En una implementación real con servidor, aquí se haría un fetch()
        // Como estamos en un ambiente sandbox, simulamos la sincronización de nube local
        const vaultDataKey = `ferrecloud_vault_data_${this.vaultId}`;
        const cloudDataRaw = localStorage.getItem(vaultDataKey);
        
        if (!cloudDataRaw) return false;

        try {
            const data = JSON.parse(cloudDataRaw);
            if (data.products) {
                await productDB.saveBulk(data.products);
                window.dispatchEvent(new Event('ferrecloud_products_updated'));
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    async pushToCloud(data: any, type: string) {
        this.loadConfig();
        if (!this.isAutoSyncEnabled || !this.vaultId) return false;

        // Simulamos la persistencia en "Nube" (que otras PCs leerían si tuviéramos backend)
        const vaultDataKey = `ferrecloud_vault_data_${this.vaultId}`;
        const currentProducts = await productDB.getAll();
        
        localStorage.setItem(vaultDataKey, JSON.stringify({
            products: currentProducts,
            lastUpdate: Date.now()
        }));

        console.log(`[Sync] Datos enviados a boveda ${this.vaultId}`);
        return true;
    }

    async initializeBootstrap(): Promise<SyncStatus> {
        this.loadConfig();
        if (!this.isAutoSyncEnabled) return 'OFFLINE';
        return 'SYNCED';
    }

    async syncEverything() {
        await this.pushToCloud({}, 'FULL');
    }

    async linkTerminal(newVaultId: string): Promise<boolean> {
        const config = {
            enabled: true,
            vaultId: newVaultId.toUpperCase(),
            apiUrl: 'https://cloud.ferrebruzzone.cloud/api/v1',
            lastSync: new Date().toLocaleString(),
            autoSync: true
        };
        localStorage.setItem('ferrecloud_sync_config', JSON.stringify(config));
        this.loadConfig();
        return true;
    }
}

export const syncService = new SyncService();
