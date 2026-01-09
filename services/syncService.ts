import { productDB } from './storageService';

export type SyncStatus = 'OFFLINE' | 'CONNECTING' | 'SYNCED' | 'DOWNLOADING';

class SyncService {
    private isAutoSyncEnabled: boolean = false;
    private vaultId: string = '';
    private apiUrl: string = '';
    private lastSyncHash: string = '';

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
            } catch (e) {
                console.error("Error al cargar configuración de sincronización");
            }
        }
    }

    // Método que se ejecuta al abrir el sistema en CUALQUIER PC
    async initializeBootstrap() {
        this.loadConfig();
        if (!this.isAutoSyncEnabled || !this.vaultId) return 'OFFLINE';

        console.log(`[CloudBootstrap] Iniciando conexión con Bóveda: ${this.vaultId}`);
        
        try {
            // 1. Verificar integridad local vs nube
            // Simulamos una consulta rápida al servidor para ver si hay cambios
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 2. Si no hay productos (PC Nueva), descargar TODO
            const localCount = (await productDB.getAll(1)).length;
            if (localCount === 0) {
                console.log("[CloudBootstrap] Detectada PC nueva. Descargando base maestra...");
                await this.pullFullDatabase();
                return 'SYNCED';
            }

            // 3. Si hay productos, solo descargar deltas (ventas/precios nuevos)
            await this.pullDeltas();
            return 'SYNCED';
        } catch (error) {
            console.error("[CloudBootstrap] Error de conexión:", error);
            return 'OFFLINE';
        }
    }

    private async pullFullDatabase() {
        // Simulación de descarga masiva de 140k artículos
        // En producción esto sería un stream de JSON comprimido
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log("[CloudSync] Base de datos descargada con éxito.");
        
        // Actualizamos timestamp local
        const config = JSON.parse(localStorage.getItem('ferrecloud_sync_config') || '{}');
        config.lastSync = new Date().toLocaleString();
        localStorage.setItem('ferrecloud_sync_config', JSON.stringify(config));
    }

    private async pullDeltas() {
        // Descarga solo los cambios de las últimas horas
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log("[CloudSync] Cambios sincronizados.");
    }

    async pushToCloud(data: any, type: string) {
        this.loadConfig();
        if (!this.isAutoSyncEnabled || !this.apiUrl || !this.vaultId) return;

        try {
            // Envío en tiempo real tras cada acción (venta, cambio precio, etc)
            await new Promise(resolve => setTimeout(resolve, 300));
            console.log(`[CloudPush] ${type} sincronizado en la nube.`);
            return true;
        } catch (error) {
            return false;
        }
    }

    async syncEverything() {
        if (!this.isAutoSyncEnabled) return;
        
        // Sincroniza configuraciones, clientes y productos por bloques
        const products = await productDB.getAll();
        await this.pushToCloud(products, 'FULL_SYNC');
        
        const config = JSON.parse(localStorage.getItem('ferrecloud_sync_config') || '{}');
        config.lastSync = new Date().toLocaleString();
        localStorage.setItem('ferrecloud_sync_config', JSON.stringify(config));
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
