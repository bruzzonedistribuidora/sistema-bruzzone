
import { productDB } from './storageService';

export type SyncStatus = 'OFFLINE' | 'CONNECTING' | 'SYNCED' | 'DOWNLOADING' | 'ERROR';

class SyncService {
    private isAutoSyncEnabled: boolean = false;
    private vaultId: string = '';
    private channel: BroadcastChannel;

    constructor() {
        this.loadConfig();
        // Comunicación en tiempo real entre pestañas del mismo PC
        this.channel = new BroadcastChannel('ferrecloud_sync_internal');
        this.channel.onmessage = (event) => {
            if (event.data.type === 'DATA_CHANGED') {
                window.dispatchEvent(new Event('ferrecloud_products_updated'));
                window.dispatchEvent(new Event('ferrecloud_sales_updated'));
            }
        };
    }

    private loadConfig() {
        const saved = localStorage.getItem('ferrecloud_sync_config');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                this.isAutoSyncEnabled = config.enabled || false;
                this.vaultId = config.vaultId || '';
            } catch (e) {
                console.error("Error al cargar configuración de sync");
            }
        }
    }

    // Exporta toda la base de datos a un archivo físico para mover entre PCs
    async exportFullVault() {
        const products = await productDB.getAll();
        const config = localStorage.getItem('company_config');
        const clients = localStorage.getItem('ferrecloud_clients');
        const sales = localStorage.getItem('ferrecloud_sales_history');
        
        const data = {
            ts: Date.now(),
            vaultId: this.vaultId,
            products,
            clients: clients ? JSON.parse(clients) : [],
            sales: sales ? JSON.parse(sales) : [],
            config: config ? JSON.parse(config) : {}
        };

        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `SISTEMA_BRUZZONE_${this.vaultId}_${new Date().toISOString().split('T')[0]}.ferrecloud`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // Importa un archivo de otra PC y lo guarda físicamente en el IndexedDB local
    async importVaultFile(file: File): Promise<boolean> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = e.target?.result as string;
                    const data = JSON.parse(content);

                    if (!data.products) throw new Error("Formato inválido");

                    // 1. Limpiar e insertar productos (los 140.000 de golpe)
                    await productDB.clearAll();
                    await productDB.saveBulk(data.products);
                    
                    // 2. Restaurar el resto de la configuración
                    if (data.clients) localStorage.setItem('ferrecloud_clients', JSON.stringify(data.clients));
                    if (data.sales) localStorage.setItem('ferrecloud_sales_history', JSON.stringify(data.sales));
                    if (data.config) {
                        localStorage.setItem('company_config', JSON.stringify(data.config));
                        window.dispatchEvent(new Event('company_config_updated'));
                    }

                    window.dispatchEvent(new Event('ferrecloud_products_updated'));
                    this.notifyInternalTabs();
                    resolve(true);
                } catch (err) {
                    console.error("Error importando bóveda:", err);
                    resolve(false);
                }
            };
            reader.readAsText(file);
        });
    }

    notifyInternalTabs() {
        this.channel.postMessage({ type: 'DATA_CHANGED' });
    }

    async pushToCloud(data: any, type: string) {
        // En este entorno sin servidor real, notificamos a otras pestañas
        this.notifyInternalTabs();
        return true;
    }

    async initializeBootstrap(): Promise<SyncStatus> {
        this.loadConfig();
        return this.isAutoSyncEnabled ? 'SYNCED' : 'OFFLINE';
    }

    async linkTerminal(newVaultId: string): Promise<boolean> {
        const config = {
            enabled: true,
            vaultId: newVaultId.toUpperCase(),
            apiUrl: 'https://cloud.ferrebruzzone.cloud/api/v1',
            lastSync: new Date().toLocaleString(),
            autoSync: true
        };
        localStorage.setItem('ferrecloud_sync_config', JSON.stringify(config));
        this.loadConfig();
        return true;
    }
}

export const syncService = new SyncService();
