
import { productDB } from './storageService';
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

// Usamos un proxy para saltar el error "Failed to fetch" (CORS)
const PROXY_URL = 'https://corsproxy.io/?';
const BASE_RELAY_URL = 'https://kvdb.io/8Dq99r8p7wW6M5uX4zR2'; 

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
        // Cada 12 segundos revisamos la red
        this.pollingInterval = window.setInterval(() => this.syncLoop(), 12000);
    }

    private async syncLoop() {
        if (this.isProcessing || !this.vaultId) return;
        this.isProcessing = true;
        
        // La URL final pasa a través del proxy para que el navegador no la bloquee
        const relayUrl = `${PROXY_URL}${encodeURIComponent(`${BASE_RELAY_URL}/${this.vaultId}`)}`;

        try {
            const myTerminal = localStorage.getItem('ferrecloud_terminal_name') || 'CAJA-LOCAL';
            
            // 1. OBTENER DATOS (PULL)
            let remoteData: any = { terminals: {}, sharedStorage: {}, logs: [] };
            
            try {
                const response = await fetch(relayUrl);
                if (response.ok) {
                    const text = await response.text();
                    if (text && text.length > 5) remoteData = JSON.parse(text);
                }
            } catch (e) {
                console.log("Vault init...");
            }

            // 2. ACTUALIZAR PRESENCIA
            const now = Date.now();
            if (!remoteData.terminals) remoteData.terminals = {};
            remoteData.terminals[this.sessionId] = {
                name: myTerminal.toUpperCase(),
                lastSeen: now
            };

            // Limpiar terminales que no responden hace mas de 40 seg
            Object.keys(remoteData.terminals).forEach(id => {
                if (now - remoteData.terminals[id].lastSeen > 40000) {
                    delete remoteData.terminals[id];
                }
            });

            let localUpdated = false;

            // 3. SINCRONIZAR ARRAYS (Clientes, Ventas, etc)
            ARRAY_SYNC_KEYS.forEach(key => {
                const localVal = localStorage.getItem(key);
                const remoteVal = remoteData.sharedStorage?.[key];
                // Solo actualizamos si el dato remoto es más nuevo o diferente
                if (remoteVal && localVal !== remoteVal) {
                    localStorage.setItem(key, remoteVal);
                    localUpdated = true;
                }
            });

            // 4. LOGS DE PRODUCTOS (Sincronización de 140k artículos)
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
                localUpdated = true;
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
                lastUpdate: new Date().toISOString()
            };

            await fetch(relayUrl, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (pendingLogs.length > 0) await productDB.clearLogs();
            
            localStorage.setItem('ferrecloud_last_sync', new Date().toLocaleTimeString());
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse', { 
                detail: { terminals: remoteData.terminals } 
            }));
            
            if (localUpdated) window.dispatchEvent(new Event('storage'));

        } catch (e) {
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_error', { 
                detail: { error: "El servidor proxy está ocupado. Reintentando..." } 
            }));
        } finally {
            this.isProcessing = false;
        }
    }

    async syncFromRemote() {
        await this.syncLoop();
        return true;
    }

    async pushToCloud() {
        await this.syncLoop();
    }
}

export const syncService = new SyncService();
