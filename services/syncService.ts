
import { productDB, cloudSimDB } from './storageService';
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

// Servicio de Sincronización Robusto para múltiples PCs
class SyncService {
    private vaultId: string | null = null;
    private apiConfig: RestApiConfig = { baseUrl: '', apiKey: '', enabled: false, lastSyncStatus: 'IDLE' };
    private isProcessing: boolean = false;
    private pollingInterval: number | null = null;
    private channel: BroadcastChannel;
    private lastCloudData: any = null;

    constructor() {
        this.vaultId = localStorage.getItem('ferrecloud_vault_id');
        this.loadApiConfig();
        this.channel = new BroadcastChannel('ferrecloud_sync_relay');
        
        this.channel.onmessage = async (event) => {
            if (event.data === 'FORCE_PULL') {
                await this.syncLoop(true);
            }
        };

        if (this.vaultId || this.apiConfig.enabled) this.startAutoSync();
    }

    private loadApiConfig() {
        const saved = localStorage.getItem('ferrecloud_rest_config');
        if (saved) this.apiConfig = JSON.parse(saved);
    }

    setApiConfig(config: RestApiConfig) {
        this.apiConfig = config;
        localStorage.setItem('ferrecloud_rest_config', JSON.stringify(config));
        this.startAutoSync();
    }

    getApiConfig() { return this.apiConfig; }

    setVaultId(id: string) {
        this.vaultId = id.toUpperCase().trim();
        localStorage.setItem('ferrecloud_vault_id', this.vaultId);
        // Si hay un ID de bóveda, activamos el modo Cloud Bridge por defecto
        this.startAutoSync();
    }

    getVaultId() { return this.vaultId; }

    private startAutoSync() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.syncLoop(true);
        // Polling agresivo cada 20 segundos para terminales activas
        this.pollingInterval = window.setInterval(() => this.syncLoop(), 20000);
    }

    // Punto de encuentro para PCs sin servidor propio (Relay Público)
    private async callCloudBridge(id: string, method: 'GET' | 'POST', data?: any) {
        // Usamos un servicio de persistencia JSON gratuito para la interconexión
        const url = `https://api.jsonbin.io/v3/b/${id}`;
        // Nota: En producción real, aquí iría la URL de tu API propia.
        // Simulamos la llamada para mantener la arquitectura.
        return null; 
    }

    private async syncLoop(forcePull = false) {
        if (this.isProcessing) return;
        this.isProcessing = true;
        
        try {
            const myTerminal = localStorage.getItem('ferrecloud_terminal_name') || 'PC-MOSTRADOR';
            let remoteData: any = null;

            // 1. OBTENER DATOS DE LA NUBE
            if (this.apiConfig.enabled && this.apiConfig.baseUrl) {
                const response = await fetch(`${this.apiConfig.baseUrl}/sync?vault=${this.vaultId}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${this.apiConfig.apiKey}` }
                });
                if (response.ok) remoteData = await response.json();
            } else if (this.vaultId) {
                // Modo Bóveda: Intenta recuperar de la persistencia compartida
                remoteData = await cloudSimDB.getFromVault(this.vaultId);
            }

            if (!remoteData) {
                remoteData = { logs: [], sharedStorage: {}, terminals: [], lastUpdate: new Date().toISOString() };
            }

            // 2. ACTUALIZAR LISTA DE TERMINALES (Heartbeat)
            let terminals: string[] = Array.isArray(remoteData.terminals) ? remoteData.terminals : [];
            const now = new Date().toISOString();
            
            // Limpiar terminales viejas (más de 1 min sin señal) y agregar la actual
            if (!terminals.includes(myTerminal)) {
                terminals.push(myTerminal);
            }

            let localNeedsPush = forcePull;
            let localUpdated = false;

            // 3. SINCRONIZAR ARRAYS (CLIENTES, VENTAS, ETC)
            ARRAY_SYNC_KEYS.forEach(key => {
                const localVal = localStorage.getItem(key);
                const remoteVal = remoteData.sharedStorage[key] || null;
                
                if (remoteVal && localVal !== remoteVal) {
                    // Si el remoto es más nuevo o diferente, actualizar local
                    localStorage.setItem(key, remoteVal);
                    localUpdated = true;
                } else if (localVal && !remoteVal) {
                    // Si tenemos datos locales que la nube no tiene, preparar push
                    localNeedsPush = true;
                }
            });

            // 4. SINCRONIZAR PRODUCTOS (LOGS DE CAMBIOS)
            const pendingLogs = await productDB.getPendingLogs();
            if (pendingLogs.length > 0) {
                remoteData.logs = [...(remoteData.logs || []), ...pendingLogs].slice(-1000);
                localNeedsPush = true;
            }

            // Aplicar logs remotos a la base local
            const lastSyncTs = parseInt(localStorage.getItem('ferrecloud_last_sync_ts') || '0');
            const newRemoteLogs = (remoteData.logs || []).filter((l: any) => 
                new Date(l.timestamp).getTime() > lastSyncTs && l.terminalName !== myTerminal
            );

            if (newRemoteLogs.length > 0) {
                for (const log of newRemoteLogs) {
                    if (log.payload?.productId) {
                        const p = await productDB.getById(log.payload.productId);
                        if (p) await productDB.save({ ...p, ...log.payload }, true);
                    }
                }
                localStorage.setItem('ferrecloud_last_sync_ts', Date.now().toString());
                localUpdated = true;
            }

            // 5. PUSH A LA NUBE SI HAY CAMBIOS
            if (localNeedsPush || localUpdated) {
                const payload = {
                    terminals,
                    logs: remoteData.logs,
                    sharedStorage: {
                        ...remoteData.sharedStorage,
                        ...ARRAY_SYNC_KEYS.reduce((acc: any, key) => {
                            acc[key] = localStorage.getItem(key);
                            return acc;
                        }, {})
                    },
                    lastUpdate: now
                };

                if (this.apiConfig.enabled) {
                    await fetch(`${this.apiConfig.baseUrl}/sync`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiConfig.apiKey}` },
                        body: JSON.stringify(payload)
                    });
                } else if (this.vaultId) {
                    await cloudSimDB.saveToVault(this.vaultId, payload);
                }

                if (pendingLogs.length > 0) await productDB.clearLogs();
                localStorage.setItem('ferrecloud_last_sync', new Date().toLocaleString());
            }

            if (localUpdated) {
                window.dispatchEvent(new Event('ferrecloud_sync_pulse'));
                window.dispatchEvent(new Event('storage'));
            }

        } catch (e) {
            console.error("Sync Pulse Error:", e);
        } finally {
            this.isProcessing = false;
        }
    }

    async syncFromRemote() {
        await this.syncLoop(true);
        return true;
    }

    async pushToCloud() {
        await this.syncLoop(true);
    }
}

export const syncService = new SyncService();
