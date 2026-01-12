import { productDB, cloudSimDB } from './storageService';
import { SyncLogEntry } from '../types';

// Tablas críticas que se comparten entre terminales para reflejar deudas y ventas al instante
const SYNCED_KEYS = [
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

    // Fix: Added missing syncFromRemote method used in UI components
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
        this.pollingInterval = window.setInterval(() => this.syncLoop(), 5000);
    }

    private async syncLoop() {
        if (!this.vaultId || this.isProcessing) return;
        this.isProcessing = true;
        
        try {
            const cloudData = await cloudSimDB.getFromVault(this.vaultId);
            
            // 1. SUBIR CAMBIOS LOCALES
            const pendingLogs = await productDB.getPendingLogs();
            const localShared: any = {};
            SYNCED_KEYS.forEach(key => {
                const val = localStorage.getItem(key);
                if (val) localShared[key] = val;
            });

            const updatedLogs = [...(cloudData?.logs || []), ...pendingLogs].slice(-1000);
            const updatedShared = { ...(cloudData?.sharedStorage || {}), ...localShared };

            await cloudSimDB.saveToVault(this.vaultId, { 
                logs: updatedLogs, 
                sharedStorage: updatedShared,
                lastUpdate: new Date().toISOString()
            });

            await productDB.clearLogs();

            // 2. BAJAR CAMBIOS REMOTOS (Simulación de pulso)
            if (cloudData?.sharedStorage) {
                let changed = false;
                Object.entries(cloudData.sharedStorage).forEach(([key, remoteVal]) => {
                    const localVal = localStorage.getItem(key);
                    if (localVal !== remoteVal) {
                        localStorage.setItem(key, remoteVal as string);
                        changed = true;
                    }
                });
                if (changed) window.dispatchEvent(new Event('ferrecloud_sync_pulse'));
            }

            // 3. ACTUALIZAR PRODUCTOS
            const lastSync = parseInt(localStorage.getItem('ferrecloud_last_sync_ts') || '0');
            const newLogs = (cloudData?.logs || []).filter((l: any) => 
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

        } catch (e) {
            console.error("Sync Error", e);
        } finally {
            this.isProcessing = false;
        }
    }

    async pushToCloud() {
        await this.syncLoop();
    }

    async initializeBootstrap() {
        if (!this.vaultId) return 'OFFLINE';
        await this.syncLoop();
        return 'UP_TO_DATE';
    }
}

export const syncService = new SyncService();
