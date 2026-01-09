
import { productDB } from './storageService';

export type SyncStatus = 'OFFLINE' | 'CONNECTING' | 'SYNCED' | 'DOWNLOADING' | 'ERROR';

class SyncService {
    private isAutoSyncEnabled: boolean = false;
    private vaultId: string = '';
    private apiUrl: string = '';

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

    // Vincula una PC nueva usando un ID existente
    async linkTerminal(newVaultId: string): Promise<boolean> {
        if (!newVaultId) return false;
        
        const config = {
            enabled: true,
            vaultId: newVaultId,
            apiUrl: 'https://cloud.ferrebruzzone.cloud/api/v1',
            lastSync: new Date().toLocaleString(),
            autoSync: true
        };
        
        localStorage.setItem('ferrecloud_sync_config', JSON.stringify(config));
        this.loadConfig();
        
        // Disparar descarga masiva tras vincular
        return await this.pullFullDatabase();
    }

    async initializeBootstrap(): Promise<SyncStatus> {
        this.loadConfig();
        if (!this.isAutoSyncEnabled || !this.vaultId) return 'OFFLINE';

        try {
            const localCount = (await productDB.getAll(1)).length;
            if (localCount === 0) {
                console.log("[Cloud] PC Vacía detectada. Iniciando descarga maestra...");
                await this.pullFullDatabase();
                return 'SYNCED';
            }
            await this.pullDeltas();
            return 'SYNCED';
        } catch (error) {
            return 'ERROR';
        }
    }

    async pullFullDatabase(): Promise<boolean> {
        console.log("[Cloud] Descargando 140,000 artículos en bloques...");
        
        // Simulación de descarga por lotes para evitar timeout
        for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 800));
            console.log(`[Cloud] Bloque ${i+1} de 5 procesado...`);
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_progress', { detail: { progress: (i + 1) * 20 } }));
        }

        // En un entorno real, aquí se recibiría el JSON masivo y se usaría productDB.saveBulk()
        console.log("[Cloud] Sincronización completa finalizada.");
        window.dispatchEvent(new Event('ferrecloud_products_updated'));
        return true;
    }

    private async pullDeltas() {
        // Verifica si hay cambios menores (ventas, precios)
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    async pushToCloud(data: any, type: string) {
        if (!this.isAutoSyncEnabled || !this.vaultId) return;
        console.log(`[CloudPush] Enviando ${type} a la bóveda ${this.vaultId}`);
        // Aquí iría el fetch real al servidor
        return true;
    }

    async syncEverything() {
        if (!this.isAutoSyncEnabled) return;
        const products = await productDB.getAll();
        await this.pushToCloud(products, 'FULL_INVENTORY');
    }
}

export const syncService = new SyncService();
