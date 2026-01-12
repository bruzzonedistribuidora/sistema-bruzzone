
import { productDB, cloudSimDB } from './storageService';
import { SyncLogEntry } from '../types';

const ARRAY_SYNC_KEYS = [
    'ferrecloud_remitos',
    'ferrecloud_sales_history',
    'ferrecloud_clients',
    'ferrecloud_movements',
    'ferrecloud_purchases',
    'ferrecloud_providers',
    'ferrecloud_registers',
    'ferrecloud_budgets'
];

class SyncService {
    private vaultId: string | null = null;
    private isProcessing: boolean = false;
    private pollingInterval: number | null = null;
    private channel: BroadcastChannel;

    constructor() {
        this.vaultId = localStorage.getItem('ferrecloud_vault_id');
        this.channel = new BroadcastChannel('ferrecloud_sync_relay');
        
        this.channel.onmessage = (event) => {
            if (event.data === 'FORCE_PULL') {
                this.syncLoop();
            }
        };

        if (this.vaultId) this.startAutoSync();
    }

    async syncFromRemote(): Promise<boolean> {
        if (!this.vaultId) return false;
        await this.syncLoop();
        return true;
    }

    setVaultId(id: string) {
        this.vaultId = id.toUpperCase().trim();
        localStorage.setItem('ferrecloud_vault_id', this.vaultId);
        this.startAutoSync();
    }

    getVaultId() { return this.vaultId; }

    private startAutoSync() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.syncLoop();
        // Sincronización proactiva cada 10 segundos
        this.pollingInterval = window.setInterval(() => this.syncLoop(), 10000);
    }

    private mergeData(localStr: string | null, remoteStr: string | null): { merged: any[], hasChanges: boolean } {
        const local = JSON.parse(localStr || '[]');
        const remote = JSON.parse(remoteStr || '[]');
        
        if (!Array.isArray(local)) return { merged: remote, hasChanges: true };
        if (!Array.isArray(remote)) return { merged: local, hasChanges: false };

        const localMap = new Map(local.map(item => [item.id, item]));
        const remoteMap = new Map(remote.map(item => [item.id, item]));
        
        let hasChanges = false;
        const combined = [...remote];

        local.forEach(item => {
            if (!remoteMap.has(item.id)) {
                combined.push(item);
                hasChanges = true;
            }
        });

        const remoteHasNew = remote.some(item => !localMap.has(item.id));

        return { merged: combined, hasChanges: hasChanges || remoteHasNew };
    }

    private async syncLoop() {
        if (!this.vaultId || this.isProcessing) return;
        this.isProcessing = true;
        
        try {
            const cloudData = await cloudSimDB.getFromVault(this.vaultId) || { logs: [], sharedStorage: {} };
            const remoteStorage = cloudData.sharedStorage || {};
            const newSharedStorage = { ...remoteStorage };
            let localUpdated = false;
            let cloudNeedsUpdate = false;

            // 1. Sincronizar Documentos (Remitos, Ventas, etc.)
            ARRAY_SYNC_KEYS.forEach(key => {
                const localVal = localStorage.getItem(key);
                const remoteVal = remoteStorage[key] || null;
                
                const { merged, hasChanges } = this.mergeData(localVal, remoteVal);
                
                if (hasChanges) {
                    const mergedStr = JSON.stringify(merged);
                    if (mergedStr !== localVal) {
                        localStorage.setItem(key, mergedStr);
                        localUpdated = true;
                    }
                    if (mergedStr !== remoteVal) {
                        newSharedStorage[key] = mergedStr;
                        cloudNeedsUpdate = true;
                    }
                }
            });

            // 2. Sincronizar Logs de Productos (Stock y Precios)
            // Usamos try-catch interno para que fallos en IndexedDB no paren el sync de Remitos
            let updatedLogs = cloudData.logs || [];
            try {
                if (typeof productDB.getPendingLogs === 'function') {
                    const pendingLogs = await productDB.getPendingLogs();
                    if (pendingLogs.length > 0) {
                        updatedLogs = [...updatedLogs, ...pendingLogs].slice(-2000);
                        cloudNeedsUpdate = true;
                    }
                }
            } catch (e) {
                console.warn("Product log sync skipped due to DB busy or error", e);
            }

            // 3. Subir a Nube si hay novedades
            if (cloudNeedsUpdate) {
                await cloudSimDB.saveToVault(this.vaultId, { 
                    logs: updatedLogs, 
                    sharedStorage: newSharedStorage,
                    lastUpdate: new Date().toISOString()
                });
                
                if (typeof productDB.clearLogs === 'function') {
                    await productDB.clearLogs();
                }
                this.channel.postMessage('FORCE_PULL');
            }

            // 4. Notificar a la UI
            if (localUpdated) {
                window.dispatchEvent(new Event('ferrecloud_sync_pulse'));
                window.dispatchEvent(new Event('storage'));
            }

            // 5. Aplicar cambios remotos de stock/precios
            const lastSync = parseInt(localStorage.getItem('ferrecloud_last_sync_ts') || '0');
            const newLogs = (cloudData.logs || []).filter((l: any) => 
                new Date(l.timestamp).getTime() > lastSync && 
                l.terminalName !== localStorage.getItem('ferrecloud_terminal_name')
            );

            if (newLogs.length > 0) {
                for (const log of newLogs) {
                    if (log.payload?.productId) {
                        const p = await productDB.getById(log.payload.productId);
                        if (p) await productDB.save({ ...p, ...log.payload }, true);
                    }
                }
                localStorage.setItem('ferrecloud_last_sync_ts', Date.now().toString());
                window.dispatchEvent(new Event('ferrecloud_sync_pulse'));
            }

            localStorage.setItem('ferrecloud_last_sync', new Date().toLocaleString());

        } catch (e) {
            console.error("Critical Sync Error:", e);
        } finally {
            this.isProcessing = false;
        }
    }

    async pushToCloud() {
        await this.syncLoop();
        this.channel.postMessage('FORCE_PULL');
    }
}

export const syncService = new SyncService();
