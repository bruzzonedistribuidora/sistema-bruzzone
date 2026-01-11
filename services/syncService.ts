
import { productDB, cloudSimDB } from './storageService';

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
        window.dispatchEvent(new Event('ferrecloud_sync_config_updated'));
    }

    getVaultId() {
        return this.vaultId;
    }

    // Exporta toda la base de datos para otra PC
    async exportFullVault(): Promise<void> {
        if (!this.vaultId) return;
        this.notifyProgress(10, "Preparando exportación masiva...");
        
        const allProducts = await productDB.getAll();
        const vaultData = {
            vaultId: this.vaultId,
            timestamp: new Date().toISOString(),
            products: allProducts,
            config: {
                clients: JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]'),
                providers: JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'),
                brands: JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'),
                categories: JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]')
            }
        };

        this.notifyProgress(50, "Comprimiendo 140k artículos...");
        const blob = new Blob([JSON.stringify(vaultData)], { type: 'application/ferrecloud' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `VINCULO_${this.vaultId}_${new Date().getTime()}.ferre`;
        link.click();
        
        this.notifyProgress(100, "Archivo de vinculación generado.");
        setTimeout(() => this.notifyProgress(0), 2000);
    }

    // Importa la bóveda en una PC nueva
    async importVaultFile(file: File): Promise<boolean> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            this.notifyProgress(10, "Leyendo archivo de vinculación...");
            
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target?.result as string);
                    this.notifyProgress(30, `Vinculando Bóveda: ${data.vaultId}`);
                    
                    this.setVaultId(data.vaultId);
                    
                    if (data.products) {
                        this.notifyProgress(40, "Instalando base de datos de artículos...");
                        await productDB.clearAll();
                        await productDB.saveBulk(data.products);
                    }

                    if (data.config) {
                        localStorage.setItem('ferrecloud_clients', JSON.stringify(data.config.clients));
                        localStorage.setItem('ferrecloud_providers', JSON.stringify(data.config.providers));
                        localStorage.setItem('ferrecloud_brands', JSON.stringify(data.config.brands));
                        localStorage.setItem('ferrecloud_categories', JSON.stringify(data.config.categories));
                    }

                    // Guardar en el simulador de nube local para que los botones de sync funcionen
                    await cloudSimDB.saveToVault(data.vaultId, { products: data.products });

                    this.notifyProgress(100, "¡PC Vinculada con éxito!");
                    window.dispatchEvent(new Event('ferrecloud_sync_pulse'));
                    resolve(true);
                } catch (err) {
                    console.error(err);
                    this.notifyProgress(0, "Archivo corrupto o inválido.");
                    resolve(false);
                }
            };
            reader.readAsText(file);
        });
    }

    async syncFromRemote(): Promise<boolean> {
        if (!this.vaultId || this.isProcessing) return false;
        this.isProcessing = true;

        try {
            this.notifyProgress(5, "Conectando con la Bóveda Cloud...");
            await new Promise(r => setTimeout(r, 1000));
            
            const data = await cloudSimDB.getFromVault(this.vaultId);
            
            if (!data) {
                this.isProcessing = false;
                this.notifyProgress(0, "Bóveda no vinculada en esta PC.");
                return false;
            }

            this.notifyProgress(20, "Descargando Actualizaciones...");
            if (data.products) await productDB.saveBulk(data.products);

            this.notifyProgress(100, "Sincronización completa.");
            this.isProcessing = false;
            localStorage.setItem('ferrecloud_last_sync', new Date().toLocaleString());
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse'));
            return true;
        } catch (e) {
            this.isProcessing = false;
            this.notifyProgress(0, "Error de conexión.");
            return false;
        }
    }

    async pushToCloud(data: any, type: string): Promise<boolean> {
        if (!this.vaultId || this.isProcessing) return false;
        this.isProcessing = true;
        
        try {
            this.notifyProgress(10, "Preparando envío...");
            const allProducts = await productDB.getAll();
            const payload = {
                vaultId: this.vaultId,
                lastUpdate: new Date().toISOString(),
                products: allProducts,
            };

            this.notifyProgress(70, "Subiendo a Bóveda Maestro...");
            await cloudSimDB.saveToVault(this.vaultId, payload);
            
            this.notifyProgress(100, "Nube actualizada.");
            localStorage.setItem('ferrecloud_last_sync', new Date().toLocaleString());
            this.isProcessing = false;
            window.dispatchEvent(new Event('ferrecloud_sync_pulse'));
            return true;
        } catch (err) {
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
        if (stats.count === 0) return 'OFFLINE';
        return 'UP_TO_DATE';
    }
}

export const syncService = new SyncService();
