
import { productDB, cloudSimDB } from './storageService';
import { SyncLogEntry } from '../types';

export type SyncStatus = 'OFFLINE' | 'CONNECTING' | 'SYNCED' | 'DOWNLOADING' | 'UPLOADING' | 'ERROR' | 'UP_TO_DATE';

class SyncService {
    private vaultId: string | null = null;
    private isProcessing: boolean = false;
    private pollingInterval: number | null = null;

    constructor() {
        this.vaultId = localStorage.getItem('ferrecloud_vault_id');
        if (!localStorage.getItem('ferrecloud_terminal_name')) {
            localStorage.setItem('ferrecloud_terminal_name', `TERM-${Math.floor(Math.random()*900)+100}`);
        }
        // Iniciar el ciclo automático si hay una bóveda vinculada
        if (this.vaultId) {
            this.startAutoSync();
        }
    }

    setVaultId(id: string) {
        this.vaultId = id.toUpperCase();
        localStorage.setItem('ferrecloud_vault_id', this.vaultId);
        window.dispatchEvent(new Event('ferrecloud_sync_config_updated'));
        this.startAutoSync();
    }

    getVaultId() { return this.vaultId; }

    // CICLO AUTOMÁTICO: Reemplaza la carga manual de archivos
    private startAutoSync() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        
        // Sincronizar inmediatamente al arrancar
        this.syncFromRemote();

        // Ciclo cada 30 segundos (simulando tiempo real sin saturar)
        this.pollingInterval = window.setInterval(() => {
            this.syncFromRemote();
        }, 30000);
    }

    async syncFromRemote(): Promise<boolean> {
        if (!this.vaultId || this.isProcessing) return false;
        this.isProcessing = true;
        
        try {
            const cloudData = await cloudSimDB.getFromVault(this.vaultId);
            if (!cloudData) {
                this.isProcessing = false;
                return false;
            }

            const cloudLogs: SyncLogEntry[] = cloudData.logs || [];
            if (cloudLogs.length === 0) {
                this.isProcessing = false;
                return true;
            }

            // Descargar y aplicar solo lo que no tenemos localmente
            const lastSyncStr = localStorage.getItem('ferrecloud_last_sync_timestamp');
            const lastSync = lastSyncStr ? parseInt(lastSyncStr) : 0;
            
            const newChanges = cloudLogs.filter(log => new Date(log.timestamp).getTime() > lastSync);

            if (newChanges.length > 0) {
                this.notifyProgress(50, `Descargando ${newChanges.length} cambios de red...`);
                
                const products = await productDB.getAll();
                for (const log of newChanges) {
                    // Evitar auto-procesar cambios que generamos nosotros mismos
                    if (log.terminalName === localStorage.getItem('ferrecloud_terminal_name')) continue;

                    if (log.type === 'STOCK_ADJUST' || log.type === 'SALE' || log.type === 'PRICE_CHANGE') {
                        const p = products.find(prod => prod.id === log.payload.productId);
                        if (p) {
                            // Aplicar cambio incremental
                            const updatedP = { ...p, ...log.payload };
                            await productDB.save(updatedP, true); // skipLog para no crear bucle
                        }
                    }
                }
            }

            localStorage.setItem('ferrecloud_last_sync_timestamp', Date.now().toString());
            localStorage.setItem('ferrecloud_last_sync', new Date().toLocaleString());
            this.notifyProgress(100, "Up to date");
            window.dispatchEvent(new Event('ferrecloud_sync_pulse'));
            this.isProcessing = false;
            return true;
        } catch (e) {
            this.isProcessing = false;
            return false;
        }
    }

    async pushToCloud(data?: any, type?: string): Promise<boolean> {
        if (!this.vaultId || this.isProcessing) return false;
        this.isProcessing = true;

        try {
            // Obtener logs pendientes locales
            const pendingLogs = await productDB.getPendingLogs();
            if (pendingLogs.length === 0 && !data) {
                this.isProcessing = false;
                return true;
            }

            const cloudData = await cloudSimDB.getFromVault(this.vaultId) || { logs: [], products: [] };
            
            // Unir y mantener solo los últimos 2000 logs para performance
            const updatedLogs = [...(cloudData.logs || []), ...pendingLogs].slice(-2000);
            
            // Actualizar el estado global en la nube simulada
            await cloudSimDB.saveToVault(this.vaultId, { 
                ...cloudData, 
                logs: updatedLogs,
                lastUpdate: new Date().toISOString()
            });
            
            await productDB.clearLogs();
            this.notifyProgress(100, "Cambios subidos");
            this.isProcessing = false;
            window.dispatchEvent(new Event('ferrecloud_sync_pulse'));
            return true;
        } catch (e) {
            this.isProcessing = false;
            return false;
        }
    }

    private notifyProgress(progress: number, message: string = "") {
        window.dispatchEvent(new CustomEvent('ferrecloud_sync_progress', { detail: { progress, message } }));
    }

    async initializeBootstrap(): Promise<SyncStatus> {
        if (!this.vaultId) return 'OFFLINE';
        await this.syncFromRemote();
        return 'UP_TO_DATE';
    }

    exportFullVault() { /* Legacy support */ }
    async importVaultFile(file: File) { return false; /* Legacy support */ }
}

export const syncService = new SyncService();
