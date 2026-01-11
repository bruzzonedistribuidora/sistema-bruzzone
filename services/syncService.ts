
import { productDB } from './storageService';

export type SyncStatus = 'OFFLINE' | 'CONNECTING' | 'SYNCED' | 'DOWNLOADING' | 'UPLOADING' | 'ERROR' | 'UP_TO_DATE';

class SyncService {
    private vaultId: string | null = null;
    private isProcessing: boolean = false;
    private autoSyncTimer: any = null;

    constructor() {
        this.vaultId = localStorage.getItem('ferrecloud_vault_id');
    }

    setVaultId(id: string) {
        this.vaultId = id.toUpperCase();
        localStorage.setItem('ferrecloud_vault_id', this.vaultId);
        // Notificar cambio global
        window.dispatchEvent(new Event('ferrecloud_sync_config_updated'));
    }

    getVaultId() {
        return this.vaultId;
    }

    // Sincronización transparente (Simulada para este entorno)
    async syncFromRemote(): Promise<boolean> {
        if (!this.vaultId || this.isProcessing) return false;
        this.isProcessing = true;

        try {
            this.notifyProgress(5);
            console.log(`[Cloud] Sincronizando Bóveda: ${this.vaultId}`);
            
            // Simulamos la recuperación de datos globales
            // En producción, aquí haríamos un fetch a un backend real o un JSON store centralizado
            const globalRes = localStorage.getItem(`global_vault_${this.vaultId}`);
            
            if (!globalRes) {
                this.isProcessing = false;
                this.notifyProgress(0);
                return false;
            }

            const data = JSON.parse(globalRes);
            this.notifyProgress(30);

            if (data.products && data.products.length > 0) {
                // Actualizar IndexedDB local con los datos de la nube
                await productDB.saveBulk(data.products);
            }

            this.notifyProgress(100);
            this.isProcessing = false;
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse'));
            return true;
        } catch (e) {
            console.error("Error en sincronización remota:", e);
            this.isProcessing = false;
            this.notifyProgress(0);
            return false;
        }
    }

    // Subir cambios locales a la nube global
    async pushToCloud(data: any, type: string): Promise<void> {
        if (!this.vaultId) return;
        
        console.log(`[Cloud] Subiendo cambios de tipo: ${type}`);
        
        // Obtenemos todos los productos actuales para el respaldo maestro
        const allProducts = await productDB.getAll();
        const payload = {
            vaultId: this.vaultId,
            lastUpdate: new Date().toISOString(),
            products: allProducts,
            stats: { count: allProducts.length }
        };

        // Guardar en el "Almacén Global Simulado"
        localStorage.setItem(`global_vault_${this.vaultId}`, JSON.stringify(payload));
        localStorage.setItem('ferrecloud_last_sync', new Date().toLocaleString());
        
        // Disparar evento para que otros dispositivos (pestañas) se enteren
        window.dispatchEvent(new Event('ferrecloud_sync_pulse'));
    }

    startAutoSync(minutes: number) {
        this.stopAutoSync();
        if (minutes <= 0) return;

        this.autoSyncTimer = setInterval(() => {
            if (!this.isProcessing) this.syncFromRemote();
        }, minutes * 60 * 1000);
    }

    stopAutoSync() {
        if (this.autoSyncTimer) {
            clearInterval(this.autoSyncTimer);
            this.autoSyncTimer = null;
        }
    }

    private notifyProgress(progress: number) {
        window.dispatchEvent(new CustomEvent('ferrecloud_sync_progress', { detail: { progress } }));
    }

    async initializeBootstrap(): Promise<SyncStatus> {
        if (!this.vaultId) return 'OFFLINE';
        
        const stats = await productDB.getStats();
        if (stats.count === 0) {
            // Si no hay datos, intentar descargar inmediatamente
            const success = await this.syncFromRemote();
            return success ? 'SYNCED' : 'ERROR';
        }
        
        return 'UP_TO_DATE';
    }
}

export const syncService = new SyncService();
