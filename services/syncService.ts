import { productDB } from './storageService';

const CLOUD_ENDPOINT = 'https://kvdb.io/A1z9XpWq2rM5nK4L7sT3'; 

// Entidades que se sincronizan por append (solo lo nuevo)
const SHARED_KEYS = [
    'ferrecloud_remitos', 
    'ferrecloud_sales_history', 
    'ferrecloud_movements', 
    'ferrecloud_budgets',
    'ferrecloud_nc_history'
];

export interface SyncActivity {
    id: string;
    timestamp: string;
    type: 'IN' | 'OUT' | 'ERROR';
    description: string;
}

class SyncService {
    private vaultId: string | null = null;
    private isProcessing: boolean = false;
    private pollingInterval: number | null = null;
    private sessionId: string = Math.random().toString(36).substring(7);
    private activityLog: SyncActivity[] = [];

    constructor() {
        this.vaultId = localStorage.getItem('ferrecloud_vault_id');
        if (this.vaultId) this.startAutoSync();
    }

    private logActivity(type: 'IN' | 'OUT' | 'ERROR', description: string) {
        const entry: SyncActivity = {
            id: Math.random().toString(36).substr(2, 5),
            timestamp: new Date().toLocaleTimeString(),
            type,
            description
        };
        this.activityLog = [entry, ...this.activityLog].slice(0, 50);
        window.dispatchEvent(new CustomEvent('ferrecloud_sync_activity', { detail: this.activityLog }));
    }

    setVaultId(id: string) {
        const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        this.vaultId = cleanId;
        localStorage.setItem('ferrecloud_vault_id', cleanId);
        this.logActivity('OUT', `Vínculo establecido con bóveda: ${cleanId}`);
        this.startAutoSync();
    }

    getVaultId() { return this.vaultId; }

    private startAutoSync() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.syncLoop();
        // Polling agresivo cada 5 segundos para entorno POS
        this.pollingInterval = window.setInterval(() => this.syncLoop(), 5000); 
    }

    private async syncLoop() {
        if (this.isProcessing || !this.vaultId) return;
        this.isProcessing = true;
        const url = `${CLOUD_ENDPOINT}/${this.vaultId}`;

        try {
            // 1. PULL: Obtener estado remoto
            const resp = await fetch(url, { cache: 'no-store' });
            let remote: any = { logs: [], shared: {}, terminals: {} };
            
            if (resp.ok) {
                remote = await resp.json();
            }

            // 2. PROCESAR CAMBIOS ENTRANTES (Deltas de otros terminales)
            const lastSyncTs = parseInt(localStorage.getItem('ferrecloud_last_log_ts') || '0');
            const incomingLogs = (remote.logs || []).filter((l: any) => 
                l.timestamp_ms > lastSyncTs && l.sid !== this.sessionId
            );

            if (incomingLogs.length > 0) {
                this.logActivity('IN', `Recibidos ${incomingLogs.length} cambios remotos`);
                for (const log of incomingLogs) {
                    if (log.payload?.id) {
                        if (log.payload.deleted) {
                            await productDB.delete(log.payload.id);
                            this.logActivity('IN', `Eliminado remoto: ${log.payload.id}`);
                        } else {
                            await productDB.save(log.payload, true); 
                            this.logActivity('IN', `Actualizado remoto: ${log.payload.name || log.payload.id}`);
                        }
                    }
                }
                const maxTs = Math.max(...incomingLogs.map((l:any) => l.timestamp_ms));
                localStorage.setItem('ferrecloud_last_log_ts', maxTs.toString());
            }

            // 3. SINCRONIZAR ARRAYS COMPARTIDOS (Merge inteligente)
            let sharedChanged = false;
            SHARED_KEYS.forEach(key => {
                const remoteValueRaw = remote.shared?.[key];
                if (remoteValueRaw) {
                    const remoteArr = JSON.parse(remoteValueRaw);
                    const localArr = JSON.parse(localStorage.getItem(key) || '[]');
                    
                    // Solo agregamos lo que no tenemos localmente (basado en ID)
                    const localIds = new Set(localArr.map((i: any) => i.id));
                    const newItems = remoteArr.filter((i: any) => !localIds.has(i.id));
                    
                    if (newItems.length > 0) {
                        const merged = [...newItems, ...localArr].slice(0, 1000); // Límite para no saturar storage
                        localStorage.setItem(key, JSON.stringify(merged));
                        sharedChanged = true;
                        this.logActivity('IN', `Sincronizados ${newItems.length} registros en ${key}`);
                    }
                }
            });

            // 4. PUSH: Subir mis cambios locales
            const myPendingLogs = await productDB.getPendingLogs();
            const myTerminal = (localStorage.getItem('ferrecloud_terminal_name') || 'CAJA').toUpperCase();

            if (!remote.terminals) remote.terminals = {};
            remote.terminals[this.sessionId] = { name: myTerminal, lastSeen: Date.now() };

            const newCloudLogs = myPendingLogs.map(l => ({
                id: l.id,
                timestamp_ms: new Date(l.timestamp).getTime(),
                sid: this.sessionId,
                payload: l.payload
            }));

            if (newCloudLogs.length > 0) {
                this.logActivity('OUT', `Subiendo ${newCloudLogs.length} cambios locales...`);
            }

            // Consolidar estado final para subir
            const finalShared: Record<string, string> = { ...remote.shared };
            SHARED_KEYS.forEach(key => {
                const localVal = localStorage.getItem(key);
                if (localVal) finalShared[key] = localVal;
            });

            const payload = {
                terminals: remote.terminals,
                logs: [...(remote.logs || []), ...newCloudLogs].sort((a,b) => a.timestamp_ms - b.timestamp_ms).slice(-200),
                shared: finalShared
            };

            const postResp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });

            if (postResp.ok) {
                if (myPendingLogs.length > 0) {
                    await productDB.clearLogs();
                    this.logActivity('OUT', `Confirmada recepción de cambios en la nube.`);
                }
                localStorage.setItem('ferrecloud_last_sync', new Date().toLocaleTimeString());
                window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse', { 
                    detail: { terminals: remote.terminals, status: 'OK' } 
                }));
            }

            if (sharedChanged) window.dispatchEvent(new Event('storage'));

        } catch (e) {
            this.logActivity('ERROR', `Error de conexión: ${e.message}`);
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse', { detail: { status: 'ERROR' } }));
        } finally {
            this.isProcessing = false;
        }
    }

    getActivityLog() { return this.activityLog; }

    async exportFullVault() {
        try {
            const prods = await productDB.getAll();
            const data = {
                products: prods,
                storage: SHARED_KEYS.reduce((acc:any, k) => {
                    acc[k] = localStorage.getItem(k);
                    return acc;
                }, {})
            };
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `MAESTRO_BRUZZONE_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            return true;
        } catch (e) { return false; }
    }

    async importFullVault(file: File) {
        return new Promise<boolean>((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target?.result as string);
                    if (!data.products) throw new Error();
                    await productDB.clearAll();
                    await productDB.saveBulk(data.products);
                    Object.entries(data.storage).forEach(([k, v]: [string, any]) => {
                        if (v) localStorage.setItem(k, v);
                    });
                    resolve(true);
                } catch { resolve(false); }
            };
            reader.readAsText(file);
        });
    }

    async pushToCloud() { await this.syncLoop(); return true; }
    async syncFromRemote() { await this.syncLoop(); return true; }
}

export const syncService = new SyncService();
