
import { productDB, cloudSimDB } from './storageService';
import { SyncLogEntry } from '../types';

// Tablas que requieren fusión inteligente (son arrays de objetos con ID)
const ARRAY_SYNC_KEYS = [
    'ferrecloud_remitos',
    'ferrecloud_sales_history',
    'ferrecloud_clients',
    'ferrecloud_movements',
    'ferrecloud_purchases',
    'ferrecloud_providers',
    'ferrecloud_registers'
];

class SyncService {
    private vaultId: string | null = null;
    private isProcessing: boolean = false;
    private pollingInterval: number | null = null;

    constructor() {
        this.vaultId = localStorage.getItem('ferrecloud_vault_id');
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
        // Sincronización cada 5 segundos para alta disponibilidad en mostrador
        this.pollingInterval = window.setInterval(() => this.syncLoop(), 5000);
    }

    /**
     * Lógica de Fusión Inteligente (Smart Merge)
     * Evita que una terminal borre los datos de otra al sincronizar.
     */
    private mergeData(localStr: string | null, remoteStr: string | null): { merged: any[], hasChanges: boolean } {
        const local = JSON.parse(localStr || '[]');
        const remote = JSON.parse(remoteStr || '[]');
        
        if (!Array.isArray(local)) return { merged: remote, hasChanges: true };
        if (!Array.isArray(remote)) return { merged: local, hasChanges: false };

        const localMap = new Map(local.map(item => [item.id, item]));
        const remoteMap = new Map(remote.map(item => [item.id, item]));
        
        let hasChanges = false;
        const combined = [...remote];

        // Añadir lo que tengo local que no está en la nube
        local.forEach(item => {
            if (!remoteMap.has(item.id)) {
                combined.push(item);
                hasChanges = true;
            }
        });

        // Verificar si la nube tiene cosas que yo no tengo
        remote.forEach(item => {
            if (!localMap.has(item.id)) {
                hasChanges = true;
            }
        });

        // Ordenar por ID o fecha si estuviera disponible, aquí usamos el orden original
        return { merged: combined, hasChanges };
    }

    private async syncLoop() {
        if (!this.vaultId || this.isProcessing) return;
        this.isProcessing = true;
        
        try {
            // 1. Obtener estado actual de la Nube
            const cloudData = await cloudSimDB.getFromVault(this.vaultId) || { logs: [], sharedStorage: {} };
            const remoteStorage = cloudData.sharedStorage || {};
            const newSharedStorage = { ...remoteStorage };
            let anyLocalChangeToPush = false;
            let anyRemoteChangeToPull = false;

            // 2. Sincronizar Tablas (Remitos, Ventas, Clientes...)
            ARRAY_SYNC_KEYS.forEach(key => {
                const localVal = localStorage.getItem(key);
                const remoteVal = remoteStorage[key] || null;
                
                const { merged, hasChanges } = this.mergeData(localVal, remoteVal);
                
                if (hasChanges) {
                    const mergedStr = JSON.stringify(merged);
                    // Si el resultado de la fusión es distinto a lo que tengo localmente, actualizo local
                    if (mergedStr !== localVal) {
                        localStorage.setItem(key, mergedStr);
                        anyRemoteChangeToPull = true;
                    }
                    // Si el resultado de la fusión es distinto a lo que hay en la nube, marco para subir
                    if (mergedStr !== remoteVal) {
                        newSharedStorage[key] = mergedStr;
                        anyLocalChangeToPush = true;
                    }
                }
            });

            // 3. Sincronizar Logs de Productos (Stock y Precios)
            const pendingLogs = await productDB.getPendingLogs();
            if (pendingLogs.length > 0) anyLocalChangeToPush = true;

            const updatedLogs = [...(cloudData.logs || []), ...pendingLogs].slice(-2000);

            // 4. Subir si hubo cambios locales o fusiones
            if (anyLocalChangeToPush) {
                await cloudSimDB.saveToVault(this.vaultId, { 
                    logs: updatedLogs, 
                    sharedStorage: newSharedStorage,
                    lastUpdate: new Date().toISOString()
                });
                await productDB.clearLogs();
            }

            // 5. Notificar a la UI si bajaron datos nuevos
            if (anyRemoteChangeToPull) {
                window.dispatchEvent(new Event('ferrecloud_sync_pulse'));
            }

            // 6. Procesar cambios de Stock/Precios de otras terminales
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
        // Forzar ejecución del loop inmediatamente
        await this.syncLoop();
    }

    async initializeBootstrap() {
        if (!this.vaultId) return 'OFFLINE';
        await this.syncLoop();
        return 'UP_TO_DATE';
    }
}

export const syncService = new SyncService();
