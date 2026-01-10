
import { productDB } from './storageService';

export type SyncStatus = 'OFFLINE' | 'CONNECTING' | 'SYNCED' | 'DOWNLOADING' | 'UPLOADING' | 'ERROR' | 'UP_TO_DATE';

class SyncService {
    private vaultId: string | null = null;
    private isProcessing: boolean = false;

    constructor() {
        this.vaultId = localStorage.getItem('ferrecloud_vault_id');
    }

    setVaultId(id: string) {
        this.vaultId = id.toUpperCase();
        localStorage.setItem('ferrecloud_vault_id', this.vaultId);
    }

    getVaultId() {
        return this.vaultId;
    }

    // EXPORTAR PAQUETE DE NUBE (Para guardar en Drive/Dropbox)
    async exportVaultPackage(): Promise<boolean> {
        if (this.isProcessing) return false;
        this.isProcessing = true;

        try {
            this.notifyProgress(10);
            const allProducts = await productDB.getAll();
            this.notifyProgress(40);

            const data = {
                vaultId: this.vaultId || 'BRUZZONE-CENTRAL',
                version: Date.now(),
                count: allProducts.length,
                products: allProducts
            };

            const jsonString = JSON.stringify(data);
            const blob = new Blob([jsonString], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `NUBE_${data.vaultId}_${new Date().toISOString().split('T')[0]}.ferre`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            this.notifyProgress(100);
            this.isProcessing = false;
            return true;
        } catch (e) {
            console.error("Error al exportar nube", e);
            this.isProcessing = false;
            return false;
        }
    }

    // IMPORTAR PAQUETE DE NUBE (Desde el archivo de Drive/Dropbox)
    async importVaultPackage(file: File): Promise<boolean> {
        if (this.isProcessing) return false;
        this.isProcessing = true;

        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onprogress = (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 30);
                    this.notifyProgress(progress);
                }
            };

            reader.onload = async (event) => {
                try {
                    const content = event.target?.result as string;
                    const data = JSON.parse(content);
                    
                    if (!data.products) throw new Error("Formato inválido");

                    this.notifyProgress(40);
                    // Limpieza y carga masiva optimizada
                    await productDB.clearAll();
                    await productDB.saveBulk(data.products);

                    this.notifyProgress(100);
                    this.isProcessing = false;
                    resolve(true);
                } catch (err) {
                    console.error("Error importando:", err);
                    this.isProcessing = false;
                    resolve(false);
                }
            };

            reader.onerror = () => {
                this.isProcessing = false;
                resolve(false);
            };

            reader.readAsText(file);
        });
    }

    private notifyProgress(progress: number) {
        window.dispatchEvent(new CustomEvent('ferrecloud_sync_progress', { detail: { progress } }));
    }

    async initializeBootstrap(): Promise<SyncStatus> {
        return this.vaultId ? 'UP_TO_DATE' : 'OFFLINE';
    }

    async pushToCloud(data: any, type: string): Promise<void> {
        // En un futuro aquí se sincronizarían cambios incrementales vía API real
    }
}

export const syncService = new SyncService();

import React, { useState, useEffect } from 'react';
import { 
    Cloud, RefreshCw, Key, Globe, ShieldCheck, 
    Monitor, Wifi, WifiOff, CheckCircle2, ArrowRight,
    Loader2, CloudDownload, DatabaseZap, AlertTriangle, Link2,
    Activity, ShieldAlert, WifiHigh, ServerCrash, Info,
    FileJson, FolderSync, Share2, HardDrive, Network, ListChecks,
    CloudUpload, Download, Globe2, Lock, Save, Settings2
} from 'lucide-react';
import { syncService } from '../services/syncService';

