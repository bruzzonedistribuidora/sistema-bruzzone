
import { productDB } from './storageService';
import { SyncLogEntry, RestApiConfig } from '../types';

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

// Relevo de datos de alta disponibilidad
const CLOUD_RELAY_URL = 'https://kvdb.io/2uD6vR8WpL8R4WpL8R4WpL';

class SyncService {
    private vaultId: string | null = null;
    private apiConfig: RestApiConfig = { baseUrl: '', apiKey: '', enabled: false, lastSyncStatus: 'IDLE' };
    private isProcessing: boolean = false;
    private pollingInterval: number | null = null;
    private sessionId: string = Math.random().toString(36).substring(7);

    constructor() {
        this.vaultId = localStorage.getItem('ferrecloud_vault_id');
        this.loadApiConfig();
        if (this.vaultId) this.startAutoSync();
    }

    private loadApiConfig() {
        const saved = localStorage.getItem('ferrecloud_rest_config');
        if (saved) this.apiConfig = JSON.parse(saved);
    }

    setVaultId(id: string) {
        this.vaultId = id.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
        localStorage.setItem('ferrecloud_vault_id', this.vaultId);
        this.startAutoSync();
    }

    getVaultId() { return this.vaultId; }
    getApiConfig() { return this.apiConfig; }

    private startAutoSync() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.syncLoop();
        // Polling cada 12 segundos para mayor agilidad
        this.pollingInterval = window.setInterval(() => this.syncLoop(), 12000);
    }

    private async syncLoop() {
        if (this.isProcessing || !this.vaultId) return;
        this.isProcessing = true;
        
        try {
            const myTerminal = localStorage.getItem('ferrecloud_terminal_name') || 'PC-SIN-NOMBRE';
            const relayUrl = `${CLOUD_RELAY_URL}/${this.vaultId}`;

            // 1. OBTENER ESTADO ACTUAL DE LA NUBE (PULL)
            const response = await fetch(relayUrl);
            let remoteData: any = { terminals: {}, sharedStorage: {}, logs: [] };
            
            if (response.ok) {
                try {
                    const text = await response.text();
                    remoteData = JSON.parse(text);
                } catch(e) { /* Data corrupta o vacía, usamos default */ }
            }

            // 2. ACTUALIZAR PRESENCIA (Merge de terminales)
            const now = Date.now();
            if (!remoteData.terminals) remoteData.terminals = {};
            
            // Registramos esta PC con su sesión única para evitar colisiones
            remoteData.terminals[this.sessionId] = {
                name: myTerminal,
                lastSeen: now
            };

            // Limpiar terminales que no dan señal hace más de 1 minuto
            Object.keys(remoteData.terminals).forEach(id => {
                if (now - remoteData.terminals[id].lastSeen > 60000) {
                    delete remoteData.terminals[id];
                }
            });

            let localUpdated = false;

            // 3. SINCRONIZAR ARRAYS (VENTAS, CLIENTES...)
            ARRAY_SYNC_KEYS.forEach(key => {
                const localVal = localStorage.getItem(key);
                const remoteVal = remoteData.sharedStorage?.[key];

                // Si la nube tiene algo nuevo que nosotros no, lo bajamos
                if (remoteVal && localVal !== remoteVal) {
                    localStorage.setItem(key, remoteVal);
                    localUpdated = true;
                }
            });

            // 4. SINCRONIZAR LOGS DE PRODUCTOS
            const pendingLogs = await productDB.getPendingLogs();
            if (pendingLogs.length > 0) {
                remoteData.logs = [...(remoteData.logs || []), ...pendingLogs].slice(-300);
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
                logs: remoteData.logs,
                sharedStorage: {
                    ...remoteData.sharedStorage,
                    ...ARRAY_SYNC_KEYS.reduce((acc: any, key) => {
                        const val = localStorage.getItem(key);
                        if (val) acc[key] = val;
                        return acc;
                    }, {})
                },
                lastGlobalUpdate: new Date().toISOString()
            };

            await fetch(relayUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (pendingLogs.length > 0) await productDB.clearLogs();
            
            localStorage.setItem('ferrecloud_last_sync', new Date().toLocaleTimeString());
            if (localUpdated) {
                window.dispatchEvent(new Event('ferrecloud_sync_pulse'));
                window.dispatchEvent(new Event('storage'));
            }

        } catch (e) {
            console.error("Sync Pulse Failed:", e);
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
