
import { productDB, cloudSimDB } from './storageService';
import { SyncLogEntry, RestApiConfig } from '../types';

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
    private apiConfig: RestApiConfig = { baseUrl: '', apiKey: '', enabled: false, lastSyncStatus: 'IDLE' };
    private isProcessing: boolean = false;
    private pollingInterval: number | null = null;
    private channel: BroadcastChannel;

    constructor() {
        this.vaultId = localStorage.getItem('ferrecloud_vault_id');
        this.loadApiConfig();
        this.channel = new BroadcastChannel('ferrecloud_sync_relay');
        
        this.channel.onmessage = async (event) => {
            if (event.data === 'FORCE_PULL' || event.data.includes('_UPDATED')) {
                await this.syncLoop(true);
            }
        };

        if (this.vaultId || this.apiConfig.enabled) this.startAutoSync();
    }

    private loadApiConfig() {
        const saved = localStorage.getItem('ferrecloud_rest_config');
        if (saved) this.apiConfig = JSON.parse(saved);
    }

    setApiConfig(config: RestApiConfig) {
        this.apiConfig = config;
        localStorage.setItem('ferrecloud_rest_config', JSON.stringify(config));
        this.startAutoSync();
    }

    getApiConfig() { return this.apiConfig; }

    async syncFromRemote(): Promise<boolean> {
        await this.syncLoop(true);
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
        // Sincronización proactiva cada 30 segundos
        this.pollingInterval = window.setInterval(() => this.syncLoop(), 30000);
    }

    /**
     * Comunicación con la API REST Real
     */
    private async callRestApi(endpoint: string, method: string, data?: any) {
        if (!this.apiConfig.enabled || !this.apiConfig.baseUrl) return null;
        
        try {
            const response = await fetch(`${this.apiConfig.baseUrl}${endpoint}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiConfig.apiKey}`
                },
                body: data ? JSON.stringify(data) : undefined
            });
            
            if (!response.ok) throw new Error('API Error');
            return await response.json();
        } catch (e) {
            console.error("[REST API] Error de conexión:", e);
            return null;
        }
    }

    private mergeData(localStr: string | null, remoteStr: string | null): { merged: any[], hasChanges: boolean } {
        const local = JSON.parse(localStr || '[]');
        const remote = JSON.parse(remoteStr || '[]');
        
        if (!Array.isArray(local)) return { merged: remote, hasChanges: true };
        if (!Array.isArray(remote)) return { merged: local, hasChanges: false };

        const localMap = new Map(local.map(item => [item.id, item]));
        const remoteMap = new Map(remote.map(item => [item.id, item]));
        
        let localWasUpdated = false;
        let remoteNeedsUpdate = false;

        remote.forEach(remoteItem => {
            if (!localMap.has(remoteItem.id)) {
                localWasUpdated = true;
            }
        });

        local.forEach(localItem => {
            if (!remoteMap.has(localItem.id)) {
                remoteNeedsUpdate = true;
            }
        });

        const combinedMap = new Map();
        remote.forEach(item => combinedMap.set(item.id, item));
        local.forEach(item => combinedMap.set(item.id, item));
        
        const merged = Array.from(combinedMap.values());

        return { 
            merged, 
            hasChanges: localWasUpdated || remoteNeedsUpdate 
        };
    }

    private async syncLoop(forcePull = false) {
        if (this.isProcessing) return;
        this.isProcessing = true;
        
        try {
            let remoteStorage: any = {};
            let cloudLogs: any[] = [];

            // INTENTAR OBTENER DATOS DE LA API REST SI ESTÁ HABILITADA
            if (this.apiConfig.enabled) {
                const apiData = await this.callRestApi('/pull', 'GET');
                if (apiData) {
                    remoteStorage = apiData.sharedStorage || {};
                    cloudLogs = apiData.logs || [];
                }
            } else if (this.vaultId) {
                // FALLBACK AL SIMULADOR CLOUD
                const cloudData = await cloudSimDB.getFromVault(this.vaultId) || { logs: [], sharedStorage: {} };
                remoteStorage = cloudData.sharedStorage || {};
                cloudLogs = cloudData.logs || [];
            }

            const newSharedStorage = { ...remoteStorage };
            let localUpdated = false;
            let cloudNeedsUpdate = false;

            // 1. Sincronizar Tablas (Clientes, Remitos, etc.)
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

            // 2. Sincronizar Logs de Productos (Deltas de Stock de 140k items)
            let pendingLogs: SyncLogEntry[] = [];
            try {
                pendingLogs = await productDB.getPendingLogs();
            } catch (e) {}

            if (pendingLogs.length > 0) {
                cloudLogs = [...cloudLogs, ...pendingLogs].slice(-5000);
                cloudNeedsUpdate = true;
            }

            // 3. Subir Cambios a la Nube (API REST o Simulador)
            if (cloudNeedsUpdate) {
                const payload = { 
                    logs: cloudLogs, 
                    sharedStorage: newSharedStorage,
                    lastUpdate: new Date().toISOString()
                };

                if (this.apiConfig.enabled) {
                    await this.callRestApi('/push', 'POST', payload);
                } else if (this.vaultId) {
                    await cloudSimDB.saveToVault(this.vaultId, payload);
                }
                
                if (pendingLogs.length > 0) await productDB.clearLogs();
                this.channel.postMessage('FORCE_PULL');
            }

            // 4. Aplicar cambios de otros terminales a IndexedDB local
            const lastSyncTs = parseInt(localStorage.getItem('ferrecloud_last_sync_ts') || '0');
            const myTerminal = localStorage.getItem('ferrecloud_terminal_name');
            
            const remoteLogs = cloudLogs.filter((l: any) => 
                new Date(l.timestamp).getTime() > lastSyncTs && 
                l.terminalName !== myTerminal
            );

            if (remoteLogs.length > 0) {
                for (const log of remoteLogs) {
                    if (log.payload?.productId) {
                        const p = await productDB.getById(log.payload.productId);
                        if (p) await productDB.save({ ...p, ...log.payload }, true);
                    }
                }
                localStorage.setItem('ferrecloud_last_sync_ts', Date.now().toString());
            }

            if (localUpdated || remoteLogs.length > 0 || forcePull) {
                window.dispatchEvent(new Event('ferrecloud_sync_pulse'));
                window.dispatchEvent(new Event('storage'));
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
    }
}

export const syncService = new SyncService();
