
import React, { useState, useEffect, useRef } from 'react';
import { 
    Cloud, RefreshCw, Save, 
    Zap, CloudDownload, Smartphone,
    Network, Wifi, ShieldCheck,
    FileUp, FileOutput, Monitor, Laptop, 
    ArrowRight, Info, AlertTriangle, CheckCircle2,
    Database, Download
} from 'lucide-react';
import { syncService } from '../services/syncService';
import { productDB } from '../services/storageService';

const CloudHub: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [syncMessage, setSyncMessage] = useState("");
    const [vaultId, setVaultId] = useState(syncService.getVaultId() || '');
    const [stats, setStats] = useState({ count: 0 });
    const [lastSync, setLastSync] = useState(localStorage.getItem('ferrecloud_last_sync') || 'Nunca');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const refreshStats = async () => {
        const s = await productDB.getStats();
        setStats(s);
    };

    useEffect(() => {
        refreshStats();
        const handleProgress = (e: any) => {
            setSyncProgress(e.detail.progress);
            if (e.detail.message) setSyncMessage(e.detail.message);
            if (e.detail.progress === 100) {
                refreshStats();
                setLastSync(new Date().toLocaleString());
                setTimeout(() => { setSyncProgress(0); setSyncMessage(""); }, 4000);
            }
        };
        window.addEventListener('ferrecloud_sync_progress', handleProgress);
        return () => window.removeEventListener('ferrecloud_sync_progress', handleProgress);
    }, []);

    const handleSaveConfig = () => {
        if (!vaultId) return alert("Ingresa un nombre para tu bóveda.");
        syncService.setVaultId(vaultId);
        alert("✅ ID de Bóveda establecido en este dispositivo.");
    };

    const handleManualSync = async () => {
        if (!vaultId) return alert("Configura primero tu ID de Bóveda.");
        setIsProcessing(true);
        const success = await syncService.syncFromRemote();
        setIsProcessing(false);
        if (!success && syncProgress === 0) {
            alert("❌ No se encontró la base de datos en esta PC.\n\nSi es una PC nueva, usa el botón 'Vincular Nueva PC' abajo para traer los datos por primera vez.");
        }
    };

    const handleBackup = async () => {
        if (!vaultId) return alert("Configura tu ID de Bóveda.");
        setIsProcessing(true);
        await syncService.pushToCloud(null, 'MANUAL_BACKUP');
        setIsProcessing(false);
    };

    const handleExportVault = async () => {
        if (!vaultId) return alert("Configura el ID de Bóveda primero.");
        setIsProcessing(true);
        await syncService.exportFullVault();
        setIsProcessing(false);
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsProcessing(true);
        const success = await syncService.importVaultFile(file);
        setIsProcessing(false);
        if (success) {
            setVaultId(syncService.getVaultId() || '');
            refreshStats();
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-32">
            
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                    <Cloud size={240}/>
                </div>
                <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20"><Network size={28}/></div>
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter">FerreConnect Cloud</h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Gestión Multi-PC de Alto Rendimiento</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-2">ID de Bóveda en esta PC</label>
                            <div className="flex gap-3">
                                <input 
                                    type="text" 
                                    placeholder="EJ: BRUZZONE-SUR"
                                    className="flex-1 p-4 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-indigo-400 outline-none focus:border-indigo-500 transition-all uppercase"
                                    value={vaultId}
                                    onChange={(e) => setVaultId(e.target.value)}
                                />
                                <button 
                                    onClick={handleSaveConfig}
                                    className="bg-indigo-600 px-8 py-4 rounded-2xl font-black hover:bg-indigo-500 transition-all shadow-xl active:scale-95">
                                    <Save size={20}/>
                                </button>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Artículos en esta PC</p>
                                <p className="text-3xl font-black">{stats.count.toLocaleString()}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Último Sync</p>
                                <p className="text-xs font-black text-indigo-400 uppercase mt-2">{lastSync}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {(syncProgress > 0 || isProcessing) && (
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-500 shadow-2xl animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <div className="space-y-1">
                            <span className="font-black text-indigo-600 uppercase tracking-widest text-xs flex items-center gap-2">
                                <RefreshCw className="animate-spin" size={14}/> Procesando...
                            </span>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{syncMessage}</p>
                        </div>
                        <span className="font-black text-3xl text-slate-900">{syncProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-200">
                        <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${syncProgress}%` }}></div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-[3.5rem] p-10 border border-slate-200 shadow-sm space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-3xl bg-indigo-50 text-indigo-600">
                            <CloudDownload size={28}/>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Sincronizar Cambios</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Solo para PCs ya vinculadas</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed italic">
                        Usa este botón para actualizar los precios o stock si ya has vinculado esta PC anteriormente.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={handleManualSync}
                            disabled={isProcessing}
                            className="bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30">
                            <CloudDownload size={18}/> Actualizar
                        </button>
                        <button 
                            onClick={handleBackup}
                            disabled={isProcessing}
                            className="bg-slate-900 text-white py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30">
                            <ShieldCheck size={18}/> Respaldar
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[3.5rem] p-10 border border-slate-200 shadow-sm space-y-8 border-l-8 border-l-indigo-600">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-3xl bg-indigo-900 text-white">
                            <Monitor size={28}/>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Vincular Nueva PC</h3>
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Traspaso de datos por primera vez</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-black">1</div>
                            <p className="text-xs font-bold text-slate-600">En la PC que tiene los 140k artículos:</p>
                            <button onClick={handleExportVault} className="ml-auto bg-white border border-slate-200 px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-slate-100 flex items-center gap-2 shadow-sm">
                                <FileOutput size={12}/> Generar Vinculo
                            </button>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-black">2</div>
                            <p className="text-xs font-bold text-slate-600">En esta PC (la nueva):</p>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".ferre" onChange={handleImportFile} />
                            <button onClick={() => fileInputRef.current?.click()} className="ml-auto bg-indigo-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-700 flex items-center gap-2 shadow-lg">
                                <FileUp size={12}/> Cargar Vinculo
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border-2 border-amber-100 p-8 rounded-[3rem] flex items-start gap-6">
                <div className="p-4 bg-white rounded-2xl text-amber-500 shadow-sm shrink-0">
                    <Info size={28}/>
                </div>
                <div className="space-y-2">
                    <h4 className="text-lg font-black text-amber-900 uppercase tracking-tighter">¿Por qué me dice "ID no encontrado"?</h4>
                    <p className="text-sm text-amber-800 font-medium leading-relaxed">
                        Cada computadora almacena su propia base de datos de 140.000 artículos localmente para poder trabajar sin internet y a máxima velocidad. 
                        <strong> Si estás en una computadora nueva, el ID de Bóveda no existe todavía en su memoria local.</strong> 
                        Debes usar el botón "Cargar Vinculo" para traer la base de datos desde tu PC principal por única vez.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
