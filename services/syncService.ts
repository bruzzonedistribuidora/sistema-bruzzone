
import { productDB } from './storageService';

export type SyncStatus = 'OFFLINE' | 'CONNECTING' | 'SYNCED' | 'DOWNLOADING' | 'ERROR';

class SyncService {
    private isAutoSyncEnabled: boolean = false;
    private vaultId: string = '';
    private channel: BroadcastChannel;

    constructor() {
        this.loadConfig();
        // Comunicación en tiempo real entre pestañas/ventas del mismo PC
        this.channel = new BroadcastChannel('ferrecloud_sync_channel');
        this.channel.onmessage = (event) => {
            if (event.data.type === 'REFRESH_REQUIRED') {
                window.dispatchEvent(new Event('ferrecloud_products_updated'));
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
                console.error("Error al cargar configuración");
            }
        }
    }

    // Genera un archivo descargable con toda la base de datos
    async exportVaultFile() {
        const products = await productDB.getAll();
        const config = localStorage.getItem('company_config');
        const clients = localStorage.getItem('ferrecloud_clients');
        const brands = localStorage.getItem('ferrecloud_brands');
        const categories = localStorage.getItem('ferrecloud_categories');
        
        const packageData = {
            ts: Date.now(),
            vaultId: this.vaultId,
            products,
            clients: clients ? JSON.parse(clients) : [],
            brands: brands ? JSON.parse(brands) : [],
            categories: categories ? JSON.parse(categories) : [],
            config: config ? JSON.parse(config) : {}
        };

        const blob = new Blob([JSON.stringify(packageData)], { type: 'application/ferrecloud' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `BOVEDA_${this.vaultId}_${new Date().toISOString().split('T')[0]}.ferrecloud`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // Importa un archivo recibido de otra PC
    async importVaultFile(file: File): Promise<boolean> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target?.result as string);
                    if (!data.products) throw new Error("Archivo inválido");

                    await productDB.clearAll();
                    // Guardar en bloques para no saturar memoria
                    await productDB.saveBulk(data.products);
                    
                    if (data.clients) localStorage.setItem('ferrecloud_clients', JSON.stringify(data.clients));
                    if (data.config) localStorage.setItem('company_config', JSON.stringify(data.config));
                    if (data.brands) localStorage.setItem('ferrecloud_brands', JSON.stringify(data.brands));
                    if (data.categories) localStorage.setItem('ferrecloud_categories', JSON.stringify(data.categories));

                    window.dispatchEvent(new Event('ferrecloud_products_updated'));
                    window.dispatchEvent(new Event('company_config_updated'));
                    this.notifyTabs();
                    resolve(true);
                } catch (err) {
                    console.error("Error importando:", err);
                    resolve(false);
                }
            };
            reader.readAsText(file);
        });
    }

    notifyTabs() {
        this.channel.postMessage({ type: 'REFRESH_REQUIRED' });
    }

    async pushToCloud(data: any, type: string) {
        this.notifyTabs();
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
