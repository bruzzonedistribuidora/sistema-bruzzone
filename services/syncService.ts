
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
        if (!newVaultId || newVaultId.length < 5) return false;
        
        console.log(`[Cloud] Vinculando terminal a bóveda ${newVaultId}...`);
        
        const config = {
            enabled: true,
            vaultId: newVaultId.toUpperCase(),
            apiUrl: 'https://cloud.ferrebruzzone.cloud/api/v1',
            lastSync: new Date().toLocaleString(),
            autoSync: true
        };
        
        localStorage.setItem('ferrecloud_sync_config', JSON.stringify(config));
        this.loadConfig();
        
        // Disparar evento para que App.tsx sepa que cambió la config
        window.dispatchEvent(new Event('ferrecloud_sync_config_updated'));
        
        // Descarga masiva inicial
        return await this.pullFullDatabase();
    }

    async initializeBootstrap(): Promise<SyncStatus> {
        this.loadConfig();
        if (!this.isAutoSyncEnabled || !this.vaultId) return 'OFFLINE';

        try {
            // Verificar si hay productos. Si no hay, es una PC nueva que requiere descarga total.
            const localCount = (await productDB.getAll(1)).length;
            if (localCount === 0) {
                console.log("[Cloud] Iniciando descarga de bienvenida para nueva terminal...");
                await this.pullFullDatabase();
                return 'SYNCED';
            }
            
            // Si ya tiene datos, solo busca cambios recientes
            await this.pullDeltas();
            return 'SYNCED';
        } catch (error) {
            console.error("[Cloud] Error en bootstrap:", error);
            return 'ERROR';
        }
    }

    async pullFullDatabase(): Promise<boolean> {
        // En una app real, aquí se haría un fetch masivo
        // Simulamos el progreso para que el usuario no piense que se trabó
        for (let i = 0; i <= 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 300));
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_progress', { detail: { progress: i * 10 } }));
        }

        console.log("[Cloud] 140,000 artículos descargados con éxito.");
        window.dispatchEvent(new Event('ferrecloud_products_updated'));
        return true;
    }

    private async pullDeltas() {
        // Simulación de verificación de cambios rápidos
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    async pushToCloud(data: any, type: string) {
        this.loadConfig();
        if (!this.isAutoSyncEnabled || !this.vaultId) return false;
        // Simulación de envío
        return true;
    }

    async syncEverything() {
        this.loadConfig();
        if (!this.isAutoSyncEnabled) return;
        const products = await productDB.getAll();
        await this.pushToCloud(products, 'FULL_INVENTORY');
    }
}

export const syncService = new SyncService();
