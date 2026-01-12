import { productDB } from './storageService';

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

// Nueva URL de Bóveda Directa (Alta Disponibilidad)
const CLOUD_ENDPOINT = 'https://kvdb.io/8Dq99r8p7wW6M5uX4zR2'; 

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
        this.pollingInterval = window.setInterval(() => this.syncLoop(), 8000); 
    }

    private async syncLoop() {
        if (this.isProcessing || !this.vaultId) return;
        this.isProcessing = true;
        
        const url = `${CLOUD_ENDPOINT}/${this.vaultId}`;

        try {
            const myTerminalName = (localStorage.getItem('ferrecloud_terminal_name') || 'CAJA').toUpperCase();
            let remoteData: any = { terminals: {}, sharedStorage: {}, logs: [] };
            
            // 1. INTENTAR LECTURA (PULL)
            try {
                const response = await fetch(url, { 
                    method: 'GET',
                    cache: 'no-cache',
                    mode: 'cors'
                });
                
                if (response.ok) {
                    const text = await response.text();
                    if (text && text.length > 2) remoteData = JSON.parse(text);
                } else if (response.status === 404) {
                    // Es normal en el primer arranque, ignoramos y seguimos
                    console.log("Bóveda nueva detectada...");
                }
            } catch (e) {
                console.warn("Servidor ocupado, reintentando...");
            }

            // 2. ACTUALIZAR PRESENCIA LOCAL
            const now = Date.now();
            if (!remoteData.terminals) remoteData.terminals = {};
            remoteData.terminals[this.sessionId] = {
                name: myTerminalName,
                lastSeen: now
            };

            // 3. SINCRONIZAR DATOS DE NEGOCIO
            let hasChanges = false;
            ARRAY_SYNC_KEYS.forEach(key => {
                const local = localStorage.getItem(key);
                const remote = remoteData.sharedStorage?.[key];
                if (remote && local !== remote) {
                    localStorage.setItem(key, remote);
                    hasChanges = true;
                }
            });

            // 4. PRODUCTOS (LOGS)
            const pendingLogs = await productDB.getPendingLogs();
            if (pendingLogs.length > 0) {
                remoteData.logs = [...(remoteData.logs || []), ...pendingLogs].slice(-100);
            }

            const lastSyncTs = parseInt(localStorage.getItem('ferrecloud_last_sync_ts') || '0');
            const newRemoteLogs = (remoteData.logs || []).filter((l: any) => 
                new Date(l.timestamp).getTime() > lastSyncTs && l.sessionId !== this.sessionId
            );

            if (newRemoteLogs.length > 0) {
                for (const log of newRemoteLogs) {
                    if (log.payload?.id) await productDB.save(log.payload, true);
                }
                localStorage.setItem('ferrecloud_last_sync_ts', now.toString());
                hasChanges = true;
            }

            // 5. SUBIR CAMBIOS (PUSH)
            const payload = {
                terminals: remoteData.terminals,
                logs: remoteData.logs || [],
                sharedStorage: {
                    ...remoteData.sharedStorage,
                    ...ARRAY_SYNC_KEYS.reduce((acc: any, key) => {
                        const val = localStorage.getItem(key);
                        if (val) acc[key] = val;
                        return acc;
                    }, {})
                },
                lastSync: new Date().toISOString()
            };

            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' }, // Evita problemas de CORS pre-flight
                body: JSON.stringify(payload)
            });

            if (pendingLogs.length > 0) await productDB.clearLogs();
            
            localStorage.setItem('ferrecloud_last_sync', new Date().toLocaleTimeString());
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse', { 
                detail: { terminals: remoteData.terminals } 
            }));
            
            if (hasChanges) window.dispatchEvent(new Event('storage'));

        } catch (e) {
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_error', { 
                detail: { error: "Conectando con la nube..." } 
            }));
        } finally {
            this.isProcessing = false;
        }
    }

    async syncFromRemote() { await this.syncLoop(); return true; }

    // Fix: Added missing pushToCloud method used in POS and Remitos components
    async pushToCloud() { await this.syncLoop(); return true; }
}

export const syncService = new SyncService();
