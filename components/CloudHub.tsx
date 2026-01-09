
import React, { useState, useEffect } from 'react';
import { 
    Cloud, RefreshCw, Key, Globe, ShieldCheck, 
    Monitor, Wifi, WifiOff, CheckCircle2, ArrowRight,
    Loader2, CloudDownload, DatabaseZap, AlertTriangle, Link2,
    Activity, ShieldAlert, WifiHigh, ServerCrash, Info,
    FileJson, FolderSync, Share2, HardDrive, Network, ListChecks
} from 'lucide-react';
import { CloudConfig } from '../types';
import { syncService } from '../services/syncService';

const CloudHub: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [status, setStatus] = useState<'IDLE' | 'CONNECTED' | 'OFFLINE'>(() => {
        return localStorage.getItem('ferrecloud_file_sync') === 'ACTIVE' ? 'CONNECTED' : 'OFFLINE';
    });

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

    const handleNetworkSetup = async () => {
        setIsProcessing(true);
        const success = await syncService.connectSharedFile();
        setIsProcessing(false);
        if (success) {
            setStatus('CONNECTED');
            alert("✅ Vínculo de Red Establecido. Esta terminal leerá los cambios del archivo seleccionado automáticamente.");
        }
    };

    const handleCreateMaster = async () => {
        setIsProcessing(true);
        const success = await syncService.exportToNetwork();
        setIsProcessing(false);
        if (success) {
            alert("✅ Archivo Maestro Creado. Guárdalo en una CARPETA COMPARTIDA DE RED para que las otras PCs puedan leerlo.");
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-32">
            
            {/* ESTADO DE CONEXIÓN LOCAL */}
            <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-200 shadow-xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="absolute -top-10 -left-10 p-20 opacity-5 text-indigo-600 pointer-events-none">
                    <Network size={280}/>
                </div>
                <div className="flex items-center gap-8 relative z-10">
                    <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center shadow-inner border-4 ${status === 'CONNECTED' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        {status === 'CONNECTED' ? <WifiHigh size={56} className="animate-pulse" /> : <WifiOff size={56}/>}
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-950 uppercase tracking-tighter leading-none">Ferre-Red LAN</h2>
                        <div className="flex items-center gap-4 mt-4">
                             <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border-2 ${status === 'CONNECTED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                {status === 'CONNECTED' ? 'Conexión Activa' : 'Modo Local Solo'}
                            </span>
                        </div>
                    </div>
                </div>
                {syncProgress > 0 && (
                    <div className="w-80 bg-slate-100 h-6 rounded-full overflow-hidden border border-slate-200 relative">
                        <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${syncProgress}%` }}></div>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-900 uppercase">Procesando 140.000 Artículos... {syncProgress}%</span>
                    </div>
                )}
            </div>

            {/* GUIA DE PASOS RAPIDOS */}
            <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-10"><ListChecks size={180}/></div>
                 <div className="p-6 bg-white/20 rounded-[2rem] backdrop-blur-md border border-white/20 shrink-0">
                     <h4 className="text-xl font-black uppercase tracking-widest">Guía Rápida</h4>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                     <div className="flex items-start gap-4">
                         <div className="w-10 h-10 bg-white text-indigo-600 rounded-full flex items-center justify-center font-black shrink-0 shadow-lg">1</div>
                         <p className="text-xs font-bold uppercase leading-relaxed text-indigo-100">En la <span className="text-white">PC MADRE</span>: Genera el archivo y guárdalo en una carpeta compartida de Windows.</p>
                     </div>
                     <div className="flex items-start gap-4">
                         <div className="w-10 h-10 bg-white text-indigo-600 rounded-full flex items-center justify-center font-black shrink-0 shadow-lg">2</div>
                         <p className="text-xs font-bold uppercase leading-relaxed text-indigo-100">En las <span className="text-white">TERMINALES</span>: Pulsa "Vincular" y selecciona ese mismo archivo en la red.</p>
                     </div>
                 </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                {/* OPCIÓN 1: PC MADRE */}
                <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl flex flex-col relative overflow-hidden group border-b-[1rem] border-indigo-600">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><HardDrive size={240}/></div>
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-6 border-b border-white/10 pb-8">
                            <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl"><Share2 size={32}/></div>
                            <div>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">PASO 1</p>
                                <h3 className="text-3xl font-black uppercase tracking-tighter">PC Madre (Servidor)</h3>
                            </div>
                        </div>
                        <p className="text-lg text-slate-400 font-medium leading-relaxed">
                            Usa el botón blanco de abajo para crear el archivo maestro con tus 140,000 artículos. 
                        </p>
                        
                        <div className="bg-white/5 border-2 border-dashed border-white/10 p-8 rounded-[3rem] space-y-4">
                             <div className="flex items-center gap-4 text-indigo-400 font-black text-xs uppercase tracking-widest">
                                 <CheckCircle2 size={20}/> 1. Hacer clic en el botón de abajo
                             </div>
                             <div className="flex items-center gap-4 text-slate-500 font-black text-xs uppercase tracking-widest">
                                 <CheckCircle2 size={20}/> 2. Guardar en Carpeta Compartida
                             </div>
                        </div>

                        <button 
                            onClick={handleCreateMaster}
                            disabled={isProcessing}
                            className="w-full bg-white text-slate-950 py-8 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.2em] shadow-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 active:scale-95 border-4 border-indigo-200">
                            {isProcessing ? <Loader2 className="animate-spin" /> : <FileJson size={24}/>}
                            Generar / Exportar Archivo de Red
                        </button>
                    </div>
                </div>

                {/* OPCIÓN 2: TERMINAL */}
                <div className="bg-white rounded-[3.5rem] p-12 border-4 border-indigo-100 shadow-2xl flex flex-col relative overflow-hidden group border-b-[1rem] border-slate-200">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Monitor size={240}/></div>
                    <div className="relative z-10 space-y-8 h-full flex flex-col">
                        <div className="flex items-center gap-6 border-b border-slate-100 pb-8">
                            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl shadow-xl"><FolderSync size={32}/></div>
                            <div>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">PASO 2</p>
                                <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">Terminal de Venta</h3>
                            </div>
                        </div>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            Usa el botón negro de abajo para buscar el archivo que creó la PC Madre y empezar a vender.
                        </p>
                        
                        <div className="flex-1 flex flex-col justify-center gap-6">
                            <button 
                                onClick={handleNetworkSetup}
                                disabled={isProcessing}
                                className="w-full bg-slate-900 text-white py-10 rounded-[3rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex flex-col items-center justify-center gap-4 active:scale-95 disabled:opacity-30 border-4 border-slate-700">
                                {isProcessing ? <Loader2 className="animate-spin" size={32}/> : <Link2 size={40}/>}
                                {isProcessing ? 'Sincronizando...' : 'Vincular con Archivo de Red'}
                            </button>
                        </div>

                        <div className="flex items-start gap-4 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                             <Info className="text-indigo-600 shrink-0 mt-1" size={20}/>
                             <p className="text-[11px] text-indigo-700 font-bold leading-relaxed uppercase">
                                Al vincular, esta computadora leerá automáticamente los precios y stock de la PC Madre.
                             </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* INSTRUCCIONES DE RED */}
            <div className="bg-amber-50 border-2 border-amber-200 p-10 rounded-[3.5rem] flex flex-col md:flex-row items-center gap-10 shadow-md">
                <div className="p-6 bg-white rounded-[2rem] text-amber-600 shadow-xl border border-amber-100 shrink-0">
                    <ServerCrash size={48}/>
                </div>
                <div className="space-y-4">
                    <h4 className="text-2xl font-black text-amber-950 uppercase tracking-tighter">Ayuda para compartir el archivo</h4>
                    <p className="text-sm text-amber-900 font-bold leading-relaxed uppercase opacity-80">
                        Si las terminales no encuentran a la PC Madre, asegúrate de que:<br/>
                        1. Ambas computadoras estén en el mismo WiFi / Cable de red.<br/>
                        2. El archivo de la PC Madre esté en una carpeta con "Permisos de Lectura" en Windows.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
