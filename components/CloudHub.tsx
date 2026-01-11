
import React, { useState, useEffect } from 'react';
import { 
    Cloud, RefreshCw, Link2, Save, 
    Zap, Timer, Play, Pause, Info,
    CloudDownload, CheckCircle2, Smartphone,
    Database, Network, Wifi, ShieldCheck
} from 'lucide-react';
import { syncService } from '../services/syncService';
import { productDB } from '../services/storageService';

const CloudHub: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [vaultId, setVaultId] = useState(syncService.getVaultId() || '');
    const [stats, setStats] = useState({ count: 0 });
    const [lastSync, setLastSync] = useState(localStorage.getItem('ferrecloud_last_sync') || 'Nunca');

    const refreshStats = async () => {
        const s = await productDB.getStats();
        setStats(s);
    };

    useEffect(() => {
        refreshStats();
        const handleProgress = (e: any) => {
            setSyncProgress(e.detail.progress);
            if (e.detail.progress === 100) {
                refreshStats();
                setLastSync(new Date().toLocaleString());
                setTimeout(() => setSyncProgress(0), 3000);
            }
        };
        window.addEventListener('ferrecloud_sync_progress', handleProgress);
        return () => window.removeEventListener('ferrecloud_sync_progress', handleProgress);
    }, []);

    const handleSaveConfig = () => {
        if (!vaultId) return alert("Ingresa un nombre para tu bóveda.");
        syncService.setVaultId(vaultId);
        alert("✅ Identidad de Nube establecida.");
    };

    const handleManualSync = async () => {
        if (!vaultId) return alert("Configura primero tu ID de Bóveda.");
        setIsProcessing(true);
        const success = await syncService.syncFromRemote();
        setIsProcessing(false);
        if (success) {
            alert("✅ ¡Sincronizado con éxito!");
        } else {
            alert("❌ No se encontró respaldo en la nube para este ID.");
        }
    };

    const handleBackup = async () => {
        if (!vaultId) return alert("Configura tu ID de Bóveda.");
        setIsProcessing(true);
        await syncService.pushToCloud(null, 'MANUAL_BACKUP');
        setIsProcessing(false);
        setLastSync(new Date().toLocaleString());
        alert("✅ Base de datos subida a la nube maestra.");
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
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Sincronización Multi-Dispositivo</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-2">Tu Clave Única de Bóveda</label>
                            <div className="flex gap-3">
                                <input 
                                    type="text" 
                                    placeholder="EJ: BRUZZONE-CENTRAL"
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
                            <p className="text-[9px] text-slate-500 font-bold uppercase ml-2 italic">Usa esta misma clave en tu celular para ver los mismos datos.</p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Artículos Locales</p>
                                <p className="text-3xl font-black">{stats.count.toLocaleString()}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Última Sincronización</p>
                                <p className="text-xs font-black text-indigo-400 uppercase mt-2">{lastSync}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {syncProgress > 0 && (
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-500 shadow-2xl animate-pulse">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-black text-indigo-600 uppercase tracking-widest text-xs flex items-center gap-2">
                            <RefreshCw className="animate-spin" size={14}/> Sincronizando Datos...
                        </span>
                        <span className="font-black text-2xl text-slate-900">{syncProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-200">
                        <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${syncProgress}%` }}></div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-[3.5rem] p-10 border border-slate-200 shadow-sm flex flex-col space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-3xl bg-indigo-50 text-indigo-600">
                            <CloudDownload size={28}/>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Descargar de la Nube</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Traer datos al celular / PC</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        Si realizaste cambios en otra computadora, pulsa este botón para actualizar este dispositivo.
                    </p>
                    <button 
                        onClick={handleManualSync}
                        disabled={isProcessing}
                        className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30">
                        {isProcessing ? <RefreshCw className="animate-spin" size={24}/> : <RefreshCw size={24}/>}
                        Actualizar este Dispositivo
                    </button>
                </div>

                <div className="bg-white rounded-[3.5rem] p-10 border border-slate-200 shadow-sm flex flex-col space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-3xl bg-green-50 text-green-600">
                            <Zap size={28}/>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Subir a la Nube</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Hacer respaldo maestro</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        Guarda el estado actual de tu ferretería en la nube para que esté disponible en tus otros celulares.
                    </p>
                    <button 
                        onClick={handleBackup}
                        disabled={isProcessing}
                        className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30">
                        {isProcessing ? <RefreshCw className="animate-spin" size={24}/> : <ShieldCheck size={24}/>}
                        Respaldar en la Nube
                    </button>
                </div>
            </div>

            <div className="bg-white border-2 border-slate-200 p-10 rounded-[3.5rem] flex flex-col md:flex-row items-center gap-10 shadow-md">
                <div className="p-6 bg-slate-900 rounded-[2rem] text-indigo-400 shadow-xl shrink-0">
                    <Smartphone size={48}/>
                </div>
                <div className="space-y-4">
                    <h4 className="text-2xl font-black text-slate-950 uppercase tracking-tighter">¿Cómo usarlo en el celular?</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-indigo-600 uppercase mb-2">1. En la PC</p>
                            <p className="text-xs text-slate-600 font-bold">Carga tus artículos y pulsa "Respaldar en la Nube" arriba.</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-indigo-600 uppercase mb-2">2. En el Celular</p>
                            <p className="text-xs text-slate-600 font-bold">Pon el mismo ID de Bóveda y pulsa "Actualizar este Dispositivo".</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
