
import React, { useState, useEffect, useRef } from 'react';
import { 
    Cloud, RefreshCw, Globe, ShieldCheck, 
    Monitor, CheckCircle2, Loader2, CloudDownload, 
    DatabaseZap, Info, CloudUpload, Download, 
    Globe2, Lock, Save, FileType, Upload,
    ExternalLink, Share2, HardDrive, Laptop,
    Link2, Zap, Clock, Timer, Settings2, Play, Pause,
    Box
} from 'lucide-react';
import { syncService } from '../services/syncService';

const CloudHub: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [vaultId, setVaultId] = useState(syncService.getVaultId() || '');
    const [dropboxUrl, setDropboxUrl] = useState(localStorage.getItem('ferrecloud_sync_url_raw') || '');
    const [autoSyncMinutes, setAutoSyncMinutes] = useState(Number(localStorage.getItem('ferrecloud_auto_min')) || 0);
    const [isAutoSyncActive, setIsAutoSyncActive] = useState(!!localStorage.getItem('ferrecloud_auto_active'));

    useEffect(() => {
        const handleProgress = (e: any) => {
            setSyncProgress(e.detail.progress);
            if (e.detail.progress === 100) {
                setTimeout(() => setSyncProgress(0), 3000);
            }
        };
        window.addEventListener('ferrecloud_sync_progress', handleProgress);
        return () => window.removeEventListener('ferrecloud_sync_progress', handleProgress);
    }, []);

    const handleSaveConfig = () => {
        if (!vaultId || !dropboxUrl) return alert("Completa el ID y el enlace de Dropbox.");
        syncService.setVaultId(vaultId);
        syncService.setSyncUrl(dropboxUrl);
        localStorage.setItem('ferrecloud_sync_url_raw', dropboxUrl);
        alert("✅ Configuración de Nube guardada.");
    };

    const handleManualSync = async () => {
        if (!dropboxUrl) return alert("Configura primero el enlace de Dropbox.");
        setIsProcessing(true);
        const success = await syncService.syncFromRemote();
        setIsProcessing(false);
        if (success) {
            alert("✅ ¡Sincronizado! Se han descargado los artículos desde Dropbox.");
        } else {
            alert("❌ Error al conectar con Dropbox. Verifica que el enlace sea correcto y público.");
        }
    };

    const toggleAutoSync = () => {
        const nextState = !isAutoSyncActive;
        setIsAutoSyncActive(nextState);
        if (nextState && autoSyncMinutes > 0) {
            syncService.startAutoSync(autoSyncMinutes);
            localStorage.setItem('ferrecloud_auto_active', 'true');
            localStorage.setItem('ferrecloud_auto_min', autoSyncMinutes.toString());
        } else {
            syncService.stopAutoSync();
            localStorage.removeItem('ferrecloud_auto_active');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-32">
            
            {/* PANEL PRINCIPAL: CONFIGURACIÓN DROPBOX */}
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                    <Cloud size={240}/>
                </div>
                <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20"><Link2 size={28}/></div>
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter">Dropbox Auto-Cloud</h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Sincronización por Enlace Directo</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-2">ID de Bóveda</label>
                            <input 
                                type="text" 
                                placeholder="EJ: BRUZZONE-CENTRAL"
                                className="w-full p-4 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-indigo-400 outline-none focus:border-indigo-500 transition-all uppercase"
                                value={vaultId}
                                onChange={(e) => setVaultId(e.target.value)}
                            />
                        </div>
                        <div className="lg:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-2">Enlace Compartido de Dropbox</label>
                            <div className="flex gap-3">
                                <input 
                                    type="url" 
                                    placeholder="https://www.dropbox.com/s/..."
                                    className="flex-1 p-4 bg-white/5 border-2 border-white/10 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500 transition-all"
                                    value={dropboxUrl}
                                    onChange={(e) => setDropboxUrl(e.target.value)}
                                />
                                <button 
                                    onClick={handleSaveConfig}
                                    className="bg-indigo-600 px-6 py-4 rounded-2xl font-black hover:bg-indigo-500 transition-all shadow-xl active:scale-95">
                                    <Save size={20}/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BARRA DE PROGRESO */}
            {syncProgress > 0 && (
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-500 shadow-2xl animate-pulse">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-black text-indigo-600 uppercase tracking-widest text-xs flex items-center gap-2">
                            <RefreshCw className="animate-spin" size={14}/> Sincronizando Catálogo...
                        </span>
                        <span className="font-black text-2xl text-slate-900">{syncProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-6 rounded-full overflow-hidden border border-slate-200">
                        <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${syncProgress}%` }}></div>
                    </div>
                </div>
            )}

            {/* CONTROLES DE SINCRONIZACIÓN */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* SINCRONIZACIÓN AUTOMÁTICA */}
                <div className="bg-white rounded-[3.5rem] p-10 border border-slate-200 shadow-sm flex flex-col space-y-8">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-3xl ${isAutoSyncActive ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                <Timer size={28}/>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Temporizador</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Auto-Refresco de Datos</p>
                            </div>
                        </div>
                        <button 
                            onClick={toggleAutoSync}
                            className={`p-5 rounded-2xl transition-all shadow-xl active:scale-95 ${isAutoSyncActive ? 'bg-red-500 text-white' : 'bg-green-600 text-white'}`}>
                            {isAutoSyncActive ? <Pause size={24}/> : <Play size={24}/>}
                        </button>
                    </div>

                    <div className="space-y-6">
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            Configura cada cuánto tiempo quieres que el sistema revise tu Dropbox y actualice precios y stock automáticamente.
                        </p>
                        <div className="grid grid-cols-4 gap-3">
                            {[5, 15, 30, 60].map(min => (
                                <button 
                                    key={min}
                                    onClick={() => setAutoSyncMinutes(min)}
                                    disabled={isAutoSyncActive}
                                    className={`py-3 rounded-xl font-black text-xs border-2 transition-all ${autoSyncMinutes === min ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-50 bg-white text-slate-400 hover:border-slate-200'}`}>
                                    {min}m
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {isAutoSyncActive && (
                        <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                            <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Motor de Escaneo Activo</span>
                        </div>
                    )}
                </div>

                {/* SINCRONIZACIÓN MANUAL / DESCARGA */}
                <div className="bg-indigo-600 rounded-[3.5rem] p-10 text-white shadow-xl flex flex-col space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><CloudDownload size={180}/></div>
                    <div className="relative z-10 space-y-6 flex-1">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl"><Zap size={28}/></div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">Sincronización Forzada</h3>
                        </div>
                        <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                            Si acabas de subir un archivo a Dropbox desde el local y quieres verlo ya mismo en tu casa, usa este botón.
                        </p>
                        <button 
                            onClick={handleManualSync}
                            disabled={isProcessing}
                            className="w-full bg-white text-indigo-600 py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30">
                            {isProcessing ? <Loader2 className="animate-spin" size={24}/> : <RefreshCw size={24}/>}
                            {isProcessing ? 'DESCARGANDO...' : 'Sincronizar Ahora'}
                        </button>
                    </div>
                </div>

            </div>

            {/* INSTRUCCIONES RÁPIDAS */}
            <div className="bg-white border-2 border-slate-200 p-10 rounded-[3.5rem] flex flex-col md:flex-row items-center gap-10 shadow-md">
                <div className="p-6 bg-slate-900 rounded-[2rem] text-indigo-400 shadow-xl border border-indigo-900 shrink-0">
                    <Info size={48}/>
                </div>
                <div className="space-y-4">
                    <h4 className="text-2xl font-black text-slate-950 uppercase tracking-tighter">Guía de Dropbox Nube</h4>
                    <ul className="text-sm text-slate-500 font-bold leading-relaxed uppercase space-y-2 opacity-80">
                        <li>1. En el local, genera el archivo <span className="text-indigo-600">.ferre</span> y súbelo a tu Dropbox.</li>
                        <li>2. Haz clic derecho en el archivo en Dropbox y selecciona <span className="text-indigo-600">"Copiar enlace"</span>.</li>
                        <li>3. Pega ese enlace arriba y activa el temporizador.</li>
                        <li>4. ¡Listo! El sistema se mantendrá al día solo.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
