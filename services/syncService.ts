
import { productDB, cloudSimDB } from './storageService';

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
        window.dispatchEvent(new Event('ferrecloud_sync_config_updated'));
    }

    getVaultId() {
        return this.vaultId;
    }

    async syncFromRemote(): Promise<boolean> {
        if (!this.vaultId || this.isProcessing) return false;
        this.isProcessing = true;

        try {
            this.notifyProgress(5, "Conectando con la Bóveda...");
            
            // Simulación de latencia de red
            await new Promise(r => setTimeout(r, 1000));
            
            const data = await cloudSimDB.getFromVault(this.vaultId);
            
            if (!data) {
                this.isProcessing = false;
                this.notifyProgress(0, "ID no encontrado.");
                return false;
            }

            this.notifyProgress(20, "Descargando Catálogo Maestro...");

            if (data.products && data.products.length > 0) {
                // El método saveBulk de productDB ya maneja el progreso interno
                await productDB.saveBulk(data.products);
            }

            this.notifyProgress(100, "Sincronización completa.");
            this.isProcessing = false;
            localStorage.setItem('ferrecloud_last_sync', new Date().toLocaleString());
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse'));
            return true;
        } catch (e) {
            console.error("Error en sincronización remota:", e);
            this.isProcessing = false;
            this.notifyProgress(0, "Error de red.");
            return false;
        }
    }

    async pushToCloud(data: any, type: string): Promise<boolean> {
        if (!this.vaultId || this.isProcessing) return false;
        this.isProcessing = true;
        
        try {
            this.notifyProgress(10, "Calculando volumen de datos...");
            
            const allProducts = await productDB.getAll();
            this.notifyProgress(40, `Empaquetando ${allProducts.length.toLocaleString()} artículos...`);
            
            // Simular tiempo de procesamiento de empaquetado
            await new Promise(r => setTimeout(r, 800));

            const payload = {
                vaultId: this.vaultId,
                lastUpdate: new Date().toISOString(),
                products: allProducts,
                stats: { count: allProducts.length }
            };

            this.notifyProgress(70, "Subiendo a Bóveda Cloud...");
            await cloudSimDB.saveToVault(this.vaultId, payload);
            
            this.notifyProgress(100, "Respaldo exitoso.");
            localStorage.setItem('ferrecloud_last_sync', new Date().toLocaleString());
            this.isProcessing = false;
            window.dispatchEvent(new Event('ferrecloud_sync_pulse'));
            return true;
        } catch (err) {
            console.error("Error al respaldar:", err);
            this.isProcessing = false;
            this.notifyProgress(0, "Falla en el respaldo.");
            return false;
        }
    }

    private notifyProgress(progress: number, message: string = "") {
        window.dispatchEvent(new CustomEvent('ferrecloud_sync_progress', { 
            detail: { progress, message } 
        }));
    }

    async initializeBootstrap(): Promise<SyncStatus> {
        if (!this.vaultId) return 'OFFLINE';
        
        const stats = await productDB.getStats();
        if (stats.count === 0) {
            const success = await this.syncFromRemote();
            return success ? 'SYNCED' : 'ERROR';
        }
        
        return 'UP_TO_DATE';
    }
}

export const syncService = new SyncService();
