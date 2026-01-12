
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

// Usamos KVDB.io que es más estable para aplicaciones web puras
// El prefijo 'ferre_' ayuda a evitar colisiones con otros servicios
const CLOUD_RELAY_URL = 'https://kvdb.io/2uD6vR8WpL8R4WpL8R4WpL'; // Bucket público seguro para el sistema

class SyncService {
    private vaultId: string | null = null;
    private apiConfig: RestApiConfig = { baseUrl: '', apiKey: '', enabled: false, lastSyncStatus: 'IDLE' };
    private isProcessing: boolean = false;
    private pollingInterval: number | null = null;

    constructor() {
        this.vaultId = localStorage.getItem('ferrecloud_vault_id');
        this.loadApiConfig();
        if (this.vaultId || this.apiConfig.enabled) this.startAutoSync();
    }

    private loadApiConfig() {
        const saved = localStorage.getItem('ferrecloud_rest_config');
        if (saved) this.apiConfig = JSON.parse(saved);
    }

    setVaultId(id: string) {
        // Limpiamos el ID de caracteres especiales
        this.vaultId = id.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
        localStorage.setItem('ferrecloud_vault_id', this.vaultId);
        this.startAutoSync();
    }

    getVaultId() { return this.vaultId; }
    getApiConfig() { return this.apiConfig; }

    private startAutoSync() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.syncLoop();
        // Polling cada 15 segundos
        this.pollingInterval = window.setInterval(() => this.syncLoop(), 15000);
    }

    private async syncLoop() {
        if (this.isProcessing || !this.vaultId) return;
        this.isProcessing = true;
        
        try {
            const myTerminal = localStorage.getItem('ferrecloud_terminal_name') || 'PC-LOCAL';
            const relayUrl = `${CLOUD_RELAY_URL}/${this.vaultId}`;

            // 1. INTENTAR OBTENER DATOS
            const response = await fetch(relayUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            let remoteData: any = null;
            if (response.ok) {
                const text = await response.text();
                try { remoteData = JSON.parse(text); } catch(e) { remoteData = null; }
            }

            if (!remoteData || typeof remoteData !== 'object') {
                remoteData = { terminals: {}, sharedStorage: {}, logs: [], lastGlobalUpdate: '' };
            }

            // 2. ACTUALIZAR MI PRESENCIA (Heartbeat)
            const now = new Date().toISOString();
            remoteData.terminals = remoteData.terminals || {};
            remoteData.terminals[myTerminal] = now;

            // Limpiar terminales inactivas (> 2 min)
            Object.keys(remoteData.terminals).forEach(t => {
                const lastSeen = new Date(remoteData.terminals[t]).getTime();
                if (Date.now() - lastSeen > 120000) delete remoteData.terminals[t];
            });

            let localUpdated = false;
            let needsPush = true; // Siempre subimos para mantener el latido vivo

            // 3. SINCRONIZAR DATOS (VENTAS, CLIENTES, ETC)
            ARRAY_SYNC_KEYS.forEach(key => {
                const localVal = localStorage.getItem(key);
                const remoteVal = remoteData.sharedStorage[key];

                if (remoteVal && localVal !== remoteVal) {
                    localStorage.setItem(key, remoteVal);
                    localUpdated = true;
                }
            });

            // 4. SINCRONIZAR PRODUCTOS (LOGS DE CAMBIOS)
            const pendingLogs = await productDB.getPendingLogs();
            if (pendingLogs.length > 0) {
                remoteData.logs = [...(remoteData.logs || []), ...pendingLogs].slice(-500);
            }

            const lastSyncTs = parseInt(localStorage.getItem('ferrecloud_last_sync_ts') || '0');
            const newRemoteLogs = (remoteData.logs || []).filter((l: any) => 
                new Date(l.timestamp).getTime() > lastSyncTs && l.terminalName !== myTerminal
            );

            if (newRemoteLogs.length > 0) {
                for (const log of newRemoteLogs) {
                    if (log.payload?.id) await productDB.save(log.payload, true);
                }
                localStorage.setItem('ferrecloud_last_sync_ts', Date.now().toString());
                localUpdated = true;
            }

            // 5. SUBIR ESTADO ACTUALIZADO
            const payload = {
                terminals: remoteData.terminals,
                logs: remoteData.logs,
                sharedStorage: {
                    ...remoteData.sharedStorage,
                    ...ARRAY_SYNC_KEYS.reduce((acc: any, key) => {
                        acc[key] = localStorage.getItem(key);
                        return acc;
                    }, {})
                },
                lastGlobalUpdate: now
            };

            await fetch(relayUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (pendingLogs.length > 0) await productDB.clearLogs();
            
            localStorage.setItem('ferrecloud_last_sync', new Date().toLocaleString());
            if (localUpdated) {
                window.dispatchEvent(new Event('ferrecloud_sync_pulse'));
                window.dispatchEvent(new Event('storage'));
            }

        } catch (e) {
            console.error("Sync Critical Error:", e);
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
