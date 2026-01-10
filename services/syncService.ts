
import { productDB } from './storageService';

export type SyncStatus = 'OFFLINE' | 'CONNECTING' | 'SYNCED' | 'DOWNLOADING' | 'UPLOADING' | 'ERROR' | 'UP_TO_DATE';

class SyncService {
    private vaultId: string | null = null;
    private isProcessing: boolean = false;

    constructor() {
        this.vaultId = localStorage.getItem('ferrecloud_vault_id');
    }

    // Configura el ID de la nube (Ej: BRUZZONE-2024)
    setVaultId(id: string) {
        this.vaultId = id.toUpperCase();
        localStorage.setItem('ferrecloud_vault_id', this.vaultId);
    }

    getVaultId() {
        return this.vaultId;
    }

    // SUBIR TODO A LA NUBE (Desde el local)
    async uploadToCloud(): Promise<boolean> {
        if (!this.vaultId || this.isProcessing) return false;
        this.isProcessing = true;

        try {
            // Notificar inicio
            this.notifyProgress(10);
            
            const allProducts = await productDB.getAll();
            const data = {
                vaultId: this.vaultId,
                lastUpdate: new Date().toISOString(),
                count: allProducts.length,
                products: allProducts
            };

            // Simulación de subida a la nube (En un entorno real aquí iría un fetch POST)
            console.log(`[Cloud] Subiendo ${allProducts.length} productos a la bóveda ${this.vaultId}...`);
            
            // Simulamos tiempo de subida por red
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Guardamos en un "servidor" (localStorage simulado para la demo, pero representa la nube)
            // En producción esto se guarda en un Bucket de S3 o Base de Datos NoSQL
            localStorage.setItem(`cloud_storage_${this.vaultId}`, JSON.stringify(data));
            
            this.notifyProgress(100);
            this.isProcessing = false;
            return true;
        } catch (e) {
            console.error("Error al subir a la nube", e);
            this.isProcessing = false;
            return false;
        }
    }

    // DESCARGAR DE LA NUBE (Desde casa)
    async downloadFromCloud(): Promise<boolean> {
        if (!this.vaultId || this.isProcessing) return false;
        this.isProcessing = true;

        try {
            this.notifyProgress(5);
            
            // Simulación de descarga (fetch GET)
            const cloudDataRaw = localStorage.getItem(`cloud_storage_${this.vaultId}`);
            if (!cloudDataRaw) {
                throw new Error("Bóveda no encontrada");
            }

            const cloudData = JSON.parse(cloudDataRaw);
            this.notifyProgress(30);

            // Guardar masivamente en la PC de casa
            await productDB.clearAll();
            await productDB.saveBulk(cloudData.products);

            this.notifyProgress(100);
            this.isProcessing = false;
            return true;
        } catch (e) {
            console.error("Error al descargar de la nube", e);
            this.isProcessing = false;
            return false;
        }
    }

    private notifyProgress(progress: number) {
        window.dispatchEvent(new CustomEvent('ferrecloud_sync_progress', { detail: { progress } }));
    }

    async initializeBootstrap(): Promise<SyncStatus> {
        return this.vaultId ? 'UP_TO_DATE' : 'OFFLINE';
    }

    async pushToCloud(data: any, type: string): Promise<void> {
        // Enviar cambios pequeños automáticamente si la nube está configurada
        if (this.vaultId) {
            console.log(`[Cloud] Auto-sincronizando: ${type}`);
        }
    }
}

export const syncService = new SyncService();
