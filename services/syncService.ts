
import { productDB, cloudSimDB } from './storageService';
import { SyncLogEntry } from '../types';

// Tablas críticas que se fusionan para ser visibles en toda la red
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
        // Canal de comunicación instantáneo entre pestañas/terminales
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
        this.pollingInterval = window.setInterval(() => this.syncLoop(), 15000); // Cada 15s revisión de fondo
    }

    /**
     * Fusiona datos locales y remotos asegurando que nada se borre.
     */
    private mergeData(localStr: string | null, remoteStr: string | null): { merged: any[], hasChanges: boolean } {
        const local = JSON.parse(localStr || '[]');
        const remote = JSON.parse(remoteStr || '[]');
        
        if (!Array.isArray(local) || local.length === 0) return { merged: remote, hasChanges: remote.length > 0 };
        if (!Array.isArray(remote) || remote.length === 0) return { merged: local, hasChanges: false };

        const localMap = new Map(local.map(item => [item.id, item]));
        const remoteMap = new Map(remote.map(item => [item.id, item]));
        
        let hasChanges = false;
        
        // Empezamos con los datos remotos (la "verdad" de la nube)
        const combined = [...remote];

        // Añadimos lo que tenemos local que aún no llegó a la nube
        local.forEach(item => {
            if (!remoteMap.has(item.id)) {
                combined.push(item);
                hasChanges = true; // Tenemos algo nuevo para subir
            }
        });

        // Verificamos si la nube tiene algo que nosotros no (para avisar a la UI)
        const needsUIUpdate = remote.some(item => !localMap.has(item.id));

        return { merged: combined, hasChanges: hasChanges || needsUIUpdate };
    }

    private async syncLoop() {
        if (!this.vaultId || this.isProcessing) return;
        this.isProcessing = true;
        
        try {
            // 1. Obtener estado actual del "Servidor"
            const cloudData = await cloudSimDB.getFromVault(this.vaultId) || { logs: [], sharedStorage: {} };
            const remoteStorage = cloudData.sharedStorage || {};
            const newSharedStorage = { ...remoteStorage };
            let localUpdated = false;
            let cloudNeedsUpdate = false;

            // 2. Procesar cada tabla con lógica de fusión
            ARRAY_SYNC_KEYS.forEach(key => {
                const localVal = localStorage.getItem(key);
                const remoteVal = remoteStorage[key] || null;
                
                const { merged, hasChanges } = this.mergeData(localVal, remoteVal);
                
                if (hasChanges) {
                    const mergedStr = JSON.stringify(merged);
                    
                    // Si el resultado de la fusión es distinto a lo que tengo localmente, actualizo local
                    if (mergedStr !== localVal) {
                        localStorage.setItem(key, mergedStr);
                        localUpdated = true;
                    }
                    
                    // Si el resultado de la fusión tiene datos locales que no están en la nube, marcamos para subir
                    if (mergedStr !== remoteVal) {
                        newSharedStorage[key] = mergedStr;
                        cloudNeedsUpdate = true;
                    }
                }
            });

            // 3. Sincronizar Logs de Productos (Stock y Precios)
            const pendingLogs = await productDB.getPendingLogs();
            const updatedLogs = [...(cloudData.logs || []), ...pendingLogs].slice(-2000);
            if (pendingLogs.length > 0) cloudNeedsUpdate = true;

            // 4. Subir cambios a la "Nube" si hay novedades
            if (cloudNeedsUpdate) {
                await cloudSimDB.saveToVault(this.vaultId, { 
                    logs: updatedLogs, 
                    sharedStorage: newSharedStorage,
                    lastUpdate: new Date().toISOString()
                });
                await productDB.clearLogs();
                // Notificar a otras terminales que hay datos nuevos en la nube
                this.channel.postMessage('FORCE_PULL');
            }

            // 5. Notificar a la Interfaz Local si bajaron datos
            if (localUpdated) {
                window.dispatchEvent(new Event('ferrecloud_sync_pulse'));
                window.dispatchEvent(new Event('storage')); // Compatibilidad con listeners de storage
            }

            // 6. Procesar cambios individuales de productos (Stock/Precios)
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
        // Notificamos inmediatamente después de una acción del usuario (ej: crear remito)
        this.channel.postMessage('FORCE_PULL');
    }
}

export const syncService = new SyncService();
