
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
        if (this.vaultId) {
            this.startAutoSync();
        }
    }

    setVaultId(id: string) {
        // Normalización: removemos espacios y convertimos a mayúsculas
        const cleanId = id.trim().toUpperCase().replace(/\s/g, '');
        this.vaultId = cleanId;
        localStorage.setItem('ferrecloud_vault_id', cleanId);
        window.dispatchEvent(new Event('ferrecloud_sync_config_updated'));
        this.startAutoSync();
    }

    getVaultId() { return this.vaultId; }

    private startAutoSync() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        
        // Sincronizar inmediatamente
        this.syncFromRemote();

        // Ciclo cada 10 segundos (Sincronización estilo Fidel)
        this.pollingInterval = window.setInterval(() => {
            this.syncFromRemote();
            this.pushToCloud(); // Empuja cambios locales que hayan quedado pendientes
        }, 10000);
    }

    async syncFromRemote(): Promise<boolean> {
        if (!this.vaultId || this.isProcessing) return false;
        this.isProcessing = true;
        
        try {
            let cloudData = await cloudSimDB.getFromVault(this.vaultId);
            
            // Si el ID es nuevo (como BRUZZONE2026), inicializamos el espacio en la nube
            if (!cloudData) {
                console.log("Inicializando nueva bóveda de red:", this.vaultId);
                const initialData = { 
                    logs: [], 
                    lastUpdate: new Date().toISOString(),
                    terminalCount: 1 
                };
                await cloudSimDB.saveToVault(this.vaultId, initialData);
                cloudData = initialData;
            }

            const cloudLogs: SyncLogEntry[] = cloudData.logs || [];
            if (cloudLogs.length === 0) {
                this.isProcessing = false;
                return true;
            }

            // Descargar solo cambios posteriores al último sync
            const lastSyncStr = localStorage.getItem('ferrecloud_last_sync_timestamp');
            const lastSync = lastSyncStr ? parseInt(lastSyncStr) : 0;
            
            const newChanges = cloudLogs.filter(log => 
                new Date(log.timestamp).getTime() > lastSync && 
                log.terminalName !== localStorage.getItem('ferrecloud_terminal_name')
            );

            if (newChanges.length > 0) {
                this.notifyProgress(50, `Recibiendo ${newChanges.length} actualizaciones...`);
                
                const products = await productDB.getAll();
                for (const log of newChanges) {
                    if (log.type === 'STOCK_ADJUST' || log.type === 'SALE' || log.type === 'PRICE_CHANGE') {
                        const p = products.find(prod => prod.id === log.payload.productId);
                        if (p) {
                            // Aplicamos el cambio incremental
                            const updatedP = { ...p, ...log.payload };
                            await productDB.save(updatedP, true); // skipLog: true para no re-notificar
                        } else if (log.type === 'STOCK_ADJUST' && log.payload.fullProduct) {
                            // Si es un producto nuevo que no tenemos, lo creamos
                            await productDB.save(log.payload.fullProduct, true);
                        }
                    }
                }
                window.dispatchEvent(new Event('ferrecloud_sync_pulse'));
            }

            localStorage.setItem('ferrecloud_last_sync_timestamp', Date.now().toString());
            localStorage.setItem('ferrecloud_last_sync', new Date().toLocaleString());
            this.notifyProgress(100, "Conectado");
            this.isProcessing = false;
            return true;
        } catch (e) {
            console.error("Error de Sync:", e);
            this.isProcessing = false;
            return false;
        }
    }

    async pushToCloud(data?: any, type?: string): Promise<boolean> {
        if (!this.vaultId) return false;

        try {
            const pendingLogs = await productDB.getPendingLogs();
            if (pendingLogs.length === 0 && !data) return true;

            const cloudData = await cloudSimDB.getFromVault(this.vaultId) || { logs: [] };
            
            // Unimos logs locales a la nube
            const updatedLogs = [...(cloudData.logs || []), ...pendingLogs].slice(-5000);
            
            await cloudSimDB.saveToVault(this.vaultId, { 
                ...cloudData, 
                logs: updatedLogs,
                lastUpdate: new Date().toISOString()
            });
            
            await productDB.clearLogs();
            window.dispatchEvent(new Event('ferrecloud_sync_pulse'));
            return true;
        } catch (e) {
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
        const ok = await this.syncFromRemote();
        return ok ? 'UP_TO_DATE' : 'ERROR';
    }
}

export const syncService = new SyncService();
