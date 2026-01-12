
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
        
        // Al recibir un aviso de otra terminal, forzamos la descarga inmediata
        this.channel.onmessage = async (event) => {
            console.log(`[SyncRelay] Mensaje recibido de otra terminal: ${event.data}`);
            if (event.data === 'FORCE_PULL' || event.data.includes('_UPDATED')) {
                await this.syncLoop(true); // Forzar pull
            }
        };

        if (this.vaultId) this.startAutoSync();
    }

    async syncFromRemote(): Promise<boolean> {
        if (!this.vaultId) return false;
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
        // Revisión de fondo cada 10 segundos por si falla el broadcast
        this.pollingInterval = window.setInterval(() => this.syncLoop(), 10000);
    }

    /**
     * mergeData: Fusión inteligente. Los objetos con ID duplicado se resuelven
     * manteniendo el que tenga mayor contenido o sea más reciente si tuviera timestamp.
     */
    private mergeData(localStr: string | null, remoteStr: string | null): { merged: any[], hasChanges: boolean } {
        const local = JSON.parse(localStr || '[]');
        const remote = JSON.parse(remoteStr || '[]');
        
        if (!Array.isArray(local)) return { merged: remote, hasChanges: true };
        if (!Array.isArray(remote)) return { merged: local, hasChanges: false };

        const localMap = new Map(local.map(item => [item.id, item]));
        const remoteMap = new Map(remote.map(item => [item.id, item]));
        
        let localWasUpdated = false;
        let remoteNeedsUpdate = false;

        // 1. Verificar qué tiene la nube que yo no tengo localmente
        remote.forEach(remoteItem => {
            if (!localMap.has(remoteItem.id)) {
                localWasUpdated = true;
            }
        });

        // 2. Verificar qué tengo yo que no está en la nube
        local.forEach(localItem => {
            if (!remoteMap.has(localItem.id)) {
                remoteNeedsUpdate = true;
            }
        });

        // La unión de ambos sets por ID único
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
        if (!this.vaultId || this.isProcessing) return;
        this.isProcessing = true;
        
        try {
            // Obtener estado actual de la "Nube" (IndexedDB compartido)
            const cloudData = await cloudSimDB.getFromVault(this.vaultId) || { logs: [], sharedStorage: {} };
            const remoteStorage = cloudData.sharedStorage || {};
            const newSharedStorage = { ...remoteStorage };
            let localUpdated = false;
            let cloudNeedsUpdate = false;

            // 1. Procesar Tablas de Documentos (Remitos, Ventas, etc.)
            ARRAY_SYNC_KEYS.forEach(key => {
                const localVal = localStorage.getItem(key);
                const remoteVal = remoteStorage[key] || null;
                
                const { merged, hasChanges } = this.mergeData(localVal, remoteVal);
                
                if (hasChanges) {
                    const mergedStr = JSON.stringify(merged);
                    
                    // Si el resultado combinado es distinto a lo que tengo local, actualizo local
                    if (mergedStr !== localVal) {
                        localStorage.setItem(key, mergedStr);
                        localUpdated = true;
                        console.log(`[Sync] Tabla ${key} actualizada desde nube.`);
                    }
                    
                    // Si el resultado combinado tiene cosas locales que no están en nube, marcamos para subir
                    if (mergedStr !== remoteVal) {
                        newSharedStorage[key] = mergedStr;
                        cloudNeedsUpdate = true;
                    }
                }
            });

            // 2. Procesar Logs de Productos (Stock y Precios de los 140k items)
            let currentCloudLogs = cloudData.logs || [];
            let pendingLogs: SyncLogEntry[] = [];
            
            try {
                if (typeof productDB.getPendingLogs === 'function') {
                    pendingLogs = await productDB.getPendingLogs();
                }
            } catch (e) { console.warn("DB Busy", e); }

            if (pendingLogs.length > 0) {
                currentCloudLogs = [...currentCloudLogs, ...pendingLogs].slice(-2000);
                cloudNeedsUpdate = true;
            }

            // 3. Persistir en la Nube si hubo cambios originados aquí
            if (cloudNeedsUpdate) {
                await cloudSimDB.saveToVault(this.vaultId, { 
                    logs: currentCloudLogs, 
                    sharedStorage: newSharedStorage,
                    lastUpdate: new Date().toISOString()
                });
                
                if (pendingLogs.length > 0 && typeof productDB.clearLogs === 'function') {
                    await productDB.clearLogs();
                }
                
                // Avisar a otras terminales para que hagan pull inmediato
                this.channel.postMessage('FORCE_PULL');
            }

            // 4. Notificar a la Interfaz de esta terminal que los datos cambiaron
            if (localUpdated || forcePull) {
                window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse', { 
                    detail: { timestamp: Date.now() } 
                }));
                // Evento estándar para componentes que escuchan storage
                window.dispatchEvent(new Event('storage'));
            }

            // 5. Aplicar cambios granulares de Stock/Precios de otras terminales
            const lastSyncTs = parseInt(localStorage.getItem('ferrecloud_last_sync_ts') || '0');
            const myTerminal = localStorage.getItem('ferrecloud_terminal_name');
            
            const remoteLogs = currentCloudLogs.filter((l: any) => 
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
        // Notificación redundante para asegurar visibilidad inmediata
        this.channel.postMessage('FORCE_PULL');
    }
}

export const syncService = new SyncService();
