
import React, { useState, useEffect, useRef } from 'react';
import { 
    Cloud, RefreshCw, Globe, ShieldCheck, 
    Monitor, CheckCircle2, Loader2, CloudDownload, 
    DatabaseZap, Info, CloudUpload, Download, 
    Globe2, Lock, Save, FileType, Upload,
    ExternalLink, Share2, HardDrive, Laptop
} from 'lucide-react';
import { syncService } from '../services/syncService';

const CloudHub: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [vaultId, setVaultId] = useState(syncService.getVaultId() || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleSaveVault = () => {
        if (!vaultId) return;
        syncService.setVaultId(vaultId);
        alert("✅ ID de Bóveda configurado.");
    };

    const handleExport = async () => {
        setIsProcessing(true);
        const success = await syncService.exportVaultPackage();
        setIsProcessing(false);
        if (success) {
            alert("✅ Archivo Cloud generado.\n\nIMPORTANTE: Guarda este archivo en tu Google Drive o Dropbox para acceder desde tu casa.");
        } else {
            alert("❌ Error al generar el archivo.");
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        const success = await syncService.importVaultPackage(file);
        setIsProcessing(false);
        
        if (success) {
            alert("✅ ¡Sincronización Exitosa! Ahora tienes los 140.000 artículos en esta PC.");
        } else {
            alert("❌ El archivo no es válido o está dañado.");
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
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
                            Configura tu ID único. Usa este mismo ID para nombrar tus archivos de respaldo y mantener la organización entre el local y tu casa.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <input 
                            type="text" 
                            placeholder="EJ: FERRETERIA-BRUZZONE"
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
                        <span className="font-black text-indigo-600 uppercase tracking-widest text-xs">Procesando Base de Datos Maestra...</span>
                        <span className="font-black text-2xl text-slate-900">{syncProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-6 rounded-full overflow-hidden border border-slate-200">
                        <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${syncProgress}%` }}></div>
                    </div>
                    <p className="mt-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Manejando 140.000 registros. No cierre esta pestaña.</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                {/* LOCAL COMERCIAL */}
                <div className="bg-white rounded-[3.5rem] p-12 border-4 border-slate-100 shadow-xl flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><CloudUpload size={240}/></div>
                    <div className="relative z-10 space-y-8 flex-1 flex flex-col">
                        <div className="flex items-center gap-6 border-b border-slate-50 pb-8">
                            <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl"><HardDrive size={32}/></div>
                            <div>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">PASO 1: EN EL LOCAL</p>
                                <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">Subir a la Nube</h3>
                            </div>
                        </div>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            Crea el archivo de datos y guárdalo en tu carpeta de <strong>Google Drive o Dropbox</strong> instalada en esta PC.
                        </p>
                        
                        <div className="mt-auto">
                            <button 
                                onClick={handleExport}
                                disabled={isProcessing}
                                className="w-full bg-slate-900 text-white py-10 rounded-[3rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex flex-col items-center justify-center gap-4 active:scale-95 disabled:opacity-30">
                                {isProcessing ? <Loader2 className="animate-spin" size={32}/> : <CloudUpload size={40}/>}
                                {isProcessing ? 'Procesando...' : 'Generar Archivo Cloud'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ACCESO DESDE CASA */}
                <div className="bg-indigo-50 rounded-[3.5rem] p-12 border-4 border-indigo-100 shadow-xl flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Laptop size={240}/></div>
                    <div className="relative z-10 space-y-8 h-full flex flex-col">
                        <div className="flex items-center gap-6 border-b border-indigo-100 pb-8">
                            <div className="p-4 bg-white text-indigo-600 rounded-3xl shadow-xl"><CloudDownload size={32}/></div>
                            <div>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">PASO 2: DESDE TU CASA</p>
                                <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">Bajar de la Nube</h3>
                            </div>
                        </div>
                        <p className="text-lg text-slate-600 font-medium leading-relaxed">
                            Selecciona el archivo desde tu carpeta de <strong>Google Drive o Dropbox</strong> (que ya se habrá sincronizado solo).
                        </p>
                        
                        <div className="mt-auto">
                            <input type="file" ref={fileInputRef} className="hidden" accept=".ferre" onChange={handleFileChange} />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessing}
                                className="w-full bg-white text-indigo-600 py-10 rounded-[3rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-indigo-600 hover:text-white transition-all flex flex-col items-center justify-center gap-4 active:scale-95 disabled:opacity-30 border-2 border-indigo-200">
                                {isProcessing ? <Loader2 className="animate-spin" size={32}/> : <Upload size={40}/>}
                                {isProcessing ? 'Sincronizando...' : 'Seleccionar Archivo de Drive'}
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* INSTRUCCIONES CLOUD */}
            <div className="bg-white border-2 border-slate-200 p-10 rounded-[3.5rem] flex flex-col md:flex-row items-center gap-10 shadow-md">
                <div className="p-6 bg-indigo-50 rounded-[2rem] text-indigo-600 shadow-xl border border-indigo-100 shrink-0">
                    <ShieldCheck size={48}/>
                </div>
                <div className="space-y-4">
                    <h4 className="text-2xl font-black text-slate-950 uppercase tracking-tighter">¿Cómo funciona la Nube Bruzzone?</h4>
                    <p className="text-sm text-slate-500 font-bold leading-relaxed uppercase opacity-80">
                        Para que esto sea 100% efectivo sin pagar servidores costosos:<br/>
                        1. Instala <strong>Google Drive Desktop</strong> o <strong>Dropbox</strong> en ambas PCs.<br/>
                        2. Cuando el sistema te pida "Generar Archivo", elije esa carpeta.<br/>
                        3. Al llegar a tu casa, el archivo ya estará allí esperándote.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
