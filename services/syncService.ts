
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

// Usamos un servicio de intercambio de JSON más directo
const CLOUD_RELAY_URL = 'https://api.keyvalue.xyz';
// Generamos una clave única basada en el vaultId para este servicio específico
const getVaultKey = (id: string) => `ferrecloud_${id.toLowerCase()}`;

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
        // Limpiamos espacios y caracteres raros
        const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        this.vaultId = cleanId;
        localStorage.setItem('ferrecloud_vault_id', cleanId);
        this.startAutoSync();
    }

    getVaultId() { return this.vaultId; }

    private startAutoSync() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.syncLoop();
        // Polling cada 15 segundos para no saturar pero mantener vivo el sistema
        this.pollingInterval = window.setInterval(() => this.syncLoop(), 15000);
    }

    private async syncLoop() {
        if (this.isProcessing || !this.vaultId) return;
        this.isProcessing = true;
        
        try {
            const myTerminal = localStorage.getItem('ferrecloud_terminal_name') || 'PC-SIN-NOMBRE';
            const vaultKey = getVaultKey(this.vaultId);
            const relayUrl = `${CLOUD_RELAY_URL}/${vaultKey}`;

            // 1. INTENTAR OBTENER DATOS (PULL)
            let remoteData: any = { terminals: {}, sharedStorage: {}, logs: [] };
            try {
                const response = await fetch(relayUrl);
                if (response.ok) {
                    const text = await response.text();
                    if (text && text.length > 5) {
                        remoteData = JSON.parse(text);
                    }
                }
            } catch (e) {
                console.warn("Cloud pull error, using local data structure.");
            }

            // 2. ACTUALIZAR MI PRESENCIA (Merge)
            const now = Date.now();
            if (!remoteData.terminals) remoteData.terminals = {};
            
            remoteData.terminals[this.sessionId] = {
                name: myTerminal.toUpperCase(),
                lastSeen: now
            };

            // Limpiar terminales inactivas (> 1 minuto)
            Object.keys(remoteData.terminals).forEach(id => {
                if (now - remoteData.terminals[id].lastSeen > 60000) {
                    delete remoteData.terminals[id];
                }
            });

            let localUpdated = false;

            // 3. SINCRONIZAR DATOS COMPARTIDOS
            ARRAY_SYNC_KEYS.forEach(key => {
                const localVal = localStorage.getItem(key);
                const remoteVal = remoteData.sharedStorage?.[key];

                if (remoteVal && localVal !== remoteVal) {
                    localStorage.setItem(key, remoteVal);
                    localUpdated = true;
                }
            });

            // 4. LOGS DE PRODUCTOS
            const pendingLogs = await productDB.getPendingLogs();
            if (pendingLogs.length > 0) {
                remoteData.logs = [...(remoteData.logs || []), ...pendingLogs].slice(-200);
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

            // 5. SUBIR ESTADO (PUSH)
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
                lastUpdate: new Date().toISOString()
            };

            await fetch(relayUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (pendingLogs.length > 0) await productDB.clearLogs();
            
            localStorage.setItem('ferrecloud_last_sync', new Date().toLocaleTimeString());
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse', { detail: { terminals: remoteData.terminals } }));
            if (localUpdated) window.dispatchEvent(new Event('storage'));

        } catch (e) {
            console.error("Sync Error:", e);
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_error', { detail: { error: String(e) } }));
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
