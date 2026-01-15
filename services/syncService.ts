import { 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    serverTimestamp, 
    orderBy, 
    limit 
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

    constructor() {
        this.vaultId = localStorage.getItem('ferrecloud_vault_id');
        if (this.vaultId) this.initFirebase();

        // Listener para capturar peticiones de sincronización saliente (desde storage o POS)
        window.addEventListener('ferrecloud_sync_out' as any, (e: CustomEvent) => {
            this.pushDelta(e.detail.type, e.detail.payload);
        });

        // Listener para pulsos globales
        window.addEventListener('ferrecloud_request_pulse' as any, () => {
            this.pushToCloud();
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
        this.vaultId = cleanId;
        localStorage.setItem('ferrecloud_vault_id', cleanId);
        this.logActivity('OUT', `Terminal vinculada a la bóveda: ${cleanId}`);
        this.initFirebase();
    }

    getVaultId() { return this.vaultId; }

    private initFirebase() {
        if (!this.vaultId) return;
        if (this.unsubscribe) this.unsubscribe();

        const q = query(
            collection(db, "vaults", this.vaultId, "deltas"),
            orderBy("createdAt", "desc"),
            limit(1)
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
                                this.logActivity('IN', `Actualizado: ${payload.name}`);
                                break;
                            case 'PRODUCT_DELETE':
                                await productDB.delete(payload.id, true);
                                this.logActivity('IN', `Eliminado ID: ${payload.id}`);
                                break;
                            case 'TREASURY_UPDATE':
                                localStorage.setItem('ferrecloud_registers', JSON.stringify(payload));
                                window.dispatchEvent(new Event('storage'));
                                this.logActivity('IN', `Sincronización de cajas recibida`);
                                break;
                            case 'CLIENT_UPDATE':
                                const currentClients = JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]');
                                const newClients = currentClients.map((c: any) => c.id === payload.id ? payload : c);
                                if (!currentClients.some((c:any) => c.id === payload.id)) newClients.push(payload);
                                localStorage.setItem('ferrecloud_clients', JSON.stringify(newClients));
                                window.dispatchEvent(new Event('storage'));
                                this.logActivity('IN', `Cliente actualizado: ${payload.name}`);
                                break;
                        }
                    } catch (err: any) {
                        this.logActivity('ERROR', `Error al procesar sync: ${err.message}`);
                    }
                }
            });
            
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse', { 
                detail: { status: 'OK', engine: 'FIREBASE' } 
            }));
        }, (error) => {
            this.logActivity('ERROR', `Error de conexión: ${error.message}`);
            window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse', { detail: { status: 'ERROR' } }));
        });
    }

    async pushDelta(type: string, payload: any) {
        if (!this.vaultId) return;

        try {
            await addDoc(collection(db, "vaults", this.vaultId, "deltas"), {
                type,
                payload,
                sid: this.sessionId,
                terminal: localStorage.getItem('ferrecloud_terminal_name') || 'TERMINAL',
                createdAt: serverTimestamp()
            });
            this.logActivity('OUT', `Cambio enviado (${type})`);
        } catch (e: any) {
            this.logActivity('ERROR', `Fallo al subir cambio: ${e.message}`);
        }
    }

    async pushToCloud() {
        if (!this.vaultId) return;
        await this.pushDelta('SYNC_PULSE', { timestamp: Date.now() });
    }

    async syncFromRemote(): Promise<boolean> {
        if (!this.vaultId) return false;
        this.logActivity('IN', 'Sincronización manual solicitada...');
        window.dispatchEvent(new CustomEvent('ferrecloud_sync_pulse', { 
            detail: { status: 'OK', engine: 'FIREBASE' } 
        }));
        return true;
    }

    getActivityLog() { return this.activityLog; }
}

export const syncService = new SyncService();
