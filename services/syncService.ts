import { productDB } from './storageService';

// Bucket verificado para FerreCloud
const CLOUD_ENDPOINT = 'https://kvdb.io/A1z9XpWq2rM5nK4L7sT3'; 

const SHARED_KEYS = [
    'ferrecloud_remitos', 'ferrecloud_sales_history', 'ferrecloud_clients',
    'ferrecloud_movements', 'ferrecloud_registers', 'ferrecloud_budgets',
    'ferrecloud_brands', 'ferrecloud_categories'
];

class SyncService {
    private vaultId: string | null = null;
    private isProcessing: boolean = false;
    private pollingInterval: number | null = null;
    private sessionId: string = Math.random().toString(36).substring(7);

    constructor() {
        this.vaultId = localStorage.getItem('ferrecloud_vault_id');
        if (this.vaultId) this.startAutoSync();
    }

    setVaultId(id: string) {
        const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!cleanId || cleanId.length < 3) return;
        this.vaultId = cleanId;
        localStorage.setItem('ferrecloud_vault_id', cleanId);
        this.startAutoSync();
    }

    getVaultId() { return this.vaultId; }

    private startAutoSync() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.syncLoop();
        this.pollingInterval = window.setInterval(() => this.syncLoop(), 7000); 
    }

    private async syncLoop() {
        if (this.isProcessing || !this.vaultId) return;
        this.isProcessing = true;
        const url = `${CLOUD_ENDPOINT}/${this.vaultId}`;

        try {
            // 1. OBTENER ESTADO ACTUAL (PULL)
            let remote: any = { logs: [], shared: {}, terminals: {} };
            const resp = await fetch(url, { cache: 'no-store' });
            
            if (resp.ok) {
                const text = await resp.text();
                if (text) remote = JSON.parse(text);
            } else if (resp.status === 404) {
                // Es normal en bóvedas nuevas, inicializamos localmente
                console.log("Sync: Inicializando nueva bóveda en la nube...");
            } else {
                throw new Error(`Cloud Error: ${resp.status}`);
            }

            // 2. APLICAR CAMBIOS REMOTOS (DELTA)
            const lastSyncTs = parseInt(localStorage.getItem('ferrecloud_last_log_ts') || '0');
            let hasChanges = false;

            // Filtrar logs que no son míos y son más nuevos que mi última sincronización
            const newLogs = (remote.logs || []).filter((l: any) => 
                l.timestamp_ms > lastSyncTs && l.sid !== this.sessionId
            );

            for (const log of newLogs) {
                if (log.payload?.id) {
                    if (log.payload.deleted) {
                        await productDB.delete(log.payload.id);
                    } else {
                        await productDB.save(log.payload, true); // true = no re-generar log local
                    }
                    hasChanges = true;
                }
            }
            
            if (newLogs.length > 0) {
                const maxTs = Math.max(...newLogs.map((l:any) => l.timestamp_ms));
                localStorage.setItem('ferrecloud_last_log_ts', maxTs.toString());
            }

            // Sincronizar Almacén Compartido (Ventas, Clientes, etc.)
            SHARED_KEYS.forEach(key => {
                const rVal = remote.shared?.[key];
                const lVal = localStorage.getItem(key);
                if (rVal && rVal !== lVal) {
                    localStorage.setItem(key, rVal);
                    hasChanges = true;
                }
            });

            // 3. SUBIR CAMBIOS LOCALES (PUSH)
            const myPendingLogs = await productDB.getPendingLogs();
            const myTerminal = (localStorage.getItem('ferrecloud_terminal_name') || 'PC').toUpperCase();

            if (!remote.terminals) remote.terminals = {};
            remote.terminals[this.sessionId] = { name: myTerminal, last: Date.now() };
            
            // Limpiar terminales inactivas (> 1 min)
            Object.keys(remote.terminals).forEach(k => {
                if (Date.now() - remote.terminals[k].last > 60000) delete remote.terminals[k];
            });

            const formattedLogs = myPendingLogs.map(l => ({
                id: l.id,
                timestamp_ms: new Date(l.timestamp).getTime(),
                sid: this.sessionId,
                payload: l.payload
            }));

            // Mantener solo los últimos 100 movimientos en la nube para no exceder 64KB
            const updatedLogs = [...(remote.logs || []), ...formattedLogs]
                .sort((a,b) => a.timestamp_ms - b.timestamp_ms)
                .slice(-100);

            const payload = {
                terminals: remote.terminals,
                logs: updatedLogs,
                shared: {
                    ...remote.shared,
                    ...SHARED_KEYS.reduce((acc:any, k) => {
                        const val = localStorage.getItem(k);
                        if (val) acc[k] = val;
                        return acc;
                    }, {})
                }
            };

            const postResp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });

            if (!postResp.ok) throw new Error("Error al escribir en nube");

            // Si el post fue exitoso, limpiar mis logs locales ya subidos
            if (myPendingLogs.length > 0) await productDB.clearLogs();

            localStorage.setItem('ferrecloud_last_sync', new Date().toLocaleTimeString());
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse', { 
                detail: { terminals: remote.terminals, logsCount: newLogs.length, status: 'OK' } 
            }));
            
            if (hasChanges) window.dispatchEvent(new Event('storage'));

        } catch (e) {
            console.error("Sync Cycle Error:", e);
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse', { 
                detail: { terminals: {}, logsCount: 0, status: 'ERROR' } 
            }));
        } finally {
            this.isProcessing = false;
        }
    }

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
            a.download = `MAESTRO_FERRETERIA_${new Date().toISOString().split('T')[0]}.json`;
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
