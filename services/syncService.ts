import { productDB } from './storageService';

// Added 'UP_TO_DATE' to SyncStatus to avoid type mismatch in initializeBootstrap
export type SyncStatus = 'OFFLINE' | 'CONNECTING' | 'SYNCED' | 'DOWNLOADING' | 'ERROR' | 'UP_TO_DATE';

class SyncService {
    private isAutoSyncEnabled: boolean = false;
    private vaultId: string = '';
    private lastUpdateTs: number = 0;
    private checkInterval: any = null;

    constructor() {
        this.loadConfig();
        if (this.isAutoSyncEnabled && this.vaultId) {
            this.startAutoSync();
        }
    }

    private loadConfig() {
        const saved = localStorage.getItem('ferrecloud_sync_config');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                this.isAutoSyncEnabled = config.enabled || false;
                this.vaultId = config.vaultId || '';
                this.lastUpdateTs = config.lastUpdateTs || 0;
            } catch (e) {
                console.error("Error al cargar configuración de red");
            }
        }
    }

    // Simulación de "Push" a la nube real
    async pushToCloud(data: any, type: string) {
        if (!this.isAutoSyncEnabled || !this.vaultId) return;

        console.log(`[Cloud] Enviando actualización de tipo ${type} a la bóveda ${this.vaultId}`);
        
        // En una implementación real, aquí haríamos un fetch POST a un backend (Firebase/Supabase/Node)
        // Para esta demo, simulamos que la nube registra el cambio
        const now = Date.now();
        this.lastUpdateTs = now;
        
        // Guardamos el timestamp global en un registro compartido simulado
        localStorage.setItem(`ferrecloud_global_ts_${this.vaultId}`, now.toString());
        
        // Si son productos, simulamos la persistencia masiva en el "servidor"
        if (type === 'PRODUCT' || type === 'BULK_PRODUCTS') {
            const allProds = await productDB.getAll();
            // Simular almacenamiento en base de datos externa persistente
            localStorage.setItem(`ferrecloud_cloud_db_${this.vaultId}`, JSON.stringify(allProds));
        }

        this.saveState();
        return true;
    }

    // Simulación de "Pull" de la nube real
    async pullFromCloud(): Promise<boolean> {
        if (!this.isAutoSyncEnabled || !this.vaultId) return false;

        const globalTs = parseInt(localStorage.getItem(`ferrecloud_global_ts_${this.vaultId}`) || '0');
        
        // Solo descargamos si hay algo nuevo en la nube que no tenemos localmente
        if (globalTs > this.lastUpdateTs) {
            console.log("[Cloud] Detectados cambios en la nube. Sincronizando 140,000 artículos...");
            
            const cloudDataRaw = localStorage.getItem(`ferrecloud_cloud_db_${this.vaultId}`);
            if (cloudDataRaw) {
                try {
                    const products = JSON.parse(cloudDataRaw);
                    await productDB.clearAll();
                    await productDB.saveBulk(products);
                    
                    this.lastUpdateTs = globalTs;
                    this.saveState();
                    
                    // Notificar a la UI que los productos cambiaron
                    window.dispatchEvent(new Event('ferrecloud_products_updated'));
                    return true;
                } catch (e) {
                    console.error("Error al procesar datos de la nube");
                }
            }
        }
        return false;
    }

    private saveState() {
        const config = {
            enabled: this.isAutoSyncEnabled,
            vaultId: this.vaultId,
            lastUpdateTs: this.lastUpdateTs
        };
        localStorage.setItem('ferrecloud_sync_config', JSON.stringify(config));
    }

    public startAutoSync() {
        if (this.checkInterval) clearInterval(this.checkInterval);
        
        // Revisar cambios cada 30 segundos de forma silenciosa
        this.checkInterval = setInterval(async () => {
            const didUpdate = await this.pullFromCloud();
            if (didUpdate) {
                // Disparamos un evento visual para que el usuario sepa que hubo un pulso
                window.dispatchEvent(new Event('ferrecloud_sync_pulse'));
            }
        }, 30000); 
    }

    async initializeBootstrap(): Promise<SyncStatus> {
        this.loadConfig();
        if (!this.isAutoSyncEnabled) return 'OFFLINE';
        
        // Al arrancar, forzar una descarga completa
        const success = await this.pullFromCloud();
        // Updated to use types defined in SyncStatus
        return success ? 'SYNCED' : 'UP_TO_DATE';
    }

    async linkTerminal(newVaultId: string): Promise<boolean> {
        this.vaultId = newVaultId.toUpperCase();
        this.isAutoSyncEnabled = true;
        this.lastUpdateTs = 0; // Forzar descarga inicial
        this.saveState();
        this.startAutoSync();
        return await this.pullFromCloud();
    }
}

export const syncService = new SyncService();