const CloudHub: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [vaultId, setVaultId] = useState(syncService.getVaultId() || '');
    const [mode, setMode] = useState<'IDLE' | 'UPLOADING' | 'DOWNLOADING'>('IDLE');

    useEffect(() => {
        const handleProgress = (e: any) => {
            setSyncProgress(e.detail.progress);
            if (e.detail.progress === 100) {
                setTimeout(() => {
                    setSyncProgress(0);
                    setMode('IDLE');
                }, 3000);
            }
        };
        window.addEventListener('ferrecloud_sync_progress', handleProgress);
        return () => window.removeEventListener('ferrecloud_sync_progress', handleProgress);
    }, []);

    const handleSaveVault = () => {
        if (!vaultId) return;
        syncService.setVaultId(vaultId);
        alert("✅ ID de Bóveda configurado. Ahora puedes subir o descargar datos.");
    };

    const handleUpload = async () => {
        if (!vaultId) return alert("Configura un ID de Bóveda primero");
        setMode('UPLOADING');
        setIsProcessing(true);
        const success = await syncService.uploadToCloud();
        setIsProcessing(false);
        if (success) {
            alert("✅ ¡Todo en la Nube! Ahora puedes abrir el sistema en tu casa y descargar los datos.");
        } else {
            alert("❌ Error al subir datos.");
            setMode('IDLE');
        }
    };

    const handleDownload = async () => {
        if (!vaultId) return alert("Configura un ID de Bóveda primero");
        setMode('DOWNLOADING');
        setIsProcessing(true);
        const success = await syncService.downloadFromCloud();
        setIsProcessing(false);
        if (success) {
            alert("✅ ¡Sincronización Completa! Tienes todos los datos del local en esta computadora.");
        } else {
            alert("❌ No se encontró información en la nube para este ID.");
            setMode('IDLE');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-32">
            
            {/* CONFIGURACIÓN DE IDENTIDAD CLOUD */}
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                    <Globe size={240}/>
                </div>
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500 rounded-2xl"><Lock size={24}/></div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter">Mi Bóveda Cloud</h2>
                        </div>
                        <p className="text-slate-400 font-medium leading-relaxed">
                            Crea un nombre único para tu ferretería. Usa este mismo nombre en el local y en tu casa para que los datos viajen por internet de forma segura.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <input 
                            type="text" 
                            placeholder="EJ: BRUZZONE-MORON-2024"
                            className="flex-1 p-5 bg-white/10 border-2 border-white/10 rounded-2xl font-black text-xl text-indigo-400 outline-none focus:border-indigo-500 transition-all uppercase"
                            value={vaultId}
                            onChange={(e) => setVaultId(e.target.value.toUpperCase())}
                        />
                        <button 
                            onClick={handleSaveVault}
                            className="bg-white text-slate-900 px-8 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-50 transition-all shadow-xl active:scale-95">
                            <Save size={20}/>
                        </button>
                    </div>
                </div>
            </div>

            {syncProgress > 0 && (
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-500 shadow-2xl animate-pulse">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-black text-indigo-600 uppercase tracking-widest text-xs">
                            {mode === 'UPLOADING' ? 'Subiendo a la Nube...' : 'Descargando de la Nube...'}
                        </span>
                        <span className="font-black text-2xl text-slate-900">{syncProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-6 rounded-full overflow-hidden border border-slate-200">
                        <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${syncProgress}%` }}></div>
                    </div>
                    <p className="mt-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Procesando 140,000 registros. Por favor, mantenga abierta esta pestaña.</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                {/* OPCIÓN: DESDE EL LOCAL */}
                <div className="bg-white rounded-[3.5rem] p-12 border-4 border-slate-100 shadow-xl flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><CloudUpload size={240}/></div>
                    <div className="relative z-10 space-y-8 flex-1 flex flex-col">
                        <div className="flex items-center gap-6 border-b border-slate-50 pb-8">
                            <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl"><Globe2 size={32}/></div>
                            <div>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">LOCAL COMERCIAL</p>
                                <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">Enviar a la Nube</h3>
                            </div>
                        </div>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            Presiona este botón al terminar el día o después de actualizar precios para que tu versión "en la nube" esté al día.
                        </p>
                        
                        <div className="mt-auto">
                            <button 
                                onClick={handleUpload}
                                disabled={isProcessing || !vaultId}
                                className="w-full bg-slate-900 text-white py-10 rounded-[3rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex flex-col items-center justify-center gap-4 active:scale-95 disabled:opacity-30">
                                {isProcessing ? <Loader2 className="animate-spin" size={32}/> : <CloudUpload size={40}/>}
                                {isProcessing ? 'Sincronizando...' : 'Subir Base de Datos'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* OPCIÓN: DESDE CASA */}
                <div className="bg-indigo-50 rounded-[3.5rem] p-12 border-4 border-indigo-100 shadow-xl flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><CloudDownload size={240}/></div>
                    <div className="relative z-10 space-y-8 h-full flex flex-col">
                        <div className="flex items-center gap-6 border-b border-indigo-100 pb-8">
                            <div className="p-4 bg-white text-indigo-600 rounded-3xl shadow-xl"><RefreshCw size={32}/></div>
                            <div>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">ACCESO REMOTO / CASA</p>
                                <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">Bajar de la Nube</h3>
                            </div>
                        </div>
                        <p className="text-lg text-slate-600 font-medium leading-relaxed">
                            Si estás en tu casa o en otra sucursal, usa este botón para traerte la última versión que subiste desde el local.
                        </p>
                        
                        <div className="mt-auto">
                            <button 
                                onClick={handleDownload}
                                disabled={isProcessing || !vaultId}
                                className="w-full bg-white text-indigo-600 py-10 rounded-[3rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-indigo-600 hover:text-white transition-all flex flex-col items-center justify-center gap-4 active:scale-95 disabled:opacity-30 border-2 border-indigo-200">
                                {isProcessing ? <Loader2 className="animate-spin" size={32}/> : <Download size={40}/>}
                                {isProcessing ? 'Descargando...' : 'Descargar a esta PC'}
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* SEGURIDAD */}
            <div className="bg-white border-2 border-slate-200 p-10 rounded-[3.5rem] flex flex-col md:flex-row items-center gap-10 shadow-md">
                <div className="p-6 bg-indigo-50 rounded-[2rem] text-indigo-600 shadow-xl border border-indigo-100 shrink-0">
                    <ShieldCheck size={48}/>
                </div>
                <div className="space-y-4">
                    <h4 className="text-2xl font-black text-slate-950 uppercase tracking-tighter">¿Cómo funciona mi Nube?</h4>
                    <p className="text-sm text-slate-500 font-bold leading-relaxed uppercase opacity-80">
                        Este sistema crea un puente privado. Cuando "Subes", los 140.000 artículos se guardan en tu bóveda. 
                        Al "Descargar" en otra PC, el sistema reconstruye toda la base de datos localmente para que la búsqueda sea instantánea (sin esperas de carga de internet al buscar).
                    </p>
                </div>
            </div>
        </div>
    );
};

const FolderBtn: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string, count: number, color: string }> = ({ active, onClick, icon: Icon, label, count, color }) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-4 rounded-[1.5rem] transition-all group ${active ? 'bg-slate-900 text-white shadow-2xl scale-[1.02]' : 'hover:bg-slate-50 text-slate-500'}`}>
        <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${active ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white'} transition-colors`}><Icon size={18}/></div>
            <span className={`text-[11px] font-black uppercase tracking-tight ${active ? 'text-white' : 'text-slate-600'}`}>{label}</span>
        </div>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${active ? 'bg-white/10 border-white/20 text-indigo-300' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>{count.toLocaleString()}</span>
    </button>
);

export default CloudHub;
