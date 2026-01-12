
import { productDB } from './storageService';

const ARRAY_SYNC_KEYS = [
    'ferrecloud_remitos',
    'ferrecloud_sales_history',
    'ferrecloud_clients',
    'ferrecloud_movements',
    'ferrecloud_purchases',
    'ferrecloud_providers',
    'ferrecloud_registers',
    'ferrecloud_budgets',
    'company_config',
    'ferrecloud_brands',
    'ferrecloud_categories'
];

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

    // --- PLAN B: SINCRONIZACIÓN POR ARCHIVO (RECOMENDADO PARA 140K ITEMS) ---
    
    async exportFullVault() {
        try {
            const allProducts = await productDB.getAll(200000); // Traer todos
            const storageData: any = {};
            
            ARRAY_SYNC_KEYS.forEach(key => {
                const val = localStorage.getItem(key);
                if (val) storageData[key] = JSON.parse(val);
            });

            const fullPackage = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                products: allProducts,
                storage: storageData
            };

            const blob = new Blob([JSON.stringify(fullPackage)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const dateStr = new Date().toISOString().split('T')[0];
            a.href = url;
            a.download = `MAESTRO_FERRETERIA_${dateStr}.json`;
            a.click();
            URL.revokeObjectURL(url);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async importFullVault(file: File): Promise<boolean> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target?.result as string);
                    if (!data.products) throw new Error("Formato inválido");

                    // 1. Limpiar e Importar Productos (IndexedDB)
                    await productDB.clearAll();
                    await productDB.saveBulk(data.products);

                    // 2. Importar LocalStorage
                    if (data.storage) {
                        Object.entries(data.storage).forEach(([key, val]) => {
                            localStorage.setItem(key, JSON.stringify(val));
                        });
                    }

                    resolve(true);
                } catch (err) {
                    console.error(err);
                    resolve(false);
                }
            };
            reader.readAsText(file);
        });
    }

    // --- PLAN A: NUBE (SOLO PARA CAMBIOS PEQUEÑOS Y PRESENCIA) ---

    private startAutoSync() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.syncLoop();
        this.pollingInterval = window.setInterval(() => this.syncLoop(), 10000); 
    }

    private async syncLoop() {
        if (this.isProcessing || !this.vaultId) return;
        this.isProcessing = true;
        
        const url = `${CLOUD_ENDPOINT}/${this.vaultId}`;

        try {
            const myTerminalName = (localStorage.getItem('ferrecloud_terminal_name') || 'PC').toUpperCase();
            
            // Handshake ultraligero
            const response = await fetch(url, { 
                method: 'GET',
                cache: 'no-store',
                mode: 'cors'
            });

            let remoteData: any = { terminals: {} };
            if (response.ok) {
                const text = await response.text();
                if (text) remoteData = JSON.parse(text);
            }

            // Actualizar presencia
            const now = Date.now();
            if (!remoteData.terminals) remoteData.terminals = {};
            remoteData.terminals[this.sessionId] = { name: myTerminalName, lastSeen: now };

            // Limpiar desconectados
            Object.keys(remoteData.terminals).forEach(id => {
                if (now - remoteData.terminals[id].lastSeen > 40000) delete remoteData.terminals[id];
            });

            // Solo subimos presencia para no saturar con 140k items
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    terminals: remoteData.terminals,
                    lastSync: new Date().toISOString()
                })
            });

            localStorage.setItem('ferrecloud_last_sync', new Date().toLocaleTimeString());
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse', { 
                detail: { terminals: remoteData.terminals } 
            }));

        } catch (e) {
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_error', { 
                detail: { error: "Nube en espera..." } 
            }));
        } finally {
            this.isProcessing = false;
        }
    }

    async syncFromRemote() { await this.syncLoop(); return true; }
    async pushToCloud() { await this.syncLoop(); return true; }
}

export const syncService = new SyncService();
