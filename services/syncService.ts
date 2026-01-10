
import { productDB } from './storageService';

export type SyncStatus = 'OFFLINE' | 'CONNECTING' | 'SYNCED' | 'DOWNLOADING' | 'UPLOADING' | 'ERROR' | 'UP_TO_DATE';

class SyncService {
    private vaultId: string | null = null;
    private syncUrl: string | null = null;
    private isProcessing: boolean = false;
    private autoSyncTimer: any = null;

    constructor() {
        this.vaultId = localStorage.getItem('ferrecloud_vault_id');
        this.syncUrl = localStorage.getItem('ferrecloud_sync_url');
    }

    setVaultId(id: string) {
        this.vaultId = id.toUpperCase();
        localStorage.setItem('ferrecloud_vault_id', this.vaultId);
    }

    getVaultId() {
        return this.vaultId;
    }

    setSyncUrl(url: string) {
        // Convertir link de Dropbox dl=0 a raw=1 para fetch directo
        let directUrl = url;
        if (url.includes('dropbox.com')) {
            directUrl = url.replace('dl=0', 'raw=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com');
        }
        this.syncUrl = directUrl;
        localStorage.setItem('ferrecloud_sync_url', directUrl);
    }

    getSyncUrl() {
        return this.syncUrl;
    }

    // DESCARGAR DESDE URL (Dropbox/Nube)
    async syncFromRemote(): Promise<boolean> {
        if (!this.syncUrl || this.isProcessing) return false;
        this.isProcessing = true;

        try {
            this.notifyProgress(5);
            console.log(`[Cloud] Iniciando sincronización remota desde: ${this.syncUrl}`);
            
            const response = await fetch(this.syncUrl);
            if (!response.ok) throw new Error("Error de conexión con la nube");

            this.notifyProgress(25);
            const data = await response.json();
            
            if (!data.products) throw new Error("Archivo de nube inválido");

            this.notifyProgress(40);
            // Carga masiva en IndexedDB
            await productDB.clearAll();
            await productDB.saveBulk(data.products);

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

    // MOTOR DE AUTO-SINCRONIZACIÓN
    startAutoSync(minutes: number) {
        this.stopAutoSync();
        if (minutes <= 0) return;

        console.log(`[Cloud] Auto-sincronización activada cada ${minutes} min.`);
        this.autoSyncTimer = setInterval(() => {
            if (!this.isProcessing) {
                this.syncFromRemote();
            }
        }, minutes * 60 * 1000);
    }

    stopAutoSync() {
        if (this.autoSyncTimer) {
            clearInterval(this.autoSyncTimer);
            this.autoSyncTimer = null;
        }
    }

    // EXPORTAR PAQUETE (Igual que antes, para generar el archivo inicial)
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
            link.download = `NUBE_${data.vaultId}.ferre`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this.notifyProgress(100);
            this.isProcessing = false;
            return true;
        } catch (e) {
            this.isProcessing = false;
            return false;
        }
    }

    async importVaultPackage(file: File): Promise<boolean> {
        // Implementación manual existente...
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);
                    await productDB.clearAll();
                    await productDB.saveBulk(data.products);
                    resolve(true);
                } catch (e) { resolve(false); }
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

    async pushToCloud(data: any, type: string): Promise<void> {}
}

export const syncService = new SyncService();
