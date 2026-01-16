import { 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    serverTimestamp, 
    orderBy, 
    where,
    Timestamp,
    doc
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { productDB } from "./storageService";

export interface SyncActivity {
    id: string;
    timestamp: string;
    type: 'IN' | 'OUT' | 'ERROR';
    description: string;
}

class SyncService {
    private vaultId: string | null = null;
    private sessionId: string = Math.random().toString(36).substring(7);
    private activityLog: SyncActivity[] = [];
    private unsubscribe: (() => void) | null = null;
    private connectionTime: Date = new Date();

    constructor() {
        // CONEXIÓN AUTOMÁTICA AL INICIAR
        this.vaultId = localStorage.getItem('ferrecloud_vault_id');
        if (this.vaultId) {
            console.log("Iniciando Sincronización Automática con Bóveda:", this.vaultId);
            this.initFirebase();
        }

        // Escuchar cambios locales para subirlos a la nube
        window.addEventListener('ferrecloud_sync_out' as any, (e: CustomEvent) => {
            this.pushDelta(e.detail.type, e.detail.payload);
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
        this.connectionTime = new Date(); 
        this.initFirebase();
    }

    getVaultId() { return this.vaultId; }

    private initFirebase() {
        if (!this.vaultId || !db) {
            console.warn("SyncService: No se puede inicializar Firebase sin vaultId o db.");
            return;
        }
        
        // Limpiar suscripción previa
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        this.logActivity('IN', 'Estableciendo enlace de datos en tiempo real...');

        try {
            const deltasRef = collection(db, "vaults", this.vaultId, "deltas");
            
            const q = query(
                deltasRef,
                where("createdAt", ">", Timestamp.fromDate(this.connectionTime)),
                orderBy("createdAt", "asc")
            );

            this.unsubscribe = onSnapshot(q, (snapshot) => {
                snapshot.docChanges().forEach(async (change) => {
                    if (change.type === "added") {
                        const data = change.doc.data();
                        if (data.sid === this.sessionId) return;

                        const { type, payload } = data;

                        try {
                            switch (type) {
                                case 'PRODUCT_UPDATE':
                                    await productDB.save(payload, true);
                                    this.logActivity('IN', `Stock: ${payload.name} actualizado`);
                                    break;
                                case 'PRODUCT_DELETE':
                                    await productDB.delete(payload.id, true);
                                    this.logActivity('IN', `Stock: Eliminado ID ${payload.id}`);
                                    break;
                                case 'TREASURY_UPDATE':
                                    localStorage.setItem('ferrecloud_registers', JSON.stringify(payload));
                                    window.dispatchEvent(new Event('storage'));
                                    this.logActivity('IN', `Finanzas: Cajas actualizadas`);
                                    break;
                                case 'CLIENT_UPDATE':
                                    const currentClients = JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]');
                                    const newClients = currentClients.map((c: any) => c.id === payload.id ? payload : c);
                                    if (!currentClients.some((c:any) => c.id === payload.id)) newClients.push(payload);
                                    localStorage.setItem('ferrecloud_clients', JSON.stringify(newClients));
                                    window.dispatchEvent(new Event('storage'));
                                    this.logActivity('IN', `Cliente: ${payload.name} actualizado`);
                                    break;
                                case 'REMITOS_SYNC':
                                    localStorage.setItem('ferrecloud_remitos', JSON.stringify(payload));
                                    window.dispatchEvent(new Event('storage'));
                                    this.logActivity('IN', `Logística: Libro de remitos sincronizado`);
                                    break;
                                case 'SYNC_PULSE':
                                    window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse', { 
                                        detail: { status: 'OK', engine: 'FIREBASE' } 
                                    }));
                                    break;
                            }
                        } catch (err: any) {
                            this.logActivity('ERROR', `Error al procesar paquete entrante`);
                        }
                    }
                });
                
                window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse', { 
                    detail: { status: 'OK', engine: 'FIREBASE' } 
                }));
            }, (error) => {
                this.logActivity('ERROR', `Conexión perdida. Reintentando...`);
                window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse', { detail: { status: 'ERROR' } }));
            });
        } catch (e: any) {
            this.logActivity('ERROR', `Fallo crítico de inicialización`);
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
                terminal: localStorage.getItem('ferrecloud_terminal_name') || 'TERMINAL-AUTOLINK',
                createdAt: serverTimestamp()
            });
            this.logActivity('OUT', `Enviando cambio: ${type}`);
        } catch (e: any) {
            this.logActivity('ERROR', `Error de transmisión`);
        }
    }

    async pushToCloud() {
        const remitos = JSON.parse(localStorage.getItem('ferrecloud_remitos') || '[]');
        await this.pushDelta('REMITOS_SYNC', remitos);
    }

    async syncFromRemote(): Promise<boolean> {
        if (!this.vaultId) return false;
        this.connectionTime = new Date(Date.now() - 7200000); // 2 horas atrás para asegurar datos
        this.initFirebase();
        return true;
    }

    getActivityLog() { return this.activityLog; }
}

export const syncService = new SyncService();
