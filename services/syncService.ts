
import { productDB } from './storageService';

export type SyncStatus = 'OFFLINE' | 'CONNECTING' | 'SYNCED' | 'DOWNLOADING' | 'UPLOADING' | 'ERROR' | 'UP_TO_DATE';

class SyncService {
    private vaultId: string | null = null;
    private isProcessing: boolean = false;

    constructor() {
        this.vaultId = localStorage.getItem('ferrecloud_vault_id');
    }

    setVaultId(id: string) {
        this.vaultId = id.toUpperCase();
        localStorage.setItem('ferrecloud_vault_id', this.vaultId);
    }

    getVaultId() {
        return this.vaultId;
    }

    // EXPORTAR PAQUETE DE NUBE (Para guardar en Drive/Dropbox)
    async exportVaultPackage(): Promise<boolean> {
        if (this.isProcessing) return false;
        this.isProcessing = true;

        try {
            this.notifyProgress(10);
            const allProducts = await productDB.getAll();
            this.notifyProgress(40);

            const data = {
                vaultId: this.vaultId || 'BRUZZONE-CENTRAL',
                version: Date.now(),
                count: allProducts.length,
                products: allProducts
            };

            const jsonString = JSON.stringify(data);
            const blob = new Blob([jsonString], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `NUBE_${data.vaultId}_${new Date().toISOString().split('T')[0]}.ferre`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            this.notifyProgress(100);
            this.isProcessing = false;
            return true;
        } catch (e) {
            console.error("Error al exportar nube", e);
            this.isProcessing = false;
            return false;
        }
    }

    // IMPORTAR PAQUETE DE NUBE (Desde el archivo de Drive/Dropbox)
    async importVaultPackage(file: File): Promise<boolean> {
        if (this.isProcessing) return false;
        this.isProcessing = true;

        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onprogress = (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 30);
                    this.notifyProgress(progress);
                }
            };

            reader.onload = async (event) => {
                try {
                    const content = event.target?.result as string;
                    const data = JSON.parse(content);
                    
                    if (!data.products) throw new Error("Formato inválido");

                    this.notifyProgress(40);
                    // Limpieza y carga masiva optimizada
                    await productDB.clearAll();
                    await productDB.saveBulk(data.products);

                    this.notifyProgress(100);
                    this.isProcessing = false;
                    resolve(true);
                } catch (err) {
                    console.error("Error importando:", err);
                    this.isProcessing = false;
                    resolve(false);
                }
            };

            reader.onerror = () => {
                this.isProcessing = false;
                resolve(false);
            };

            reader.readAsText(file);
        });
    }

    private notifyProgress(progress: number) {
        window.dispatchEvent(new CustomEvent('ferrecloud_sync_progress', { detail: { progress } }));
    }

    async initializeBootstrap(): Promise<SyncStatus> {
        return this.vaultId ? 'UP_TO_DATE' : 'OFFLINE';
    }

    async pushToCloud(data: any, type: string): Promise<void> {
        // En un futuro aquí se sincronizarían cambios incrementales vía API real
    }
}

export const syncService = new SyncService();
