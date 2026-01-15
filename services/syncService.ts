import { productDB } from './storageService';

// Endpoint de alto rendimiento para intercambio de datos
const CLOUD_ENDPOINT = 'https://kvdb.io/A1z9XpWq2rM5nK4L7sT3'; 

const SHARED_KEYS = [
    'ferrecloud_remitos', 
    'ferrecloud_sales_history', 
    'ferrecloud_clients',
    'ferrecloud_movements', 
    'ferrecloud_registers', 
    'ferrecloud_budgets',
    'ferrecloud_brands', 
    'ferrecloud_categories',
    'ferrecloud_nc_history'
];

class SyncService {
    private vaultId: string | null = null;
    private isProcessing: boolean = false;
    private pollingInterval: number | null = null;
    private sessionId: string = Math.random().toString(36).substring(7);
    private lastCloudStateHash: string = '';

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
        // Polling cada 7 segundos para no saturar la API
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
                if (text) {
                    remote = JSON.parse(text);
                    this.lastCloudStateHash = text.length.toString(); // Simple hash para detectar cambios
                }
            } else if (resp.status === 404) {
                console.log("Sync: Bóveda nueva detectada. Se creará al subir datos.");
            } else {
                throw new Error(`Cloud Error: ${resp.status}`);
            }

            // 2. APLICAR CAMBIOS REMOTOS EN PRODUCTOS (DELTAS)
            const lastSyncTs = parseInt(localStorage.getItem('ferrecloud_last_log_ts') || '0');
            let productsChanged = false;

            // Procesar logs de otros terminales
            const incomingLogs = (remote.logs || []).filter((l: any) => 
                l.timestamp_ms > lastSyncTs && l.sid !== this.sessionId
            );

            for (const log of incomingLogs) {
                if (log.payload?.id) {
                    if (log.payload.deleted) {
                        await productDB.delete(log.payload.id);
                    } else {
                        // Guardar sin generar un nuevo log local (evita bucles)
                        await productDB.save(log.payload, true); 
                    }
                    productsChanged = true;
                }
            }
            
            if (incomingLogs.length > 0) {
                const maxTs = Math.max(...incomingLogs.map((l:any) => l.timestamp_ms));
                localStorage.setItem('ferrecloud_last_log_ts', maxTs.toString());
            }

            // 3. SINCRONIZAR DATOS COMPARTIDOS (Ventas, Clientes, etc)
            let sharedChanged = false;
            SHARED_KEYS.forEach(key => {
                const remoteValue = remote.shared?.[key];
                const localValue = localStorage.getItem(key);
                
                if (remoteValue && remoteValue !== localValue) {
                    // Solo actualizamos si el remoto es diferente
                    localStorage.setItem(key, remoteValue);
                    sharedChanged = true;
                }
            });

            // 4. SUBIR CAMBIOS LOCALES (PUSH)
            const myPendingLogs = await productDB.getPendingLogs();
            const myTerminal = (localStorage.getItem('ferrecloud_terminal_name') || 'PC-LOCAL').toUpperCase();

            // Actualizar registro de terminales activas
            if (!remote.terminals) remote.terminals = {};
            remote.terminals[this.sessionId] = { name: myTerminal, lastSeen: Date.now() };
            
            // Limpiar terminales inactivas (> 2 min)
            Object.keys(remote.terminals).forEach(k => {
                if (Date.now() - remote.terminals[k].lastSeen > 120000) delete remote.terminals[k];
            });

            // Formatear mis logs locales para la nube
            const newCloudLogs = myPendingLogs.map(l => ({
                id: l.id,
                timestamp_ms: new Date(l.timestamp).getTime(),
                sid: this.sessionId,
                payload: l.payload
            }));

            // Mantener solo los últimos 150 movimientos en la nube para no exceder límites de tamaño
            const updatedLogs = [...(remote.logs || []), ...newCloudLogs]
                .sort((a,b) => a.timestamp_ms - b.timestamp_ms)
                .slice(-150);

            // Preparar el paquete compartido final
            const finalSharedState = { ...remote.shared };
            SHARED_KEYS.forEach(key => {
                const localVal = localStorage.getItem(key);
                if (localVal) finalSharedState[key] = localVal;
            });

            const payload = {
                terminals: remote.terminals,
                logs: updatedLogs,
                shared: finalSharedState
            };

            const postResp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' }, // Evita problemas de preflight CORS
                body: JSON.stringify(payload)
            });

            if (postResp.ok) {
                // Si subió bien, podemos borrar mis logs locales ya transmitidos
                if (myPendingLogs.length > 0) await productDB.clearLogs();
                
                localStorage.setItem('ferrecloud_last_sync', new Date().toLocaleTimeString());
                window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse', { 
                    detail: { terminals: remote.terminals, logsCount: incomingLogs.length, status: 'OK' } 
                }));
            }

            // Notificar a la UI si algo cambió
            if (productsChanged || sharedChanged) {
                window.dispatchEvent(new Event('storage'));
            }

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
