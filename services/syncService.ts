
import { productDB, cloudSimDB } from './storageService';
import { SyncLogEntry } from '../types';

export type SyncStatus = 'OFFLINE' | 'CONNECTING' | 'SYNCED' | 'DOWNLOADING' | 'UPLOADING' | 'ERROR' | 'UP_TO_DATE';

// Lista de llaves de localStorage que deben compartirse entre todas las terminales
const SYNCED_LOCALSTORAGE_KEYS = [
    'ferrecloud_remitos',
    'ferrecloud_sales_history',
    'ferrecloud_clients',
    'ferrecloud_movements',
    'ferrecloud_budgets',
    'ferrecloud_checks',
    'ferrecloud_registers'
];

class SyncService {
    private vaultId: string | null = null;
    private isProcessing: boolean = false;
    private pollingInterval: number | null = null;
    private broadcastChannel: BroadcastChannel;

    constructor() {
        this.vaultId = localStorage.getItem('ferrecloud_vault_id');
        this.broadcastChannel = new BroadcastChannel('ferrecloud_sync_channel');
        
        if (!localStorage.getItem('ferrecloud_terminal_name')) {
            localStorage.setItem('ferrecloud_terminal_name', `TERM-${Math.floor(Math.random()*900)+100}`);
        }

        // Escuchar actualizaciones de otras pestañas en la misma máquina
        this.broadcastChannel.onmessage = (event) => {
            if (event.data === 'REFRESH_REQUIRED') {
                window.dispatchEvent(new Event('ferrecloud_sync_pulse'));
            }
        };

        if (this.vaultId) {
            this.startAutoSync();
        }
    }

    setVaultId(id: string) {
        const cleanId = id.trim().toUpperCase().replace(/\s/g, '');
        this.vaultId = cleanId;
        localStorage.setItem('ferrecloud_vault_id', cleanId);
        window.dispatchEvent(new Event('ferrecloud_sync_config_updated'));
        this.startAutoSync();
    }

    getVaultId() { return this.vaultId; }

    private startAutoSync() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.syncFromRemote();
        // Ciclo agresivo cada 5 segundos para que la ferretería sea ágil
        this.pollingInterval = window.setInterval(() => {
            this.syncFromRemote();
            this.pushToCloud();
        }, 5000);
    }

    async syncFromRemote(): Promise<boolean> {
        if (!this.vaultId || this.isProcessing) return false;
        this.isProcessing = true;
        
        try {
            const cloudData = await cloudSimDB.getFromVault(this.vaultId);
            if (!cloudData) {
                this.isProcessing = false;
                return true;
            }

            // 1. Sincronizar LocalStorage (Tablas de documentos y clientes)
            if (cloudData.sharedStorage) {
                let hasChanges = false;
                Object.entries(cloudData.sharedStorage).forEach(([key, remoteValue]) => {
                    const localValue = localStorage.getItem(key);
                    // Si el valor remoto es más nuevo o diferente (simplificado para demo)
                    if (JSON.stringify(remoteValue) !== localValue) {
                        localStorage.setItem(key, remoteValue as string);
                        hasChanges = true;
                    }
                });
                if (hasChanges) {
                    window.dispatchEvent(new Event('ferrecloud_sync_pulse'));
                }
            }

            // 2. Sincronizar Logs de Productos (Stock y Precios)
            const cloudLogs: SyncLogEntry[] = cloudData.logs || [];
            const lastSyncStr = localStorage.getItem('ferrecloud_last_sync_timestamp');
            const lastSync = lastSyncStr ? parseInt(lastSyncStr) : 0;
            
            const newChanges = cloudLogs.filter(log => 
                new Date(log.timestamp).getTime() > lastSync && 
                log.terminalName !== localStorage.getItem('ferrecloud_terminal_name')
            );

            if (newChanges.length > 0) {
                this.notifyProgress(50, `Descargando ${newChanges.length} cambios...`);
                const products = await productDB.getAll();
                for (const log of newChanges) {
                    if (log.payload && log.payload.productId) {
                        const p = products.find(prod => prod.id === log.payload.productId);
                        if (p) {
                            await productDB.save({ ...p, ...log.payload }, true);
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
            this.isProcessing = false;
            return false;
        }
    }

    async pushToCloud(): Promise<boolean> {
        if (!this.vaultId) return false;

        try {
            const pendingLogs = await productDB.getPendingLogs();
            const cloudData = await cloudSimDB.getFromVault(this.vaultId) || { logs: [], sharedStorage: {} };
            
            // Recolectar estado actual de las tablas de localStorage para la nube
            const currentStorage: Record<string, string> = {};
            SYNCED_LOCALSTORAGE_KEYS.forEach(key => {
                const val = localStorage.getItem(key);
                if (val) currentStorage[key] = val;
            });

            const updatedLogs = [...(cloudData.logs || []), ...pendingLogs].slice(-2000);
            
            await cloudSimDB.saveToVault(this.vaultId, { 
                ...cloudData, 
                logs: updatedLogs,
                sharedStorage: { ...(cloudData.sharedStorage || {}), ...currentStorage },
                lastUpdate: new Date().toISOString()
            });
            
            await productDB.clearLogs();
            this.broadcastChannel.postMessage('REFRESH_REQUIRED');
            return true;
        } catch (e) {
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
}

export const syncService = new SyncService();
