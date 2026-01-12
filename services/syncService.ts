
import { productDB } from './storageService';

const CLOUD_ENDPOINT = 'https://kvdb.io/8Dq99r8p7wW6M5uX4zR2';

const SHARED_KEYS = [
    'ferrecloud_remitos', 'ferrecloud_sales_history', 'ferrecloud_clients',
    'ferrecloud_movements', 'ferrecloud_registers', 'ferrecloud_budgets'
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
        if (!cleanId) return;
        this.vaultId = cleanId;
        localStorage.setItem('ferrecloud_vault_id', cleanId);
        this.startAutoSync();
    }

    getVaultId() { return this.vaultId; }

    private startAutoSync() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.syncLoop();
        this.pollingInterval = window.setInterval(() => this.syncLoop(), 5000); // Cada 5 seg para simultaneidad
    }

    private async syncLoop() {
        if (this.isProcessing || !this.vaultId) return;
        this.isProcessing = true;
        const url = `${CLOUD_ENDPOINT}/${this.vaultId}`;

        try {
            // 1. OBTENER ESTADO ACTUAL DE LA NUBE
            let remote: any = { logs: [], shared: {}, terminals: {} };
            const resp = await fetch(url);
            if (resp.ok) {
                const text = await resp.text();
                if (text) remote = JSON.parse(text);
            }

            // 2. APLICAR CAMBIOS REMOTOS (PULL INCREMENTAL)
            const lastSyncTs = parseInt(localStorage.getItem('ferrecloud_last_log_ts') || '0');
            let hasChanges = false;

            // Procesar solo logs nuevos de otras PCs
            const newLogs = (remote.logs || []).filter((l: any) => 
                l.timestamp_ms > lastSyncTs && l.sid !== this.sessionId
            );

            for (const log of newLogs) {
                if (log.payload?.id) {
                    await productDB.save(log.payload, true);
                    hasChanges = true;
                }
            }
            
            if (newLogs.length > 0) {
                const maxTs = Math.max(...newLogs.map((l:any) => l.timestamp_ms));
                localStorage.setItem('ferrecloud_last_log_ts', maxTs.toString());
            }

            // Sincronizar LocalStorage (Ventas, Clientes, etc)
            SHARED_KEYS.forEach(key => {
                const rVal = remote.shared?.[key];
                const lVal = localStorage.getItem(key);
                if (rVal && rVal !== lVal) {
                    localStorage.setItem(key, rVal);
                    hasChanges = true;
                }
            });

            // 3. SUBIR CAMBIOS LOCALES (PUSH INCREMENTAL)
            const myPendingLogs = await productDB.getPendingLogs();
            const myTerminal = (localStorage.getItem('ferrecloud_terminal_name') || 'PC').toUpperCase();

            // Actualizar presencia
            remote.terminals[this.sessionId] = { name: myTerminal, last: Date.now() };
            
            // Limpiar terminales viejas (>1 min)
            Object.keys(remote.terminals).forEach(k => {
                if (Date.now() - remote.terminals[k].last > 60000) delete remote.terminals[k];
            });

            // Preparar nuevos logs para subir (limitar a los últimos 200 en la nube)
            const formattedLogs = myPendingLogs.map(l => ({
                id: l.id,
                timestamp_ms: new Date(l.timestamp).getTime(),
                sid: this.sessionId,
                payload: l.payload
            }));

            const updatedLogs = [...(remote.logs || []), ...formattedLogs]
                .sort((a,b) => a.timestamp_ms - b.timestamp_ms)
                .slice(-200); // Solo mantenemos historial reciente para velocidad

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

            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });

            if (myPendingLogs.length > 0) await productDB.clearLogs();

            localStorage.setItem('ferrecloud_last_sync', new Date().toLocaleTimeString());
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse', { 
                detail: { terminals: remote.terminals, logsCount: newLogs.length } 
            }));
            
            if (hasChanges) window.dispatchEvent(new Event('storage'));

        } catch (e) {
            console.warn("Sync: Reintentando conexión...");
        } finally {
            this.isProcessing = false;
        }
    }

    // Exportar todo (Base 140k + Config)
    async exportFullVault() {
        const prods = await productDB.getAll(500000);
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
        a.download = `BASE_MAESTRA_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        return true;
    }

    // Importar todo
    async importFullVault(file: File) {
        return new Promise<boolean>((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target?.result as string);
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
