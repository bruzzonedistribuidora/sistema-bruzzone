import { 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    serverTimestamp, 
    orderBy, 
    where,
    Timestamp
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { productDB } from "./storageService";

export interface SyncActivity {
    id: string;
    timestamp: string;
    type: 'IN' | 'OUT' | 'ERROR';
    description: string;
}

// Definición de todas las claves de localStorage que se sincronizarán
const JSON_STORAGE_KEYS_TO_SYNC = [
    'ferrecloud_clients',
    'ferrecloud_providers',
    'ferrecloud_purchases',
    'ferrecloud_employees',
    'company_config',
    'daily_movements',
    'ferrecloud_roles',
    'ferrecloud_users',
    'ferrecloud_checks',
    'ferrecloud_registers',
    'ferrecloud_treasury_movements',
    'ferrecloud_movements', // Movimientos de Cta Cte de clientes
    'ferrecloud_provider_movements', // Movimientos de Cta Cte de proveedores
    'ferrecloud_manual_shortages',
    'ferrecloud_remitos',
    'ferrecloud_budgets',
    'ferrecloud_sales_orders',
    'ferrecloud_stock_transfers',
    'ferrecloud_brands',
    'ferrecloud_categories',
    'ferrecloud_price_lists',
    'ferrecloud_replenishment_orders',
    'ferrecloud_coupons',
    'ferrecloud_campaigns',
    'ferrecloud_print_templates_v8',
    'ferrecloud_license',
    'ferrecloud_user_shortcuts'
];

const STRING_STORAGE_KEYS_TO_SYNC = [
    'afip_backend_url',
    'afip_sales_point',
    'afip_environment',
    'afip_cuit',
];

const ALL_STORAGE_KEYS_TO_SYNC = [...JSON_STORAGE_KEYS_TO_SYNC, ...STRING_STORAGE_KEYS_TO_SYNC];

class SyncService {
    private vaultId: string | null = null;
    private sessionId: string = Math.random().toString(36).substring(7);
    private activityLog: SyncActivity[] = [];
    private unsubscribe: (() => void) | null = null;
    private lastSyncTime: Date = new Date(); // Track last sync to fetch from

    constructor() {
        this.vaultId = localStorage.getItem('ferrecloud_vault_id');
        if (this.vaultId) this.initFirebase();

        // Escuchar cambios locales para subirlos a la nube
        // Listener para productos (IndexedDB), ya existente
        window.addEventListener('ferrecloud_sync_out' as any, (e: CustomEvent) => {
            this.pushDelta(e.detail.type, e.detail.payload);
        });

        // Escuchadores genéricos para todas las claves de localStorage
        ALL_STORAGE_KEYS_TO_SYNC.forEach(key => {
            window.addEventListener(`${key}_updated`, () => {
                const data = localStorage.getItem(key);
                if (data === null) { // Handle deletion by sending null payload
                    this.pushDelta(`${key}_SYNC`, null);
                    this.logActivity('OUT', `Enviando ${key.replace('ferrecloud_', '').toUpperCase()} (borrado)`);
                } else {
                    try {
                        const payload = JSON_STORAGE_KEYS_TO_SYNC.includes(key) ? JSON.parse(data) : data;
                        this.pushDelta(`${key}_SYNC`, payload);
                        this.logActivity('OUT', `Enviando ${key.replace('ferrecloud_', '').toUpperCase()}`);
                    } catch (e) {
                        this.logActivity('ERROR', `Error al serializar ${key} para enviar: ${e}`);
                    }
                }
            });
        });

        // Listener para pulsos globales de sincronización manual
        window.addEventListener('ferrecloud_request_pulse' as any, () => {
            this.pushDelta('SYNC_PULSE', { timestamp: Date.now() });
        });
    }

    private logActivity(type: 'IN' | 'OUT' | 'ERROR', description: string) {
        const entry: SyncActivity = {
            id: Math.random().toString(36).substr(2, 5),
            timestamp: new Date().toLocaleTimeString(),
            type,
            description
        };
        this.activityLog = [entry, ...this.activityLog].slice(0, 50);
        window.dispatchEvent(new CustomEvent('ferrecloud_sync_activity', { detail: this.activityLog }));
    }

    setVaultId(id: string) {
        const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!cleanId) return;
        
        this.vaultId = cleanId;
        localStorage.setItem('ferrecloud_vault_id', cleanId);
        this.logActivity('OUT', `Vínculo establecido con bóveda: ${cleanId}`);
        this.lastSyncTime = new Date(); // Reset sync time to now
        this.initFirebase();
    }

    getVaultId() { return this.vaultId; }

    // Helper para actualizar localStorage y disparar eventos
    private updateLocalStorageAndDispatch(key: string, data: any, isString: boolean = false) {
        if (data === null) {
            localStorage.removeItem(key);
        } else if (isString) {
            localStorage.setItem(key, data);
        } else {
            localStorage.setItem(key, JSON.stringify(data));
        }
        window.dispatchEvent(new Event('storage')); // Evento genérico
        window.dispatchEvent(new CustomEvent(`${key}_updated`)); // Evento específico
    }

    private initFirebase() {
        if (!this.vaultId || !db) return;
        
        // Limpiar suscripción previa si existe
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        this.logActivity('IN', 'Iniciando escucha de cambios en tiempo real...');

        try {
            const deltasRef = collection(db, "vaults", this.vaultId, "deltas");
            
            // Query para obtener todos los deltas desde el último punto de sincronización
            const q = query(
                deltasRef,
                where("createdAt", ">", Timestamp.fromDate(this.lastSyncTime)),
                orderBy("createdAt", "asc")
            );

            this.unsubscribe = onSnapshot(q, (snapshot) => {
                let initialLoadComplete = false; // Flag para manejar la carga inicial
                snapshot.docChanges().forEach(async (change) => {
                    // Si es el primer conjunto de documentos o un cambio 'added' que no es de esta sesión
                    if ((change.type === "added" || change.type === "modified") && change.doc.data().sid !== this.sessionId) {
                        const data = change.doc.data();
                        const { type, payload } = data;

                        try {
                            // Manejo específico para productos (IndexedDB)
                            if (type === 'PRODUCT_UPDATE') {
                                await productDB.save(payload, true);
                                this.logActivity('IN', `Sinc: ${payload.name} actualizado (producto)`);
                            } else if (type === 'PRODUCT_DELETE') {
                                await productDB.delete(payload.id, true);
                                this.logActivity('IN', `Sinc: Eliminado ID ${payload.id} (producto)`);
                            }
                            // Manejo genérico para claves de localStorage
                            else if (JSON_STORAGE_KEYS_TO_SYNC.includes(type.replace('_SYNC', ''))) {
                                this.updateLocalStorageAndDispatch(type.replace('_SYNC', ''), payload, false);
                                this.logActivity('IN', `Sinc: ${type.replace('ferrecloud_', '').toUpperCase()} actualizado`);
                            } else if (STRING_STORAGE_KEYS_TO_SYNC.includes(type.replace('_SYNC', ''))) {
                                this.updateLocalStorageAndDispatch(type.replace('_SYNC', ''), payload, true);
                                this.logActivity('IN', `Sinc: ${type.replace('afip_', '').toUpperCase()} actualizado`);
                            }
                            // Manejo para pulsos de sincronización (generalmente sin payload significativo)
                            else if (type === 'SYNC_PULSE') {
                                this.logActivity('IN', `Sinc: Recibido pulso de sincronización`);
                            }
                        } catch (err: any) {
                            console.error("Sync Error:", err);
                            this.logActivity('ERROR', `Fallo al procesar cambio entrante: ${err.message}`);
                        }
                    }
                });
                
                // Actualizar lastSyncTime después de procesar todos los cambios de este snapshot
                // y notificar que la sincronización está activa
                this.lastSyncTime = new Date();
                window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse', { 
                    detail: { status: 'OK', engine: 'FIREBASE' } 
                }));
            }, (error) => {
                console.error("Firestore error:", error);
                this.logActivity('ERROR', `Conexión perdida: ${error.message}`);
                window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse', { detail: { status: 'ERROR' } }));
            });
        } catch (e: any) {
            console.error("Firebase init error:", e);
            this.logActivity('ERROR', `Error al inicializar Firestore: ${e.message}`);
        }
    }

    async pushDelta(type: string, payload: any) {
        if (!this.vaultId || !db) return;

        try {
            const deltasRef = collection(db, "vaults", this.vaultId, "deltas");
            await addDoc(deltasRef, {
                type,
                payload,
                sid: this.sessionId,
                terminal: localStorage.getItem('ferrecloud_terminal_name') || 'PC-DESCONOCIDA',
                createdAt: serverTimestamp()
            });
            this.logActivity('OUT', `Paquete enviado: ${type}`);
        } catch (e: any) {
            console.error("Push Delta Error:", e);
            this.logActivity('ERROR', `Error al transmitir: ${e.message}`);
        }
    }

    /**
     * Fuerza el envío de todos los datos locales de localStorage a la nube.
     * Útil para la configuración inicial o para resincronizar una terminal.
     */
    async pushAllLocalData() {
        if (!this.vaultId || !db) {
            this.logActivity('ERROR', 'No se puede enviar: Bóveda no configurada o Firestore no inicializado.');
            return;
        }

        this.logActivity('OUT', 'Iniciando envío de TODOS los datos locales a la nube...');
        
        // Enviar productos de IndexedDB
        const allProducts = await productDB.getAll();
        await this.pushDelta('PRODUCT_UPDATE', allProducts); // Envía todos como un bulk update
        
        // Enviar todas las claves de localStorage
        for (const key of ALL_STORAGE_KEYS_TO_SYNC) {
            const data = localStorage.getItem(key);
            if (data !== null) {
                try {
                    const payload = JSON_STORAGE_KEYS_TO_SYNC.includes(key) ? JSON.parse(data) : data;
                    await this.pushDelta(`${key}_SYNC`, payload);
                } catch (e) {
                    this.logActivity('ERROR', `Error al enviar ${key}: ${e}`);
                }
            } else {
                await this.pushDelta(`${key}_SYNC`, null); // Enviar null para indicar que se borró
            }
        }
        this.logActivity('OUT', 'Envío completo de datos locales.');
    }

    /**
     * Fuerza una sincronización completa de datos desde la nube.
     * Esto reinicializa la escucha de Firebase para que capture todos los deltas pasados
     * y los aplique al estado local.
     */
    async syncFromRemote(): Promise<boolean> {
        if (!this.vaultId) {
            this.logActivity('ERROR', 'No se puede sincronizar: Bóveda no configurada.');
            return false;
        }

        this.logActivity('IN', 'Iniciando sincronización completa de datos desde la nube...');
        
        // Establecer la fecha de última sincronización muy antigua para obtener todo el historial
        this.lastSyncTime = new Date(0); // Epoch, significa "desde el inicio de los tiempos"
        
        // Reinicializar Firebase con la nueva lastSyncTime
        this.initFirebase();

        // Disparar un pulso para asegurar que se actualice el estado de la UI
        window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse', { 
            detail: { status: 'OK', engine: 'FIREBASE' } 
        }));
        
        this.logActivity('IN', 'Sincronización completa solicitada. Los datos se aplicarán a medida que lleguen.');
        return true;
    }

    getActivityLog() { return this.activityLog; }
}

export const syncService = new SyncService();
